const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(() => console.log("✅ Connected to Railway Postgres"))
  .catch(err => console.error("❌ DB connection error:", err));
