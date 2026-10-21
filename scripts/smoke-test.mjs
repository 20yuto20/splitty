/**
 * End-to-end smoke test against a running Splitty server.
 *
 *   BASE_URL=http://localhost:3000 node scripts/smoke-test.mjs
 *
 * It creates a throwaway group and writes expenses, so only point it at a
 * server backed by a disposable database. Non-local URLs are refused unless
 * SMOKE_ALLOW_REMOTE=1 is set.
 */

const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

const { hostname } = new URL(BASE_URL);
if (!["localhost", "127.0.0.1", "::1"].includes(hostname) && process.env.SMOKE_ALLOW_REMOTE !== "1") {
  console.error(`Refusing to write test data to ${BASE_URL}. Set SMOKE_ALLOW_REMOTE=1 if its DB is disposable.`);
  process.exit(2);
}

let failures = 0;

function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok || !detail ? "" : `  (${detail})`}`);
  if (!ok) failures += 1;
}

async function call(method, path, body, headers = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = undefined;
  }
  return { status: res.status, headers: res.headers, text, json };
}

// React inserts `<!-- -->` between adjacent text nodes; drop markup to match on visible text.
function visibleText(html) {
  return html.replace(/<!-- -->/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
}

// ----- Create group --------------------------------------------------------
let r = await call("POST", "/api/groups", "{not json");
check("create: malformed JSON is rejected with 400", r.status === 400, `got ${r.status}`);

r = await call("POST", "/api/groups", { name: "Solo", currency: "JPY", members: ["Alice"] });
check("create: fewer than 2 members is rejected with 400", r.status === 400, `got ${r.status}`);

r = await call("POST", "/api/groups", { name: "Smoke Trip", currency: "JPY", members: ["Alice", "Bob", "Carol"] });
check("create: valid group returns 201 + id", r.status === 201 && typeof r.json?.id === "string", `got ${r.status}`);
const groupId = r.json?.id;
if (!groupId) {
  console.error("Cannot continue without a group id.");
  process.exit(1);
}

r = await call("GET", `/api/groups/${groupId}`);
check("read: group has 3 members and no expenses", r.status === 200 && r.json.members.length === 3 && r.json.expenses.length === 0);
const id = Object.fromEntries(r.json.members.map((m) => [m.name, m.id]));

// ----- Share link ----------------------------------------------------------
const createdPath = `/g/${groupId}/created`;
r = await call("GET", createdPath);
check("share link: uses request host", r.status === 200 && r.text.includes(`${BASE_URL}/g/${groupId}`), `got ${r.status}`);

r = await call("GET", createdPath, undefined, { "x-forwarded-host": "preview.example.com", "x-forwarded-proto": "https" });
check("share link: honours x-forwarded-host/proto", r.text.includes(`https://preview.example.com/g/${groupId}`));

// ----- Expenses ------------------------------------------------------------
r = await call("POST", `/api/groups/${groupId}/expenses`, {
  description: "Hotel",
  amount: 3000,
  payerId: id.Alice,
  shares: [
    { memberId: id.Alice, amount: 1000 },
    { memberId: id.Bob, amount: 1000 },
    { memberId: id.Carol, amount: 1000 },
  ],
});
check("expense: even 3-way split returns 201", r.status === 201, `got ${r.status} ${r.text}`);

r = await call("POST", `/api/groups/${groupId}/expenses`, {
  description: "Taxi, late night",
  amount: 600,
  payerId: id.Bob,
  shares: [
    { memberId: id.Alice, amount: 300 },
    { memberId: id.Bob, amount: 300 },
    { memberId: id.Carol, amount: 0 },
  ],
});
check("expense: uneven split with a zero share returns 201", r.status === 201, `got ${r.status} ${r.text}`);
const taxiId = r.json?.id;

