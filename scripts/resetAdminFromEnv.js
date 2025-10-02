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
    const [res] = await pool.query(
      "UPDATE users SET password_hash = ? WHERE email = ?",
      [hash, ADMIN_EMAIL]
    );
    if (res.affectedRows) {
      console.log(`Password updated for ${ADMIN_EMAIL}`);
      console.log("Use this credential to login:", ADMIN_EMAIL, ADMIN_PASSWORD);
    } else {
      console.log(
        `No user found with email ${ADMIN_EMAIL}. Create one or check the email in phpMyAdmin.`
      );
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
})();
