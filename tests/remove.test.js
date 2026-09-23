import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  installSkill,
  removeSkill
} from "../cli/installer.js";

import {
  readLockfile
} from "../cli/lockfile.js";

function createTempProject() {
  return fs.mkdtempSync(
    path.join(
      os.tmpdir(),
      "maykel-remove-"
    )
  );
}

test(
  "removes an installed skill and updates the lockfile",
  () => {
    const project =
      createTempProject();

    try {
      const target =
        path.join(
          project,
          ".agents",
          "skills"
        );

      const installed =
        installSkill(
          "sqlite-debugging",
          target
        );

      assert.equal(
        installed.name,
        "sqlite-debugging"
      );

      const skillDirectory =
        path.join(
          target,
          "sqlite-debugging"
        );

      assert.equal(
        fs.existsSync(
          skillDirectory
        ),
        true
      );

      const before =
        readLockfile(
          target
        );

      assert.equal(
        before.skills[
          "sqlite-debugging"
        ].version,
        "0.1.0"
      );

      const result =
        removeSkill(
          "sqlite-debugging",
          target
        );

      assert.equal(
        result.name,
        "sqlite-debugging"
      );

      assert.equal(
        fs.existsSync(
          skillDirectory
        ),
        false
      );

      const after =
        readLockfile(
          target
        );

      assert.equal(
        Object.hasOwn(
          after.skills,
          "sqlite-debugging"
        ),
        false
      );
    } finally {
      fs.rmSync(
        project,
        {
          recursive: true,
          force: true
        }
      );
    }
  }
);

test(
  "removes an installed skill without a lockfile",
  () => {
    const project =
      createTempProject();

    try {
      const target =
        path.join(
          project,
          ".agents",
          "skills"
        );

      const skillDirectory =
        path.join(
          target,
          "manual-skill"
        );

      fs.mkdirSync(
        skillDirectory,
        {
          recursive: true
        }
      );

      fs.writeFileSync(
        path.join(
          skillDirectory,
          "SKILL.md"
        ),
        "# Manual Skill\n",
        "utf8"
      );

      const result =
        removeSkill(
          "manual-skill",
          target
        );

      assert.equal(
        result.name,
        "manual-skill"
      );

      assert.equal(
        result.lockfile,
        null
      );

      assert.equal(
        fs.existsSync(
          skillDirectory
        ),
        false
      );
    } finally {
      fs.rmSync(
        project,
        {
          recursive: true,
          force: true
        }
      );
    }
  }
);

test(
  "rejects removing a skill that is not installed",
  () => {
    const project =
      createTempProject();

    try {
      const target =
        path.join(
          project,
          ".agents",
          "skills"
        );

      assert.throws(
        () =>
          removeSkill(
            "sqlite-debugging",
            target
          ),
        /Installed skill "sqlite-debugging" was not found/
      );
    } finally {
      fs.rmSync(
        project,
        {
          recursive: true,
          force: true
        }
      );
    }
  }
);

test(
  "supports removing a skill from a custom target directory",
  () => {
    const project =
      createTempProject();

    try {
      const target =
        path.join(
          project,
          "custom",
          "agent-skills"
        );

      installSkill(
        "surgical-fix",
        target
      );

      const skillDirectory =
        path.join(
          target,
          "surgical-fix"
        );

      assert.equal(
        fs.existsSync(
          skillDirectory
        ),
        true
      );

      removeSkill(
        "surgical-fix",
        target
      );

      assert.equal(
        fs.existsSync(
          skillDirectory
        ),
        false
      );

      const lockfile =
        readLockfile(
          target
        );

      assert.equal(
        Object.hasOwn(
          lockfile.skills,
          "surgical-fix"
        ),
        false
      );
    } finally {
      fs.rmSync(
        project,
        {
          recursive: true,
          force: true
        }
      );
    }
  }
);