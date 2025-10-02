import db from "../../../lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookie from "cookie";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const rows = await db.query(
      "SELECT id, email, password_hash, role, name FROM users WHERE email = ?",
      [email]
    );
    if (!rows.length) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET || "change-me", {
      expiresIn: "7d",
    });

    // 🔹 Dev-friendly cookie
    res.setHeader(
      "Set-Cookie",
      cookie.serialize("token", token, {
        httpOnly: false, // ⚠️ dev only! (so you can see it in DevTools)
        secure: false, // ⚠️ dev only! (HTTPS not required)
        sameSite: "lax", // safe for same-origin
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    );

    const safeUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    return res.status(200).json({ user: safeUser });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
