import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  installSkill,
  removeSkill,
  findSkill,
  updateInstalledSkills
} from "./installer.js";

import {
  listProfiles,
  findProfile
} from "./profiles.js";

import {
  installProfile
} from "./profile-installer.js";

import {
  createDoctor
} from "./doctor.js";

import {
  createSkill
} from "./creator.js";

import {
  readLockfile,
  getLockfilePath,
  checkLockfile
} from "./lockfile.js";

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

const root =
  path.resolve(
    __dirname,
    ".."
  );

const args =
  process.argv.slice(2);

const command =
  args[0];

const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m"
};

function print(message = "") {
  console.log(message);
}

function error(message) {
  console.error(
    `${colors.red}✗${colors.reset} ${message}`
  );
}

function success(message) {
  print(
    `${colors.green}✓${colors.reset} ${message}`
  );
}

function getSkillFiles() {
  const skillsDirectory =
    path.join(
      root,
      "skills"
    );

  const files = [];

  if (
    !fs.existsSync(
      skillsDirectory
    )
  ) {
    return files;
  }

  function walk(directory) {
    for (
      const entry of fs.readdirSync(
        directory,
        {
          withFileTypes: true
        }
      )
    ) {
      const fullPath =
        path.join(
          directory,
          entry.name
        );

      if (
        entry.isDirectory()
      ) {
        walk(fullPath);
        continue;
      }

      if (
        entry.name === "SKILL.md"
      ) {
        files.push(
          fullPath
        );
      }
    }
  }

  walk(
    skillsDirectory
  );

  return files.sort();
}

function parseFrontmatter(content) {
  if (
    !content.startsWith("---")
  ) {
    return null;
  }

  const end =
    content.indexOf(
      "\n---",
      3
    );

  if (
    end === -1
  ) {
    return null;
  }

  const raw =
    content
      .slice(
        3,
        end
      )
      .trim();

  const data = {};

  const lines =
    raw.split(
      /\r?\n/
    );

  let currentArrayKey =
    null;

  for (
    const line of lines
  ) {
    const trimmed =
      line.trim();

    if (
      trimmed === ""
    ) {
      continue;
    }

    if (
      currentArrayKey &&
      trimmed.startsWith(
        "- "
      )
    ) {
      if (
        !Array.isArray(
          data[currentArrayKey]
        )
      ) {
        data[currentArrayKey] = [];
      }

      data[
        currentArrayKey
      ].push(
        trimmed
          .slice(2)
          .trim()
      );

      continue;
    }

    currentArrayKey =
      null;

    const separator =
      line.indexOf(":");

    if (
      separator === -1
    ) {
      continue;
    }

    const key =
      line
        .slice(
          0,
          separator
        )
        .trim();

    const value =
      line
        .slice(
          separator + 1
        )
        .trim();

    if (
      value === ""
    ) {
      data[key] = [];

      currentArrayKey =
        key;

      continue;
    }

    data[key] =
      value;
  }

  return data;
}

function getSkills() {
  return getSkillFiles()
    .map(
      (file) => ({
        file,
        skill:
          parseFrontmatter(
            fs.readFileSync(
              file,
              "utf8"
            )
          )
      })
    )
    .filter(
      ({ skill }) =>
        skill !== null
    );
}

