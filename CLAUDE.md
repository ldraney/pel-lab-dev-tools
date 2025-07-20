# CLAUDE.md - Dev Tools Project

This file provides guidance to Claude Code when working with the PEL Lab Dev Tools project.

## 🎯 Project Purpose

This is a **development toolkit** for managing Monday.com boards and PostgreSQL data. The project focuses on mapping board connections, generating visualizations, and providing insights for leadership about how different Monday.com workspaces and boards interconnect.

## 📊 Current Project Status (2025-07-20)

### ✅ **COMPLETED:**
- **Workspace Discovery**: Found 25 accessible workspaces, identified CRM workspace (ID: 11007618)
- **CRM Board Mapping**: Mapped all 25 boards in CRM workspace
- **Accounts Board Analysis**: Deep traced 7 mirror connections from Accounts board
- **Mermaid Diagram Generation**: Created visual diagram of Accounts board connections
- **Missing Board Identification**: Found 2 missing boards (Shopify Integration, Development Board)

### 🔄 **NEXT PHASE:**
- Map connections from other key CRM boards (Contacts, Projects, Dev Deals, Prod Deals)
- Build database sync tools for PostgreSQL → Monday.com
- Create cross-workspace connection analysis
- Generate automated board health reports

## 🏗️ Key Architecture

- **Data Sources**: 
  - Monday.com API (multiple workspaces)
  - PostgreSQL database (`cosmetics_data_hub_v2_local`)
- **Approach**: Read-only analysis and visualization, no modifications to source data
- **Output**: JSON connection maps and Mermaid diagrams

## 🚀 Key Scripts Created

### Core Analysis Tools
- `discover-workspaces.js` - Lists all accessible Monday.com workspaces
- `find-crm-boards.js` - Maps all boards in CRM workspace
- `trace-accounts-connections.js` - Initial attempt to trace board connections
- `deep-trace-accounts.js` - Successful deep trace of Accounts board connections
- `generate-accounts-mermaid.js` - Creates Mermaid diagram from connection data

### Output Files Generated
- `crm-boards-config.json` - All CRM boards and basic info
- `accounts-deep-connections.json` - Detailed Accounts board connection map
- `accounts-board-diagram.md` - Mermaid visualization of Accounts connections

## 🔑 Key Discoveries

### CRM Workspace Structure
- **Workspace ID**: 11007618
- **Total Boards**: 25
- **Key Entities**: Accounts, Contacts, Leads, Projects, Dev Deals, Prod Deals
- **Mirror Patterns**: Boards use mirror columns to pull data from other workspaces

### Accounts Board Connections
The Accounts board (ID: 9161287533) mirrors data from:
1. **Production Status** → Production board (Production workspace)
2. **Shopify Status** → Shopify Integration (E-commerce workspace) [NOT FOUND]
3. **Development Status** → Development Board (Lab workspace) [NOT FOUND]
4. **Deals** → Deals board (CRM - template workspace)
5. **Dev Deals Status** → Dev Deals board (CRM workspace)
6. **Prod Deals Status** → Prod Deals board (CRM workspace)
7. **Project Status** → Projects board (CRM workspace)

### Known Workspaces
```javascript
const workspaces = {
  'CRM': { id: 11007618, boardCount: 25 },
  'Production': { id: unknown, identified: true },
  'Lab': { id: 9736208, identified: true },
  'Cosmetics Testing Lab': { id: 11691826, boardCount: 5 },
  'E-commerce': { id: unknown, status: 'referenced but not found' }
};
```

## 🛠️ Technical Patterns

### Working Monday API Query
```javascript
const boardsQuery = `
  query {
    boards(limit: 200) {
      id
      name
      workspace {
        id
        name
      }
      columns {
        id
        title
        type
        settings_str
      }
    }
  }
`;
```

### Mirror Column Detection
Mirror columns can be identified by:
- Column type: 'mirror'
- Settings may not always contain source board ID
- Column names often indicate source (e.g., "Production Status", "Dev Deals Status")

### Connection Mapping Strategy
1. Get all boards with workspace info
2. Filter by target workspace
3. Analyze column types for connections
4. Infer missing connections from column names
5. Generate visual diagram with Mermaid

## 📋 Common Tasks

### Trace Any Board's Connections
```javascript
// Pattern to trace connections from any board
const BOARD_ID = 'target_board_id';
1. Get board details with columns
2. Filter for connection-type columns (mirror, board-relation, dependency)
3. Parse settings_str for connected board IDs
4. Fetch connected board details
5. Generate connection map
```

### Generate Mermaid Diagrams
```javascript
// Pattern for Mermaid generation
1. Read connection JSON file
2. Group by workspace
3. Create subgraphs for each workspace
4. Add styled nodes for boards
5. Add arrows for connections
6. Include legend for clarity
```

## 🚨 Important Context

1. **API Limitations**: Some mirror columns don't expose their source board IDs in settings
2. **Workspace Access**: User has access to 25 workspaces but not all boards within them
3. **Missing Boards**: Some referenced boards (Shopify, Development) weren't found in accessible boards
4. **CRM Template**: There's a "CRM - template" workspace separate from main CRM workspace

## 🔮 Future Enhancements

1. **Batch Connection Tracer**: Trace multiple boards in one run
2. **Cross-Workspace Mapper**: Map connections between all workspaces
3. **Database Sync Tools**: Sync PostgreSQL formulas/ingredients to Monday
4. **Automated Reports**: Weekly board health and connection reports
5. **Change Detection**: Monitor for new/removed connections

## 💡 Development Tips

- Always check if response.data exists before accessing nested properties
- Use descriptive console output with emojis for better readability
- Save all outputs as JSON for further processing
- Generate both human-readable and machine-readable outputs
- Consider board access permissions when boards aren't found