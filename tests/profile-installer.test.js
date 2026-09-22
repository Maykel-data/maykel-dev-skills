import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { installProfile } from "../cli/profile-installer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

test("installs an existing profile and its skills", () => {
  const temporaryDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "maykel-dev-profile-")
  );

  try {
    const result = installProfile(
      root,
      "engineering",
      temporaryDirectory
    );

    const installedFile = path.join(
      temporaryDirectory,
      "surgical-fix",
      "SKILL.md"
    );

    assert.equal(result.name, "engineering");
    assert.equal(result.skills.length, 1);
    assert.equal(result.skills[0].name, "surgical-fix");
    assert.equal(result.skills[0].version, "0.1.0");
    assert.equal(fs.existsSync(installedFile), true);
  } finally {
    fs.rmSync(temporaryDirectory, {
      recursive: true,
      force: true
    });
  }
});

test("rejects an unknown profile", () => {
  const temporaryDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "maykel-dev-profile-")
  );

  try {
    assert.throws(
      () =>
        installProfile(
          root,
          "does-not-exist",
          temporaryDirectory
        ),
      /Profile "does-not-exist" was not found/
    );
  } finally {
    fs.rmSync(temporaryDirectory, {
      recursive: true,
      force: true
    });
  }
});

test("supports force installation for an existing profile", () => {
  const temporaryDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "maykel-dev-profile-")
  );

  try {
    installProfile(
      root,
      "engineering",
      temporaryDirectory
    );

    assert.throws(
      () =>
        installProfile(
          root,
          "engineering",
          temporaryDirectory
        ),
      /already exists/
    );

    const result = installProfile(
      root,
      "engineering",
      temporaryDirectory,
      { force: true }
    );

    assert.equal(result.name, "engineering");
    assert.equal(result.skills.length, 1);
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
    fs.rmSync(temporaryDirectory, {
      recursive: true,
      force: true
    });
  }
});
