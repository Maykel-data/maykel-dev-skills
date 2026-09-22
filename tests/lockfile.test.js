import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import {
  LOCKFILE_NAME,
  LOCKFILE_SCHEMA_VERSION,
  getLockfilePath,
  createEmptyLockfile,
  readLockfile,
  writeLockfile,
  addSkillToLockfile,
  removeSkillFromLockfile
} from "../cli/lockfile.js";

test("creates an empty lockfile structure", () => {
  const lockfile =
    createEmptyLockfile();

  assert.deepEqual(
    lockfile,
    {
      schemaVersion:
        LOCKFILE_SCHEMA_VERSION,
      skills: {}
    }
  );
});

test("returns the expected lockfile path", () => {
  const temporaryDirectory =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "maykel-dev-lockfile-"
      )
    );

  try {
    assert.equal(
      getLockfilePath(
        temporaryDirectory
      ),
      path.join(
        temporaryDirectory,
        LOCKFILE_NAME
      )
    );
  } finally {
    fs.rmSync(
      temporaryDirectory,
      {
        recursive: true,
        force: true
      }
    );
  }
});

test("reads an empty lockfile when none exists", () => {
  const temporaryDirectory =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "maykel-dev-lockfile-"
      )
    );

  try {
    const lockfile =
      readLockfile(
        temporaryDirectory
      );

    assert.deepEqual(
      lockfile,
      createEmptyLockfile()
    );
  } finally {
    fs.rmSync(
      temporaryDirectory,
      {
        recursive: true,
        force: true
      }
    );
  }
});

test("writes and reads a lockfile", () => {
  const temporaryDirectory =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "maykel-dev-lockfile-"
      )
    );

  try {
    const lockfile = {
      schemaVersion:
        LOCKFILE_SCHEMA_VERSION,
      skills: {
        "surgical-fix": {
          version: "0.1.0",
          source: "maykel-dev-skills"
        }
      }
    };

    writeLockfile(
      temporaryDirectory,
      lockfile
    );

    const lockfilePath =
      getLockfilePath(
        temporaryDirectory
      );

    assert.equal(
      fs.existsSync(
        lockfilePath
      ),
      true
    );

    assert.deepEqual(
      readLockfile(
        temporaryDirectory
      ),
      lockfile
    );
  } finally {
    fs.rmSync(
      temporaryDirectory,
      {
        recursive: true,
        force: true
      }
    );
  }
});

test("adds a skill to the lockfile", () => {
  const temporaryDirectory =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "maykel-dev-lockfile-"
      )
    );

  try {
    const lockfile =
      addSkillToLockfile(
        temporaryDirectory,
        {
          name: "surgical-fix",
          version: "0.1.0"
        }
      );

    assert.deepEqual(
      lockfile.skills,
      {
        "surgical-fix": {
          version: "0.1.0",
          source:
            "maykel-dev-skills"
        }
      }
    );
  } finally {
    fs.rmSync(
      temporaryDirectory,
      {
        recursive: true,
        force: true
      }
    );
  }
});

test("keeps lockfile skills sorted", () => {
  const temporaryDirectory =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "maykel-dev-lockfile-"
      )
    );

  try {
    addSkillToLockfile(
      temporaryDirectory,
      {
        name: "zeta-skill",
        version: "0.1.0"
      }
    );

    addSkillToLockfile(
      temporaryDirectory,
      {
        name: "alpha-skill",
        version: "0.2.0"
      }
    );

    const lockfile =
      readLockfile(
        temporaryDirectory
      );

    assert.deepEqual(
      Object.keys(
        lockfile.skills
      ),
      [
        "alpha-skill",
        "zeta-skill"
      ]
    );
  } finally {
    fs.rmSync(
      temporaryDirectory,
      {
        recursive: true,
        force: true
      }
    );
  }
});

test("removes a skill from the lockfile", () => {
  const temporaryDirectory =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "maykel-dev-lockfile-"
      )
    );

  try {
    addSkillToLockfile(
      temporaryDirectory,
      {
        name: "surgical-fix",
        version: "0.1.0"
      }
    );

    addSkillToLockfile(
      temporaryDirectory,
      {
        name: "sqlite-debugging",
        version: "0.1.0"
      }
    );

    const lockfile =
      removeSkillFromLockfile(
        temporaryDirectory,
        "surgical-fix"
      );

    assert.deepEqual(
      lockfile.skills,
      {
        "sqlite-debugging": {
          version: "0.1.0",
          source:
            "maykel-dev-skills"
        }
      }
    );
  } finally {
    fs.rmSync(
      temporaryDirectory,
      {
        recursive: true,
        force: true
      }
    );
  }
});

test("rejects an unsupported lockfile schema", () => {
  const temporaryDirectory =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "maykel-dev-lockfile-"
      )
    );

  try {
    const lockfilePath =
      getLockfilePath(
        temporaryDirectory
      );

    fs.writeFileSync(
      lockfilePath,
      JSON.stringify({
        schemaVersion: 999,
        skills: {}
      }),
      "utf8"
    );

    assert.throws(
      () =>
        readLockfile(
          temporaryDirectory
        ),
      /Unsupported lockfile schema version: 999/
    );
  } finally {
    fs.rmSync(
      temporaryDirectory,
      {
        recursive: true,
        force: true
      }
    );
  }
});