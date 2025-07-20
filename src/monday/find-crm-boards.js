const mondaySDK = require('monday-sdk-js');
require('dotenv').config();
const fs = require('fs');

const monday = mondaySDK();
monday.setToken(process.env.MONDAY_API_TOKEN);

async function findCRMBoards() {
  console.log('🔍 Finding CRM Boards and Connections\n');
  
  try {
    // Use the working query pattern from debug-monday-api.js
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
    
    const response = await monday.api(boardsQuery);
    const allBoards = response.data.boards;
    
    console.log(`✅ Found ${allBoards.length} total boards\n`);
    
    // Find CRM workspace boards
    const crmBoards = allBoards.filter(board => 
      board.workspace && 
      (board.workspace.name === 'CRM' || board.workspace.id === '11007618')
    );
    
    if (crmBoards.length === 0) {
      console.log('❌ No boards found in CRM workspace');
      console.log('\nAvailable workspaces:');
      const workspaces = {};
      allBoards.forEach(board => {
        if (board.workspace) {
          const key = `${board.workspace.name} (ID: ${board.workspace.id})`;
          workspaces[key] = (workspaces[key] || 0) + 1;
        }
      });
      Object.entries(workspaces).forEach(([ws, count]) => {
        console.log(`  - ${ws}: ${count} boards`);
      });
      return;
    }
    
    console.log(`📌 Found ${crmBoards.length} boards in CRM workspace:\n`);
    
    const connections = [];
    const boardMap = {};
    
    // Create board lookup
    allBoards.forEach(board => {
      boardMap[board.id] = {
        name: board.name,
        workspace: board.workspace?.name || 'Unknown'
      };
    });
    
    // Analyze CRM boards
    crmBoards.forEach((board, index) => {
      console.log(`${index + 1}. ${board.name}`);
      console.log(`   ID: ${board.id}`);
      
      // Find connection columns
      const connectionColumns = board.columns.filter(col => 
        col.type === 'board-relation' || 
        col.type === 'dependency' || 
        col.type === 'mirror' ||
        col.type === 'link_to_board'
      );
      
      if (connectionColumns.length > 0) {
        console.log(`   Connections:`);
        
        connectionColumns.forEach(col => {
          console.log(`   - ${col.title} (${col.type})`);
          
          if (col.settings_str) {
            try {
              const settings = JSON.parse(col.settings_str);
              
              // Get connected board IDs
              let connectedIds = [];
              if (settings.boardIds) connectedIds = settings.boardIds;
              else if (settings.boardId) connectedIds = [settings.boardId];
              
              connectedIds.forEach(id => {
                const target = boardMap[String(id)];
                if (target) {
                  console.log(`     → ${target.name} (${target.workspace})`);
                  connections.push({
                    source: board.name,
                    sourceId: board.id,
                    target: target.name,
                    targetId: id,
                    targetWorkspace: target.workspace,
                    column: col.title,
                    type: col.type
                  });
                }
              });
            } catch (e) {
              // Settings parsing failed
            }
          }
        });
      }
      console.log();
    });
    
    // Save results
    const config = {
      crmWorkspace: {
        id: 11007618,
        name: 'CRM'
      },
      boards: crmBoards.map(b => ({
        id: b.id,
        name: b.name
      })),
      connections: connections,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('../../output/crm-boards-config.json', JSON.stringify(config, null, 2));
    console.log(`💾 Saved to: output/crm-boards-config.json\n`);
    
    // Generate Mermaid diagram
    if (connections.length > 0) {
      console.log('📊 Mermaid Diagram:\n');
      console.log('```mermaid');
      console.log('graph TD');
      
      // CRM boards
      console.log('    subgraph "CRM Workspace"');
      crmBoards.forEach(board => {
        const safeName = board.name.replace(/[^a-zA-Z0-9]/g, '_');
        console.log(`        ${safeName}["${board.name}"]`);
      });
      console.log('    end');
      
      // External workspaces
      const externalWorkspaces = {};
      connections.forEach(conn => {
        if (conn.targetWorkspace !== 'CRM') {
          if (!externalWorkspaces[conn.targetWorkspace]) {
            externalWorkspaces[conn.targetWorkspace] = new Set();
          }
          externalWorkspaces[conn.targetWorkspace].add(conn.target);
        }
      });
      
      Object.entries(externalWorkspaces).forEach(([ws, boards]) => {
        console.log(`    subgraph "${ws}"`);
        boards.forEach(boardName => {
          const safeName = boardName.replace(/[^a-zA-Z0-9]/g, '_');
          console.log(`        ${safeName}["${boardName}"]`);
        });
        console.log('    end');
      });
      
      // Connections
      connections.forEach(conn => {
        const source = conn.source.replace(/[^a-zA-Z0-9]/g, '_');
        const target = conn.target.replace(/[^a-zA-Z0-9]/g, '_');
        console.log(`    ${source} -->|"${conn.column}"| ${target}`);
      });
      
      console.log('```');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  findCRMBoards();
}

module.exports = { findCRMBoards };