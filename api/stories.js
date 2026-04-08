const crypto = require("crypto");
const { sql, ensureTables, getJsonBody } = require("./_db");

module.exports = async (req, res) => {
  await ensureTables();

  if (req.method === "GET") {
    const { rows } = await sql`
      SELECT id, title, name, description, likes, created_at
      FROM stories
      ORDER BY likes DESC, created_at DESC
    `;
    return res.status(200).json(rows);
  }

  if (req.method === "POST") {
    const body = await getJsonBody(req);
    const title = (body.title || "").trim();
    const name = (body.name || "").trim();
    const description = (body.description || "").trim();
    if (!title || !name || !description) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const id = crypto.randomUUID();
    const { rows } = await sql`
      INSERT INTO stories (id, title, name, description)
      VALUES (${id}, ${title}, ${name}, ${description})
      RETURNING id, title, name, description, likes, created_at
    `;
    return res.status(201).json(rows[0]);
  }

  return res.status(405).json({ error: "Method not allowed" });
};
