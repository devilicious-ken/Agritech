import db from "../../../lib/db";

export default async function handler(req, res) {
  try {
    const { id } = req.query;
    const numericId = parseInt(id, 10);
    if (Number.isNaN(numericId))
      return res.status(400).json({ error: "invalid id" });

    if (req.method === "GET") {
      const rows = await db.query("SELECT * FROM items WHERE id = ?", [
        numericId,
      ]);
      if (!rows.length) return res.status(404).json({ error: "Not found" });
      return res.status(200).json(rows[0]);
    }

    if (req.method === "PUT") {
      const { name, description } = req.body || {};
      const fields = [];
      const params = [];
      if (name !== undefined) {
        fields.push("name = ?");
        params.push(name);
      }
      if (description !== undefined) {
        fields.push("description = ?");
        params.push(description);
      }
      if (!fields.length)
        return res.status(400).json({ error: "no fields to update" });
      params.push(numericId);
      await db.execute(
        `UPDATE items SET ${fields.join(", ")} WHERE id = ?`,
        params
      );
      const rows = await db.query("SELECT * FROM items WHERE id = ?", [
        numericId,
      ]);
      return res.status(200).json(rows.length ? rows[0] : null);
    }

    if (req.method === "DELETE") {
      await db.execute("DELETE FROM items WHERE id = ?", [numericId]);
      return res.status(204).end();
    }

    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
