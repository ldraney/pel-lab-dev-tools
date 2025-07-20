const fs = require('fs');

function generateAccountsMermaid() {
  console.log('📊 Generating Mermaid Diagram for Accounts Board Connections\n');
  
  try {
    // Read the connections file
    const connectionsData = JSON.parse(
      fs.readFileSync('../../output/accounts-deep-connections.json', 'utf8')
    );
    
    // Start building the Mermaid diagram
    let mermaid = '```mermaid\n';
    mermaid += 'graph TD\n';
    mermaid += '    %% Styling\n';
    mermaid += '    classDef crmStyle fill:#4a90e2,stroke:#2c5aa0,stroke-width:2px,color:#fff\n';
    mermaid += '    classDef productionStyle fill:#82ca9d,stroke:#5da271,stroke-width:2px,color:#fff\n';
    mermaid += '    classDef ecommerceStyle fill:#f39c12,stroke:#d68910,stroke-width:2px,color:#fff\n';
    mermaid += '    classDef labStyle fill:#e74c3c,stroke:#c0392b,stroke-width:2px,color:#fff\n';
    mermaid += '    classDef notFoundStyle fill:#95a5a6,stroke:#7f8c8d,stroke-width:2px,color:#fff,stroke-dasharray: 5 5\n';
    mermaid += '\n';
    
    // Central Accounts node
    mermaid += '    %% Central Node\n';
    mermaid += '    Accounts["🏢 Accounts<br/>(CRM Workspace)"]:::crmStyle\n';
    mermaid += '\n';
    
    // Group connections by workspace
    const workspaceGroups = {};
    connectionsData.mirrorConnections.forEach(conn => {
      const workspace = conn.sourceBoard.workspace;
      if (!workspaceGroups[workspace]) {
        workspaceGroups[workspace] = [];
      }
      workspaceGroups[workspace].push(conn);
    });
    
    // Create subgraphs for each workspace
    Object.entries(workspaceGroups).forEach(([workspace, connections]) => {
      if (workspace === 'CRM') {
        mermaid += '    %% CRM Workspace Connections\n';
        mermaid += '    subgraph "CRM Workspace"\n';
        connections.forEach(conn => {
          const nodeId = conn.sourceBoard.name.replace(/[^a-zA-Z0-9]/g, '_');
          mermaid += `        ${nodeId}["${conn.sourceBoard.name}"]:::crmStyle\n`;
        });
        mermaid += '    end\n\n';
      } else if (workspace === 'Production') {
        mermaid += '    %% Production Workspace\n';
        mermaid += '    subgraph "Production Workspace"\n';
        connections.forEach(conn => {
          const nodeId = conn.sourceBoard.name.replace(/[^a-zA-Z0-9]/g, '_');
          mermaid += `        ${nodeId}["${conn.sourceBoard.name}"]:::productionStyle\n`;
        });
        mermaid += '    end\n\n';
      } else if (workspace === 'E-commerce') {
        mermaid += '    %% E-commerce Workspace (Not Found)\n';
        mermaid += '    subgraph "E-commerce Workspace [Missing]"\n';
        connections.forEach(conn => {
          const nodeId = conn.sourceBoard.name.replace(/[^a-zA-Z0-9]/g, '_');
          mermaid += `        ${nodeId}["${conn.sourceBoard.name}<br/>(Not Found)"]:::notFoundStyle\n`;
        });
        mermaid += '    end\n\n';
      } else if (workspace === 'Lab') {
        mermaid += '    %% Lab Workspace (Not Found)\n';
        mermaid += '    subgraph "Lab Workspace [Missing]"\n';
        connections.forEach(conn => {
          const nodeId = conn.sourceBoard.name.replace(/[^a-zA-Z0-9]/g, '_');
          mermaid += `        ${nodeId}["${conn.sourceBoard.name}<br/>(Not Found)"]:::notFoundStyle\n`;
        });
        mermaid += '    end\n\n';
      } else if (workspace === 'CRM - template') {
        mermaid += '    %% CRM Template Workspace\n';
        mermaid += '    subgraph "CRM Template Workspace"\n';
        connections.forEach(conn => {
          const nodeId = conn.sourceBoard.name.replace(/[^a-zA-Z0-9]/g, '_');
          mermaid += `        ${nodeId}["${conn.sourceBoard.name}"]:::crmStyle\n`;
        });
        mermaid += '    end\n\n';
      }
    });
    
    // Add connections
    mermaid += '    %% Mirror Connections\n';
    connectionsData.mirrorConnections.forEach(conn => {
      const sourceId = conn.sourceBoard.name.replace(/[^a-zA-Z0-9]/g, '_');
      const label = conn.columnName.replace(/"/g, "'");
      mermaid += `    ${sourceId} -.->|"${label}"| Accounts\n`;
    });
    
    mermaid += '\n';
    mermaid += '    %% Legend\n';
    mermaid += '    subgraph "Legend"\n';
    mermaid += '        L1["CRM Boards"]:::crmStyle\n';
    mermaid += '        L2["Production"]:::productionStyle\n';
    mermaid += '        L3["E-commerce"]:::ecommerceStyle\n';
    mermaid += '        L4["Lab"]:::labStyle\n';
    mermaid += '        L5["Not Found"]:::notFoundStyle\n';
    mermaid += '    end\n';
    
    mermaid += '```\n';
    
    // Save to file
    fs.writeFileSync('../../output/accounts-board-diagram.md', mermaid);
    console.log('✅ Mermaid diagram saved to: output/accounts-board-diagram.md\n');
    
    // Also output to console
    console.log('📊 Mermaid Diagram:\n');
    console.log(mermaid);
    
    // Summary
    console.log('\n📋 Summary:');
    console.log(`   Total mirror connections: ${connectionsData.mirrorConnections.length}`);
    console.log(`   Connected workspaces: ${connectionsData.connectedWorkspaces.length}`);
    console.log(`   Found boards: ${connectionsData.mirrorConnections.filter(c => !c.sourceBoard.status).length}`);
    console.log(`   Missing boards: ${connectionsData.mirrorConnections.filter(c => c.sourceBoard.status === 'not_found').length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  generateAccountsMermaid();
}

module.exports = { generateAccountsMermaid };