import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire, registerHooks } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const frontendSrcRoot = path.join(repoRoot, "src", "frontend", "src");
const requireFromFrontend = createRequire(
  path.join(repoRoot, "src", "frontend", "package.json")
);
const ts = requireFromFrontend("typescript");

function resolveTsOrJsonPath(basePath) {
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.json`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.tsx"),
  ];
  for (const cand of candidates) {
    if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
      return cand;
    }
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const target = path.join(frontendSrcRoot, specifier.slice(2));
      const resolved = resolveTsOrJsonPath(target);
      if (resolved) {
        return { url: pathToFileURL(resolved).href, shortCircuit: true };
      }
    }

    if (
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      context.parentURL?.startsWith("file:")
    ) {
      const parentDir = path.dirname(fileURLToPath(context.parentURL));
      const target = path.resolve(parentDir, specifier);
      const resolved = resolveTsOrJsonPath(target);
      if (resolved) {
        return { url: pathToFileURL(resolved).href, shortCircuit: true };
      }
    }

    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.endsWith(".json")) {
      const source = fs.readFileSync(fileURLToPath(url), "utf8");
      return { format: "json", source, shortCircuit: true };
    }
    if ((url.endsWith(".ts") || url.endsWith(".tsx")) && !url.includes("node_modules")) {
      const source = fs.readFileSync(fileURLToPath(url), "utf8");
      const transpiled = ts.transpileModule(source, {
        fileName: fileURLToPath(url),
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
        },
      });
      return { format: "module", source: transpiled.outputText, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

const {
  dedupeReviewsById,
  dedupeSubmissionsById,
  generateSubmissionId,
  INITIAL_SAMPLE_REVIEWS,
  INITIAL_SAMPLE_SUBMISSIONS,
  stripUndefinedDeep,
} = await import(
  "../../src/frontend/src/utils/abstractSubmissionIntegrity.ts"
);

test("INITIAL_SAMPLE_SUBMISSIONS & dedupeSubmissionsById eliminate duplicate ABS-2027-004 keys while preserving user abstracts", () => {
  // Sample seeds must never claim sequential ID ABS-2027-004
  assert.equal(
    INITIAL_SAMPLE_SUBMISSIONS.some((s) => s.id === "ABS-2027-004"),
    false,
    "Sample seeds must not use ABS-2027-004 (corporate sample must use ABS-2027-S04)"
  );
  assert.ok(
    INITIAL_SAMPLE_SUBMISSIONS.some((s) => s.id === "ABS-2027-S04"),
    "Corporate sample seed must exist under ABS-2027-S04"
  );

  // Case A: Polluted v4 storage with user ABS-2027-004 + sample ABS-2027-004 + duplicate user copy
  const realUser004Old = {
    ...INITIAL_SAMPLE_SUBMISSIONS[0],
    id: "ABS-2027-004",
    title: "User Submitted 004 (Older)",
    isSampleSeed: false,
    submittedByUid: "user-123",
    updatedAt: "2026-11-10T10:00:00.000Z",
  };
  const realUser004New = {
    ...realUser004Old,
    title: "User Submitted 004 (Updated)",
    updatedAt: "2026-11-12T10:00:00.000Z",
  };
  const collidingSeed004 = {
    ...INITIAL_SAMPLE_SUBMISSIONS[3],
    id: "ABS-2027-004",
    title: "Sample Corporate Collision",
    isSampleSeed: true,
    updatedAt: "2026-11-18T10:00:00.000Z",
  };

  const { records, changed } = dedupeSubmissionsById([
    collidingSeed004,
    realUser004Old,
    realUser004New,
    INITIAL_SAMPLE_SUBMISSIONS[0],
  ]);

  assert.equal(changed, true);
  const ids = records.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length, "All resulting IDs must be strictly unique");

  const resolvedUser004 = records.find((r) => r.id === "ABS-2027-004");
  assert.ok(resolvedUser004, "Real user ABS-2027-004 submission must be preserved");
  assert.equal(resolvedUser004.isSampleSeed, false);
  assert.equal(resolvedUser004.title, "User Submitted 004 (Updated)");

  const corporateSample = records.find((r) => r.id === "ABS-2027-S04");
  assert.ok(corporateSample, "Corporate sample seed ABS-2027-S04 should be restored");

  // Case B: Sample seed ABS-2027-004 alone (no real user 004) gets migrated cleanly to S04
  const onlySeedResult = dedupeSubmissionsById([collidingSeed004]);
  assert.equal(
    onlySeedResult.records.some((r) => r.id === "ABS-2027-004"),
    false,
    "Stale ABS-2027-004 sample seed must be dropped when no real user owns it"
  );
  assert.ok(onlySeedResult.records.some((r) => r.id === "ABS-2027-S04"));
});

test("dedupeReviewsById purges stale ABS-2027-004 sample review while keeping real reviews and ABS-2027-S04 sample review", () => {
  const staleSeedReview = {
    ...INITIAL_SAMPLE_REVIEWS[5],
    reviewId: "rev_ABS-2027-004_ksato_hems-workshop.org",
    submissionId: "ABS-2027-004",
    isSampleSeed: true,
  };
  const realUserReviewOn004 = {
    ...staleSeedReview,
    reviewId: "rev_ABS-2027-004_reviewer_hems-workshop.org",
    reviewerEmail: "reviewer@hems-workshop.org",
    isSampleSeed: false,
  };

  const { records, changed } = dedupeReviewsById([
    staleSeedReview,
    realUserReviewOn004,
    realUserReviewOn004,
  ]);
  assert.equal(changed, true);

  const ids = records.map((r) => r.reviewId);
  assert.equal(new Set(ids).size, ids.length, "All reviewIds must be strictly unique");
  assert.equal(
    ids.includes("rev_ABS-2027-004_ksato_hems-workshop.org"),
    false,
    "Stale sample review on ABS-2027-004 should be dropped"
  );
  assert.ok(
    ids.includes("rev_ABS-2027-004_reviewer_hems-workshop.org"),
    "Real review on user ABS-2027-004 must be preserved"
  );
  assert.ok(
    records.some((r) => r.submissionId === "ABS-2027-S04"),
    "Corporate sample seed review on ABS-2027-S04 must be present"
  );
});

test("generateSubmissionId creates globally collision-free ABS-YYYY-XXXXXX IDs", () => {
  const generated = new Set();
  const runningList = [...INITIAL_SAMPLE_SUBMISSIONS];
  for (let i = 0; i < 500; i++) {
    const id = generateSubmissionId(2027, runningList);
    assert.match(id, /^ABS-2027-[A-HJ-NP-Z2-9]{6}$/);
    assert.equal(generated.has(id), false, `Collision detected on ${id}`);
    generated.add(id);
    runningList.push({ ...INITIAL_SAMPLE_SUBMISSIONS[0], id });
  }
  assert.equal(generated.size, 500);
});

test("stripUndefinedDeep recursively strips undefined keys while preserving null, primitives, and arrays", () => {
  const dirty = {
    id: "ABS-2027-9ABCDE",
    secondaryEmail: undefined,
    selectionVersion: 0,
    score: null,
    isSampleSeed: false,
    graphic: {
      fileName: "fig.png",
      detectedDpi: 300,
      hasLocalBlob: undefined,
      storageUrl: undefined,
    },
    authors: [{ id: "a1", name: "Alice", affiliationId: "aff-1", isPresenter: true }, undefined],
  };

  const cleaned = stripUndefinedDeep(dirty);
  assert.equal("secondaryEmail" in cleaned, false);
  assert.equal(cleaned.selectionVersion, 0);
  assert.equal(cleaned.score, null);
  assert.equal(cleaned.isSampleSeed, false);
  assert.equal("hasLocalBlob" in cleaned.graphic, false);
  assert.equal("storageUrl" in cleaned.graphic, false);
  assert.equal(cleaned.authors.length, 1);
  assert.equal(JSON.stringify(cleaned).includes("undefined"), false);
});

test("firestore.rules protects hemsFitness, committeeSelection, and selectionVersion on attendee create and update", () => {
  const rulesText = fs.readFileSync(path.join(repoRoot, "firestore.rules"), "utf8");
  const start = rulesText.indexOf("match /abstract_submissions/{submissionId}");
  const end = rulesText.indexOf("match /board_documents/{document}");
  assert.ok(start !== -1 && end > start);
  const absRulesBlock = rulesText.slice(start, end);

  for (const requiredToken of [
    "!('hemsFitness' in request.resource.data)",
    "request.resource.data.committeeSelection == 'pending'",
    "request.resource.data.selectionVersion == 0",
    "request.resource.data.get('hemsFitness', null) == resource.data.get('hemsFitness', null)",
    "request.resource.data.get('committeeSelection', 'pending') == resource.data.get('committeeSelection', 'pending')",
    "request.resource.data.get('selectionVersion', 0) == resource.data.get('selectionVersion', 0)",
  ]) {
    assert.ok(
      absRulesBlock.includes(requiredToken),
      `firestore.rules abstract_submissions missing guard: ${requiredToken}`
    );
  }
});