const valid = { description: "x", amount: 100, payerId: id.Alice, shares: [{ memberId: id.Alice, amount: 100 }] };
for (const [name, body] of [
  ["malformed JSON", "{not json"],
  ["payer outside group", { ...valid, payerId: "not-a-member" }],
  ["share outside group", { ...valid, shares: [{ memberId: "not-a-member", amount: 100 }] }],
  ["shares not summing to total", { ...valid, shares: [{ memberId: id.Alice, amount: 99 }] }],
  ["all-zero shares", { ...valid, shares: [{ memberId: id.Alice, amount: 0 }] }],
]) {
  r = await call("POST", `/api/groups/${groupId}/expenses`, body);
  check(`expense validation: ${name} → 400`, r.status === 400, `got ${r.status}`);
}

// ----- Balances & settlement ----------------------------------------------
// Alice: +3000 -1000 -300 = +1700, Bob: +600 -1000 -300 = -700, Carol: -1000
// Greedy settlement: Carol → Alice 1000, Bob → Alice 700.
r = await call("GET", `/api/groups/${groupId}`);
check("read: group has both expenses", r.json?.expenses.length === 2);

r = await call("GET", `/g/${groupId}`);
const page = visibleText(r.text);
check("page: total is ¥3,600", r.status === 200 && page.includes("Total ¥3,600"), page.match(/Total \S+/)?.[0]);
check("page: Carol → Alice ¥1,000", /Carol\s*Alice\s*¥1,000/.test(page));
check("page: Bob → Alice ¥700", /Bob\s*Alice\s*¥700/.test(page));

// ----- CSV -----------------------------------------------------------------
r = await call("GET", `/api/groups/${groupId}/csv`);
const lines = r.text.split("\n");
check("csv: 200 text/csv", r.status === 200 && r.headers.get("content-type")?.startsWith("text/csv"));
check("csv: header + 2 rows", lines.length === 3, `got ${lines.length} lines`);
const hotel = lines.find((l) => l.includes(",Hotel,"));
check(
  "csv: hotel row has amount, currency, payer and all shares",
  !!hotel && hotel.includes(",3000,JPY,Alice,") && ["Alice:1000", "Bob:1000", "Carol:1000"].every((s) => hotel.includes(s)),
  hotel,
);
check("csv: comma in description is quoted", lines.some((l) => l.includes('"Taxi, late night"')));

// ----- Edit group ----------------------------------------------------------
r = await call("PATCH", `/api/groups/${groupId}`, { name: "Smoke Trip 2", addMembers: ["Dave"], removeMemberIds: [id.Carol] });
check("edit: rename/add/remove returns 200", r.status === 200, `got ${r.status}`);
r = await call("GET", `/api/groups/${groupId}`);
const names = r.json.members.map((m) => m.name);
check("edit: name updated", r.json.name === "Smoke Trip 2");
check("edit: Dave added, Carol kept (has expenses)", names.includes("Dave") && names.includes("Carol") && names.length === 4, names.join(","));
const daveId = r.json.members.find((m) => m.name === "Dave")?.id;
await call("PATCH", `/api/groups/${groupId}`, { removeMemberIds: [daveId] });
r = await call("GET", `/api/groups/${groupId}`);
check("edit: uninvolved member can be removed", !r.json.members.some((m) => m.name === "Dave"));

// ----- Delete expense ------------------------------------------------------
r = await call("DELETE", `/api/groups/${groupId}/expenses/${taxiId}`);
check("delete: expense returns 200", r.status === 200, `got ${r.status}`);
r = await call("DELETE", `/api/groups/${groupId}/expenses/${taxiId}`);
check("delete: second delete returns 404", r.status === 404, `got ${r.status}`);
r = await call("GET", `/api/groups/${groupId}`);
check("delete: one expense left", r.json?.expenses.length === 1);

// ----- Not found -----------------------------------------------------------
r = await call("GET", "/api/groups/DOES-NOT-EXIST");
check("read: unknown group → 404", r.status === 404, `got ${r.status}`);

console.log(failures ? `\n${failures} check(s) failed.` : "\nAll checks passed.");
process.exit(failures ? 1 : 0);
