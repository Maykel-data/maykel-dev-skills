import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

const root =
  path.resolve(
    __dirname,
    ".."
  );

const skillsDir =
  path.join(
    root,
    "skills"
  );

const REQUIRED_FIELDS = [
  "name",
  "description",
  "version",
  "category"
];

const VALID_CATEGORIES = [
  "engineering",
  "testing",
  "database",
  "backend",
  "frontend",
  "security",
  "workflows"
];

const NAME_PATTERN =
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const VERSION_PATTERN =
  /^\d+\.\d+\.\d+$/;

function walk(directory) {
  if (
    !fs.existsSync(
      directory
    )
  ) {
    return [];
  }

  const results = [];

  for (
    const entry of fs.readdirSync(
      directory,
      {
        withFileTypes: true
      }
    )
  ) {
    const fullPath =
      path.join(
        directory,
        entry.name
      );

    if (
      entry.isDirectory()
    ) {
      results.push(
        ...walk(fullPath)
      );

      continue;
    }

    if (
      entry.name === "SKILL.md"
    ) {
      results.push(
        fullPath
      );
    }
  }

  return results;
}

function parseFrontmatter(
  content
) {
  if (
    !content.startsWith("---")
  ) {
    return null;
  }

  const end =
    content.indexOf(
      "\n---",
      3
    );

  if (
    end === -1
  ) {
    return null;
  }

  const raw =
    content
      .slice(
        3,
        end
      )
      .trim();

  const data = {};

  let currentArray =
    null;

  for (
    const line of raw.split(
      /\r?\n/
    )
  ) {
    const trimmed =
      line.trim();

    if (
      trimmed === ""
    ) {
      continue;
    }

    if (
      currentArray &&
      trimmed.startsWith(
        "- "
      )
    ) {
      data[
        currentArray
      ].push(
        trimmed
          .slice(2)
          .trim()
      );

      continue;
    }

    currentArray =
      null;

    const separator =
      line.indexOf(":");

    if (
      separator === -1
    ) {
      continue;
    }

    const key =
      line
        .slice(
          0,
          separator
        )
        .trim();

    const value =
      line
        .slice(
          separator + 1
        )
        .trim();

    if (
      value === ""
    ) {
      data[key] = [];

      currentArray =
        key;

      continue;
    }

    data[key] =
      value;
  }

  return data;
}

function validateSkill(
  filePath,
  skill
) {
  const errors = [];

  const relativePath =
    path
      .relative(
        root,
        filePath
      )
      .replaceAll(
        "\\",
        "/"
      );

  if (!skill) {
    errors.push(
      `${relativePath}: invalid or missing frontmatter.`
    );

    return errors;
  }

  for (
    const field of REQUIRED_FIELDS
  ) {
    if (
      typeof skill[field] !==
        "string" ||
      skill[field].trim() === ""
    ) {
      errors.push(
        `${relativePath}: missing required field "${field}".`
      );
    }
  }

  if (
    typeof skill.name ===
      "string" &&
    !NAME_PATTERN.test(
      skill.name
    )
  ) {
    errors.push(
      `${relativePath}: invalid skill name "${skill.name}".`
    );
  }

  if (
    typeof skill.version ===
      "string" &&
    !VERSION_PATTERN.test(
      skill.version
    )
  ) {
    errors.push(
      `${relativePath}: invalid version "${skill.version}". Expected SemVer format.`
    );
  }

  if (
    typeof skill.category ===
      "string" &&
    !VALID_CATEGORIES.includes(
      skill.category
    )
  ) {
    errors.push(
      `${relativePath}: invalid category "${skill.category}".`
    );
  }

  /*
   * Expected structure:
   *
   * skills/
   *   <category>/
   *     <skill-name>/
   *       SKILL.md
   *
   * Therefore the category directory is
   * two levels above SKILL.md.
   */
  const categoryDirectory =
    path.basename(
      path.dirname(
        path.dirname(
          filePath
        )
      )
    );

  if (
    typeof skill.category ===
      "string" &&
    skill.category !==
      categoryDirectory
  ) {
    errors.push(
      `${relativePath}: category "${skill.category}" does not match directory "${categoryDirectory}".`
    );
  }

  if (
    skill.dependencies !== undefined
  ) {
    if (
      !Array.isArray(
        skill.dependencies
      )
    ) {
      errors.push(
        `${relativePath}: dependencies must be an array.`
      );
    } else {
      const seenDependencies =
        new Set();

      for (
        const dependency of skill.dependencies
      ) {
        if (
          typeof dependency !== "string" ||
          dependency.trim() === ""
        ) {
          errors.push(
            `${relativePath}: every dependency must be a non-empty string.`
          );
          continue;
        }

        if (
          !NAME_PATTERN.test(
            dependency
          )
        ) {
          errors.push(
            `${relativePath}: invalid dependency "${dependency}".`
          );
        }

        if (
          dependency === skill.name
        ) {
          errors.push(
            `${relativePath}: skill cannot depend on itself.`
          );
        }

        const normalized =
          dependency.toLowerCase();

        if (
          seenDependencies.has(
            normalized
          )
        ) {
          errors.push(
            `${relativePath}: duplicate dependency "${dependency}".`
          );
        }

        seenDependencies.add(
          normalized
        );
      }
    }
  }

  if (
    skill.tags !== undefined
  ) {
    if (
      !Array.isArray(
        skill.tags
      )
    ) {
      errors.push(
        `${relativePath}: tags must be an array.`
      );
    } else {
      const seenTags =
        new Set();

      for (
        const tag of skill.tags
      ) {
        if (
          typeof tag !==
            "string" ||
          tag.trim() === ""
        ) {
          errors.push(
            `${relativePath}: every tag must be a non-empty string.`
          );

          continue;
        }

        if (
          !NAME_PATTERN.test(
            tag
          )
        ) {
          errors.push(
            `${relativePath}: invalid tag "${tag}".`
          );
        }

        const normalizedTag =
          tag.toLowerCase();

        if (
          seenTags.has(
            normalizedTag
          )
        ) {
          errors.push(
            `${relativePath}: duplicate tag "${tag}".`
          );
        }

        seenTags.add(
          normalizedTag
        );
      }
    }
  }

  return errors;
}

const skillFiles =
  walk(
    skillsDir
  );

const errors = [];

const names =
  new Set();

for (
  const filePath of skillFiles
) {
  const content =
    fs.readFileSync(
      filePath,
      "utf8"
    );

  const skill =
    parseFrontmatter(
      content
    );

  errors.push(
    ...validateSkill(
      filePath,
      skill
    )
  );

  if (
    skill?.name
  ) {
    if (
      names.has(
        skill.name
      )
    ) {
      const relativePath =
        path
          .relative(
            root,
            filePath
          )
          .replaceAll(
            "\\",
            "/"
          );

      errors.push(
        `${relativePath}: duplicate skill name "${skill.name}".`
      );
    }

    names.add(
      skill.name
    );
  }
}

if (
  errors.length > 0
) {
  console.error(
    `Skill validation failed with ${errors.length} error(s):`
  );

  for (
    const validationError of errors
  ) {
    console.error(
      `- ${validationError}`
    );
  }

  process.exit(1);
}

console.log(
  `Skill validation passed: ${skillFiles.length} skill(s).`
);