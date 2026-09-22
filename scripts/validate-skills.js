import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const skillsDir = path.join(root, "skills");

const requiredFields = [
  "name",
  "description",
  "version",
  "category"
];

const errors = [];

function walk(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const entries = fs.readdirSync(dir, {
    withFileTypes: true
  });

  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function parseFrontmatter(content, filePath) {
  if (!content.startsWith("---")) {
    errors.push(
      `${filePath}: missing YAML frontmatter`
    );

    return null;
  }

  const end = content.indexOf("\n---", 3);

  if (end === -1) {
    errors.push(
      `${filePath}: invalid YAML frontmatter`
    );

    return null;
  }

  const raw = content
    .slice(3, end)
    .trim();

  const data = {};

  for (const line of raw.split(/\r?\n/)) {
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

    data[key] = value;
  }

  return data;
}

const skillFiles = walk(skillsDir).filter(
  (file) => path.basename(file) === "SKILL.md"
);

if (skillFiles.length === 0) {
  errors.push("No SKILL.md files found.");
}

const names = new Map();

for (const file of skillFiles) {
  const content = fs.readFileSync(
    file,
    "utf8"
  );

  const frontmatter = parseFrontmatter(
    content,
    file
  );

  if (!frontmatter) {
    continue;
  }

  for (const field of requiredFields) {
    if (!frontmatter[field]) {
      errors.push(
        `${file}: missing required field "${field}"`
      );
    }
  }

  if (frontmatter.name) {
    const name = frontmatter.name;

    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)
    ) {
      errors.push(
        `${file}: invalid skill name "${name}" - use lowercase kebab-case`
      );
    }

    if (names.has(name)) {
      errors.push(
        `${file}: duplicate skill name "${name}" also found in ${names.get(name)}`
      );
    }

    names.set(name, file);
  }

  if (frontmatter.version) {
    if (
      !/^\d+\.\d+\.\d+$/.test(
        frontmatter.version
      )
    ) {
      errors.push(
        `${file}: invalid version "${frontmatter.version}" - use MAJOR.MINOR.PATCH`
      );
    }
  }

  if (frontmatter.category) {
    const skillDirectory = path.dirname(file);

    const categoryDirectory =
      path.dirname(skillDirectory);

    const expectedCategory =
      path.basename(categoryDirectory);

    if (
      frontmatter.category !== expectedCategory
    ) {
      errors.push(
        `${file}: category "${frontmatter.category}" does not match folder "${expectedCategory}"`
      );
    }
  }
}

if (errors.length > 0) {
  console.error(
    "\nSkill validation failed:\n"
  );

  for (const error of errors) {
    console.error(`- ${error}`);
  }

  process.exit(1);
}

console.log(
  `Skill validation passed: ${skillFiles.length} skill(s) checked.`
);