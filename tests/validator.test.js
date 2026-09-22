import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const validatorPath = path.join(
  root,
  "scripts",
  "validate-skills.js"
);

test("skill validator passes the current repository", () => {
  const result = spawnSync(
    process.execPath,
    [validatorPath],
    {
      cwd: root,
      encoding: "utf8"
    }
  );

  assert.equal(
    result.status,
    0,
    result.stderr || result.stdout
  );

  assert.match(
    result.stdout,
    /Skill validation passed/
  );
});