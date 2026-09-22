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
    schemaVersion: LOCKFILE_SCHEMA_VERSION,
    skills: {}
  };
}

function readLockfile(root) {
  const lockfilePath =
    getLockfilePath(root);

  if (!fs.existsSync(lockfilePath)) {
    return createEmptyLockfile();
  }

  const content = fs.readFileSync(
    lockfilePath,
    "utf8"
  );

  const lockfile =
    JSON.parse(content);

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
    Array.isArray(lockfile.skills)
  ) {
    throw new Error(
      "Invalid lockfile: skills must be an object."
    );
  }

  return lockfile;
}

function writeLockfile(root, lockfile) {
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
    Array.isArray(lockfile.skills)
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

  lockfile.skills[skill.name] = {
    version: skill.version,
    source: "maykel-dev-skills"
  };

  const sortedSkills =
    Object.fromEntries(
      Object.entries(
        lockfile.skills
      ).sort(([a], [b]) =>
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
      ).sort(([a], [b]) =>
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

export {
  LOCKFILE_NAME,
  LOCKFILE_SCHEMA_VERSION,
  getLockfilePath,
  createEmptyLockfile,
  readLockfile,
  writeLockfile,
  addSkillToLockfile,
  removeSkillFromLockfile
};