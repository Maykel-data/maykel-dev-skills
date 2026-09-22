import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function createDoctor(root) {
  const checks = [];

  function addCheck(name, passed, details) {
    checks.push({
      name,
      passed,
      details
    });
  }

  function checkNodeVersion() {
    const majorVersion = Number(
      process.versions.node.split(".")[0]
    );

    addCheck(
      "Node.js >= 20",
      majorVersion >= 20,
      `Detected Node.js ${process.versions.node}`
    );
  }

  function checkDirectory(name) {
    const directory = path.join(
      root,
      name
    );

    addCheck(
      `${name}/ exists`,
      fs.existsSync(directory),
      directory
    );
  }

  function checkFile(name) {
    const file = path.join(
      root,
      name
    );

    addCheck(
      `${name} exists`,
      fs.existsSync(file),
      file
    );
  }

  function checkPackageJson() {
    const packagePath = path.join(
      root,
      "package.json"
    );

    if (!fs.existsSync(packagePath)) {
      addCheck(
        "package.json is valid",
        false,
        "package.json was not found."
      );

      return;
    }

    try {
      const packageJson = JSON.parse(
        fs.readFileSync(
          packagePath,
          "utf8"
        )
      );

      const valid =
        packageJson.name ===
          "maykel-dev-skills" &&
        packageJson.version &&
        packageJson.scripts?.validate &&
        packageJson.scripts?.test;

      addCheck(
        "package.json is valid",
        valid,
        valid
          ? `Version ${packageJson.version}`
          : "Required package fields are missing."
      );
    } catch (error) {
      addCheck(
        "package.json is valid",
        false,
        error.message
      );
    }
  }

  function checkRegistry() {
    const registryPath = path.join(
      root,
      "registry",
      "skills.json"
    );

    if (!fs.existsSync(registryPath)) {
      addCheck(
        "registry is valid",
        false,
        "registry/skills.json was not found."
      );

      return;
    }

    try {
      const registry = JSON.parse(
        fs.readFileSync(
          registryPath,
          "utf8"
        )
      );

      const valid =
        registry.schemaVersion === 1 &&
        Number.isInteger(
          registry.totalSkills
        ) &&
        Array.isArray(
          registry.skills
        ) &&
        registry.totalSkills ===
          registry.skills.length;

      addCheck(
        "registry is valid",
        valid,
        valid
          ? `${registry.totalSkills} skill(s) registered`
          : "Registry structure is invalid."
      );
    } catch (error) {
      addCheck(
        "registry is valid",
        false,
        error.message
      );
    }
  }

  function checkSkills() {
    const skillsDirectory = path.join(
      root,
      "skills"
    );

    if (!fs.existsSync(skillsDirectory)) {
      addCheck(
        "skills directory is valid",
        false,
        "skills/ was not found."
      );

      return;
    }

    const result = spawnSync(
      process.execPath,
      [
        path.join(
          root,
          "scripts",
          "validate-skills.js"
        )
      ],
      {
        cwd: root,
        encoding: "utf8"
      }
    );

    addCheck(
      "skill validation passes",
      result.status === 0,
      result.status === 0
        ? result.stdout.trim()
        : (
            result.stderr ||
            result.stdout ||
            "Skill validation failed."
          ).trim()
    );
  }

  function checkTests() {
    const result = spawnSync(
      process.execPath,
      ["--test"],
      {
        cwd: root,
        encoding: "utf8"
      }
    );

    addCheck(
      "automated tests pass",
      result.status === 0,
      result.status === 0
        ? "All automated tests passed."
        : (
            result.stderr ||
            result.stdout ||
            "Automated tests failed."
          ).trim()
    );
  }

  function run() {
    checkNodeVersion();

    checkPackageJson();

    checkDirectory("cli");
    checkDirectory("skills");
    checkDirectory("registry");
    checkDirectory("scripts");
    checkDirectory("tests");

    checkFile("package.json");
    checkFile("docs/SKILL-SPEC.md");

    checkRegistry();
    checkSkills();
    checkTests();

    return checks;
  }

  return {
    run
  };
}

export {
  createDoctor
};