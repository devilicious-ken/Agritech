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
      "Fill MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE in .env.local"
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

  try {
    // create users table if not exists (uses password_hash column)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const adminEmail = "admin@agritech.gov";
    const adminPassword = "ChangeMe123!"; // change after first login

    const [rows] = await pool.query("SELECT id FROM users WHERE email = ?", [
      adminEmail,
    ]);
    if (rows.length) {
      console.log("Admin already exists:", adminEmail);
    } else {
      const hash = await bcrypt.hash(adminPassword, 10);
      const [res] = await pool.query(
        "INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)",
        [adminEmail, hash, "admin", "Administrator"]
      );
      console.log("Seeded admin:", adminEmail, "id:", res.insertId);
      console.log("Admin password (change immediately):", adminPassword);
    }

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message || err);
    try {
      await pool.end();
    } catch {}
    process.exit(1);
  }
}

run();
