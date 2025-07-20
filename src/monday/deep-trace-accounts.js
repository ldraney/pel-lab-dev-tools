const mondaySDK = require('monday-sdk-js');
require('dotenv').config();
const fs = require('fs');

const monday = mondaySDK();
monday.setToken(process.env.MONDAY_API_TOKEN);

const ACCOUNTS_BOARD_ID = '9161287533';

async function deepTraceAccounts() {
  console.log('🔍 Deep Tracing Accounts Board Connections\n');
  
  try {
    // Get accounts board with columns first
    const accountsQuery = `
      query {
        boards(ids: [${ACCOUNTS_BOARD_ID}]) {
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
    
    const response = await monday.api(accountsQuery);
    const accountsBoard = response.data.boards[0];
    
    console.log(`📋 ${accountsBoard.name} (${accountsBoard.workspace.name})\n`);
    
    // Find all connection columns
    const mirrorColumns = accountsBoard.columns.filter(col => col.type === 'mirror');
    const relationColumns = accountsBoard.columns.filter(col => 
      col.type === 'board-relation' || col.type === 'dependency'
    );
    
    console.log(`Found ${mirrorColumns.length} mirror columns and ${relationColumns.length} relation columns\n`);
    
    // Analyze mirror columns by looking at their names to infer connections
    const mirrorConnections = [];
    const knownBoards = {
      'Production Status': { workspace: 'Production', boardName: 'Production Board' },
      'Shopify Status': { workspace: 'E-commerce', boardName: 'Shopify Integration' },
      'Development Status': { workspace: 'Lab', boardName: 'Development Board' },
      'Dev Deals Status': { workspace: 'CRM', boardName: 'Dev Deals', boardId: '9161287503' },
      'Prod Deals Status': { workspace: 'CRM', boardName: 'Prod Deals', boardId: '9384243852' },
      'Project Status': { workspace: 'CRM', boardName: 'Projects', boardId: '9161287526' },
      'Deals': { workspace: 'CRM', boardName: 'Deals Board' }
    };
    
    console.log('🔍 Analyzing mirror columns:\n');
    
    for (const col of mirrorColumns) {
      console.log(`📊 ${col.title}`);
      
      // Check if we know about this mirror column
      const known = knownBoards[col.title];
      if (known) {
        console.log(`   → Likely mirrors from: ${known.boardName} (${known.workspace})`);
        mirrorConnections.push({
          columnName: col.title,
          columnId: col.id,
          type: 'mirror',
          inferredSource: known
        });
      }
      
      // Note: We'll check sample values separately if needed
      console.log();
    }
    
    // Now let's search for the actual source boards
    console.log('🔍 Searching for source boards...\n');
    
    // Get all boards to find potential sources
    const allBoardsQuery = `
      query {
        boards(limit: 200) {
          id
          name
          workspace {
            id
            name
          }
        }
      }
    `;
    
    const allBoardsResponse = await monday.api(allBoardsQuery);
    const allBoards = allBoardsResponse.data.boards;
    
    // Try to match mirror columns with actual boards
    const connectionMap = {
      accountsBoard: {
        id: accountsBoard.id,
        name: accountsBoard.name,
        workspace: accountsBoard.workspace.name,
        workspaceId: accountsBoard.workspace.id
      },
      mirrorConnections: [],
      relationConnections: [],
      connectedWorkspaces: new Set(),
      timestamp: new Date().toISOString()
    };
    
    // Process each mirror connection
    for (const conn of mirrorConnections) {
      let sourceBoard = null;
      
      // First check if we have a known board ID
      if (conn.inferredSource.boardId) {
        sourceBoard = allBoards.find(b => b.id === conn.inferredSource.boardId);
      }
      
      // If not found, try to match by name and workspace
      if (!sourceBoard && conn.inferredSource.boardName) {
        sourceBoard = allBoards.find(b => 
          b.name.toLowerCase().includes(conn.inferredSource.boardName.toLowerCase()) ||
          conn.inferredSource.boardName.toLowerCase().includes(b.name.toLowerCase())
        );
      }
      
      if (sourceBoard) {
        console.log(`✅ Found source for "${conn.columnName}": ${sourceBoard.name} (${sourceBoard.workspace.name})`);
        connectionMap.connectedWorkspaces.add(sourceBoard.workspace.name);
        
        connectionMap.mirrorConnections.push({
          columnName: conn.columnName,
          columnId: conn.columnId,
          sourceBoard: {
            id: sourceBoard.id,
            name: sourceBoard.name,
            workspace: sourceBoard.workspace.name
          }
        });
      } else {
        console.log(`❓ Could not find source board for "${conn.columnName}"`);
        connectionMap.mirrorConnections.push({
          columnName: conn.columnName,
          columnId: conn.columnId,
          sourceBoard: {
            name: conn.inferredSource.boardName,
            workspace: conn.inferredSource.workspace,
            status: 'not_found'
          }
        });
      }
    }
    
    // Convert Set to Array for JSON
    connectionMap.connectedWorkspaces = Array.from(connectionMap.connectedWorkspaces);
    
    // Save the results
    const path = require('path');
    const outputPath = path.join(__dirname, '../../output/accounts-deep-connections.json');
    fs.writeFileSync(outputPath, JSON.stringify(connectionMap, null, 2));
    console.log(`\n💾 Saved to: output/accounts-deep-connections.json\n`);
    
    // Generate summary
    console.log('📊 Connection Summary:');
    console.log(`   Mirror columns: ${connectionMap.mirrorConnections.length}`);
    console.log(`   Connected workspaces: ${connectionMap.connectedWorkspaces.join(', ')}`);
    console.log('\n🔗 Connections:');
    
    connectionMap.mirrorConnections.forEach(conn => {
      if (conn.sourceBoard.status === 'not_found') {
        console.log(`   ${conn.columnName} → ${conn.sourceBoard.name} (${conn.sourceBoard.workspace}) [NOT FOUND]`);
      } else {
        console.log(`   ${conn.columnName} → ${conn.sourceBoard.name} (${conn.sourceBoard.workspace})`);
      }
    });
    
    return connectionMap;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Details:', error.response.data);
    }
  }
}

// Run if called directly
if (require.main === module) {
  deepTraceAccounts();
}

module.exports = { deepTraceAccounts };