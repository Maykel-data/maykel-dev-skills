import fs from "node:fs";
import path from "node:path";

const LOCKFILE_NAME = "skills-lock.json";
const LOCKFILE_SCHEMA_VERSION = 1;

function getLockfilePath(root) {
  return path.join(
    root,
    LOCKFILE_NAME
  );
}

function createEmptyLockfile() {
  return {
    schemaVersion:
      LOCKFILE_SCHEMA_VERSION,
    skills: {}
  };
}

function readLockfile(root) {
  const lockfilePath =
    getLockfilePath(root);

  if (!fs.existsSync(lockfilePath)) {
    return createEmptyLockfile();
  }

  const content =
    fs.readFileSync(
      lockfilePath,
      "utf8"
    );

  let lockfile;

  try {
    lockfile =
      JSON.parse(content);
  } catch {
    throw new Error(
      "Invalid lockfile: file contains invalid JSON."
    );
  }

  if (
    lockfile.schemaVersion !==
    LOCKFILE_SCHEMA_VERSION
  ) {
    throw new Error(
      `Unsupported lockfile schema version: ${lockfile.schemaVersion}`
    );
  }

  if (
    typeof lockfile.skills !==
      "object" ||
    lockfile.skills === null ||
    Array.isArray(
      lockfile.skills
    )
  ) {
    throw new Error(
      "Invalid lockfile: skills must be an object."
    );
  }

  return lockfile;
}

function writeLockfile(
  root,
  lockfile
) {
  if (
    !lockfile ||
    lockfile.schemaVersion !==
      LOCKFILE_SCHEMA_VERSION
  ) {
    throw new Error(
      "Invalid lockfile."
    );
  }

  if (
    typeof lockfile.skills !==
      "object" ||
    lockfile.skills === null ||
    Array.isArray(
      lockfile.skills
    )
  ) {
    throw new Error(
      "Invalid lockfile: skills must be an object."
    );
  }

  const lockfilePath =
    getLockfilePath(root);

  fs.writeFileSync(
    lockfilePath,
    JSON.stringify(
      lockfile,
      null,
      2
    ) + "\n",
    "utf8"
  );

  return lockfilePath;
}

function addSkillToLockfile(
  root,
  skill
) {
  if (
    !skill ||
    typeof skill.name !==
      "string" ||
    typeof skill.version !==
      "string"
  ) {
    throw new Error(
      "Invalid skill lock entry."
    );
  }

  const lockfile =
    readLockfile(root);

  lockfile.skills[
    skill.name
  ] = {
    version: skill.version,
    source:
      "maykel-dev-skills"
  };

  const sortedSkills =
    Object.fromEntries(
      Object.entries(
        lockfile.skills
      ).sort(
        ([a], [b]) =>
          a.localeCompare(b)
      )
    );

  lockfile.skills =
    sortedSkills;

  writeLockfile(
    root,
    lockfile
  );

  return lockfile;
}

function removeSkillFromLockfile(
  root,
  skillName
) {
  const lockfile =
    readLockfile(root);

  delete lockfile.skills[
    skillName
  ];

  const sortedSkills =
    Object.fromEntries(
      Object.entries(
        lockfile.skills
      ).sort(
        ([a], [b]) =>
          a.localeCompare(b)
      )
    );

  lockfile.skills =
    sortedSkills;

  writeLockfile(
    root,
    lockfile
  );

  return lockfile;
}

function checkLockfile(
  root,
  availableSkills
) {
  const lockfile =
    readLockfile(root);

  if (
    !Array.isArray(
      availableSkills
    )
  ) {
    throw new Error(
      "Available skills must be an array."
    );
  }

  const availableMap =
    new Map();

  for (
    const skill of availableSkills
  ) {
    if (
      !skill ||
      typeof skill.name !==
        "string" ||
      typeof skill.version !==
        "string"
    ) {
      continue;
    }

    availableMap.set(
      skill.name,
      skill
    );
  }

  const missing = [];
  const versionMismatches = [];
  const extra = [];

  for (
    const [
      skillName,
      lockedSkill
    ] of Object.entries(
      lockfile.skills
    )
  ) {
    const availableSkill =
      availableMap.get(
        skillName
      );

    if (!availableSkill) {
      missing.push(
        skillName
      );

      continue;
    }

    if (
      availableSkill.version !==
      lockedSkill.version
    ) {
      versionMismatches.push({
        name: skillName,
        locked:
          lockedSkill.version,
        available:
          availableSkill.version
      });
    }
  }

  for (
    const skill of availableSkills
  ) {
    if (
      !skill ||
      typeof skill.name !==
        "string"
    ) {
      continue;
    }

    if (
      !Object.hasOwn(
        lockfile.skills,
        skill.name
      )
    ) {
      extra.push(
        skill.name
      );
    }
  }

  return {
    valid:
      missing.length === 0 &&
      versionMismatches.length === 0 &&
      extra.length === 0,
    missing,
    versionMismatches,
    extra
  };
}

export {
  LOCKFILE_NAME,
  LOCKFILE_SCHEMA_VERSION,
  getLockfilePath,
  createEmptyLockfile,
  readLockfile,
  writeLockfile,
  addSkillToLockfile,
  removeSkillFromLockfile,
  checkLockfile
};