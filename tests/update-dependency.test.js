import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import assert from "node:assert/strict";
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

test(
  "update command refreshes an outdated dependency when the requested skill is already current",
  () => {
    const project =
      fs.mkdtempSync(
        path.join(
          os.tmpdir(),
          "maykel-update-dependency-"
        )
      );

    try {
      const target =
        path.join(
          project,
          ".agents",
          "skills"
        );

      fs.mkdirSync(
        path.join(
          target,
          "sqlite-debugging"
        ),
        {
          recursive: true
        }
      );

      fs.mkdirSync(
        path.join(
          target,
          "surgical-fix"
        ),
        {
          recursive: true
        }
      );

      fs.writeFileSync(
        path.join(
          target,
          "sqlite-debugging",
          "SKILL.md"
        ),
        `---
name: sqlite-debugging
version: 0.1.0
category: database
description: old installed metadata
dependencies:
  - surgical-fix
---

# Old installed copy
`,
        "utf8"
      );

      fs.writeFileSync(
        path.join(
          target,
          "surgical-fix",
          "SKILL.md"
        ),
        `---
name: surgical-fix
version: 0.0.9
category: engineering
description: old installed metadata
---

# Old installed copy
`,
        "utf8"
      );

      fs.writeFileSync(
        path.join(
          project,
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

      const result =
        spawnSync(
          process.execPath,
          [
            cliPath,
            "update",
            "sqlite-debugging"
          ],
          {
            cwd:
              project,
            encoding:
              "utf8"
          }
        );

      assert.equal(
        result.status,
        0,
        result.stderr
      );

      const dependency =
        fs.readFileSync(
          path.join(
            target,
            "surgical-fix",
            "SKILL.md"
          ),
          "utf8"
        );

      assert.match(
        dependency,
        /version: 0\.1\.0/
      );

      const lockfile =
        JSON.parse(
          fs.readFileSync(
            path.join(
              project,
              "skills-lock.json"
            ),
            "utf8"
          )
        );

      assert.equal(
        lockfile.skills[
          "surgical-fix"
        ].version,
        "0.1.0"
      );
    } finally {
      fs.rmSync(
        project,
        {
          recursive:
            true,
          force:
            true
        }
      );
    }
  }
);
