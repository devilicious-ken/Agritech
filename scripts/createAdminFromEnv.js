const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

(async () => {
  const {
    MYSQL_HOST = "127.0.0.1",
    MYSQL_PORT = 3306,
    MYSQL_USER,
    MYSQL_PASSWORD,
    MYSQL_DATABASE,
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    ADMIN_ROLE = "admin",
    ADMIN_NAME = "Admin",
  } = process.env;

  if (
    !MYSQL_USER ||
    MYSQL_PASSWORD === undefined ||
    !MYSQL_DATABASE ||
    !ADMIN_EMAIL ||
    !ADMIN_PASSWORD
  ) {
    console.error("Fill MYSQL_*, ADMIN_EMAIL and ADMIN_PASSWORD in .env.local");
    process.exit(1);
  }

  const pool = mysql.createPool({
    host: MYSQL_HOST,
    port: MYSQL_PORT,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 3,
  });

  try {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const sql = `
      INSERT INTO users (email, password_hash, role, name)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        password_hash = VALUES(password_hash),
        role = VALUES(role),
        name = VALUES(name)
    `;
    const [res] = await pool.query(sql, [
      ADMIN_EMAIL,
      hash,
      ADMIN_ROLE,
      ADMIN_NAME,
    ]);
    if (res.affectedRows) {
      console.log(
        `Admin ensured: ${ADMIN_EMAIL} (password: ${ADMIN_PASSWORD})`
      );
    } else {
      console.log("No rows affected. Check table schema or permissions.");
    }
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error("Error creating/updating admin:", err.message || err);
    try {
      await pool.end();
    } catch {}
    process.exit(1);
  }
})();
