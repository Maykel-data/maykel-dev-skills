import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

import {
  addSkillToLockfile,
  readLockfile
} from "../cli/lockfile.js";

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

const root =
  path.resolve(
    __dirname,
    ".."
  );

test("lockfile can update an existing skill version", () => {
  const temporaryDirectory =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "maykel-dev-update-"
      )
    );

  try {
    addSkillToLockfile(
      temporaryDirectory,
      {
        name: "sqlite-debugging",
        version: "0.1.0"
      }
    );

    addSkillToLockfile(
      temporaryDirectory,
      {
        name: "sqlite-debugging",
        version: "0.2.0"
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
      "0.2.0"
    );

    assert.equal(
      lockfile.skills[
        "sqlite-debugging"
      ].source,
      "maykel-dev-skills"
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

test("lockfile preserves other skills when updating one skill", () => {
  const temporaryDirectory =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "maykel-dev-update-"
      )
    );

  try {
    addSkillToLockfile(
      temporaryDirectory,
      {
        name: "sqlite-debugging",
        version: "0.1.0"
      }
    );

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
        version: "0.2.0"
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
      "0.2.0"
    );

    assert.equal(
      lockfile.skills[
        "surgical-fix"
      ].version,
      "0.1.0"
    );

    assert.deepEqual(
      Object.keys(
        lockfile.skills
      ),
      [
        "sqlite-debugging",
        "surgical-fix"
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