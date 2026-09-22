import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDoctor } from "../cli/doctor.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

test("doctor passes for the current repository", () => {
  const doctor = createDoctor(root);
  const checks = doctor.run();

  assert.ok(checks.length > 0);

  const failedChecks = checks.filter(
    (check) => !check.passed
  );

  assert.equal(
    failedChecks.length,
    0,
    failedChecks
      .map(
        (check) =>
          `${check.name}: ${check.details}`
      )
      .join("\n")
  );
});

test("doctor includes the expected health checks", () => {
  const doctor = createDoctor(root);
  const checks = doctor.run();

  const names = checks.map(
    (check) => check.name
  );

  assert.ok(
    names.includes("Node.js >= 20")
  );

  assert.ok(
    names.includes(
      "package.json is valid"
    )
  );

  assert.ok(
    names.includes(
      "registry is valid"
    )
  );

  assert.ok(
    names.includes(
      "skill validation passes"
    )
  );

  assert.ok(
    names.includes(
      "automated tests pass"
    )
  );
});