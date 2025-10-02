const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
const mysql = require("mysql2/promise");

(async () => {
  try {
    const pool = mysql.createPool({
      host: process.env.MYSQL_HOST || "127.0.0.1",
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });
    const [rows] = await pool.query("SELECT 1 AS ok");
    console.log("DB connection OK", rows);
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error("DB connection failed:", err.message || err);
    process.exit(1);
  }
})();
