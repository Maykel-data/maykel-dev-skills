import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const defaultTarget = ".agents/skills";

function getSkillDirectories() {
  const skillsDir = path.join(root, "skills");
  const results = [];

  if (!fs.existsSync(skillsDir)) {
    return results;
  }

  function walk(directory) {
    for (const entry of fs.readdirSync(directory, {
      withFileTypes: true
    })) {
      const fullPath = path.join(
        directory,
        entry.name
      );

      if (entry.isDirectory()) {
        const skillFile = path.join(
          fullPath,
          "SKILL.md"
        );

        if (fs.existsSync(skillFile)) {
          results.push(fullPath);
          continue;
        }

        walk(fullPath);
      }
    }
  }

  walk(skillsDir);

  return results;
}

function parseSkill(filePath) {
  const content = fs.readFileSync(
    filePath,
    "utf8"
  );

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
  const directories = getSkillDirectories();

  for (const directory of directories) {
    const skillFile = path.join(
      directory,
      "SKILL.md"
    );

    const skill = parseSkill(skillFile);

    if (skill?.name === skillName) {
      return {
        directory,
        skill
      };
    }
  }

  return null;
}

function copyDirectory(
  sourceDirectory,
  destinationDirectory
) {
  fs.mkdirSync(destinationDirectory, {
    recursive: true
  });

  for (const entry of fs.readdirSync(
    sourceDirectory,
    {
      withFileTypes: true
    }
  )) {
    const sourcePath = path.join(
      sourceDirectory,
      entry.name
    );

    const destinationPath = path.join(
      destinationDirectory,
      entry.name
    );

    if (entry.isDirectory()) {
      copyDirectory(
        sourcePath,
        destinationPath
      );
      continue;
    }

    fs.copyFileSync(
      sourcePath,
      destinationPath
    );
  }
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

  if (
    fs.existsSync(skillDestination) &&
    !options.force
  ) {
    throw new Error(
      `Skill "${skillName}" already exists at ${skillDestination}. Use --force to replace it.`
    );
  }

  if (
    fs.existsSync(skillDestination) &&
    options.force
  ) {
    fs.rmSync(
      skillDestination,
      {
        recursive: true,
        force: true
      }
    );
  }

  copyDirectory(
    result.directory,
    skillDestination
  );

  return {
    name: result.skill.name,
    version: result.skill.version,
    category: result.skill.category,
    source: path.relative(
      root,
      result.directory
    ).replaceAll("\\", "/"),
    destination: path.relative(
      process.cwd(),
      skillDestination
    ).replaceAll("\\", "/")
  };
}

export {
  installSkill,
  findSkill
};