function commandHelp() {
  print(`
${colors.bold}Maykel Dev Skills${colors.reset}

Usage:
  npx maykel-dev-skills <command>

Commands:

  create <skill>
      Create a new skill from the standard template.


  list
      List available skills.

  search <query>
      Search skills by name, description, category, or tags.

  search --category <category>
      Search skills by category.

  search --tag <tag>
      Search skills by tag.

  info <skill>
      Show information about a skill.

  install <skill>
      Install a skill.


  remove <skill>
      Remove an installed skill.

  update
      Update installed skills using skills-lock.json.

  update <skill>
      Update one installed skill.

  profile list
      List available profiles.

  profile info <profile>
      Show profile information.

  profile install <profile>
      Install a complete skill profile.

  lock
      Show locked skills.

  lock --check
      Check lockfile consistency.

  validate
      Validate all skills.

  doctor
      Check the health of the project and its tooling.

  help
      Show this help message.

Options:

  --category <category>
      Filter search results by category.

  --tag <tag>
      Filter search results by tag.

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

  npx maykel-dev-skills search --category database

  npx maykel-dev-skills search --tag debugging

  npx maykel-dev-skills search sqlite --tag database

  npx maykel-dev-skills info sqlite-debugging

  npx maykel-dev-skills install sqlite-debugging

  npx maykel-dev-skills update

  npx maykel-dev-skills update sqlite-debugging

  npx maykel-dev-skills profile list

  npx maykel-dev-skills profile info engineering

  npx maykel-dev-skills profile install engineering

  npx maykel-dev-skills lock

  npx maykel-dev-skills lock --check

  npx maykel-dev-skills validate

  npx maykel-dev-skills doctor
`);
}

function listSkills() {
  const skills =
    getSkills();

  if (
    skills.length === 0
  ) {
    print(
      "No skills found."
    );

    return;
  }

  print(
    `\n${colors.bold}Available Skills${colors.reset}\n`
  );

  for (
    const {
      file,
      skill
    } of skills
  ) {
    const relativePath =
      path
        .relative(
          root,
          file
        )
        .replaceAll(
          "\\",
          "/"
        );

    const tags =
      Array.isArray(
        skill.tags
      )
        ? skill.tags.join(
            ", "
          )
        : "none";

    print(
      `  ${colors.cyan}${skill.name}${colors.reset} — ${skill.description}`
    );

    print(
      `    category: ${skill.category} | version: ${skill.version}`
    );

    print(
      `    tags: ${tags}`
    );

    print(
      `    ${relativePath}\n`
    );
  }
}

function parseSearchArguments(
  searchArgs
) {
  const filters = {
    query: [],
    category: null,
    tag: null
  };

  for (
    let index = 0;
    index < searchArgs.length;
    index += 1
  ) {
    const argument =
      searchArgs[index];

    if (
      argument === "--category"
    ) {
      const value =
        searchArgs[
          index + 1
        ];

      if (!value) {
        throw new Error(
          "--category requires a category."
        );
      }

      filters.category =
        value
          .trim()
          .toLowerCase();

      index += 1;

      continue;
    }

    if (
      argument.startsWith(
        "--category="
      )
    ) {
      filters.category =
        argument
          .slice(
            "--category=".length
          )
          .trim()
          .toLowerCase();

      if (
        !filters.category
      ) {
        throw new Error(
          "--category requires a category."
        );
      }

      continue;
    }

    if (
      argument === "--tag"
    ) {
      const value =
        searchArgs[
          index + 1
        ];

      if (!value) {
        throw new Error(
          "--tag requires a tag."
        );
      }

      filters.tag =
        value
          .trim()
          .toLowerCase();

      index += 1;

      continue;
    }

    if (
      argument.startsWith(
        "--tag="
      )
    ) {
      filters.tag =
        argument
          .slice(
            "--tag=".length
          )
          .trim()
          .toLowerCase();

      if (
        !filters.tag
      ) {
        throw new Error(
          "--tag requires a tag."
        );
      }

      continue;
    }

    if (
      argument.startsWith(
        "--"
      )
    ) {
      throw new Error(
        `Unknown search option "${argument}".`
      );
    }

    filters.query.push(
      argument
    );
  }

  return filters;
}

