const NON_BUMPING_TYPES = new Set(["chore", "docs", "test", "refactor", "nit"]);

function parseSemver(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) {
    throw new Error(`Invalid SemVer version: ${version}`);
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function bumpSemver(version, bump) {
  const parsed = parseSemver(version);
  if (bump === "major") return `${parsed.major + 1}.0.0`;
  if (bump === "minor") return `${parsed.major}.${parsed.minor + 1}.0`;
  if (bump === "patch")
    return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
  return version;
}

function classifyCommit(message) {
  const breaking = /(^|\n)BREAKING CHANGE:/m.test(message);
  const header = message.split("\n")[0]?.trim() ?? "";

  if (breaking || /^[a-z]+(?:\([^)]+\))?!:/i.test(header)) return "major";
  if (/^feat(?:\([^)]+\))?:/i.test(header)) return "minor";
  if (/^fix(?:\([^)]+\))?:/i.test(header)) return "patch";

  const typeMatch = /^([a-z]+)(?:\([^)]+\))?:/i.exec(header);
  if (typeMatch && NON_BUMPING_TYPES.has(typeMatch[1].toLowerCase()))
    return "none";

  return "none";
}

function highestBump(bumps) {
  if (bumps.includes("major")) return "major";
  if (bumps.includes("minor")) return "minor";
  if (bumps.includes("patch")) return "patch";
  return "none";
}

export {
  NON_BUMPING_TYPES,
  parseSemver,
  bumpSemver,
  classifyCommit,
  highestBump,
};
