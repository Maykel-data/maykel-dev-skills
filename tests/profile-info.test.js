import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const cliPath = path.join(
  root,
  "cli",
  "index.js"
);

test("profile info shows an existing profile", () => {
  const result = spawnSync(
    process.execPath,
    [
      cliPath,
      "profile",
      "info",
      "engineering"
    ],
    {
      cwd: root,
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
    /engineering/
  );

  assert.match(
    result.stdout,
    /Core software engineering skills/
  );

  assert.match(
    result.stdout,
    /surgical-fix@0\.1\.0/
  );

  assert.match(
    result.stdout,
    /profiles\/engineering\.json/
  );
});

test("profile info rejects an unknown profile", () => {
  const result = spawnSync(
    process.execPath,
    [
      cliPath,
      "profile",
      "info",
      "does-not-exist"
    ],
    {
      cwd: root,
      encoding: "utf8"
    }
  );

  assert.notEqual(
    result.status,
    0
  );

  assert.match(
    result.stderr,
    /Profile "does-not-exist" was not found/
  );
});