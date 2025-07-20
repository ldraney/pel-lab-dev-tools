const { Pool } = require('pg');
require('dotenv').config();

async function testDatabaseConnection() {
  console.log('🔍 Testing PostgreSQL Database Connection\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://earthharbor@localhost:5432/cosmetics_data_hub_v2_local'
  });

  try {
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Database connected successfully\n');
    
    // Get database info
    const dbInfo = await client.query('SELECT version()');
    console.log('📊 Database Version:', dbInfo.rows[0].version.split(' ').slice(0, 2).join(' '));
    
    // List tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`\n📋 Found ${tables.rows.length} tables:`);
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Get formula count
    const formulaCount = await client.query('SELECT COUNT(*) FROM formulas');
    console.log(`\n🧪 Total formulas: ${formulaCount.rows[0].count}`);
    
    // Get ingredient count  
    const ingredientCount = await client.query('SELECT COUNT(*) FROM ingredients');
    console.log(`🧪 Total ingredients: ${ingredientCount.rows[0].count}`);
    
    // Get 10 sample formulas
    const sampleFormulas = await client.query(`
      SELECT id, name, total_percentage 
      FROM formulas 
      ORDER BY name 
      LIMIT 10
    `);
    
    console.log('\n📝 Sample Formulas:');
    sampleFormulas.rows.forEach((formula, index) => {
      console.log(`${index + 1}. ${formula.name}`);
      console.log(`   ID: ${formula.id}`);
      console.log(`   Total %: ${formula.total_percentage || 'N/A'}%`);
      console.log();
    });
    
    client.release();
    return {
      connected: true,
      formulaCount: formulaCount.rows[0].count,
      ingredientCount: ingredientCount.rows[0].count,
      tables: tables.rows.map(r => r.table_name),
      sampleFormulas: sampleFormulas.rows
    };
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return { connected: false, error: error.message };
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  testDatabaseConnection();
}

module.exports = { testDatabaseConnection };