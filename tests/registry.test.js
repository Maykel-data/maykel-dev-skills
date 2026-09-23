import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
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

const builderPath =
  path.join(
    root,
    "scripts",
    "build-registry.js"
  );

const registryPath =
  path.join(
    root,
    "registry",
    "skills.json"
  );

function buildRegistry() {
  const result =
    spawnSync(
      process.execPath,
      [builderPath],
      {
        cwd: root,
        encoding: "utf8"
      }
    );

  assert.equal(
    result.status,
    0,
    result.stderr ||
      result.stdout
  );

  assert.match(
    result.stdout,
    /Registry built successfully/
  );
}

function readRegistry() {
  return JSON.parse(
    fs.readFileSync(
      registryPath,
      "utf8"
    )
  );
}

test(
  "registry builder preserves skill tags",
  () => {
    buildRegistry();

    const registry =
      readRegistry();

    const skill =
      registry.skills.find(
        (entry) =>
          entry.name ===
          "sqlite-debugging"
      );

    assert.ok(skill);

    assert.deepEqual(
      skill.tags,
      [
        "sqlite",
        "sql",
        "database",
        "debugging",
        "transactions"
      ]
    );
  }
);

test(
  "registry builder omits tags when a skill has no tags",
  () => {
    buildRegistry();

    const registry =
      readRegistry();

    const skill =
      registry.skills.find(
        (entry) =>
          entry.name ===
          "surgical-fix"
      );

    assert.ok(skill);

    assert.equal(
      Object.hasOwn(
        skill,
        "tags"
      ),
      false
    );
  }
);

test(
  "registry builder preserves skill metadata",
  () => {
    buildRegistry();

    const registry =
      readRegistry();

    const sqliteSkill =
      registry.skills.find(
        (entry) =>
          entry.name ===
          "sqlite-debugging"
      );

    assert.ok(
      sqliteSkill
    );

    assert.equal(
      sqliteSkill.description,
      "Diagnose SQLite database problems using evidence from schema, queries, transactions, constraints, and runtime behavior."
    );

    assert.equal(
      sqliteSkill.version,
      "0.1.0"
    );

    assert.equal(
      sqliteSkill.category,
      "database"
    );

    assert.equal(
      sqliteSkill.path,
      "skills/database/sqlite-debugging/SKILL.md"
    );
  }
);

test(
  "registry builder keeps skills sorted by name",
  () => {
    buildRegistry();

    const registry =
      readRegistry();

    const names =
      registry.skills.map(
        (skill) =>
          skill.name
      );

    const sortedNames =
      [
        ...names
      ].sort();

    assert.deepEqual(
      names,
      sortedNames
    );
  }
);

test(
  "registry builder calculates category totals",
  () => {
    buildRegistry();

    const registry =
      readRegistry();

    assert.equal(
      registry.totalSkills,
      registry.skills.length
    );

    assert.deepEqual(
      registry.categories,
      {
        database: 1,
        engineering: 1
      }
    );
  }
);