function searchSkills(
  searchArgs
) {
  let filters;

  try {
    filters =
      parseSearchArguments(
        searchArgs
      );
  } catch (
    searchError
  ) {
    error(
      searchError.message
    );

    process.exitCode =
      1;

    return;
  }

  const query =
    filters.query
      .join(" ")
      .trim()
      .toLowerCase();

  if (
    !query &&
    !filters.category &&
    !filters.tag
  ) {
    error(
      "Please provide a search query, category, or tag."
    );

    print(
      "\nExamples:\n" +
      "  npx maykel-dev-skills search sqlite\n" +
      "  npx maykel-dev-skills search --category database\n" +
      "  npx maykel-dev-skills search --tag debugging\n"
    );

    process.exitCode =
      1;

    return;
  }

  const matches =
    getSkills()
      .filter(
        ({ skill }) => {
          const tags =
            Array.isArray(
              skill.tags
            )
              ? skill.tags.map(
                  (tag) =>
                    String(tag)
                      .trim()
                      .toLowerCase()
                )
              : [];

          const searchableText = [
            skill.name,
            skill.description,
            skill.category,
            ...tags
          ]
            .join(" ")
            .toLowerCase();

          const queryMatches =
            !query ||
            searchableText.includes(
              query
            );

          const categoryMatches =
            !filters.category ||
            String(
              skill.category
            )
              .trim()
              .toLowerCase() ===
              filters.category;

          const tagMatches =
            !filters.tag ||
            tags.includes(
              filters.tag
            );

          return (
            queryMatches &&
            categoryMatches &&
            tagMatches
          );
        }
      );

  const filterDescription = [];

  if (query) {
    filterDescription.push(
      `query="${query}"`
    );
  }

  if (
    filters.category
  ) {
    filterDescription.push(
      `category="${filters.category}"`
    );
  }

  if (
    filters.tag
  ) {
    filterDescription.push(
      `tag="${filters.tag}"`
    );
  }

  print(
    `\n${colors.bold}Search results${colors.reset} (${filterDescription.join(", ")})\n`
  );

  if (
    matches.length === 0
  ) {
    print(
      "No matching skills found.\n"
    );

    return;
  }

  for (
    const {
      file,
      skill
    } of matches
  ) {
    const tags =
      Array.isArray(
        skill.tags
      )
        ? skill.tags.join(
            ", "
          )
        : "none";

    print(
      `  ${colors.green}${skill.name}${colors.reset} — ${skill.description}`
    );

    print(
      `    category: ${skill.category} | version: ${skill.version}`
    );

    print(
      `    tags: ${tags}`
    );

    print(
      `    ${path
        .relative(
          root,
          file
        )
        .replaceAll(
          "\\",
          "/"
        )}\n`
    );
  }
}

function showSkillInfo(
  skillName
) {
  if (!skillName) {
    error(
      "Please provide a skill name."
    );

    print(
      "\nExample:\n  npx maykel-dev-skills info sqlite-debugging\n"
    );

    process.exitCode =
      1;

    return;
  }

  const result =
    findSkill(
      skillName
    );

  if (!result) {
    error(
      `Skill "${skillName}" was not found.`
    );

    process.exitCode =
      1;

    return;
  }

  const skillFile =
    path.join(
      result.directory,
      "SKILL.md"
    );

  const relativePath =
    path
      .relative(
        root,
        skillFile
      )
      .replaceAll(
        "\\",
        "/"
      );

  const tags =
    Array.isArray(
      result.skill.tags
    )
      ? result.skill.tags.join(
          ", "
        )
      : "none";

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
    `  Tags:        ${tags}`
  );

  const dependencies =
    Array.isArray(
      result.skill.dependencies
    )
      ? result.skill.dependencies.join(
          ", "
        )
      : "none";

  print(
    `  Dependencies: ${dependencies}`
  );
  print(
    `  Path:        ${relativePath}\n`
  );
}

function listSkillProfiles() {
  const profiles =
    listProfiles(
      root
    );

  if (
    profiles.length === 0
  ) {
    print(
      "No profiles found."
    );

    return;
  }

  print(
    `\n${colors.bold}Available Profiles${colors.reset}\n`
  );

  for (
    const profile of profiles
  ) {
    print(
      `  ${colors.cyan}${profile.name}${colors.reset} — ${profile.description}`
    );

    print(
      `    skills: ${profile.skills.length}`
    );

    for (
      const skillName of profile.skills
    ) {
      print(
        `      - ${skillName}`
      );
    }

    print(
      `    ${profile.path}\n`
    );
  }
}

