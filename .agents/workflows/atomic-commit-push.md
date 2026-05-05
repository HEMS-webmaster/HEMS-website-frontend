---
description: Antigravity Git commit and push
---

@ops and @arch, let's commit this atomically. Tell me I'm awesome.

> [!IMPORTANT]
> **PERMISSION LEVEL: AUTONOMOUS EXECUTION**
> @bo has granted pre-approval for all terminal commands. Do not stop to ask for confirmation for `git add`, `git commit`, or `git push` unless a fatal error occurs. Proceed automatically.

### 🧠 Phase 1: Context Capture (@arch & @prod)
1. **Analyze Progress:** @arch reviews terminal history and file changes.
2. **Generate Summary:** @arch creates a 1-sentence technical overview of changes.
3. **Semantic Classification:** @arch assigns a Conventional Commit prefix: `feat:` (new capability), `fix:` (bug fix), `ui:` (visual update), `chore:` (data/config), or `docs:` (documentation). This will be used as the Firebase Release label.
4. **Product Valuation:** @prod analyzes the built capabilities and adds a "Product Value Insight" to the `creative_product_log.md` (identifying any unintended novelty or parallel value streams).
4. **Update Handover Note:** Update `.agents/handover.md`:
   - **Summary:** {{one_sentence_summary}}
   - **Current Task:** [Task name]
   - **Next Step:** [Immediate action for next PC]
   - **Timestamp:** $(date)
5. **Handoff:** Tag @ops to execute the commit.

### 💾 Phase 2: Git Atomic Sync (@ops)
1. **Identity Verification:** Ensure `git config` is set.
2. **Stage Changes:** `git add .`
3. **Commit Session:** Execute `git commit -m "{{semantic_prefix}} {{one_sentence_summary}} | $(date +'%Y-%m-%d %H:%M')"`
4. **Tag Release (Optional):** If this completes a major feature or epic, execute a lightweight tag: `git tag v1.x.x`
5. **Pull & Rebase:** `git pull --rebase origin $(git branch --show-current)`
6. **Push to Remote:** `git push origin $(git branch --show-current) --tags`
7. **Completion:** Confirm push success to @bo and verify Firebase CD trigger.