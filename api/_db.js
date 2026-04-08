const { sql } = require("@vercel/postgres");

const ensureTables = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS submissions (
      id text PRIMARY KEY,
      title text NOT NULL,
      name text NOT NULL,
      description text NOT NULL,
      image_url text NOT NULL,
      likes integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `;
};

const getJsonBody = async (req) => {
  if (req.body) return req.body;
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
};

module.exports = {
  sql,
  ensureTables,
  getJsonBody,
};
