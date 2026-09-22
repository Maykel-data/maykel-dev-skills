import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

const root =
  path.resolve(
    __dirname,
    ".."
  );

const cliPath =
  path.join(
    root,
    "cli",
    "index.js"
  );

function createLockfile(
  directory
) {
  fs.writeFileSync(
    path.join(
      directory,
      "skills-lock.json"
    ),
    JSON.stringify(
      {
        schemaVersion: 1,
        skills: {
          "sqlite-debugging": {
            version: "0.0.9",
            source:
              "maykel-dev-skills"
          }
        }
      },
      null,
      2
    ),
    "utf8"
  );
}

test("update command reports when the lockfile is missing", () => {
  const temporaryDirectory =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "maykel-dev-update-command-"
      )
    );

  try {
    const result =
      spawnSync(
        process.execPath,
        [
          cliPath,
          "update"
        ],
        {
          cwd: temporaryDirectory,
          encoding: "utf8"
        }
      );

    assert.notEqual(
      result.status,
      0
    );

    assert.match(
      result.stderr,
      /skills-lock\.json was not found/
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

test("update command rejects an unknown skill", () => {
  const temporaryDirectory =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "maykel-dev-update-command-"
      )
    );

  try {
    createLockfile(
      temporaryDirectory
    );

    const result =
      spawnSync(
        process.execPath,
        [
          cliPath,
          "update",
          "does-not-exist"
        ],
        {
          cwd: temporaryDirectory,
          encoding: "utf8"
        }
      );

    assert.notEqual(
      result.status,
      0
    );

    assert.match(
      result.stderr,
      /Skill "does-not-exist"/
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

test("update command can be invoked from the CLI", () => {
  const temporaryDirectory =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "maykel-dev-update-command-"
      )
    );

  try {
    createLockfile(
      temporaryDirectory
    );

    fs.mkdirSync(
      path.join(
        temporaryDirectory,
        ".agents",
        "skills",
        "sqlite-debugging"
      ),
      {
        recursive: true
      }
    );

    const result =
      spawnSync(
        process.execPath,
        [
          cliPath,
          "update"
        ],
        {
          cwd: temporaryDirectory,
          encoding: "utf8"
        }
      );

    assert.equal(
      result.status,
      0,
      result.stderr
    );

    assert.match(
      result.stdout,
      /Updating skills/
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