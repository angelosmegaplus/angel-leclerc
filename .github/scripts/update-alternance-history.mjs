import fs from "node:fs/promises";

const latestPath = "runtime/alternance-urgent-latest.json";
const historyPath = "runtime/alternance-research-history.json";

const normalize = (value = "") =>
  String(value)
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const identity = (item) => ({
  company: normalize(item.employer || item.company || ""),
  city: normalize(item.city || ""),
  position: normalize(item.position || ""),
});

const exactKey = (item) => {
  const id = identity(item);
  return `${id.company}|${id.city}|${id.position}`;
};

function mergeDefined(base, incoming, seenAt) {
  const merged = { ...base };
  for (const [key, value] of Object.entries(incoming || {})) {
    if (value !== undefined && value !== null && value !== "") merged[key] = value;
  }
  merged.firstSeenAt = base.firstSeenAt || seenAt;
  merged.lastSeenAt = seenAt;
  return merged;
}

const latest = JSON.parse(await fs.readFile(latestPath, "utf8"));
let history = { version: 1, updatedAt: null, items: [] };
try {
  history = JSON.parse(await fs.readFile(historyPath, "utf8"));
} catch {
  // First run: create the history from the latest research snapshot.
}

const seenAt = latest.updatedAt || new Date().toISOString();
const map = new Map((history.items || []).map((item) => [exactKey(item), item]));

function findCompatibleKey(item) {
  const key = exactKey(item);
  if (map.has(key)) return key;

  const target = identity(item);
  if (!target.company) return key;

  const sameCompanyAndCity = [...map.entries()].filter(([, current]) => {
    const candidate = identity(current);
    return candidate.company === target.company && candidate.city === target.city;
  });

  if (!target.position && sameCompanyAndCity.length === 1) return sameCompanyAndCity[0][0];
  return key;
}

function upsert(item) {
  if (!item || typeof item !== "object") return;
  const company = item.employer || item.company;
  if (!company) return;

  const key = findCompatibleKey(item);
  const previous = map.get(key) || {};
  const merged = mergeDefined(previous, item, seenAt);
  if (!merged.employer && merged.company) merged.employer = merged.company;
  map.set(key, merged);
}

for (const item of latest.screenedLeads || []) upsert(item);
if (latest.newApplication) upsert(latest.newApplication);
for (const item of latest.gmailActions || []) upsert(item);

const items = [...map.values()].sort((a, b) =>
  String(b.lastSeenAt || b.lastActionAt || "").localeCompare(String(a.lastSeenAt || a.lastActionAt || "")),
);

await fs.writeFile(
  historyPath,
  `${JSON.stringify({ version: 1, updatedAt: seenAt, items }, null, 2)}\n`,
  "utf8",
);

console.log(`Alternance history updated: ${items.length} tracked item(s).`);