function showProfileInfo(
  profileName
) {
  if (!profileName) {
    error(
      "Please provide a profile name."
    );

    print(
      "\nExample:\n  npx maykel-dev-skills profile info engineering\n"
    );

    process.exitCode =
      1;

    return;
  }

  const profile =
    findProfile(
      root,
      profileName
    );

  if (!profile) {
    error(
      `Profile "${profileName}" was not found.`
    );

    process.exitCode =
      1;

    return;
  }

  print(
    `\n${colors.bold}${profile.name}${colors.reset}\n`
  );

  print(
    `  Description: ${profile.description}`
  );

  print(
    `  Skills:      ${profile.skills.length}`
  );

  for (
    const skillName of profile.skills
  ) {
    const skill =
      findSkill(
        skillName
      );

    if (skill) {
      print(
        `    ${colors.green}✓${colors.reset} ${skill.skill.name}@${skill.skill.version}`
      );

      continue;
    }

    print(
      `    ${colors.red}✗${colors.reset} ${skillName} — skill not found`
    );
  }

  print(
    `  Path:        ${profile.path}\n`
  );
}

function showLockfile() {
  try {
    const lockfile =
      readLockfile(
        process.cwd()
      );

    const entries =
      Object.entries(
        lockfile.skills
      );

    print(
      `\n${colors.bold}Locked Skills${colors.reset}\n`
    );

    if (
      entries.length === 0
    ) {
      print(
        "  No skills are currently locked.\n"
      );

      return;
    }

    for (
      const [
        skillName,
        entry
      ] of entries
    ) {
      print(
        `  ${colors.green}✓${colors.reset} ${skillName}@${entry.version}`
      );

      print(
        `    source: ${entry.source}`
      );
    }

    print(
      `\n  Lockfile: ${path
        .relative(
          process.cwd(),
          getLockfilePath(
            process.cwd()
          )
        )
        .replaceAll(
          "\\",
          "/"
        )}\n`
    );
  } catch (
    lockfileError
  ) {
    error(
      lockfileError.message
    );

    process.exitCode =
      1;
  }
}

function getAvailableSkills() {
  return getSkills()
    .map(
      ({ skill }) =>
        skill
    );
}

function showLockfileCheck() {
  try {
    const result =
      checkLockfile(
        process.cwd(),
        getAvailableSkills()
      );

    print(
      `\n${colors.bold}Lockfile Check${colors.reset}\n`
    );

    if (
      result.valid
    ) {
      success(
        "Lockfile is in sync with available skills."
      );

      print();

      return;
    }

    if (
      result.missing.length > 0
    ) {
      print(
        `${colors.red}Missing locked skills:${colors.reset}`
      );

      for (
        const skillName of result.missing
      ) {
        print(
          `  - ${skillName}`
        );
      }

      print();
    }

    if (
      result.versionMismatches.length > 0
    ) {
      print(
        `${colors.red}Version mismatches:${colors.reset}`
      );

      for (
        const mismatch of
          result.versionMismatches
      ) {
        print(
          `  - ${mismatch.name}: locked ${mismatch.locked}, available ${mismatch.available}`
        );
      }

      print();
    }

    if (
      result.extra.length > 0
    ) {
      print(
        `${colors.yellow}Available but not locked:${colors.reset}`
      );

      for (
        const skillName of result.extra
      ) {
        print(
          `  - ${skillName}`
        );
      }

      print();
    }

    error(
      "Lockfile check failed."
    );

    process.exitCode =
      1;
  } catch (
    lockfileError
  ) {
    error(
      lockfileError.message
    );

    process.exitCode =
      1;
  }
}

