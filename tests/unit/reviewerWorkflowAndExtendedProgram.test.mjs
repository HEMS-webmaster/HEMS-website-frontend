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

    if (specifier === "jspdf") {
      const jspdfPath = requireFromFrontend.resolve("jspdf");
      return { url: pathToFileURL(jspdfPath).href, shortCircuit: true };
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

const { RESEARCH_TRACK_OPTIONS } = await import(
  "../../src/frontend/src/types/abstractSubmission.ts"
);
const { extractSuggestedKeywords } = await import(
  "../../src/frontend/src/utils/keywordExtractor.ts"
);
const {
  classifySubmissionCohort,
  findReviewerEvaluation,
  resolveEffectiveTrack,
  summarizeSubmissionReviews,
} = await import("../../src/frontend/src/utils/abstractReviewMetrics.ts");
const { buildHemsResponseEmail, formatHemsRecipientAddress } = await import(
  "../../src/frontend/src/utils/hemsResponseEmail.ts"
);
const { DEFAULT_UPCOMING_WORKSHOP } = await import(
  "../../src/frontend/src/utils/upcomingWorkshop.ts"
);
const {
  assignMiscellaneousCandidatesToDedicatedSession,
  buildScheduleExportFilename,
  buildSuggestedHemsSchedule,
  collectDeselectedScheduledSlotIds,
  collectScheduledSubmissionIds,
  extractAcceptedSubmissionsForSchedule,
  formatDisplayTrackName,
  syncPlanWithSelectedSubmissions,
} = await import("../../src/frontend/src/utils/conferenceScheduleBuilder.ts");
const { buildConferenceSchedulePdfBytes, buildExtendedProgramPdfBytes } = await import(
  "../../src/frontend/src/utils/scheduleExportPdf.ts"
);
const { buildConferenceScheduleDocxBytes, buildExtendedProgramDocxBytes } = await import(
  "../../src/frontend/src/utils/scheduleExportDocx.ts"
);

function parseZipStoreEntries(zipBytes) {
  const view = new DataView(zipBytes.buffer, zipBytes.byteOffset, zipBytes.byteLength);
  const decoder = new TextDecoder("utf-8");
  const files = new Map();
  let offset = 0;

  while (offset + 4 <= zipBytes.length) {
    const sig = view.getUint32(offset, true);
    if (sig !== 0x04034b50) break;
    const compSize = view.getUint32(offset + 18, true);
    const nameLen = view.getUint16(offset + 26, true);
    const extraLen = view.getUint16(offset + 28, true);
    const name = decoder.decode(zipBytes.subarray(offset + 30, offset + 30 + nameLen));
    const dataStart = offset + 30 + nameLen + extraLen;
    files.set(name, decoder.decode(zipBytes.subarray(dataStart, dataStart + compSize)));
    offset = dataStart + compSize;
  }
  return files;
}

const SAMPLE_WORKSHOP = {
  ...DEFAULT_UPCOMING_WORKSHOP,
  workshop_number: 16,
  workshop_ordinal: "16th",
  workshop_year: "2027",
  venue_confirmed: true,
  venue_city_state: "Virginia Beach, VA",
  hotel_name: "Sheraton Oceanfront Hotel",
  hotel_address: "3501 Atlantic Ave, Virginia Beach, VA 23451",
  conference_start_date: "2027-09-13",
  conference_end_date: "2027-09-16",
  exact_dates: "September 13–16, 2027",
  venue_session_room: "Cape Charles Ballroom",
  venue_foyer_room: "Atlantic Foyer",
};

function makeSubmission(id, overrides = {}) {
  return {
    id,
    workshopYear: 2027,
    title: `In-Situ Analysis of δ¹³C and CO₂ Using <i>m/z</i> Telemetry (${id})`,
    presentingAuthor: "Malte Höhn",
    correspondingEmail: `${id.toLowerCase()}@example.org`,
    affiliation: "MIT Lincoln Laboratory",
    coAuthors: "Frédéric Progent",
    affiliations: [
      { id: "aff-1", institution: "MIT Lincoln Laboratory", location: "Lexington, MA" },
    ],
    authors: [
      { id: "a-1", name: "Malte Höhn", affiliationId: "aff-1", isPresenter: true },
      { id: "a-2", name: "Frédéric Progent", affiliationId: "aff-1", isPresenter: false },
    ],
    presentationFormat: "Oral Presentation",
    presenterCategory: "academic",
    researchTrack: "Miscellaneous",
    summary: `Concise synopsis for ${id}.`,
    abstractText: `Paragraph one for ${id}.\n\n[FIGURE]\n\nParagraph two with $q_z = \\frac{4eV}{m r_0^2 \\Omega^2}$.`,
    keywords: "mass spectrometry; quadrupole; harsh environments",
    presenterBio: `Dr. Höhn leads field mass spectrometry development (${id}).`,
    graphic: {
      fileName: "fig1.png",
      fileSizeBytes: 120000,
      mimeType: "image/png",
      widthPx: 1200,
      heightPx: 800,
      detectedDpi: 300,
      dpiSource: "metadata",
      caption: `Figure 1. Stability diagram for ${id}.`,
    },
    studentTravelAwardApplicant: false,
    submittedByUid: `uid-${id}`,
    submittedByEmail: `${id.toLowerCase()}@example.org`,
    submittedAt: "2027-05-01T10:00:00.000Z",
    updatedAt: "2027-05-01T10:00:00.000Z",
    deadline: "August 2027",
    status: "Reviewed",
    decision: "Pending",
    committeeSelection: "pending",
    selectionVersion: 1,
    ...overrides,
  };
}

test("RESEARCH_TRACK_OPTIONS & keywordExtractor support Miscellaneous and classifySubmissionCohort identifies Corporate & Student abstracts", () => {
  assert.ok(RESEARCH_TRACK_OPTIONS.includes("Miscellaneous"));

  const keywords = extractSuggestedKeywords({
    title: "Field Calibration Unit",
    synopsis: "Compact calibration target.",
    abstractText: "Rapid calibration workflow.",
    researchTrack: "Miscellaneous",
  });
  assert.ok(keywords.length >= 4, "Expected keyword extractor fallback support for Miscellaneous");

  const corpExplicit = classifySubmissionCohort(
    makeSubmission("ABS-CORP", { presenterCategory: "corporate" })
  );
  assert.equal(corpExplicit.category, "corporate");
  assert.equal(corpExplicit.isCorporate, true);
  assert.equal(corpExplicit.isStudent, false);

  const studentExplicit = classifySubmissionCohort(
    makeSubmission("ABS-STU", {
      presenterCategory: "student",
      studentTravelAwardApplicant: true,
    })
  );
  assert.equal(studentExplicit.category, "student");
  assert.equal(studentExplicit.isStudent, true);
  assert.equal(studentExplicit.isStudentAward, true);

  const legacyCorp = classifySubmissionCohort(
    makeSubmission("ABS-LCORP", {
      presenterCategory: undefined,
      affiliations: [{ id: "a1", institution: "Helios Mass Instruments LLC" }],
    })
  );
  assert.equal(legacyCorp.isCorporate, true);

  const legacyStudent = classifySubmissionCohort(
    makeSubmission("ABS-LSTU", {
      presenterCategory: undefined,
      presenterBio: "Elena is a Ph.D. candidate studying miniature ion traps.",
    })
  );
  assert.equal(legacyStudent.isStudent, true);
});

test("Unscored Completed toggles never distort medians while Consensus Recommended Track & HEMS Response Email work cleanly", () => {
  const sub = makeSubmission("ABS-REV", {
    researchTrack: "Planetary & Spaceflight MS",
    committeeSelection: "accept_oral",
  });

  // Reviewer 1 only toggled Completed without numeric scores yet
  const completedOnly = {
    reviewId: "rev_ABS-REV_r1",
    submissionId: "ABS-REV",
    reviewerEmail: "r1@hems-workshop.org",
    score: null,
    hemsFitness: null,
    decision: "Pending",
    recommendedTrack: "Miscellaneous",
    isCompleted: true,
    completedAt: "2027-06-01T12:00:00.000Z",
    reviewerComments: "",
    privateNotes: "",
    createdAt: "2027-06-01T12:00:00.000Z",
    updatedAt: "2027-06-01T12:00:00.000Z",
  };

  const summaryUnscored = summarizeSubmissionReviews(sub, [completedOnly]);
  assert.equal(summaryUnscored.reviewCount, 0);
  assert.equal(summaryUnscored.medianCombined, null);
  assert.equal(summaryUnscored.allReviewerRecords.length, 1);
  assert.equal(
    findReviewerEvaluation([completedOnly], "ABS-REV", "r1@hems-workshop.org")?.isCompleted,
    true
  );
  assert.equal(resolveEffectiveTrack(sub, summaryUnscored), "Miscellaneous");

  // Reviewer 2 submits numeric scores (8.0 and 9.0 -> combined median 8.5)
  const scoredReview = {
    ...completedOnly,
    reviewId: "rev_ABS-REV_r2",
    reviewerEmail: "r2@hems-workshop.org",
    score: 8,
    hemsFitness: 9,
    decision: "Accept (Oral)",
    recommendedTrack: "Miscellaneous",
  };
  const summaryWithScore = summarizeSubmissionReviews(sub, [completedOnly, scoredReview]);
  assert.equal(summaryWithScore.reviewCount, 1);
  assert.equal(summaryWithScore.medianScore, 8);
  assert.equal(summaryWithScore.medianHemsFitness, 9);
  assert.equal(summaryWithScore.medianCombined, 8.5);
  assert.equal(resolveEffectiveTrack(sub, summaryWithScore), "Miscellaneous");

  // HEMS Response Email formatting & content across all 3 selection states
  const recipient = formatHemsRecipientAddress(
    makeSubmission("ABS-EM", {
      correspondingEmail: "malte@whoi.edu",
      secondaryEmail: "lab@whoi.edu",
    })
  );
  assert.equal(recipient, '"Malte Höhn" <malte@whoi.edu>, <lab@whoi.edu>');

  const oralEmail = buildHemsResponseEmail(sub, "accept_oral", SAMPLE_WORKSHOP, "Special Topics");
  assert.ok(oralEmail.body.includes("Oral Presentation"));
  assert.ok(oralEmail.body.includes("δ¹³C"));
  assert.ok(!oralEmail.body.includes("<i>"), "Raw HTML tags should be stripped from email body");

  const posterEmail = buildHemsResponseEmail(sub, "accept_poster", SAMPLE_WORKSHOP);
  assert.ok(posterEmail.body.includes("Poster Presentation"));

  const declineEmail = buildHemsResponseEmail(sub, "decline", SAMPLE_WORKSHOP);
  assert.ok(declineEmail.body.includes("unable to include"));
  assert.ok(declineEmail.body.includes("16th Biennial Workshop"));
});

test("Schedule Builder restricts sorter to official selections, groups & renames Miscellaneous category, and exports Extended Program", () => {
  const acceptedOral = makeSubmission("ABS-ORA-1", {
    presenterCategory: "corporate",
    researchTrack: "Underwater & Marine Biogeochemistry",
    committeeSelection: "accept_oral",
    decision: "Accept (Oral)",
  });
  const acceptedMiscOral = makeSubmission("ABS-MISC-1", {
    researchTrack: "Miscellaneous",
    committeeSelection: "accept_oral",
    decision: "Accept (Oral)",
  });
  const acceptedPoster = makeSubmission("ABS-POS-1", {
    presentationFormat: "Poster Presentation",
    researchTrack: "Planetary & Spaceflight MS",
    committeeSelection: "accept_poster",
    decision: "Accept (Poster)",
  });
  const declinedSub = makeSubmission("ABS-DEC-1", {
    title: "DECLINED SECRET SUBMISSION SHOULD NEVER APPEAR",
    committeeSelection: "decline",
    decision: "Accept (Oral)",
  });

  const subs = [acceptedOral, acceptedMiscOral, acceptedPoster, declinedSub];
  const { oralCandidates, posterCandidates } = extractAcceptedSubmissionsForSchedule(subs, []);

  assert.deepEqual(
    oralCandidates.map((c) => c.submission.id),
    ["ABS-ORA-1", "ABS-MISC-1"]
  );
  assert.deepEqual(
    posterCandidates.map((c) => c.submission.id),
    ["ABS-POS-1"]
  );

  // Build suggested schedule with customized Miscellaneous category name
  const customMiscTitle = "Emerging Frontiers & Special Topics";
  let plan = buildSuggestedHemsSchedule(SAMPLE_WORKSHOP, oralCandidates, posterCandidates, {
    defaultTalkDurationMinutes: 30,
    miscellaneousCategoryTitle: customMiscTitle,
  });

  assert.equal(formatDisplayTrackName("Miscellaneous", plan), customMiscTitle);
  const allSessions = plan.days.flatMap((d) => d.blocks.filter((b) => b.kind === "session"));
  const miscSession = allSessions.find((s) => s.themeSubtitle === customMiscTitle);
  assert.ok(miscSession, "Expected dedicated session bearing custom Miscellaneous title");
  assert.ok(
    miscSession.talks.some((t) => t.submissionId === "ABS-MISC-1"),
    "Expected Misc talk inside dedicated Miscellaneous session"
  );

  // Verify assignMiscellaneousCandidatesToDedicatedSession works interactively too
  const rebuiltMiscPlan = assignMiscellaneousCandidatesToDedicatedSession(
    plan,
    oralCandidates.filter((c) => c.effectiveTrack === "Miscellaneous")
  );
  assert.ok(
    collectScheduledSubmissionIds(rebuiltMiscPlan).has("ABS-MISC-1"),
    "Expected Misc talk preserved in dedicated session"
  );

  // If ABS-MISC-1 is later deselected to decline, flag and prune cleanly
  const modifiedSubs = subs.map((s) =>
    s.id === "ABS-MISC-1" ? { ...s, committeeSelection: "decline" } : s
  );
  const deselectedSlots = collectDeselectedScheduledSlotIds(plan, modifiedSubs);
  assert.equal(deselectedSlots.size, 1);
  const prunedPlan = syncPlanWithSelectedSubmissions(plan, modifiedSubs, [], {
    pruneDeselectedTalks: true,
  });
  assert.equal(collectScheduledSubmissionIds(prunedPlan).has("ABS-MISC-1"), false);

  // Export filenames distinguish schedule vs extended program
  assert.equal(
    buildScheduleExportFilename(plan, "pdf", "schedule"),
    "16th_HEMS_Workshop_2027_Program_Schedule.pdf"
  );
  assert.equal(
    buildScheduleExportFilename(plan, "docx", "extended"),
    "16th_HEMS_Workshop_2027_Extended_Program.docx"
  );

  // Verify Standard Program vs Extended Program exports (PDF & DOCX)
  const stdPdf = buildConferenceSchedulePdfBytes(plan, SAMPLE_WORKSHOP);
  const extPdf = buildExtendedProgramPdfBytes(plan, SAMPLE_WORKSHOP, subs, []);
  assert.match(new TextDecoder("ascii").decode(extPdf.subarray(0, 8)), /^%PDF-1\./);
  assert.ok(extPdf.length > stdPdf.length);

  const stdDocx = buildConferenceScheduleDocxBytes(plan, SAMPLE_WORKSHOP);
  const extDocx = buildExtendedProgramDocxBytes(plan, SAMPLE_WORKSHOP, subs, []);
  const stdXml = parseZipStoreEntries(stdDocx).get("word/document.xml");
  const extXml = parseZipStoreEntries(extDocx).get("word/document.xml");

  assert.ok(stdXml && extXml);
  const customMiscXml = "Emerging Frontiers &amp; Special Topics";
  assert.ok(stdXml.includes(customMiscXml));
  assert.ok(!stdXml.includes("DECLINED SECRET SUBMISSION SHOULD NEVER APPEAR"));
  assert.ok(extXml.startsWith(stdXml.slice(0, 400)), "Extended Program must open identically with top schedule");
  assert.ok(extXml.includes("Accepted Poster Presentations (1)"));
  assert.ok(extXml.includes(customMiscXml));

  // Exact count of accepted oral + accepted poster abstracts = 3 => 3 page breaks
  const pageBreaks = (extXml.match(/<w:br w:type="page"\/>/g) || []).length;
  assert.equal(pageBreaks, 3, "Expected 3 page breaks for 2 oral + 1 poster selected abstracts");

  // Full abstract fields included cleanly, [FIGURE] token & declined abstract excluded
  assert.ok(extXml.includes("Paragraph one for ABS-ORA-1."));
  assert.ok(extXml.includes("Paragraph one for ABS-POS-1."));
  assert.ok(extXml.includes("Figure 1. Stability diagram for ABS-ORA-1."));
  assert.ok(extXml.includes("MIT Lincoln Laboratory"));
  assert.ok(extXml.includes("Dr. Höhn leads field mass spectrometry development"));
  assert.ok(!extXml.includes("[FIGURE]"), "Inline [FIGURE] placeholder should be stripped in Extended Program");
  assert.ok(
    !extXml.includes("DECLINED SECRET SUBMISSION SHOULD NEVER APPEAR"),
    "Declined abstract must never appear in Extended Program"
  );
});
