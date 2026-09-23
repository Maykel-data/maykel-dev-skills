import fs from "node:fs";
import path from "node:path";

const NAME_PATTERN =
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const VERSION_PATTERN =
  /^\d+\.\d+\.\d+$/;

const VALID_CATEGORIES = [
  "engineering",
  "testing",
  "database",
  "backend",
  "frontend",
  "security",
  "workflows"
];

function createSkill({
  root,
  name,
  category = "engineering",
  version = "0.1.0",
  tags = [],
  force = false
}) {
  if (!name) {
    throw new Error(
      "Please provide a skill name."
    );
  }

  if (!NAME_PATTERN.test(name)) {
    throw new Error(
      `Invalid skill name "${name}". Use lowercase letters, numbers, and hyphens only.`
    );
  }

  if (!VALID_CATEGORIES.includes(category)) {
    throw new Error(
      `Invalid category "${category}". Valid categories: ${VALID_CATEGORIES.join(", ")}.`
    );
  }

  if (!VERSION_PATTERN.test(version)) {
    throw new Error(
      `Invalid version "${version}". Expected SemVer format such as 0.1.0.`
    );
  }

  const normalizedTags = [
    ...new Set(
      tags
        .map((tag) =>
          String(tag)
            .trim()
            .toLowerCase()
        )
        .filter(Boolean)
    )
  ];

  for (const tag of normalizedTags) {
    if (!NAME_PATTERN.test(tag)) {
      throw new Error(
        `Invalid tag "${tag}". Use lowercase letters, numbers, and hyphens only.`
      );
    }
  }

  const skillDirectory =
    path.join(
      root,
      "skills",
      category,
      name
    );

  const skillFile =
    path.join(
      skillDirectory,
      "SKILL.md"
    );

  if (
    fs.existsSync(skillDirectory) &&
    !force
  ) {
    throw new Error(
      `Skill "${name}" already exists at ${path.relative(root, skillDirectory).replaceAll("\\", "/")}. Use --force to replace it.`
    );
  }

  if (
    fs.existsSync(skillDirectory) &&
    force
  ) {
    fs.rmSync(
      skillDirectory,
      {
        recursive: true,
        force: true
      }
    );
  }

  const tagsSection =
    normalizedTags.length > 0
      ? [
          "tags:",
          ...normalizedTags.map(
            (tag) => `  - ${tag}`
          )
        ].join("\n")
      : "tags: []";

  const content = `---
name: ${name}
description: Describe what this skill does.
version: ${version}
category: ${category}
${tagsSection}
---

# ${name}

## Purpose

Describe the problem this skill solves and when it should be used.

## Workflow

1. Identify the task or problem.
2. Gather the relevant evidence.
3. Apply the smallest safe change or action.
4. Verify the result.
5. Report what changed and how it was verified.

## Rules

- Use evidence before making changes.
- Avoid unrelated modifications.
- Preserve existing project conventions.
- Prefer small, reversible changes.
- Verify the result before declaring completion.

## Completion Criteria

- The intended task is completed.
- Relevant verification has passed.
- No unrelated changes were introduced.
`;

  fs.mkdirSync(
    skillDirectory,
    {
      recursive: true
    }
  );

  fs.writeFileSync(
    skillFile,
    content,
    "utf8"
  );

  return {
    name,
    category,
    version,
    tags: normalizedTags,
    path: path
      .relative(
        root,
        skillFile
      )
      .replaceAll("\\", "/")
  };
}

export {
  createSkill,
  VALID_CATEGORIES
};
