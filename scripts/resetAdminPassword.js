const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

(async () => {
  const email = process.argv[2] || "admin@agritech.gov";
  const newPass = process.argv[3] || "ChangeMe123!";
  if (!email || !newPass) {
    console.error("Usage: node resetAdminPassword.js <email> <newPassword>");
    process.exit(1);
  }

  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });

  try {
    const hash = await bcrypt.hash(newPass, 10);
    const [res] = await pool.query(
      "UPDATE users SET password_hash = ? WHERE email = ?",
      [hash, email]
    );
    if (res.affectedRows) {
      console.log("Password updated for", email);
    } else {
      console.log("No user updated. Check email exists:", email);
    }
    await pool.end();
  } catch (err) {
    console.error("Error:", err.message || err);
    try {
      await pool.end();
    } catch {}
    process.exit(1);
  }
})();
