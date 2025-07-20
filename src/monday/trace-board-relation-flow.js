const mondaySDK = require('monday-sdk-js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const monday = mondaySDK();
monday.setToken(process.env.MONDAY_API_TOKEN);

/**
 * Traces board connections using board_relation columns (primary connections)
 * Follows the confirmed flow: Accounts → Dev Deals → Development → EPO - Ingredients
 */

const CONFIRMED_FLOW = [
  {
    step: 1,
    name: 'Accounts',
    id: '9161287533',
    workspace: 'CRM',
    nextConnection: 'Dev Deals Status', // mirror column
    nextBoardId: '9161287503'
  },
  {
    step: 2,
    name: 'Dev Deals',
    id: '9161287503',
    workspace: 'CRM',
    nextConnection: 'Development Ticket', // board_relation column
    nextBoardId: '8446397459'
  },
  {
    step: 3,
    name: 'Development',
    id: '8446397459',
    workspace: 'Lab',
    nextConnection: 'EPOs - Ingredients', // board_relation column
    nextBoardId: '9387127195'
  },
  {
    step: 4,
    name: 'EPO - Ingredients',
    id: '9387127195',
    workspace: 'VRM - Purchasing',
    nextConnection: null,
    nextBoardId: null
  }
];

async function getBoardDetails(boardId) {
  try {
    const query = `
      query {
        boards(ids: [${boardId}]) {
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
    
    const response = await monday.api(query);
    return response.data?.boards?.[0] || null;
  } catch (error) {
    console.error(`❌ Error fetching board ${boardId}:`, error.message);
    return null;
  }
}

function findBoardRelationColumns(board) {
  const relationColumns = board.columns.filter(col => 
    col.type === 'board_relation' || col.type === 'dependency'
  );
  
  return relationColumns.map(col => {
    let connectedBoardIds = [];
    
    if (col.settings_str) {
      try {
        const settings = JSON.parse(col.settings_str);
        if (settings.boardIds) {
          connectedBoardIds = settings.boardIds;
        } else if (settings.board_id) {
          connectedBoardIds = [settings.board_id];
        }
      } catch (e) {
        console.log(`   Warning: Could not parse settings for ${col.title}`);
      }
    }
    
    return {
      columnId: col.id,
      columnName: col.title,
      columnType: col.type,
      connectedBoardIds
    };
  });
}

function findMirrorColumns(board) {
  return board.columns
    .filter(col => col.type === 'mirror')
    .map(col => ({
      columnId: col.id,
      columnName: col.title,
      columnType: col.type
    }));
}

async function traceBoardRelationFlow() {
  console.log('🔗 Tracing Board Relation Flow: Accounts → Dev Deals → Development → EPO - Ingredients\n');
  console.log('📝 Using board_relation columns as PRIMARY connection method\n');
  
  const flowResults = {
    flow: [],
    timestamp: new Date().toISOString(),
    method: 'board_relation_primary',
    success: false,
    insights: []
  };
  
  try {
    for (const step of CONFIRMED_FLOW) {
      console.log(`🎯 Step ${step.step}: ${step.name} Board`);
      
      const board = await getBoardDetails(step.id);
      if (!board) {
        console.log(`❌ Could not load ${step.name} board`);
        continue;
      }
      
      console.log(`✅ ${board.name} (${board.workspace.name})`);
      
      // Find board_relation columns (PRIMARY)
      const relationColumns = findBoardRelationColumns(board);
      
      // Find mirror columns (SECONDARY - for data display)
      const mirrorColumns = findMirrorColumns(board);
      
      console.log(`   🔗 Board Relations: ${relationColumns.length}`);
      console.log(`   🪞 Mirror Columns: ${mirrorColumns.length}`);
      
      const stepResult = {
        step: step.step,
        board: {
          id: board.id,
          name: board.name,
          workspace: board.workspace.name,
          workspaceId: board.workspace.id
        },
        primaryConnections: relationColumns,
        secondaryConnections: mirrorColumns,
        nextBoard: null,
        connectionMethod: null
      };
      
      // Find the specific connection to next board
      if (step.nextBoardId) {
        console.log(`   🔍 Looking for connection to next board (${step.nextBoardId})...`);
        
        // First check board_relation columns
        const relationMatch = relationColumns.find(col => 
          col.connectedBoardIds.includes(parseInt(step.nextBoardId)) ||
          col.columnName.toLowerCase().includes(step.nextConnection?.toLowerCase())
        );
        
        if (relationMatch) {
          console.log(`   ✅ Found board_relation: "${relationMatch.columnName}"`);
          stepResult.nextBoard = {
            id: step.nextBoardId,
            name: CONFIRMED_FLOW.find(s => s.id === step.nextBoardId)?.name,
            connectionColumn: relationMatch.columnName,
            connectionType: 'board_relation'
          };
          stepResult.connectionMethod = 'board_relation';
          
          flowResults.insights.push(`${step.name} → ${stepResult.nextBoard.name}: PRIMARY connection via board_relation "${relationMatch.columnName}"`);
        } else {
          // Fallback to mirror column
          const mirrorMatch = mirrorColumns.find(col =>
            col.columnName.toLowerCase().includes(step.nextConnection?.toLowerCase())
          );
          
          if (mirrorMatch) {
            console.log(`   ⚠️  Found mirror connection: "${mirrorMatch.columnName}" (derived from board_relation)`);
            stepResult.nextBoard = {
              id: step.nextBoardId,
              name: CONFIRMED_FLOW.find(s => s.id === step.nextBoardId)?.name,
              connectionColumn: mirrorMatch.columnName,
              connectionType: 'mirror'
            };
            stepResult.connectionMethod = 'mirror';
            
            flowResults.insights.push(`${step.name} → ${stepResult.nextBoard.name}: SECONDARY connection via mirror "${mirrorMatch.columnName}"`);
          }
        }
      }
      
      flowResults.flow.push(stepResult);
      console.log('');
    }
    
    flowResults.success = true;
    console.log('🎉 Successfully traced complete board relation flow!\n');
    
    // Save results
    const outputPath = path.join(__dirname, '../../output/flow-accounts-to-epo-ingredients-trace.json');
    fs.writeFileSync(outputPath, JSON.stringify(flowResults, null, 2));
    console.log(`💾 Results saved to: output/flow-accounts-to-epo-ingredients-trace.json\n`);
    
    // Print insights
    console.log('💡 Connection Insights:');
    flowResults.insights.forEach(insight => {
      console.log(`   - ${insight}`);
    });
    
    // Print flow summary
    console.log('\n📊 Flow Summary:');
    flowResults.flow.forEach(step => {
      if (step.nextBoard) {
        const method = step.connectionMethod === 'board_relation' ? '🔗' : '🪞';
        console.log(`   ${step.step}. ${step.board.name} ${method} ${step.nextBoard.name} [${step.nextBoard.connectionColumn}]`);
      } else {
        console.log(`   ${step.step}. ${step.board.name} (final destination)`);
      }
    });
    
    return flowResults;
    
  } catch (error) {
    console.error('❌ Error tracing board relation flow:', error.message);
    if (error.response?.data) {
      console.error('API Error Details:', error.response.data);
    }
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  traceBoardRelationFlow().catch(console.error);
}

module.exports = { 
  traceBoardRelationFlow, 
  CONFIRMED_FLOW, 
  findBoardRelationColumns,
  findMirrorColumns 
};