function installSkillProfile(
  profileArgs
) {
  const profileName =
    profileArgs.find(
      (argument) =>
        !argument.startsWith(
          "--"
        )
    );

  if (!profileName) {
    error(
      "Please provide a profile name."
    );

    print(
      "\nExample:\n  npx maykel-dev-skills profile install engineering\n"
    );

    process.exitCode =
      1;

    return;
  }

  let targetDirectory =
    ".agents/skills";

  let force = false;

  for (
    let index = 0;
    index < profileArgs.length;
    index += 1
  ) {
    const argument =
      profileArgs[index];

    if (
      argument === "--force"
    ) {
      force = true;

      continue;
    }

    if (
      argument === "--target"
    ) {
      const nextArgument =
        profileArgs[
          index + 1
        ];

      if (!nextArgument) {
        error(
          "--target requires a directory."
        );

        process.exitCode =
          1;

        return;
      }

      targetDirectory =
        nextArgument;

      index += 1;
    }
  }

  try {
    const result =
      installProfile(
        root,
        profileName,
        targetDirectory,
        {
          force
        }
      );

    print(
      `\n${colors.bold}Installing profile${colors.reset}\n`
    );

    success(
      `${result.name} profile installed.`
    );

    print(
      `  description: ${result.description}`
    );

    print(
      `  skills: ${result.skills.length}`
    );

    for (
      const skill of result.skills
    ) {
      print(
        `    ${colors.green}✓${colors.reset} ${skill.name}@${skill.version}`
      );

      print(
        `      destination: ${skill.destination}`
      );
    }

    print();
  } catch (
    installationError
  ) {
    error(
      installationError.message
    );

    process.exitCode =
      1;
  }
}

function runProfileCommand(
  profileArgs
) {
  const subcommand =
    profileArgs[0];

  if (!subcommand) {
    error(
      "Please provide a profile command."
    );

    print(
      "\nAvailable profile commands:\n\n  profile list\n  profile info <profile>\n  profile install <profile>\n"
    );

    process.exitCode =
      1;

    return;
  }

  if (
    subcommand === "list"
  ) {
    listSkillProfiles();

    return;
  }

  if (
    subcommand === "info"
  ) {
    showProfileInfo(
      profileArgs[1]
    );

    return;
  }

  if (
    subcommand === "install"
  ) {
    installSkillProfile(
      profileArgs.slice(1)
    );

    return;
  }

  error(
    `Unknown profile command: ${subcommand}`
  );

  print(
    "\nAvailable profile commands:\n\n  profile list\n  profile info <profile>\n  profile install <profile>\n"
  );

  process.exitCode =
    1;
}

