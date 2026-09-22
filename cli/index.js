#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const command = args[0] || "help";

const colors = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  bold: "\x1b[1m"
};

function print(message = "") {
  console.log(message);
}

function success(message) {
  print(`${colors.green}✓${colors.reset} ${message}`);
}

function error(message) {
  console.error(`${colors.red}✗${colors.reset} ${message}`);
}

function getSkillFiles() {
  const skillsDir = path.join(root, "skills");

  if (!fs.existsSync(skillsDir)) {
    return [];
  }

  const results = [];

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

function commandHelp() {
  print(`
${colors.bold}Maykel Dev Skills${colors.reset}

Practical agent skills and workflows for real-world software development.

Usage:

  npx maykel-dev-skills <command>

Commands:

  list
      List available skills.

  search <query>
      Search skills by name, description, or category.

  validate
      Validate all skills in the repository.

  help
      Show this help message.

Examples:

  npx maykel-dev-skills list
  npx maykel-dev-skills search sqlite
  npx maykel-dev-skills validate
`);
}

function listSkills() {
  const files = getSkillFiles();

  if (files.length === 0) {
    print("No skills found.");
    return;
  }

  print(`\n${colors.bold}Available Skills${colors.reset}\n`);

  for (const file of files) {
    const skill = parseSkill(file);

    if (!skill) {
      continue;
    }

    const relativePath = path.relative(root, file);

    print(
      `  ${colors.cyan}${skill.name}${colors.reset} — ${skill.description}`
    );

    print(
      `    category: ${skill.category} | version: ${skill.version}`
    );

    print(`    ${relativePath}\n`);
  }
}

function searchSkills(query) {
  if (!query) {
    error("Please provide a search query.");

    print(
      "\nExample:\n  npx maykel-dev-skills search sqlite\n"
    );

    process.exitCode = 1;
    return;
  }

  const normalizedQuery = query.toLowerCase();

  const matches = getSkillFiles()
    .map((file) => ({
      file,
      skill: parseSkill(file)
    }))
    .filter(({ skill }) => {
      if (!skill) {
        return false;
      }

      const searchableText = [
        skill.name,
        skill.description,
        skill.category
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });

  print(
    `\n${colors.bold}Search results for "${query}"${colors.reset}\n`
  );

  if (matches.length === 0) {
    print("No matching skills found.\n");
    return;
  }

  for (const { file, skill } of matches) {
    print(
      `  ${colors.green}${skill.name}${colors.reset} — ${skill.description}`
    );

    print(
      `    category: ${skill.category} | version: ${skill.version}`
    );

    print(
      `    ${path.relative(root, file)}\n`
    );
  }
}

function runValidation() {
  const { spawnSync } = awaitImportChildProcess();

  const result = spawnSync(
    process.execPath,
    [path.join(root, "scripts", "validate-skills.js")],
    {
      stdio: "inherit"
    }
  );

  process.exitCode = result.status ?? 1;
}

function awaitImportChildProcess() {
  return {
    spawnSync: null
  };
}

switch (command) {
  case "list":
    listSkills();
    break;

  case "search":
    searchSkills(args.slice(1).join(" "));
    break;

  case "validate":
    print("Run validation with:");
    print("  npm run validate");
    break;

  case "help":
  case "--help":
  case "-h":
    commandHelp();
    break;

  case "--version":
  case "-v": {
    const packageJson = JSON.parse(
      fs.readFileSync(
        path.join(root, "package.json"),
        "utf8"
      )
    );

    print(packageJson.version);
    break;
  }

  default:
    error(`Unknown command: ${command}`);
    commandHelp();
    process.exitCode = 1;
}