---
name: sqlite-debugging
description: Diagnose SQLite database problems using evidence from schema, queries, transactions, constraints, and runtime behavior.
version: 0.1.0
category: database
tags:
  - sqlite
  - sql
  - database
  - debugging
  - transactions
---

# SQLite Debugging

## Purpose

Diagnose SQLite problems systematically before changing database code.

Use this skill when an application has unexpected SQLite errors, incorrect query results, missing data, constraint failures, locking problems, transaction issues, or database behavior that differs from expectations.

## Workflow

1. Identify the exact SQLite operation failing.
2. Capture the complete error and runtime context.
3. Identify the database file and confirm the expected database.
4. Inspect tables, columns, indexes, constraints, and relationships.
5. Reproduce the problem with the smallest useful query or operation.
6. Check application logic, SQL syntax, schema state, data state, transaction behavior, and connection configuration.
7. Form a root-cause hypothesis.
8. Verify the hypothesis with focused queries, inspection, or controlled tests.
9. Make the smallest safe change.
10. Re-run the failing operation.
11. Run regression tests.
12. Inspect the final database and code changes.

## Rules

- Never assume the application is connected to the expected database.
- Do not modify production data to test a hypothesis.
- Do not delete or recreate the database to hide an error.
- Prefer read-only evidence.
- Inspect the schema before making schema changes.
- Do not ignore foreign key, UNIQUE, NOT NULL, CHECK, or primary-key constraints.
- Do not assume an empty result means a query is correct.
- Check prepared-statement parameters.
- Check transaction boundaries.
- Preserve existing data unless modification is explicitly required.
- Prefer reproducible tests.
- Keep unrelated refactoring out.

## Evidence Checklist

Collect relevant evidence including:

- SQLite error
- Database path
- SQLite version when relevant
- Schema
- Columns and types
- Primary keys
- Foreign keys
- Indexes
- Constraints
- SQL statement
- Query parameters
- Transaction state
- Relevant rows
- Application logs

## Useful SQLite Inspection

Useful inspection queries and commands include:

- `sqlite_master`
- `PRAGMA table_info`
- `PRAGMA foreign_key_list`
- `PRAGMA foreign_keys`
- `PRAGMA index_list`

## Verification

The fix is complete when the original failure is reproduced successfully or otherwise verified as resolved.

Verify:

- Original operation succeeds.
- Expected rows are returned.
- Constraints remain enforced.
- Transactions behave correctly.
- No unintended rows are modified.
- Tests pass.
- Database remains readable.

## Completion Criteria

- Database identified.
- Root cause supported by evidence.
- Smallest safe fix applied.
- Original problem resolved.
- Regression checks passed.
- No unrelated database changes.