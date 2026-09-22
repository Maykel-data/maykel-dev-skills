import test from "node:test";
import assert from "node:assert/strict";
import {
  findSkill
} from "../cli/installer.js";

test("finds an existing skill by name", () => {
  const result = findSkill(
    "sqlite-debugging"
  );

  assert.notEqual(
    result,
    null
  );

  assert.equal(
    result.skill.name,
    "sqlite-debugging"
  );

  assert.equal(
    result.skill.version,
    "0.1.0"
  );

  assert.equal(
    result.skill.category,
    "database"
  );
});

test("returns null for an unknown skill", () => {
  const result = findSkill(
    "does-not-exist"
  );

  assert.equal(
    result,
    null
  );
});