const { sql, ensureTables } = require("../_db");

module.exports = async (req, res) => {
  await ensureTables();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: "Missing id" });
  }

  const { rows } = await sql`
    UPDATE submissions
    SET likes = likes + 1
    WHERE id = ${id}
    RETURNING likes
  `;

  if (!rows.length) {
    return res.status(404).json({ error: "Not found" });
  }

  return res.status(200).json({ likes: rows[0].likes });
};
