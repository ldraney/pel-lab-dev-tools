const mondaySDK = require('monday-sdk-js');
require('dotenv').config();

const monday = mondaySDK();
monday.setToken(process.env.MONDAY_API_TOKEN);

async function discoverWorkspaces() {
  console.log('🔍 Discovering Monday.com Workspaces\n');
  
  try {
    // First, verify connection
    const meQuery = `query { me { id name email } }`;
    const meResponse = await monday.api(meQuery);
    console.log(`✅ Connected as: ${meResponse.data.me.name}\n`);
    
    // Get all workspaces
    const workspacesQuery = `
      query {
        workspaces {
          id
          name
          description
          kind
          state
        }
      }
    `;
    
    const response = await monday.api(workspacesQuery);
    const workspaces = response.data.workspaces;
    
    console.log(`Found ${workspaces.length} workspaces:\n`);
    
    // Display all workspaces
    workspaces.forEach((ws, index) => {
      console.log(`${index + 1}. ${ws.name}`);
      console.log(`   ID: ${ws.id}`);
      console.log(`   Kind: ${ws.kind}`);
      console.log(`   State: ${ws.state}`);
      if (ws.description) {
        console.log(`   Description: ${ws.description}`);
      }
      console.log();
    });
    
    // Look for CRM workspace
    const crmWorkspace = workspaces.find(ws => 
      ws.name.toLowerCase().includes('crm') || 
      ws.name.toLowerCase().includes('customer')
    );
    
    if (crmWorkspace) {
      console.log('🎯 Found CRM Workspace:');
      console.log(`   Name: ${crmWorkspace.name}`);
      console.log(`   ID: ${crmWorkspace.id}`);
      console.log('\n   Add this to your .env file:');
      console.log(`   CRM_WORKSPACE_ID=${crmWorkspace.id}`);
    } else {
      console.log('❓ No workspace with "CRM" in the name found.');
      console.log('   Please identify which workspace is your CRM from the list above.');
    }
    
    return workspaces;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('API Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run if called directly
if (require.main === module) {
  discoverWorkspaces();
}

module.exports = { discoverWorkspaces };