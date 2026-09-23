import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const skillsDir = path.join(root, "skills");
const profilesDir = path.join(root, "profiles");
const registryDir = path.join(root, "registry");

const registryFile = path.join(
  registryDir,
  "skills.json"
);

function walk(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const results = [];

  for (const entry of fs.readdirSync(dir, {
    withFileTypes: true
  })) {
    const fullPath = path.join(
      dir,
      entry.name
    );

    if (entry.isDirectory()) {
      results.push(...walk(fullPath));
      continue;
    }

    if (entry.name === "SKILL.md") {
      results.push(fullPath);
    }
  }

  return results;
}

function parseFrontmatter(content) {
  if (!content.startsWith("---")) {
    return null;
  }

  const end = content.indexOf(
    "\n---",
    3
  );

  if (end === -1) {
    return null;
  }

  const raw = content
    .slice(3, end)
    .trim();

  const data = {};
  const lines = raw.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const separator = line.indexOf(":");

    if (separator === -1) {
      continue;
    }

    const key = line
      .slice(0, separator)
      .trim();

    const value = line
      .slice(separator + 1)
      .trim();

    if (
      key === "tags" &&
      value === ""
    ) {
      const tags = [];

      for (
        let tagIndex = index + 1;
        tagIndex < lines.length;
        tagIndex += 1
      ) {
        const tagLine =
          lines[tagIndex].trim();

        if (
          !tagLine.startsWith("- ")
        ) {
          break;
        }

        tags.push(
          tagLine
            .slice(2)
            .trim()
        );

        index = tagIndex;
      }

      data.tags = tags;
      continue;
    }

    data[key] = value;
  }

  return data;
}

function loadSkills() {
  const skillFiles = walk(skillsDir);
  const skills = [];

  for (const file of skillFiles) {
    const content = fs.readFileSync(
      file,
      "utf8"
    );

    const frontmatter =
      parseFrontmatter(content);

    if (!frontmatter) {
      continue;
    }

    const relativePath = path
      .relative(root, file)
      .replaceAll("\\", "/");

    const skill = {
      name: frontmatter.name,
      description: frontmatter.description,
      version: frontmatter.version,
      category: frontmatter.category,
      path: relativePath
    };

    if (
      Array.isArray(
        frontmatter.tags
      )
    ) {
      skill.tags = [
        ...frontmatter.tags
      ];
    }

    skills.push(skill);
  }

  skills.sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return skills;
}

function loadProfiles() {
  if (!fs.existsSync(profilesDir)) {
    return [];
  }

  const profiles = [];

  for (const entry of fs.readdirSync(
    profilesDir,
    { withFileTypes: true }
  )) {
    if (
      !entry.isFile() ||
      !entry.name.endsWith(".json")
    ) {
      continue;
    }

    const filePath = path.join(
      profilesDir,
      entry.name
    );

    try {
      const profile = JSON.parse(
        fs.readFileSync(
          filePath,
          "utf8"
        )
      );

      profiles.push({
        name: profile.name,
        description: profile.description,
        skills: Array.isArray(profile.skills)
          ? [...profile.skills].sort()
          : [],
        path: path
          .relative(root, filePath)
          .replaceAll("\\", "/")
      });
    } catch {
      continue;
    }
  }

  profiles.sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return profiles;
}

fs.mkdirSync(
  registryDir,
  { recursive: true }
);

const skills = loadSkills();
const profiles = loadProfiles();

const categories = {};

for (const skill of skills) {
  categories[skill.category] =
    (categories[skill.category] || 0) + 1;
}

const sortedCategories =
  Object.fromEntries(
    Object.entries(categories).sort(
      ([a], [b]) =>
        a.localeCompare(b)
    )
  );

const registry = {
  schemaVersion: 1,
  totalSkills: skills.length,
  categories: sortedCategories,
  skills,
  profiles
};

fs.writeFileSync(
  registryFile,
  JSON.stringify(
    registry,
    null,
    2
  ) + "\n",
  "utf8"
);

console.log(
  `Registry built successfully: ${skills.length} skill(s).`
);

console.log(
  `Profiles registered: ${profiles.length}`
);

console.log(
  `Categories: ${Object.keys(
    sortedCategories
  ).length}`
);

console.log(
  `Output: ${path.relative(
    root,
    registryFile
  )}`
);