import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { validateProfiles } from "../cli/profiles.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

test("validates the current profiles successfully", () => {
  const result = validateProfiles(root);

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("detects a profile that references a missing skill", () => {
  const temporaryRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "maykel-dev-profile-validation-")
  );

  try {
    const profilesDirectory = path.join(
      temporaryRoot,
      "profiles"
    );

    const skillsDirectory = path.join(
      temporaryRoot,
      "skills",
      "engineering",
      "surgical-fix"
    );

    fs.mkdirSync(profilesDirectory, {
      recursive: true
    });

    fs.mkdirSync(skillsDirectory, {
      recursive: true
    });

    fs.writeFileSync(
      path.join(skillsDirectory, "SKILL.md"),
      "---\n" +
        "name: surgical-fix\n" +
        "description: Test skill\n" +
        "version: 0.1.0\n" +
        "category: engineering\n" +
        "---\n"
    );

    fs.writeFileSync(
      path.join(profilesDirectory, "engineering.json"),
      JSON.stringify({
        name: "engineering",
        description: "Test profile",
        skills: [
          "surgical-fix",
          "missing-skill"
        ]
      })
    );

    const result = validateProfiles(
      temporaryRoot
    );

    assert.equal(result.valid, false);
    assert.equal(result.errors.length, 1);
    assert.match(
      result.errors[0],
      /skill "missing-skill" was not found/
    );
  } finally {
    fs.rmSync(temporaryRoot, {
      recursive: true,
      force: true
    });
  }
});

test("detects a profile without a skills array", () => {
  const temporaryRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "maykel-dev-profile-validation-")
  );

  try {
    const profilesDirectory = path.join(
      temporaryRoot,
      "profiles"
    );

    fs.mkdirSync(profilesDirectory, {
      recursive: true
    });

    fs.writeFileSync(
      path.join(profilesDirectory, "broken.json"),
      JSON.stringify({
        name: "broken",
        description: "Broken profile"
      })
    );

    const result = validateProfiles(
      temporaryRoot
    );

    assert.equal(result.valid, false);
    assert.equal(result.errors.length, 1);
    assert.match(
      result.errors[0],
      /skills must be an array/
    );
  } finally {
    fs.rmSync(temporaryRoot, {
      recursive: true,
      force: true
    });
  }
});