import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import pg from "pg";

const requestedUrl = process.env.PRESERVATION_DATABASE_URL;
if (!requestedUrl) {
  throw new Error("PRESERVATION_DATABASE_URL is required.");
}
const databaseUrl = new URL(requestedUrl);
if (!databaseUrl.pathname.includes("_test")) {
  throw new Error(
    "Refusing to run preservation tests against a database without _test in its name.",
  );
}
const connectionString = databaseUrl.toString();
const client = new pg.Client({ connectionString });
await client.connect();

async function snapshot() {
  const sessions = await client.query(
    'select id, name, active from "Session" order by id',
  );
  const admins = await client.query(
    'select id, "passwordHash" from "AdminUser" order by id',
  );
  return createHash("sha256")
    .update(JSON.stringify({ sessions: sessions.rows, admins: admins.rows }))
    .digest("hex");
}

function runScript(script) {
  const result = spawnSync("npm", ["run", script], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: connectionString },
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `${script} failed`);
  }
}

const before = await snapshot();
runScript("db:seed");
const after = await snapshot();
if (before !== after) {
  throw new Error("Seed changed existing sessions or administrator credentials.");
}

await client.query(`
  insert into "Team" (
    id, "competitionId", name, problem, "createdAt", "updatedAt"
  )
  select
    'preservation-test-team',
    id,
    'Preservation Test',
    'Temporary validation only',
    now(),
    now()
  from "Competition"
  where slug = 'vibeathon-2026'
`);
await client.query(`
  update "Participant"
  set "teamId" = 'preservation-test-team'
  where id = (select id from "Participant" order by id limit 1)
`);

runScript("db:import");
const assignment = await client.query(
  `select count(*)::int as count
   from "Participant"
   where "teamId" = 'preservation-test-team'`,
);
if (assignment.rows[0]?.count !== 1) {
  throw new Error("CSV import removed an existing official team assignment.");
}

await client.end();
console.log("seed_preserved_sessions_and_password=true");
console.log("import_preserved_team_assignment=true");
