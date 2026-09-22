#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  findSkill,
  installSkill
} from "./installer.js";
import { createDoctor } from "./doctor.js";
import {
  listProfiles,
  findProfile
} from "./profiles.js";

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
  print(
    `${colors.green}✓${colors.reset} ${message}`
  );
}

function error(message) {
  console.error(
    `${colors.red}✗${colors.reset} ${message}`
  );
}

function getSkillFiles() {
  const skillsDir = path.join(
    root,
    "skills"
  );

  const results = [];

  if (!fs.existsSync(skillsDir)) {
    return results;
  }

  function walk(directory) {
    for (const entry of fs.readdirSync(
      directory,
      {
        withFileTypes: true
      }
    )) {
      const fullPath = path.join(
        directory,
        entry.name
      );

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

  for (const line of frontmatter.split(
    /\r?\n/
  )) {
    const separator =
      line.indexOf(":");

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

  info <skill>
      Show detailed information about a skill.

  install <skill>
      Install a skill into the current project.

  profile list
      List available skill profiles.

  validate
      Validate all skills in the repository.

  doctor
      Check the health of the project and its tooling.

  help
      Show this help message.

Options:

  --target <directory>
      Choose where the skill will be installed.

  --force
      Replace an existing installed skill.

  --version, -v
      Show the current version.

  --help, -h
      Show this help message.

Examples:

  npx maykel-dev-skills list

  npx maykel-dev-skills search sqlite

  npx maykel-dev-skills info sqlite-debugging

  npx maykel-dev-skills install sqlite-debugging

  npx maykel-dev-skills profile list

  npx maykel-dev-skills validate

  npx maykel-dev-skills doctor
`);
}

function listSkills() {
  const files = getSkillFiles();

  if (files.length === 0) {
    print("No skills found.");
    return;
  }

  print(
    `\n${colors.bold}Available Skills${colors.reset}\n`
  );

  for (const file of files) {
    const skill = parseSkill(file);

    if (!skill) {
      continue;
    }

    const relativePath = path
      .relative(root, file)
      .replaceAll("\\", "/");

    print(
      `  ${colors.cyan}${skill.name}${colors.reset} — ${skill.description}`
    );

    print(
      `    category: ${skill.category} | version: ${skill.version}`
    );

    print(
      `    ${relativePath}\n`
    );
  }
}

function searchSkills(query) {
  if (!query) {
    error(
      "Please provide a search query."
    );

    print(
      "\nExample:\n  npx maykel-dev-skills search sqlite\n"
    );

    process.exitCode = 1;
    return;
  }

  const normalizedQuery =
    query.toLowerCase();

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

      return searchableText.includes(
        normalizedQuery
      );
    });

  print(
    `\n${colors.bold}Search results for "${query}"${colors.reset}\n`
  );

  if (matches.length === 0) {
    print(
      "No matching skills found.\n"
    );

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
      `    ${path
        .relative(root, file)
        .replaceAll("\\", "/")}\n`
    );
  }
}

function showSkillInfo(skillName) {
  if (!skillName) {
    error(
      "Please provide a skill name."
    );

    print(
      "\nExample:\n  npx maykel-dev-skills info sqlite-debugging\n"
    );

    process.exitCode = 1;
    return;
  }

  const result = findSkill(skillName);

  if (!result) {
    error(
      `Skill "${skillName}" was not found.`
    );

    process.exitCode = 1;
    return;
  }

  const skillFile = path.join(
    result.directory,
    "SKILL.md"
  );

  const relativePath = path
    .relative(root, skillFile)
    .replaceAll("\\", "/");

  print(
    `\n${colors.bold}${result.skill.name}${colors.reset}\n`
  );

  print(
    `  Description: ${result.skill.description}`
  );

  print(
    `  Version:     ${result.skill.version}`
  );

  print(
    `  Category:    ${result.skill.category}`
  );

  print(
    `  Path:        ${relativePath}\n`
  );
}

function listSkillProfiles() {
  const profiles = listProfiles(root);

  if (profiles.length === 0) {
    print("No profiles found.");
    return;
  }

  print(
    `\n${colors.bold}Available Profiles${colors.reset}\n`
  );

  for (const profile of profiles) {
    print(
      `  ${colors.cyan}${profile.name}${colors.reset} — ${profile.description}`
    );

    print(
      `    skills: ${profile.skills.length}`
    );

    for (const skillName of profile.skills) {
      print(
        `      - ${skillName}`
      );
    }

    print(
      `    ${profile.path}\n`
    );
  }
}

function runProfileCommand(profileArgs) {
  const subcommand =
    profileArgs[0];

  if (!subcommand) {
    error(
      "Please provide a profile command."
    );

    print(
      "\nAvailable profile commands:\n\n  profile list\n"
    );

    process.exitCode = 1;
    return;
  }

  if (subcommand === "list") {
    listSkillProfiles();
    return;
  }

  error(
    `Unknown profile command: ${subcommand}`
  );

  print(
    "\nAvailable profile commands:\n\n  profile list\n"
  );

  process.exitCode = 1;
}

function runValidation() {
  print(
    `\n${colors.bold}Validating skills...${colors.reset}\n`
  );

  const validatorPath = path.join(
    root,
    "scripts",
    "validate-skills.js"
  );

  if (!fs.existsSync(validatorPath)) {
    error(
      "Validator script not found."
    );

    process.exitCode = 1;
    return;
  }

  const result = spawnSync(
    process.execPath,
    [validatorPath],
    {
      cwd: root,
      stdio: "inherit"
    }
  );

  if (result.error) {
    error(
      `Failed to run validator: ${result.error.message}`
    );

    process.exitCode = 1;
    return;
  }

  if (result.status === 0) {
    success(
      "All skills passed validation."
    );

    return;
  }

  error(
    "Skill validation failed."
  );

  process.exitCode =
    result.status ?? 1;
}

function runDoctor() {
  print(
    `\n${colors.bold}Maykel Dev Skills Doctor${colors.reset}\n`
  );

  const doctor =
    createDoctor(root);

  const checks = doctor.run();

  for (const check of checks) {
    if (check.passed) {
      success(
        `${check.name}${check.details ? ` — ${check.details}` : ""}`
      );
    } else {
      error(
        `${check.name}${check.details ? ` — ${check.details}` : ""}`
      );
    }
  }

  const failedChecks =
    checks.filter(
      (check) => !check.passed
    );

  print();

  if (failedChecks.length === 0) {
    success(
      "Doctor check passed."
    );

    return;
  }

  error(
    `Doctor found ${failedChecks.length} problem(s).`
  );

  process.exitCode = 1;
}

function installCommand(commandArgs) {
  const skillName = commandArgs.find(
    (argument) =>
      !argument.startsWith("--")
  );

  if (!skillName) {
    error(
      "Please provide a skill name."
    );

    print(
      "\nExample:\n  npx maykel-dev-skills install sqlite-debugging\n"
    );

    process.exitCode = 1;
    return;
  }

  let targetDirectory =
    ".agents/skills";

  let force = false;

  for (
    let index = 0;
    index < commandArgs.length;
    index += 1
  ) {
    const argument =
      commandArgs[index];

    if (argument === "--force") {
      force = true;
      continue;
    }

    if (argument === "--target") {
      const nextArgument =
        commandArgs[index + 1];

      if (!nextArgument) {
        error(
          "--target requires a directory."
        );

        process.exitCode = 1;
        return;
      }

      targetDirectory =
        nextArgument;

      index += 1;
    }
  }

  try {
    const result = installSkill(
      skillName,
      targetDirectory,
      {
        force
      }
    );

    print(
      `\n${colors.bold}Installing skill${colors.reset}\n`
    );

    success(
      `${result.name}@${result.version} installed.`
    );

    print(
      `  category: ${result.category}`
    );

    print(
      `  source: ${result.source}`
    );

    print(
      `  destination: ${result.destination}\n`
    );
  } catch (installationError) {
    error(
      installationError.message
    );

    process.exitCode = 1;
  }
}

function showVersion() {
  const packagePath = path.join(
    root,
    "package.json"
  );

  const packageJson = JSON.parse(
    fs.readFileSync(
      packagePath,
      "utf8"
    )
  );

  print(packageJson.version);
}

switch (command) {
  case "list":
    listSkills();
    break;

  case "search":
    searchSkills(
      args.slice(1).join(" ")
    );
    break;

  case "info":
    showSkillInfo(args[1]);
    break;

  case "install":
    installCommand(args.slice(1));
    break;

  case "profile":
    runProfileCommand(
      args.slice(1)
    );
    break;

  case "validate":
    runValidation();
    break;

  case "doctor":
    runDoctor();
    break;

  case "help":
  case "--help":
  case "-h":
    commandHelp();
    break;

  case "--version":
  case "-v":
    showVersion();
    break;

  default:
    error(
      `Unknown command: ${command}`
    );

    commandHelp();

    process.exitCode = 1;
}