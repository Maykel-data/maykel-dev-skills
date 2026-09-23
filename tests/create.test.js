import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  createSkill
} from "../cli/creator.js";

test("creates a skill with default metadata", () => {
  const root =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "maykel-create-"
      )
    );

  try {
    const result =
      createSkill({
        root,
        name: "example-skill"
      });

    assert.equal(
      result.name,
      "example-skill"
    );

    assert.equal(
      result.category,
      "engineering"
    );

    assert.equal(
      result.version,
      "0.1.0"
    );

    assert.deepEqual(
      result.tags,
      []
    );

    const skillPath =
      path.join(
        root,
        "skills",
        "engineering",
        "example-skill",
        "SKILL.md"
      );

    assert.equal(
      fs.existsSync(skillPath),
      true
    );

    const content =
      fs.readFileSync(
        skillPath,
        "utf8"
      );

    assert.match(
      content,
      /name: example-skill/
    );

    assert.match(
      content,
      /version: 0\.1\.0/
    );

    assert.match(
      content,
      /category: engineering/
    );
  } finally {
    fs.rmSync(
      root,
      {
        recursive: true,
        force: true
      }
    );
  }
});

test("creates a skill with custom metadata", () => {
  const root =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "maykel-create-"
      )
    );

  try {
    const result =
      createSkill({
        root,
        name: "api-testing",
        category: "testing",
        version: "0.2.0",
        tags: [
          "testing",
          "automation",
          "testing"
        ]
      });

    assert.equal(
      result.name,
      "api-testing"
    );

    assert.equal(
      result.category,
      "testing"
    );

    assert.equal(
      result.version,
      "0.2.0"
    );

    assert.deepEqual(
      result.tags,
      [
        "testing",
        "automation"
      ]
    );

    const skillPath =
      path.join(
        root,
        "skills",
        "testing",
        "api-testing",
        "SKILL.md"
      );

    assert.equal(
      fs.existsSync(skillPath),
      true
    );

    const content =
      fs.readFileSync(
        skillPath,
        "utf8"
      );

    assert.match(
      content,
      /name: api-testing/
    );

    assert.match(
      content,
      /version: 0\.2\.0/
    );

    assert.match(
      content,
      /category: testing/
    );

    assert.match(
      content,
      /tags:\r?\n  - testing\r?\n  - automation/
    );
  } finally {
    fs.rmSync(
      root,
      {
        recursive: true,
        force: true
      }
    );
  }
});

test("rejects an invalid skill name", () => {
  const root =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "maykel-create-"
      )
    );

  try {
    assert.throws(
      () =>
        createSkill({
          root,
          name: "Invalid Skill"
        }),
      /Invalid skill name/
    );
  } finally {
    fs.rmSync(
      root,
      {
        recursive: true,
        force: true
      }
    );
  }
});

test("rejects an invalid category", () => {
  const root =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "maykel-create-"
      )
    );

  try {
    assert.throws(
      () =>
        createSkill({
          root,
          name: "example-skill",
          category: "invalid"
        }),
      /Invalid category/
    );
  } finally {
    fs.rmSync(
      root,
      {
        recursive: true,
        force: true
      }
    );
  }
});

test("rejects an invalid version", () => {
  const root =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "maykel-create-"
      )
    );

  try {
    assert.throws(
      () =>
        createSkill({
          root,
          name: "example-skill",
          version: "1.0"
        }),
      /Invalid version/
    );
  } finally {
    fs.rmSync(
      root,
      {
        recursive: true,
        force: true
      }
    );
  }
});

test("prevents overwriting an existing skill without force", () => {
  const root =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "maykel-create-"
      )
    );

  try {
    createSkill({
      root,
      name: "example-skill"
    });

    assert.throws(
      () =>
        createSkill({
          root,
          name: "example-skill"
        }),
      /already exists/
    );
  } finally {
    fs.rmSync(
      root,
      {
        recursive: true,
        force: true
      }
    );
  }
});

test("allows overwriting an existing skill with force", () => {
  const root =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "maykel-create-"
      )
    );

  try {
    createSkill({
      root,
      name: "example-skill",
      version: "0.1.0"
    });

    const result =
      createSkill({
        root,
        name: "example-skill",
        version: "0.2.0",
        force: true
      });

    assert.equal(
      result.version,
      "0.2.0"
    );

    const skillPath =
      path.join(
        root,
        "skills",
        "engineering",
        "example-skill",
        "SKILL.md"
      );

    const content =
      fs.readFileSync(
        skillPath,
        "utf8"
      );

    assert.match(
      content,
      /version: 0\.2\.0/
    );
  } finally {
    fs.rmSync(
      root,
      {
        recursive: true,
        force: true
      }
    );
  }
});
