import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { installSkill } from "../cli/installer.js";

test("finds and installs an existing skill", () => {
  const temporaryDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "maykel-dev-skills-")
  );

  try {
    const result = installSkill(
      "sqlite-debugging",
      temporaryDirectory
    );

    const installedFile = path.join(
      temporaryDirectory,
      "sqlite-debugging",
      "SKILL.md"
    );

    assert.equal(
      result.name,
      "sqlite-debugging"
    );

    assert.equal(
      result.version,
      "0.1.0"
    );

    assert.equal(
      result.category,
      "database"
    );

    assert.equal(
      fs.existsSync(installedFile),
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

test("installs skill dependencies automatically", () => {
  const temporaryDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "maykel-dev-skills-dependencies-")
  );

  try {
    installSkill(
      "sqlite-debugging",
      temporaryDirectory
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

    const lockfilePath =
      path.join(
        temporaryDirectory,
        "skills-lock.json"
      );

    const lockfile =
      JSON.parse(
        fs.readFileSync(
          lockfilePath,
          "utf8"
        )
      );

    assert.ok(
      lockfile.skills["sqlite-debugging"]
    );

    assert.ok(
      lockfile.skills["surgical-fix"]
    );

    assert.equal(
      lockfile.skills["sqlite-debugging"].version,
      "0.1.0"
    );

    assert.equal(
      lockfile.skills["surgical-fix"].version,
      "0.1.0"
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

test("rejects an unknown skill", () => {
  const temporaryDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "maykel-dev-skills-")
  );

  try {
    assert.throws(
      () => {
        installSkill(
          "does-not-exist",
          temporaryDirectory
        );
      },
      /Skill "does-not-exist" was not found/
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

test("prevents overwriting an existing skill without force", () => {
  const temporaryDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "maykel-dev-skills-")
  );

  try {
    installSkill(
      "sqlite-debugging",
      temporaryDirectory
    );

    assert.throws(
      () => {
        installSkill(
          "sqlite-debugging",
          temporaryDirectory
        );
      },
      /already exists/
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

test("allows overwriting an existing skill with force", () => {
  const temporaryDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "maykel-dev-skills-")
  );

  try {
    installSkill(
      "sqlite-debugging",
      temporaryDirectory
    );

    const result = installSkill(
      "sqlite-debugging",
      temporaryDirectory,
      {
        force: true
      }
    );

    assert.equal(
      result.name,
      "sqlite-debugging"
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