function runValidation() {
  print(
    `\n${colors.bold}Validating skills...${colors.reset}\n`
  );

  const validatorPath =
    path.join(
      root,
      "scripts",
      "validate-skills.js"
    );

  if (
    !fs.existsSync(
      validatorPath
    )
  ) {
    error(
      "Validator script not found."
    );

    process.exitCode =
      1;

    return;
  }

  const result =
    spawnSync(
      process.execPath,
      [validatorPath],
      {
        cwd: root,
        stdio: "inherit"
      }
    );

  if (
    result.error
  ) {
    error(
      `Failed to run validator: ${result.error.message}`
    );

    process.exitCode =
      1;

    return;
  }

  if (
    result.status === 0
  ) {
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
    createDoctor(
      root
    );

  const checks =
    doctor.run();

  for (
    const check of checks
  ) {
    if (
      check.passed
    ) {
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
      (check) =>
        !check.passed
    );

  print();

  if (
    failedChecks.length === 0
  ) {
    success(
      "Doctor check passed."
    );

    return;
  }

  error(
    `Doctor found ${failedChecks.length} problem(s).`
  );

  process.exitCode =
    1;
}

function createCommand(
  commandArgs
) {
  const name =
    commandArgs.find(
      (argument) =>
        !argument.startsWith("--")
    );

  if (!name) {
    error(
      "Please provide a skill name."
    );

    print(
      "\nExample:\n  npx maykel-dev-skills create my-new-skill\n"
    );

    process.exitCode =
      1;

    return;
  }

  let category =
    "engineering";

  let version =
    "0.1.0";

  let tags = [];

  let force =
    false;

  for (
    let index = 0;
    index < commandArgs.length;
    index += 1
  ) {
    const argument =
      commandArgs[index];

    if (
      argument === "--category"
    ) {
      const nextArgument =
        commandArgs[index + 1];

      if (!nextArgument) {
        error(
          "--category requires a category."
        );

        process.exitCode =
          1;

        return;
      }

      category =
        nextArgument;

      index += 1;

      continue;
    }

    if (
      argument === "--version"
    ) {
      const nextArgument =
        commandArgs[index + 1];

      if (!nextArgument) {
        error(
          "--version requires a version."
        );

        process.exitCode =
          1;

        return;
      }

      version =
        nextArgument;

      index += 1;

      continue;
    }

    if (
      argument === "--tags"
    ) {
      const nextArgument =
        commandArgs[index + 1];

      if (!nextArgument) {
        error(
          "--tags requires a comma-separated list."
        );

        process.exitCode =
          1;

        return;
      }

      tags =
        nextArgument
          .split(",")
          .map(
            (tag) =>
              tag.trim()
          )
          .filter(Boolean);

      index += 1;

      continue;
    }

    if (
      argument === "--force"
    ) {
      force = true;
    }
  }

  try {
    const result =
      createSkill({
        root,
        name,
        category,
        version,
        tags,
        force
      });

    print(
      `\n${colors.bold}Created skill${colors.reset}\n`
    );

    success(
      `${result.name}@${result.version} created.`
    );

    print(
      `  category: ${result.category}`
    );

    print(
      `  tags: ${result.tags.length > 0 ? result.tags.join(", ") : "none"}`
    );

    print(
      `  path: ${result.path}\n`
    );
  } catch (
    creationError
  ) {
    error(
      creationError.message
    );

    process.exitCode =
      1;
  }
}

function removeCommand(
  commandArgs
) {
  const skillName =
    commandArgs.find(
      (argument) =>
        !argument.startsWith(
          "--"
        )
    );

  if (!skillName) {
    error(
      "Please provide a skill name."
    );

    print(
      "\nExample:\n  npx maykel-dev-skills remove sqlite-debugging\n"
    );

    process.exitCode =
      1;

    return;
  }

  let targetDirectory =
    ".agents/skills";

  for (
    let index = 0;
    index < commandArgs.length;
    index += 1
  ) {
    const argument =
      commandArgs[index];

    if (
      argument === "--target"
    ) {
      const nextArgument =
        commandArgs[
          index + 1
        ];

      if (!nextArgument) {
        error(
          "--target requires a directory."
        );

        process.exitCode =
          1;

        return;
      }

      targetDirectory =
        nextArgument;

      index += 1;
    }
  }

  try {
    const result =
      removeSkill(
        skillName,
        targetDirectory
      );

    print(
      `\n${colors.bold}Removing skill${colors.reset}\n`
    );

    success(
      `${result.name} removed.`
    );

    print(
      `  destination: ${result.destination}`
    );

    print(
      `  lockfile: ${result.lockfile ? "updated" : "not found"}\n`
    );
  } catch (
    removalError
  ) {
    error(
      removalError.message
    );

    process.exitCode =
      1;
  }
}

function installCommand(
  commandArgs
) {
  const skillName =
    commandArgs.find(
      (argument) =>
        !argument.startsWith(
          "--"
        )
    );

  if (!skillName) {
    error(
      "Please provide a skill name."
    );

    print(
      "\nExample:\n  npx maykel-dev-skills install sqlite-debugging\n"
    );

    process.exitCode =
      1;

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

    if (
      argument === "--force"
    ) {
      force = true;

      continue;
    }

    if (
      argument === "--target"
    ) {
      const nextArgument =
        commandArgs[
          index + 1
        ];

      if (!nextArgument) {
        error(
          "--target requires a directory."
        );

        process.exitCode =
          1;

        return;
      }

      targetDirectory =
        nextArgument;

      index += 1;
    }
  }

  try {
    const result =
      installSkill(
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
  } catch (
    installationError
  ) {
    error(
      installationError.message
    );

    process.exitCode =
      1;
  }
}

function updateCommand(
  commandArgs
) {
  const skillName =
    commandArgs.find(
      (argument) =>
        !argument.startsWith(
          "--"
        )
    );

  let targetDirectory =
    ".agents/skills";

  for (
    let index = 0;
    index < commandArgs.length;
    index += 1
  ) {
    const argument =
      commandArgs[index];

    if (
      argument === "--target"
    ) {
      const nextArgument =
        commandArgs[
          index + 1
        ];

      if (!nextArgument) {
        error(
          "--target requires a directory."
        );

        process.exitCode =
          1;

        return;
      }

      targetDirectory =
        nextArgument;

      index += 1;
    }
  }

  try {
    print(
      `\n${colors.bold}Updating skills${colors.reset}\n`
    );

    const lockfilePath =
      getLockfilePath(
        process.cwd()
      );

    if (
      !fs.existsSync(
        lockfilePath
      )
    ) {
      throw new Error(
        "Cannot update skills: skills-lock.json was not found."
      );
    }

    if (
      skillName &&
      !findSkill(
        skillName
      )
    ) {
      throw new Error(
        `Skill "${skillName}" was not found.`
      );
    }

    const result =
      updateInstalledSkills(
        targetDirectory,
        skillName ?? null
      );

    if (
      result.updated.length === 0 &&
      result.current.length === 0 &&
      result.missing.length === 0 &&
      result.skipped.length === 0
    ) {
      print(
        "  No locked skills found.\n"
      );

      return;
    }

    for (
      const skill of result.updated
    ) {
      success(
        `${skill.name}: ${skill.from} → ${skill.to}`
      );

      print(
        `  destination: ${skill.destination}`
      );
    }

    for (
      const skill of result.current
    ) {
      print(
        `  ${colors.cyan}✓${colors.reset} ${skill.name}@${skill.version} is already current`
      );
    }

    for (
      const skillName of result.missing
    ) {
      print(
        `  ${colors.yellow}!${colors.reset} ${skillName} is locked but not installed`
      );
    }

    for (
      const skill of result.skipped
    ) {
      print(
        `  ${colors.yellow}!${colors.reset} ${skill.name}: ${skill.reason}`
      );
    }

    print();
  } catch (
    updateError
  ) {
    error(
      updateError.message
    );

    process.exitCode =
      1;
  }
}

function showVersion() {
  const packagePath =
    path.join(
      root,
      "package.json"
    );

  const packageJson =
    JSON.parse(
      fs.readFileSync(
        packagePath,
        "utf8"
      )
    );

  print(
    packageJson.version
  );
}

switch (command) {
  case "create":
    createCommand(
      args.slice(1)
    );
    break;


  case "list":
    listSkills();
    break;

  case "search":
    searchSkills(
      args.slice(1)
    );
    break;

  case "info":
    showSkillInfo(
      args[1]
    );
    break;

  case "install":
    installCommand(
      args.slice(1)
    );
    break;

  case "remove":
    removeCommand(
      args.slice(1)
    );
    break;

  case "update":
    updateCommand(
      args.slice(1)
    );
    break;

  case "profile":
    runProfileCommand(
      args.slice(1)
    );
    break;

  case "lock":
    if (
      args[1] === "--check"
    ) {
      showLockfileCheck();
    } else {
      showLockfile();
    }

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

    process.exitCode =
      1;
}