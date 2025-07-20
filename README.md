# PEL Lab Dev Tools

A comprehensive toolkit for managing Monday.com boards and PostgreSQL formula/ingredient data for Pure Earth Labs cosmetics.

## 🎯 Purpose

This project provides development tools to:
- Map and visualize Monday.com board connections across workspaces
- Trace board relationships and dependencies
- Generate Mermaid diagrams for board visualization
- Inspect and analyze PostgreSQL formula/ingredient database
- Sync data between PostgreSQL and Monday.com
- Generate reports and diagnostics for leadership

## 📁 Project Structure

```
dev-tools/
├── src/
│   ├── monday/          # Monday.com API tools
│   │   ├── discover-workspaces.js
│   │   ├── find-crm-boards.js
│   │   ├── trace-accounts-connections.js
│   │   ├── deep-trace-accounts.js
│   │   └── generate-accounts-mermaid.js
│   ├── database/        # PostgreSQL tools
│   └── utils/           # Shared utilities
├── config/              # Configuration files
├── docs/                # Documentation
├── scripts/             # Standalone scripts
└── output/              # Generated reports (gitignored)
```

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Test connections:**
   ```bash
   node src/monday/discover-workspaces.js    # List all workspaces
   node src/monday/find-crm-boards.js        # Map CRM boards
   ```

## 📊 Key Tools Developed

### 1. Workspace Discovery
```bash
node src/monday/discover-workspaces.js
```
- Lists all accessible Monday.com workspaces
- Identifies CRM workspace (ID: 11007618)
- Found 25 workspaces total

### 2. CRM Board Mapping
```bash
node src/monday/find-crm-boards.js
```
- Maps all 25 boards in CRM workspace
- Identifies board connections and mirror columns
- Outputs: `crm-boards-config.json`

### 3. Accounts Board Deep Trace
```bash
node src/monday/deep-trace-accounts.js
```
- Traces all connections from Accounts board
- Identifies 7 mirror columns connecting to multiple workspaces
- Outputs: `accounts-deep-connections.json`

### 4. Mermaid Diagram Generation
```bash
node src/monday/generate-accounts-mermaid.js
```
- Creates visual diagram of board connections
- Outputs: `accounts-board-diagram.md`

## 🔧 Configuration

### Environment Variables (.env)
```env
# Monday.com API Configuration
MONDAY_API_TOKEN=your_token_here  # From https://monday.com/developers/v2

# PostgreSQL Database Configuration
DATABASE_URL=postgres://earthharbor@localhost:5432/cosmetics_data_hub_v2_local

# Workspace IDs
CRM_WORKSPACE_ID=11007618
COSMETICS_WORKSPACE_ID=11691826

# Key Board IDs (from CRM workspace)
ACCOUNTS_BOARD_ID=9161287533
CONTACTS_BOARD_ID=9161287505
DEV_DEALS_BOARD_ID=9161287503
PROD_DEALS_BOARD_ID=9384243852
PROJECTS_BOARD_ID=9161287526
```

### Known Workspaces
- **CRM** (ID: 11007618) - Main CRM workspace with 25 boards
- **Production** (ID: Unknown) - Contains Production board
- **Lab** (ID: 9736208) - Contains development/lab boards
- **Cosmetics Testing Lab** (ID: 11691826) - Test workspace

### PostgreSQL Database
- **Database**: cosmetics_data_hub_v2_local
- **Key Tables**: formulas, ingredients, formula_ingredients, inci_names
- **Purpose**: Source of truth for formula and ingredient data

## 📋 Common Tasks

### Map All Board Connections
```bash
# From any starting board
node src/monday/trace-board-connections.js --board-id=9161287533
```

### Generate Board Visualization
```bash
# Create Mermaid diagram for any board
node src/monday/generate-mermaid.js --board-id=9161287533 --output=board-diagram.md
```

### Sync Database to Monday
```bash
# Sync formulas/ingredients to Monday boards
node src/database/sync-to-monday.js --type=ingredients --dry-run
```

## 🛠️ Development Guidelines

### Adding New Tools
1. Create tool in appropriate `src/` subdirectory
2. Follow existing patterns for Monday API usage
3. Add npm script to `package.json`
4. Document in this README

### API Best Practices
- Use the working query pattern from existing scripts
- Respect rate limits (10 req/sec)
- Handle pagination for large result sets
- Always use try/catch for API calls

### Testing
- Use `--dry-run` flag on any sync operations
- Test with single items before bulk operations
- Check generated JSON files before using in production

## 📝 Next Steps

1. **Complete Board Mapping**: Trace connections from other key boards (Contacts, Projects, Dev Deals)
2. **Database Integration**: Build tools to sync PostgreSQL data to Monday boards
3. **Automated Reports**: Generate weekly board health reports
4. **Cross-Workspace Analysis**: Map connections between all workspaces

## 🚨 Important Notes

- Always use read-only operations on the PostgreSQL database
- The Monday API token should have appropriate permissions
- Generated files contain sensitive business data - handle appropriately
- Some boards (Shopify Integration, Development Board) were not found but are referenced in mirror columns