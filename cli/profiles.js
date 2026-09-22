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
    {
      withFileTypes: true
    }
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
        fs.readFileSync(
          filePath,
          "utf8"
        )
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

  return profiles.sort(
    (a, b) =>
      a.name.localeCompare(b.name)
  );
}

function findProfile(
  root,
  profileName
) {
  const profiles =
    getProfiles(root);

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

export {
  getProfiles,
  findProfile,
  listProfiles
};