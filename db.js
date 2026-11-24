require("dotenv").config();
const { Pool } = require("pg");

const url = process.env.DATABASE_URL;
const isLocal = !url || /localhost|127\.0\.0\.1/.test(url);

const pool = new Pool({
  connectionString: url,
  ssl: isLocal ? false : { rejectUnauthorized: false }
});

module.exports = pool;