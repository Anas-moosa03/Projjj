const { sql } = require("@vercel/postgres");

let initPromise = null;

const ensureTables = async () => {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const lockId = 914227;
    await sql`SELECT pg_advisory_lock(${lockId});`;
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS submissions (
          id text PRIMARY KEY,
          title text NOT NULL,
          name text NOT NULL,
          description text NOT NULL,
          image_url text NOT NULL,
          image_path text,
          likes integer NOT NULL DEFAULT 0,
          created_at timestamptz NOT NULL DEFAULT now()
        );
      `;
      await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS image_path text;`;
    } finally {
      await sql`SELECT pg_advisory_unlock(${lockId});`;
    }
  })();

  return initPromise;
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
