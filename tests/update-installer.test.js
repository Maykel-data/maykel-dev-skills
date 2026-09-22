import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import {
  installSkill,
  findSkill
} from "../cli/installer.js";

import {
  readLockfile,
  writeLockfile
} from "../cli/lockfile.js";

test("finds the current repository version of an installed skill", () => {
  const temporaryDirectory =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "maykel-dev-update-installer-"
      )
    );

  try {
    installSkill(
      "sqlite-debugging",
      temporaryDirectory
    );

    const currentSkill =
      findSkill(
        "sqlite-debugging"
      );

    assert.ok(
      currentSkill
    );

    assert.equal(
      currentSkill.skill.version,
      "0.1.0"
    );

    const installedFile =
      path.join(
        temporaryDirectory,
        "sqlite-debugging",
        "SKILL.md"
      );

    assert.equal(
      fs.existsSync(
        installedFile
      ),
      true
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

test("lockfile can represent an older installed version before update", () => {
  const temporaryDirectory =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "maykel-dev-update-installer-"
      )
    );

  try {
    writeLockfile(
      temporaryDirectory,
      {
        schemaVersion: 1,
        skills: {
          "sqlite-debugging": {
            version: "0.0.9",
            source:
              "maykel-dev-skills"
          }
        }
      }
    );

    const lockfile =
      readLockfile(
        temporaryDirectory
      );

    assert.equal(
      lockfile.skills[
        "sqlite-debugging"
      ].version,
      "0.0.9"
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

test("installed skill directory can be replaced with the current repository skill", () => {
  const temporaryDirectory =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "maykel-dev-update-installer-"
      )
    );

  try {
    installSkill(
      "sqlite-debugging",
      temporaryDirectory
    );

    const installedFile =
      path.join(
        temporaryDirectory,
        "sqlite-debugging",
        "SKILL.md"
      );

    const originalContent =
      fs.readFileSync(
        installedFile,
        "utf8"
      );

    fs.writeFileSync(
      installedFile,
      `${originalContent}\n\nLOCAL MODIFICATION\n`,
      "utf8"
    );

    assert.match(
      fs.readFileSync(
        installedFile,
        "utf8"
      ),
      /LOCAL MODIFICATION/
    );

    installSkill(
      "sqlite-debugging",
      temporaryDirectory,
      {
        force: true
      }
    );

    const updatedContent =
      fs.readFileSync(
        installedFile,
        "utf8"
      );

    assert.doesNotMatch(
      updatedContent,
      /LOCAL MODIFICATION/
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

test("updating one installed skill does not remove another installed skill", () => {
  const temporaryDirectory =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "maykel-dev-update-installer-"
      )
    );

  try {
    installSkill(
      "sqlite-debugging",
      temporaryDirectory
    );

    installSkill(
      "surgical-fix",
      temporaryDirectory
    );

    installSkill(
      "sqlite-debugging",
      temporaryDirectory,
      {
        force: true
      }
    );

    assert.equal(
      fs.existsSync(
        path.join(
          temporaryDirectory,
          "sqlite-debugging",
          "SKILL.md"
        )
      ),
      true
    );

    assert.equal(
      fs.existsSync(
        path.join(
          temporaryDirectory,
          "surgical-fix",
          "SKILL.md"
        )
      ),
      true
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