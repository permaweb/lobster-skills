import { TurboFactory, ArweaveSigner, USD } from '@ardrive/turbo-sdk';
import Arweave from 'arweave';

/**
 * Turbo Client for PASP Skill
 * Handles uploads via ArDrive Turbo with free tier and USD credits
 * 
 * Key Features:
 * - Free uploads for files < 500KB
 * - USD-based turbo credits for larger files
 * - Integrated with ArDrive Turbo payment system
 */
class TurboClient {
  constructor(wallet, config = {}) {
    this.wallet = wallet;
    this.config = {
      freeTierLimit: 500 * 1024, // 500KB free tier (updated from 50KB)
      ...config
    };
    
    this.arweave = Arweave.init({
      host: 'arweave.net',
      port: 443,
      protocol: 'https'
    });
    
    this.turbo = null;
    this.address = null;
  }

  /**
   * Initialize Turbo client
   */
  async initialize() {
    // Create signer from wallet
    const signer = new ArweaveSigner(this.wallet);
    
    // Create authenticated Turbo client
    this.turbo = TurboFactory.authenticated({ signer });
    
    // Get wallet address
    this.address = await this.arweave.wallets.jwkToAddress(this.wallet);
    
    return this;
  }

  /**
   * Check if upload qualifies for free tier
   * ArDrive Turbo provides free uploads for sub-500KB files when Turbo is enabled
   */
  isFreeUpload(sizeBytes) {
    return sizeBytes < this.config.freeTierLimit;
  }

  /**
   * Get upload cost for a given size
   * Returns 0 for free tier, otherwise actual cost
   */
  async getUploadCost(sizeBytes) {
    // For sub-500KB files, Turbo provides free uploads
    if (this.isFreeUpload(sizeBytes)) {
      return {
        cost: 0,
        isFree: true,
        sizeBytes,
        sizeKB: Math.round(sizeBytes / 1024),
        message: `Free tier applies (file size < ${this.config.freeTierLimit / 1024}KB)`
      };
    }
    
    // For larger files, get actual pricing
    const price = await this.turbo.getFilePrice(sizeBytes);
    
    return {
      cost: price,
      isFree: false,
      sizeBytes,
      sizeKB: Math.round(sizeBytes / 1024),
      message: `File exceeds free tier limit of ${this.config.freeTierLimit / 1024}KB`
    };
  }

  /**
   * Get current balance
   */
  async getBalance() {
    const { winc: balance } = await this.turbo.getBalance();
    
    return Number(balance);
  }

  /**
   * Convert winc to AR
   */
  wincToAR(winc) {
    return winc / 1e12;
  }

  /**
   * Convert winc to USD
   * Note: ArDrive values Credits at 1:1 with USD
   */
  wincToUSD(winc) {
    return winc / 1e12; // Credits are 1:1 with USD
  }

  /**
   * Format tags for Turbo upload
   */
  formatTags(tags) {
    return Object.entries(tags).map(([name, value]) => ({
      name,
      value: Array.isArray(value) ? value.join(',') : String(value)
    }));
  }

  /**
   * Upload data via Turbo
   */
  async upload(data, tags) {
    if (!this.turbo) {
      await this.initialize();
    }

    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const bufferSize = buffer.byteLength;
    
    // Get cost info
    const costInfo = await this.getUploadCost(bufferSize);
    
    // Check balance for paid uploads
    if (!costInfo.isFree) {
      const balance = await this.getBalance();
      
      if (balance < costInfo.cost) {
        const balanceAR = this.wincToAR(balance);
        const costAR = this.wincToAR(costInfo.cost);
        const balanceUSD = this.wincToUSD(balance);
        const costUSD = this.wincToUSD(costInfo.cost);
        
        throw new Error(
          `Insufficient balance for upload.\n` +
          `Required: ${costUSD.toFixed(4)} USD (~${costAR.toFixed(6)} AR)\n` +
          `Current: ${balanceUSD.toFixed(4)} USD (~${balanceAR.toFixed(6)} AR)\n` +
          `File size: ${costInfo.sizeKB} KB\n\n` +
          `Free tier limit: ${this.config.freeTierLimit / 1024} KB\n\n` +
          `To purchase credits:\n` +
          `1. Open: https://arweave.net/turbo\n` +
          `2. Connect wallet: ${this.address}\n` +
          `3. Purchase credits (minimum $5 USD)\n\n` +
          `Credits are automatically applied to your Turbo balance.`
        );
      }
    }

    try {
      // Upload via Turbo
      const result = await this.turbo.upload({
        data: buffer,
        tags: this.formatTags(tags),
      });
      
      return {
        id: result.id,
        url: `https://arweave.net/${result.id}`,
        cost: costInfo.cost,
        isFree: costInfo.isFree,
        sizeKB: costInfo.sizeKB
      };
    } catch (error) {
      throw new Error(`Turbo upload failed: ${error.message}`);
    }
  }

  /**
   * Get purchase URL for Turbo credits
   */
  getPurchaseURL() {
    return 'https://turbo.ardrive.io';
  }
}

export default TurboClient;