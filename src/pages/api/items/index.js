import db from "../../../lib/db";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const items = await db.query(
        "SELECT * FROM items ORDER BY created_at DESC"
      );
      return res.status(200).json(items);
    }

    if (req.method === "POST") {
      const { name, description } = req.body || {};
      if (!name) return res.status(400).json({ error: "name is required" });

      const result = await db.execute(
        "INSERT INTO items (name, description) VALUES (?, ?)",
        [name, description || null]
      );
      const insertId = result.insertId;
      const rows = await db.query("SELECT * FROM items WHERE id = ?", [
        insertId,
      ]);
      return res.status(201).json(rows.length ? rows[0] : null);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
