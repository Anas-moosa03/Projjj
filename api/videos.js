const crypto = require("crypto");
const { sql, ensureTables, getJsonBody } = require("./_db");

const isLikelyUrl = (value) => /^https?:\/\//i.test(value);

module.exports = async (req, res) => {
  await ensureTables();

  if (req.method === "GET") {
    const { rows } = await sql`
      SELECT id, url, likes, created_at
      FROM videos
      ORDER BY likes DESC, created_at DESC
    `;
    return res.status(200).json(rows);
  }

  if (req.method === "POST") {
    const body = await getJsonBody(req);
    const url = (body.url || "").trim();
    if (!url || !isLikelyUrl(url)) {
      return res.status(400).json({ error: "Invalid URL" });
    }

    const id = crypto.randomUUID();
    const { rows } = await sql`
      INSERT INTO videos (id, url)
      VALUES (${id}, ${url})
      RETURNING id, url, likes, created_at
    `;
    return res.status(201).json(rows[0]);
  }

  return res.status(405).json({ error: "Method not allowed" });
};
