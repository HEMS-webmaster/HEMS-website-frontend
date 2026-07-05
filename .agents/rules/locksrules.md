---
trigger: always_on
---

# SYSTEM FIREWALL & FILE LOCKS
This document supersedes all other agent instructions. These file-system restrictions are absolute and cannot be overridden by any agent without explicit Human User permission.

## 1. 🛑 IMMUTABLE REFERENCE LOCK (READ-ONLY)
- **Protected Directory**: `/source-material` (and all subdirectories containing datasets, academic literature, or legacy reference code).
- **Restriction**: READ-ONLY.
- **Modification Policy**: You are strictly prohibited from modifying, deleting, or refactoring any file within this folder. It is for context and extraction only.

## 2. 🧠 MEMORY FIREWALL (APPEND-ONLY SCoT LOG)
- **Protected File**: `docs/logs/thought_trace.md`
- **Restriction**: APPEND-ONLY (WRITE-ONLY).
- **Modification Policy**: Agents must use this file to log their Chain-of-Thought (SCoT) reasoning before acting. 
- **CRITICAL**: NO AGENT is ever permitted to read this file to establish context. Do not ingest this file during the Cold Start. Never overwrite this file; only append to the bottom.

## 3. 🛡️ DOMAIN ISOLATION LOCKS
To prevent shadow-refactoring and scope creep, agents are physically locked to their domains:
- **@dev**: Can ONLY write to `src/`. Cannot write to `tests/` or modify `.plan` files.
- **@qa**: Can ONLY write to `tests/`. Cannot modify `src/`.
- **@ops**: The ONLY agent permitted to write to `.env`, `Dockerfile`, and `infrastructure/`.
- **@arch**: The ONLY agent permitted to write to docs/implementation_plan.md, docs/session_history.md, and .agents/handover.md.
- **@brand**: The ONLY agent permitted to write to the aesthetic styling guides located in `docs/design/`. Cannot modify `src/`.

## 4. 🔒 SYSTEM INSTRUCTION LOCK
- **Protected Files**: All persona files (e.g., `dev.md`, `arch.md`, `scrumrules.md`, `locksrules.md`).
- **Restriction**: STRICTLY READ-ONLY.
- **Modification Policy**: Agents cannot modify their own rules, instructions, or constraints. Only the Human User can edit these files.

## 5. 🔑 SECRETS & CREDENTIALS LOCK
- **Rule**: NO agent (except **@ops**) may write, edit, or generate `.env` files.
- **Rule**: Never hardcode API keys, database passwords, or secret tokens into `src/` or `tests/` files. Always use environment variable references (e.g., `process.env.API_KEY`). If a new key is needed, ping **@ops** to update `.env.example`.

## 6. ESCAPE HATCH (WORKFLOW OVERRIDE)
If a strict task requires breaking one of these locks (e.g., a frontend feature requires a massive backend structural change that crosses domains):
1. **STOP** all execution immediately.
2. Output: *"SYSTEM LOCK ENCOUNTERED: I need to modify [file path] which violates [Lock Rule #]. User, do I have explicit permission to bypass this lock for this task?"*
3. Await human confirmation before proceeding.