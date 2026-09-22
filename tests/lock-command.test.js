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

test("lock command shows locked skills", () => {
  const temporaryDirectory =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "maykel-dev-lock-command-"
      )
    );

  try {
    fs.writeFileSync(
      path.join(
        temporaryDirectory,
        "skills-lock.json"
      ),
      JSON.stringify(
        {
          schemaVersion: 1,
          skills: {
            "sqlite-debugging": {
              version: "0.1.0",
              source:
                "maykel-dev-skills"
            },
            "surgical-fix": {
              version: "0.1.0",
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

    const result =
      spawnSync(
        process.execPath,
        [
          cliPath,
          "lock"
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
      /Locked Skills/
    );

    assert.match(
      result.stdout,
      /sqlite-debugging@0\.1\.0/
    );

    assert.match(
      result.stdout,
      /surgical-fix@0\.1\.0/
    );

    assert.match(
      result.stdout,
      /source: maykel-dev-skills/
    );

    assert.match(
      result.stdout,
      /Lockfile: skills-lock\.json/
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

test("lock command handles a project without a lockfile", () => {
  const temporaryDirectory =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "maykel-dev-lock-command-"
      )
    );

  try {
    const result =
      spawnSync(
        process.execPath,
        [
          cliPath,
          "lock"
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
      /No skills are currently locked/
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