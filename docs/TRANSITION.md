# Dev Tools Project Transition Document

## 📍 Current State (2025-07-20)

### What We've Accomplished
1. **Discovered all workspaces** - Found 25 accessible workspaces, identified CRM (ID: 11007618)
2. **Mapped CRM boards** - Located 25 boards in CRM workspace
3. **Traced Accounts board** - Deep traced connections showing 7 mirror columns
4. **Generated Mermaid diagram** - Created visual representation of Accounts board connections
5. **Identified missing boards** - Found references to Shopify Integration and Development Board

### Key Files Created
- `discover-workspaces.js` - Lists all Monday.com workspaces
- `find-crm-boards.js` - Maps boards in CRM workspace
- `deep-trace-accounts.js` - Traces all connections from Accounts board
- `generate-accounts-mermaid.js` - Creates Mermaid diagrams
- `crm-boards-config.json` - CRM boards configuration
- `accounts-deep-connections.json` - Accounts board connection map
- `accounts-board-diagram.md` - Mermaid visualization

### Environment Setup
The Monday API token is available in your zshrc environment. The dev-tools project needs:
```bash
cd /path/to/dev-tools
npm install
cp .env.example .env
# The MONDAY_API_TOKEN should already be available from your environment
```

## 🎯 Next Steps for New Chat

### 1. Set Up Dev Tools Project Structure
```bash
mkdir -p dev-tools/src/{monday,database,utils}
mkdir -p dev-tools/{config,docs,scripts,output}
cd dev-tools
npm init -y
# Copy the package.json content from dev-tools-package.json
npm install
```

### 2. Move Analysis Scripts
Move these scripts to `dev-tools/src/monday/`:
- discover-workspaces.js
- find-crm-boards.js
- deep-trace-accounts.js
- generate-accounts-mermaid.js

### 3. Continue Board Mapping
Next boards to trace (all in CRM workspace):
- **Contacts** (ID: 9161287505) - Has mirror columns for Lab Tasks, Deals value, Dev Status
- **Projects** (ID: 9161287526) - Mirrors Prod/Dev Deals Status, Production Status
- **Dev Deals** (ID: 9161287503) - Mirrors Iteration Number, Lab Status
- **Prod Deals** (ID: 9384243852) - Multiple mirrors including Purchasing, Production, COAs

### 4. Build Database Integration
Create tools to:
- Connect to PostgreSQL database (cosmetics_data_hub_v2_local)
- Map formulas and ingredients to Monday boards
- Sync data while respecting read-only constraint

### 5. Create Comprehensive Visualization
Build a tool that:
- Maps ALL board connections across ALL workspaces
- Generates a master Mermaid diagram
- Identifies circular dependencies
- Shows data flow patterns

## 🔧 Technical Notes

### Working API Pattern
```javascript
const monday = mondaySDK();
monday.setToken(process.env.MONDAY_API_TOKEN);

const query = `
  query {
    boards(limit: 200) {
      id
      name
      workspace { id name }
      columns { id title type settings_str }
    }
  }
`;
const response = await monday.api(query);
```

### Mirror Column Challenge
- Mirror columns don't always expose source board IDs in settings_str
- Solution: Infer from column names and verify with board search
- Pattern: "X Status" usually mirrors from board "X"

### Board Discovery Strategy
1. Get all accessible boards (may need pagination)
2. Group by workspace
3. Analyze column types for connections
4. Build bidirectional connection map
5. Generate visualizations

## 📊 Key Data Points

### CRM Workspace Boards (25 total)
Main entities: Accounts, Contacts, Leads, Activities, Projects, Dev Deals, Prod Deals
Support: Quotes & Invoices, Products & Services, various subitems boards
Task management: Tasks, Tickets, Intake Forms

### Connection Types Found
- **mirror**: Pulls data from another board (one-way)
- **board-relation**: Links items between boards (two-way)
- **dependency**: Creates dependencies between items
- **link_to_board**: Another form of board connection

### Missing Boards
- Shopify Integration (E-commerce workspace)
- Development Board (Lab workspace)
These are referenced in mirror columns but not found in accessible boards

## 🚀 Quick Start Commands for New Chat

```bash
# In the new dev-tools directory:
node src/monday/discover-workspaces.js     # List all workspaces
node src/monday/find-crm-boards.js         # Map CRM boards
node src/monday/deep-trace-accounts.js     # Trace Accounts connections
node src/monday/generate-accounts-mermaid.js # Generate diagram

# To trace another board:
# Copy deep-trace-accounts.js and modify BOARD_ID constant
```

## 💡 For Leadership Presentation

The Mermaid diagram shows:
- How Accounts board aggregates data from 7 different sources
- Cross-workspace data flow (CRM → Production, Lab, E-commerce)
- Which integrations are missing (Shopify, Development)
- The central role of Accounts in the CRM ecosystem

This mapping will help identify:
- Data silos and integration opportunities
- Redundant data entry points
- Process optimization possibilities
- Missing connections that could improve workflow