const supabase = require("../../_supabase");
const { sql, ensureTables } = require("../../_db");

const BUCKET = process.env.SUPABASE_BUCKET || "images";

const extractPathFromUrl = (url) => {
  const marker = `/${BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return "";
  return url.slice(index + marker.length);
};

module.exports = async (req, res) => {
  await ensureTables();

  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: "Missing id" });
  }

  const { rows } = await sql`
    DELETE FROM submissions
    WHERE id = ${id}
    RETURNING image_path, image_url
  `;

  if (!rows.length) {
    return res.status(404).json({ error: "Not found" });
  }

  const imagePath = rows[0].image_path || extractPathFromUrl(rows[0].image_url || "");
  if (imagePath) {
    await supabase.storage.from(BUCKET).remove([imagePath]);
  }

  return res.status(200).json({ ok: true });
};
