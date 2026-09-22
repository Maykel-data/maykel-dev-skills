---
name: surgical-fix
description: Make the smallest safe change needed to fix a verified problem without introducing unrelated changes.
version: 0.1.0
category: engineering
---

# Surgical Fix

## Purpose

Fix the identified problem with the smallest reasonable change.

Do not modify unrelated code just because it could be improved.

## Workflow

1. Reproduce or verify the reported problem.
2. Identify the exact failure.
3. Inspect the relevant code and its dependencies.
4. Form a specific root-cause hypothesis.
5. Make the smallest change that addresses the root cause.
6. Avoid unrelated refactoring.
7. Run the most relevant test or verification.
8. Check the final diff for unintended changes.
9. Report what changed and how it was verified.

## Rules

- Do not guess when evidence can be gathered.
- Do not rewrite working code without a reason.
- Do not introduce unrelated dependencies.
- Do not change public APIs unless required.
- Do not remove existing behavior unless the bug requires it.
- Preserve existing project conventions.
- Prefer reversible changes.
- Verify before declaring the problem fixed.

## Completion Criteria

A surgical fix is complete only when:

- The original problem is understood.
- The root cause has been addressed.
- Relevant verification has passed.
- No unrelated changes were introduced.