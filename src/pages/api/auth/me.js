import db from "../../../lib/db";
import jwt from "jsonwebtoken";
import cookie from "cookie";

export default async function handler(req, res) {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies.token;

    if (!token) {
      console.log("❌ No token cookie received");
      return res.status(401).json({ error: "Not authenticated" });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || "change-me");
    } catch (e) {
      console.log("❌ Invalid token:", e.message);
      return res.status(401).json({ error: "Invalid token" });
    }

    const rows = await db.query(
      "SELECT id, email, role, name, created_at FROM users WHERE id = ?",
      [payload.id]
    );
    if (!rows.length) {
      console.log("❌ User not found for id:", payload.id);
      return res.status(404).json({ error: "User not found" });
    }

    console.log("✅ Authenticated user:", rows[0].email);
    return res.status(200).json({ user: rows[0] });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
