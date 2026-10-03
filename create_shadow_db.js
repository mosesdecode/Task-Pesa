const { Client } = require('pg');

async function createDb() {
  const client = new Client({
    connectionString: 'postgresql://postgres:admin123@localhost:5432/postgres'
  });
  await client.connect();
  try {
    await client.query('DROP DATABASE IF EXISTS taskmint_shadow');
    await client.query('CREATE DATABASE taskmint_shadow');
    console.log('Database taskmint_shadow created successfully');
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

createDb();
