import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  addSkillToLockfile,
  readLockfile,
  removeSkillFromLockfile
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

const defaultTarget =
  ".agents/skills";

const NAME_PATTERN =
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function getSkillDirectories() {
  const skillsDir =
    path.join(
      root,
      "skills"
    );

  const results = [];

  if (
    !fs.existsSync(
      skillsDir
    )
  ) {
    return results;
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
        const skillFile =
          path.join(
            fullPath,
            "SKILL.md"
          );

        if (
          fs.existsSync(
            skillFile
          )
        ) {
          results.push(
            fullPath
          );

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
  const content =
    fs.readFileSync(
      filePath,
      "utf8"
    );

  if (
    !content.startsWith(
      "---"
    )
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

  const frontmatter =
    content
      .slice(
        3,
        end
      )
      .trim();

  const data = {};

  let currentArray =
    null;

  for (
    const line of frontmatter.split(
      /\r?\n/
    )
  ) {
    const trimmed =
      line.trim();

    if (
      trimmed === ""
    ) {
      continue;
    }

    if (
      currentArray &&
      trimmed.startsWith(
        "- "
      )
    ) {
      data[
        currentArray
      ].push(
        trimmed
          .slice(2)
          .trim()
      );

      continue;
    }

    currentArray =
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

      currentArray =
        key;

      continue;
    }

    data[key] =
      value;
  }

  return data;
}

function findSkill(skillName) {
  const directories =
    getSkillDirectories();

  for (
    const directory of directories
  ) {
    const skillFile =
      path.join(
        directory,
        "SKILL.md"
      );

    const skill =
      parseSkill(
        skillFile
      );

    if (
      skill?.name ===
      skillName
    ) {
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
  fs.mkdirSync(
    destinationDirectory,
    {
      recursive: true
    }
  );

  for (
    const entry of fs.readdirSync(
      sourceDirectory,
      {
        withFileTypes: true
      }
    )
  ) {
    const sourcePath =
      path.join(
        sourceDirectory,
        entry.name
      );

    const destinationPath =
      path.join(
        destinationDirectory,
        entry.name
      );

    if (
      entry.isDirectory()
    ) {
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

function installDependencies(
  skill,
  targetDirectory,
  options,
  installing = new Set()
) {
  if (
    installing.has(
      skill.name
    )
  ) {
    throw new Error(
      `Circular skill dependency detected: ${skill.name}.`
    );
  }

  installing.add(
    skill.name
  );

  const dependencies =
    Array.isArray(
      skill.dependencies
    )
      ? skill.dependencies
      : [];

  for (
    const dependencyName of dependencies
  ) {
    const dependency =
      findSkill(
        dependencyName
      );

    if (!dependency) {
      throw new Error(
        `Skill dependency "${dependencyName}" required by "${skill.name}" was not found.`
      );
    }

    const targetRoot =
      path.resolve(
        process.cwd(),
        targetDirectory
      );

    const dependencyDestination =
      path.join(
        targetRoot,
        dependencyName
      );

    if (
      !fs.existsSync(
        dependencyDestination
      )
    ) {
      installDependencies(
        dependency.skill,
        targetDirectory,
        options,
        installing
      );

      copyDirectory(
        dependency.directory,
        dependencyDestination
      );

      addSkillToLockfile(
        targetRoot,
        {
          name:
            dependency.skill.name,
          version:
            dependency.skill.version
        }
      );
    }
  }

  installing.delete(
    skill.name
  );
}

function installSkill(
  skillName,
  targetDirectory = defaultTarget,
  options = {}
) {
  if (
    !skillName
  ) {
    throw new Error(
      "Please provide a skill name."
    );
  }

  const result =
    findSkill(
      skillName
    );

  if (
    !result
  ) {
    throw new Error(
      `Skill "${skillName}" was not found.`
    );
  }

  const targetRoot =
    path.resolve(
      process.cwd(),
      targetDirectory
    );

  const skillDestination =
    path.join(
      targetRoot,
      skillName
    );

  if (
    fs.existsSync(
      skillDestination
    ) &&
    !options.force
  ) {
    throw new Error(
      `Skill "${skillName}" already exists at ${skillDestination}. Use --force to replace it.`
    );
  }

  if (
    fs.existsSync(
      skillDestination
    ) &&
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

  installDependencies(
    result.skill,
    targetDirectory,
    options
  );

  copyDirectory(
    result.directory,
    skillDestination
  );

  /*
   * The lockfile belongs to the installation target.
   *
   * This is important for:
   * - normal project installs
   * - isolated test installations
   * - custom target directories
   *
   * Do not use process.cwd() here because
   * targetDirectory may point somewhere else.
   */
  const lockfile =
    addSkillToLockfile(
      targetRoot,
      {
        name:
          result.skill.name,

        version:
          result.skill.version
      }
    );

  return {
    name:
      result.skill.name,

    version:
      result.skill.version,

    category:
      result.skill.category,

    tags:
      Array.isArray(
        result.skill.tags
      )
        ? result.skill.tags
        : [],

    source:
      path
        .relative(
          root,
          result.directory
        )
        .replaceAll(
          "\\",
          "/"
        ),

    destination:
      path
        .relative(
          process.cwd(),
          skillDestination
        )
        .replaceAll(
          "\\",
          "/"
        ),

    lockfile
  };
}

function findInstalledDependents(
  skillName,
  targetRoot
) {
  if (
    !fs.existsSync(
      targetRoot
    )
  ) {
    return [];
  }

  const dependents = [];

  for (
    const entry of fs.readdirSync(
      targetRoot,
      {
        withFileTypes: true
      }
    )
  ) {
    if (
      !entry.isDirectory()
    ) {
      continue;
    }

    const skillDirectory =
      path.join(
        targetRoot,
        entry.name
      );

    const skillFile =
      path.join(
        skillDirectory,
        "SKILL.md"
      );

    if (
      !fs.existsSync(
        skillFile
      )
    ) {
      continue;
    }

    const skill =
      parseSkill(
        skillFile
      );

    if (
      Array.isArray(
        skill?.dependencies
      ) &&
      skill.dependencies.includes(
        skillName
      )
    ) {
      dependents.push(
        skill.name
      );
    }
  }

  return dependents.sort();
}

function removeSkill(
  skillName,
  targetDirectory = defaultTarget
) {
  if (
    !skillName
  ) {
    throw new Error(
      "Please provide a skill name."
    );
  }

  if (
    !NAME_PATTERN.test(
      skillName
    )
  ) {
    throw new Error(
      `Invalid skill name "${skillName}".`
    );
  }

  const targetRoot =
    path.resolve(
      process.cwd(),
      targetDirectory
    );

  const skillDirectory =
    path.join(
      targetRoot,
      skillName
    );

  const dependents =
    findInstalledDependents(
      skillName,
      targetRoot
    );

  if (
    dependents.length > 0
  ) {
    throw new Error(
      `Cannot remove skill "${skillName}" because installed skill(s) depend on it: ${dependents.join(", ")}.`
    );
  }

  if (
    !fs.existsSync(
      skillDirectory
    )
  ) {
    throw new Error(
      `Installed skill "${skillName}" was not found at ${skillDirectory}.`
    );
  }

  if (
    !fs.statSync(
      skillDirectory
    ).isDirectory()
  ) {
    throw new Error(
      `Installed skill path is not a directory: ${skillDirectory}.`
    );
  }

  const lockfilePath =
    path.join(
      targetRoot,
      "skills-lock.json"
    );

  let lockfile = null;

  if (
    fs.existsSync(
      lockfilePath
    )
  ) {
    lockfile =
      readLockfile(
        targetRoot
      );
  }

  fs.rmSync(
    skillDirectory,
    {
      recursive: true,
      force: true
    }
  );

  if (
    lockfile
  ) {
    lockfile =
      removeSkillFromLockfile(
        targetRoot,
        skillName
      );
  }

  return {
    name:
      skillName,

    destination:
      path
        .relative(
          process.cwd(),
          skillDirectory
        )
        .replaceAll(
          "\\",
          "/"
        ),

    lockfile
  };
}

function updateInstalledSkills(
  targetDirectory = defaultTarget,
  skillName = null
) {
  const lockfilePath =
    path.join(
      process.cwd(),
      "skills-lock.json"
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

  const lockfile =
    readLockfile(
      process.cwd()
    );

  const lockedSkills =
    Object.entries(
      lockfile.skills
    );

  if (
    lockedSkills.length === 0
  ) {
    return {
      updated: [],
      current: [],
      missing: [],
      skipped: []
    };
  }

  const targetRoot =
    path.resolve(
      process.cwd(),
      targetDirectory
    );

  const updated = [];
  const current = [];
  const missing = [];
  const skipped = [];

  for (
    const [
      lockedName,
      lockedSkill
    ] of lockedSkills
  ) {
    if (
      skillName &&
      lockedName !==
        skillName
    ) {
      continue;
    }

    const installedDirectory =
      path.join(
        targetRoot,
        lockedName
      );

    if (
      !fs.existsSync(
        installedDirectory
      )
    ) {
      missing.push(
        lockedName
      );

      continue;
    }

    const currentSkill =
      findSkill(
        lockedName
      );

    if (
      !currentSkill
    ) {
      skipped.push({
        name:
          lockedName,

        reason:
          "skill is no longer available in the repository"
      });

      continue;
    }

    const currentVersion =
      currentSkill.skill.version;

    if (
      currentVersion ===
      lockedSkill.version
    ) {
      current.push({
        name:
          lockedName,

        version:
          currentVersion
      });

      continue;
    }

    const result =
      installSkill(
        lockedName,
        targetDirectory,
        {
          force: true
        }
      );

    updated.push({
      name:
        result.name,

      from:
        lockedSkill.version,

      to:
        result.version,

      destination:
        result.destination
    });
  }

  return {
    updated,
    current,
    missing,
    skipped
  };
}

export {
  installSkill,
  removeSkill,
  findSkill,
  updateInstalledSkills
};
