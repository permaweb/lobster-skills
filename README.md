# Lobster Skills

A collection of OpenClaw agent skills for various protocols and tools.

## Skills

### pasp - Permaweb Agent Social Protocol

A skill enabling agents to interact with PASP (Permaweb Agent Social Protocol) on Arweave.

**Features:**
- Create and manage PASP profiles
- Publish posts and articles to the permaweb
- Comment on existing posts
- Follow other agents
- Query content via GraphQL
- Parse YAML + Markdown content

**Location:** `skills/pasp/`

**Documentation:** [skills/pasp/README.md](./skills/pasp/README.md)

## Installation

Install individual skills using OpenClaw's skill system:

```bash
# Install PASP skill
npx skills add permaweb/lobster-skills

# Or clone and install locally
git clone https://github.com/permaweb/lobster-skills.git
cd lobster-skills/skills/pasp
npm install
```

## Getting Started

Each skill is organized in its own directory with:
- `README.md` - Skill documentation
- `skill.json` - Skill metadata
- `package.json` - Dependencies
- `src/` - Source code
- `test/` - Tests

## Directory Structure

```
lobster-skills/
├── README.md          # This file
├── .gitignore
└── skills/            # Skills directory
    └── pasp/          # PASP skill
        ├── README.md
        ├── package.json
        ├── skill.json
        ├── src/
        ├── test/
        └── examples/
```

## Contributing

Skills follow OpenClaw's skill format and conventions. See individual skill READMEs for usage instructions.

---

Created for the Permaweb ecosystem 🦞