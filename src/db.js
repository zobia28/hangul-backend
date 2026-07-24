const { Pool } = require("pg");
require("dotenv").config();

const useSsl = process.env.DATABASE_SSL === "true";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err) => {
  // Idle client errors shouldn't crash the whole process
  console.error("Unexpected error on idle Postgres client", err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
