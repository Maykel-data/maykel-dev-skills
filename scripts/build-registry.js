import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const skillsDir = path.join(root, "skills");
const registryDir = path.join(root, "registry");
const registryFile = path.join(registryDir, "skills.json");

function walk(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const results = [];

  for (const entry of fs.readdirSync(dir, {
    withFileTypes: true
  })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...walk(fullPath));
    } else if (entry.name === "SKILL.md") {
      results.push(fullPath);
    }
  }

  return results;
}

function parseFrontmatter(content) {
  if (!content.startsWith("---")) {
    return null;
  }

  const end = content.indexOf("\n---", 3);

  if (end === -1) {
    return null;
  }

  const raw = content.slice(3, end).trim();
  const data = {};

  for (const line of raw.split(/\r?\n/)) {
    const separator = line.indexOf(":");

    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();

    data[key] = value;
  }

  return data;
}

fs.mkdirSync(registryDir, {
  recursive: true
});

const skillFiles = walk(skillsDir);

const skills = [];

for (const file of skillFiles) {
  const content = fs.readFileSync(file, "utf8");
  const frontmatter = parseFrontmatter(content);

  if (!frontmatter) {
    continue;
  }

  const relativePath = path
    .relative(root, file)
    .replaceAll("\\", "/");

  skills.push({
    name: frontmatter.name,
    description: frontmatter.description,
    version: frontmatter.version,
    category: frontmatter.category,
    path: relativePath
  });
}

skills.sort((a, b) =>
  a.name.localeCompare(b.name)
);

const registry = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  totalSkills: skills.length,
  skills
};

fs.writeFileSync(
  registryFile,
  JSON.stringify(registry, null, 2) + "\n",
  "utf8"
);

console.log(
  `Registry built successfully: ${skills.length} skill(s).`
);

console.log(
  `Output: ${path.relative(root, registryFile)}`
);