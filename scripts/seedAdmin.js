const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

async function run() {
  const {
    MYSQL_HOST = "127.0.0.1",
    MYSQL_PORT = 3306,
    MYSQL_USER,
    MYSQL_PASSWORD,
    MYSQL_DATABASE,
  } = process.env;

  if (!MYSQL_USER || !MYSQL_PASSWORD || !MYSQL_DATABASE) {
    console.error(
      "Missing DB credentials in .env.local. Fill MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE."
    );
    process.exit(1);
  }

  const pool = mysql.createPool({
    host: MYSQL_HOST,
    port: MYSQL_PORT,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 5,
  });

  const email = "admin@example.com";
  const plainPass = "ChangeMe123!";

  try {
    const [rows] = await pool.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (rows.length) {
      console.log("Admin already exists:", email);
      await pool.end();
      process.exit(0);
    }

    const hash = await bcrypt.hash(plainPass, 10);
    const [res] = await pool.query(
      "INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)",
      [email, hash, "admin", "Admin"]
    );

    console.log("Seeded admin:", email);
    console.log("User id:", res.insertId);
    console.log("Password (store securely, change immediately):", plainPass);
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error("Error seeding admin:", err.message || err);
    try {
      await pool.end();
    } catch {}
    process.exit(1);
  }
}

run();
