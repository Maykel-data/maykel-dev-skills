import path from "node:path";
import { findProfile } from "./profiles.js";
import { installSkill } from "./installer.js";

function installProfile(
  root,
  profileName,
  targetDirectory = ".agents/skills",
  options = {}
) {
  if (!profileName) {
    throw new Error(
      "Please provide a profile name."
    );
  }

  const profile = findProfile(
    root,
    profileName
  );

  if (!profile) {
    throw new Error(
      `Profile "${profileName}" was not found.`
    );
  }

  if (
    !Array.isArray(profile.skills) ||
    profile.skills.length === 0
  ) {
    throw new Error(
      `Profile "${profileName}" does not contain any skills.`
    );
  }

  const installedSkills = [];

  for (const skillName of profile.skills) {
    const result = installSkill(
      skillName,
      targetDirectory,
      options
    );

    installedSkills.push({
      name: result.name,
      version: result.version,
      category: result.category,
      source: result.source,
      destination: result.destination
    });
  }

  return {
    name: profile.name,
    description: profile.description,
    path: path
      .relative(
        root,
        path.join(
          root,
          "profiles",
          `${profileName}.json`
        )
      )
      .replaceAll("\\", "/"),
    skills: installedSkills
  };
}

export {
  installProfile
};