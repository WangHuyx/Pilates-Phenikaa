const fs = require('fs');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

async function run() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      multipleStatements: true,
    });
    
    console.log('Connected to MySQL. Importing database...');
    
    const sqlPath = path.join(__dirname, 'pilates_db.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await connection.query(sql);
    console.log('Database imported successfully.');
    
    await connection.end();
  } catch (err) {
    console.error('Error importing database:', err);
    process.exit(1);
  }
}

run();
