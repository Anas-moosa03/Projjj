const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const { IncomingForm } = require("formidable");
const supabase = require("./_supabase");
const { sql, ensureTables } = require("./_db");

const BUCKET = process.env.SUPABASE_BUCKET || "images";

const parseForm = (req) =>
  new Promise((resolve, reject) => {
    const form = new IncomingForm({
      multiples: false,
      maxFileSize: 10 * 1024 * 1024,
    });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });

module.exports = async (req, res) => {
  await ensureTables();

  if (req.method === "GET") {
    const { rows } = await sql`
      SELECT id, title, name, description, image_url, image_path, likes, created_at
      FROM submissions
      ORDER BY likes DESC, created_at DESC
    `;
    return res.status(200).json(rows);
  }

  if (req.method === "POST") {
    try {
      const { fields, files } = await parseForm(req);
      const title = (fields.title || "").toString().trim();
      const name = (fields.name || "").toString().trim();
      const description = (fields.description || "").toString().trim();
      const image = files.image;

      if (!title || !name || !description || !image) {
        return res.status(400).json({ error: "Missing fields" });
      }

      const file = Array.isArray(image) ? image[0] : image;
      const ext = path.extname(file.originalFilename || "") || ".jpg";
      const fileName = `${crypto.randomUUID()}${ext}`;
      const fileBuffer = await fs.readFile(file.filepath);

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, fileBuffer, {
          contentType: file.mimetype || "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        return res.status(500).json({ error: uploadError.message || "Upload failed" });
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
      const imageUrl = data.publicUrl;

      const id = crypto.randomUUID();
      const { rows } = await sql`
        INSERT INTO submissions (id, title, name, description, image_url, image_path)
        VALUES (${id}, ${title}, ${name}, ${description}, ${imageUrl}, ${fileName})
        RETURNING id, title, name, description, image_url, image_path, likes, created_at
      `;

      return res.status(201).json(rows[0]);
    } catch (error) {
      console.error("Submission handler error:", error);
      const message = error && error.message ? error.message : "Upload failed";
      return res.status(500).json({ error: message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};

module.exports.config = {
  api: {
    bodyParser: false,
  },
};
