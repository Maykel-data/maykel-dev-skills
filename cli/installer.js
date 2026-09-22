import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const defaultTarget = ".agents/skills";

function getSkillFiles() {
  const skillsDir = path.join(root, "skills");
  const results = [];

  if (!fs.existsSync(skillsDir)) {
    return results;
  }

  function walk(directory) {
    for (const entry of fs.readdirSync(directory, {
      withFileTypes: true
    })) {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (entry.name === "SKILL.md") {
        results.push(fullPath);
      }
    }
  }

  walk(skillsDir);

  return results;
}

function parseSkill(filePath) {
  const content = fs.readFileSync(filePath, "utf8");

  if (!content.startsWith("---")) {
    return null;
  }

  const end = content.indexOf("\n---", 3);

  if (end === -1) {
    return null;
  }

  const frontmatter = content
    .slice(3, end)
    .trim();

  const data = {};

  for (const line of frontmatter.split(/\r?\n/)) {
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

function findSkill(skillName) {
  const files = getSkillFiles();

  for (const file of files) {
    const skill = parseSkill(file);

    if (skill?.name === skillName) {
      return {
        file,
        skill
      };
    }
  }

  return null;
}

function installSkill(
  skillName,
  targetDirectory = defaultTarget,
  options = {}
) {
  if (!skillName) {
    throw new Error(
      "Please provide a skill name."
    );
  }

  const result = findSkill(skillName);

  if (!result) {
    throw new Error(
      `Skill "${skillName}" was not found.`
    );
  }

  const targetRoot = path.resolve(
    process.cwd(),
    targetDirectory
  );

  const skillDestination = path.join(
    targetRoot,
    skillName
  );

  fs.mkdirSync(
    skillDestination,
    {
      recursive: true
    }
  );

  const destinationFile = path.join(
    skillDestination,
    "SKILL.md"
  );

  if (
    fs.existsSync(destinationFile) &&
    !options.force
  ) {
    throw new Error(
      `Skill "${skillName}" already exists at ${destinationFile}. Use --force to replace it.`
    );
  }

  fs.copyFileSync(
    result.file,
    destinationFile
  );

  return {
    name: result.skill.name,
    version: result.skill.version,
    category: result.skill.category,
    source: path.relative(
      root,
      result.file
    ).replaceAll("\\", "/"),
    destination: path.relative(
      process.cwd(),
      destinationFile
    ).replaceAll("\\", "/")
  };
}

export {
  installSkill,
  findSkill
};