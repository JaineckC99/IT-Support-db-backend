const fs = require("fs");
const path = require("path");
const pool = require("../db");

async function run() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, "..", "schema.sql"), "utf8");
    await pool.query(schema);
    console.log("Table 'records' is ready.");

    const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM records");
    if (rows[0].n === 0) {
      const seed = fs.readFileSync(path.join(__dirname, "..", "seed.sql"), "utf8");
      await pool.query(seed);
      console.log("Inserted 8 starter records.");
    } else {
      console.log(`Table already has ${rows[0].n} records. Seed skipped.`);
    }
    console.log("Database setup finished.");
  } catch (error) {
    console.error("Setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();