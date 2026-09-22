---
name: sqlite-debugging
description: Diagnose SQLite database problems using evidence from schema, queries, transactions, constraints, and runtime behavior.
version: 0.1.0
category: database
---

# SQLite Debugging

## Purpose

Diagnose SQLite problems systematically before changing database code.

Use this skill when an application has unexpected SQLite errors, incorrect query results, missing data, constraint failures, locking problems, transaction issues, or database behavior that differs from expectations.

## Workflow

1. Identify the exact SQLite operation that is failing.
2. Capture the complete error message and relevant runtime context.
3. Identify the database file and confirm that the application is connected to the expected database.
4. Inspect the relevant tables, columns, indexes, constraints, and relationships.
5. Reproduce the problem with the smallest useful query or operation.
6. Check whether the problem is caused by application logic, SQL syntax, schema state, data state, transaction behavior, or connection configuration.
7. Form a specific root-cause hypothesis.
8. Verify the hypothesis with a focused query, inspection, or controlled test.
9. Make the smallest safe change required to address the verified root cause.
10. Re-run the failing operation.
11. Run relevant regression tests.
12. Inspect the final database and code changes for unintended effects.

## Rules

- Never assume the application is connected to the database you expect.
- Do not modify production data merely to test a hypothesis.
- Do not delete or recreate a database to hide an error.
- Do not use destructive SQL when a read-only query can provide the required evidence.
- Do not change the schema without first inspecting the existing schema.
- Do not ignore foreign-key, UNIQUE, NOT NULL, CHECK, or PRIMARY KEY constraints.
- Do not assume an empty result means the query is correct.
- Check parameter values when prepared statements are involved.
- Check transaction boundaries when multiple database operations must succeed together.
- Preserve existing data unless data modification is explicitly required.
- Prefer a reproducible test case over guesswork.
- Keep unrelated refactoring out of a database fix.

## Evidence Checklist

Before changing code or schema, inspect the evidence that is relevant to the problem:

- SQLite error message
- database file path
- SQLite version when relevant
- table schema
- column names and types
- primary keys
- foreign keys
- indexes
- constraints
- SQL statement
- bound parameters
- transaction state
- relevant database rows
- application logs

## Useful SQLite Inspection

When appropriate, inspect the schema with:

```sql
SELECT name, sql
FROM sqlite_master
WHERE type IN ('table', 'index')
ORDER BY type, name;