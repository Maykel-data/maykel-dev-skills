import fs from "node:fs";
import path from "node:path";

function getProfiles(root) {
  const profilesDirectory = path.join(
    root,
    "profiles"
  );

  if (!fs.existsSync(profilesDirectory)) {
    return [];
  }

  const profiles = [];

  for (const entry of fs.readdirSync(
    profilesDirectory,
    { withFileTypes: true }
  )) {
    if (
      !entry.isFile() ||
      !entry.name.endsWith(".json")
    ) {
      continue;
    }

    const filePath = path.join(
      profilesDirectory,
      entry.name
    );

    try {
      const profile = JSON.parse(
        fs.readFileSync(filePath, "utf8")
      );

      profiles.push({
        ...profile,
        path: path
          .relative(root, filePath)
          .replaceAll("\\", "/")
      });
    } catch {
      continue;
    }
  }

  return profiles.sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

function findProfile(root, profileName) {
  const profiles = getProfiles(root);

  return (
    profiles.find(
      (profile) =>
        profile.name === profileName
    ) ?? null
  );
}

function listProfiles(root) {
  return getProfiles(root);
}

function getSkillNames(root) {
  const skillsDirectory = path.join(
    root,
    "skills"
  );

  if (!fs.existsSync(skillsDirectory)) {
    return [];
  }

  const skillNames = [];

  function walk(directory) {
    for (const entry of fs.readdirSync(
      directory,
      { withFileTypes: true }
    )) {
      const fullPath = path.join(
        directory,
        entry.name
      );

      if (!entry.isDirectory()) {
        continue;
      }

      const skillFile = path.join(
        fullPath,
        "SKILL.md"
      );

      if (fs.existsSync(skillFile)) {
        skillNames.push(entry.name);
        continue;
      }

      walk(fullPath);
    }
  }

  walk(skillsDirectory);

  return skillNames;
}

function validateProfiles(root) {
  const profiles = getProfiles(root);
  const availableSkills = new Set(
    getSkillNames(root)
  );

  const errors = [];

  for (const profile of profiles) {
    if (
      typeof profile.name !== "string" ||
      profile.name.trim() === ""
    ) {
      errors.push(
        `${profile.path}: profile name is missing.`
      );
    }

    if (!Array.isArray(profile.skills)) {
      errors.push(
        `${profile.path}: skills must be an array.`
      );
      continue;
    }

    for (const skillName of profile.skills) {
      if (!availableSkills.has(skillName)) {
        errors.push(
          `${profile.path}: skill "${skillName}" was not found.`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export {
  getProfiles,
  findProfile,
  listProfiles,
  validateProfiles
};