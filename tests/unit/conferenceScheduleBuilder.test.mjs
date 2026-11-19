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

const { DEFAULT_UPCOMING_WORKSHOP } = await import(
  "../../src/frontend/src/utils/upcomingWorkshop.ts"
);
const {
  assignCandidateToSession,
  buildSuggestedHemsSchedule,
  buildTalkSlotFromCandidate,
  collectScheduledSubmissionIds,
  detectScheduleTimeConflicts,
  extractAcceptedSubmissionsForSchedule,
  moveTalkBetweenSessions,
  recalculateSessionTalkTimes,
  removeTalkFromSession,
  syncScheduleLocationsFromWorkshopSettings,
  updateTalkTiming,
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
    const method = view.getUint16(offset + 8, true);
    const compSize = view.getUint32(offset + 18, true);
    const uncompSize = view.getUint32(offset + 22, true);
    const nameLen = view.getUint16(offset + 26, true);
    const extraLen = view.getUint16(offset + 28, true);
    assert.equal(method, 0, "Expected STORE zip compression method");
    assert.equal(compSize, uncompSize);
    const name = decoder.decode(zipBytes.subarray(offset + 30, offset + 30 + nameLen));
    const dataStart = offset + 30 + nameLen + extraLen;
    const payload = zipBytes.subarray(dataStart, dataStart + compSize);
    files.set(name, decoder.decode(payload));
    offset = dataStart + compSize;
  }

  // Verify EOCD record signature exists at end
  const eocdSig = view.getUint32(zipBytes.length - 22, true);
  assert.equal(eocdSig, 0x06054b50, "Expected valid ZIP EOCD signature");
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
  welcome_reception_time: "5:30 p.m. – 7:30 p.m.",
  welcome_reception_venue: "Oceanfront Deck Lounge",
  dinner_day_time: "Wednesday • 6:30 p.m. – 9:30 p.m.",
  dinner_venue_name: "Virginia Aquarium Banquet Hall",
  dinner_venue_address: "717 General Booth Blvd, Virginia Beach, VA",
  dinner_plan_notes: "Bus departs hotel lobby at 6:15 p.m.",
};

function makeSubmission(id, overrides = {}) {
  return {
    id,
    workshopYear: 2027,
    title: `High-Resolution Analysis of δ¹³C and CO₂ ${id}`,
    presentingAuthor: "Malte Höhn",
    correspondingEmail: `${id.toLowerCase()}@example.org`,
    affiliation: "Woods Hole Oceanographic Institution",
    coAuthors: "Frédéric Progent",
    affiliations: [
      { id: "aff-1", institution: "Woods Hole Oceanographic Institution", location: "Woods Hole, MA" },
    ],
    authors: [
      { id: "a-1", name: "Malte Höhn", affiliationId: "aff-1", isPresenter: true },
      { id: "a-2", name: "Frédéric Progent", affiliationId: "aff-1", isPresenter: false },
    ],
    presentationFormat: "Oral Presentation",
    researchTrack: "Underwater & Marine Biogeochemistry",
    summary: "Summary",
    abstractText: "Abstract body",
    studentTravelAwardApplicant: false,
    submittedByUid: `uid-${id}`,
    submittedByEmail: `${id.toLowerCase()}@example.org`,
    submittedAt: "2027-05-01T10:00:00.000Z",
    updatedAt: "2027-05-01T10:00:00.000Z",
    deadline: "August 2027",
    status: "Reviewed",
    decision: "Accept (Oral)",
    score: 8.8,
    hemsFitness: 9.2,
    ...overrides,
  };
}

test("extractAcceptedSubmissionsForSchedule strictly includes officially selected Oral and Poster candidates", () => {
  const subs = [
    makeSubmission("ABS-1", {
      committeeSelection: "accept_oral",
      decision: "Accept (Oral)",
      presentationFormat: "Oral Presentation",
    }),
    makeSubmission("ABS-2", {
      committeeSelection: "pending",
      decision: "Pending",
      status: "Pending",
      presentationFormat: "Oral Presentation",
      score: undefined,
      hemsFitness: undefined,
    }),
    makeSubmission("ABS-3", {
      committeeSelection: "accept_poster",
      decision: "Accept (Poster)",
      presentationFormat: "Poster Presentation",
    }),
    makeSubmission("ABS-4", {
      committeeSelection: "decline",
      decision: "Accept (Oral)",
    }),
    makeSubmission("ABS-LEGACY", {
      decision: "Accept (Oral)",
      presentationFormat: "Oral Presentation",
    }),
  ];

  const reviews = [
    {
      reviewId: "rev_ABS-4_r1",
      submissionId: "ABS-4",
      reviewerEmail: "r1@example.org",
      score: 9.5,
      hemsFitness: 9.5,
      decision: "Accept (Oral)",
      isCompleted: true,
      reviewerComments: "Strong paper, but declined by chair",
      privateNotes: "",
      createdAt: "2027-05-02T00:00:00.000Z",
      updatedAt: "2027-05-02T00:00:00.000Z",
    },
  ];

  const strict = extractAcceptedSubmissionsForSchedule(subs, reviews);
  assert.deepEqual(
    strict.oralCandidates.map((c) => c.submission.id),
    ["ABS-1", "ABS-LEGACY"]
  );
  assert.deepEqual(
    strict.posterCandidates.map((c) => c.submission.id),
    ["ABS-3"]
  );
});

test("buildSuggestedHemsSchedule hydrates Workshop Settings venue/dinner plans & places all accepted talks without overlaps", () => {
  const subs = Array.from({ length: 30 }, (_, idx) =>
    makeSubmission(`ABS-${String(idx + 1).padStart(3, "0")}`, {
      researchTrack:
        idx % 2 === 0
          ? "Underwater & Marine Biogeochemistry"
          : "Planetary & Spaceflight MS",
      studentTravelAwardApplicant: idx === 0,
    })
  );
  subs.push(
    makeSubmission("ABS-POSTER-1", {
      decision: "Accept (Poster)",
      presentationFormat: "Poster Presentation",
      title: "Dual Reflectron Optics at <i>m/z</i> 18–500 and $q_z = \\frac{4eV}{m r_0^2 \\Omega^2}$",
    })
  );

  const { oralCandidates, posterCandidates } = extractAcceptedSubmissionsForSchedule(subs, []);
  const plan = buildSuggestedHemsSchedule(SAMPLE_WORKSHOP, oralCandidates, posterCandidates, {
    defaultTalkDurationMinutes: 30,
    updatedBy: "chair@hems-workshop.org",
  });

  assert.equal(plan.days.length, 4);
  assert.equal(plan.days[0].dateIso, "2027-09-13");
  assert.equal(plan.days[2].dateIso, "2027-09-15");

  // Verify Day 1 Reception hydrated from Workshop Settings
  const reception = plan.days[0].blocks[0];
  assert.equal(reception.kind, "event");
  assert.equal(reception.startTime, "17:30");
  assert.equal(reception.endTime, "19:30");
  assert.equal(reception.location, "Oceanfront Deck Lounge");

  // Verify Day 3 Dinner hydrated from Workshop Settings
  const day3Dinner = plan.days[2].blocks.find(
    (b) => b.kind === "event" && b.eventCategory === "dinner"
  );
  assert.ok(day3Dinner);
  assert.equal(day3Dinner.title, "Official Workshop Dinner");
  assert.equal(day3Dinner.startTime, "18:30");
  assert.ok(day3Dinner.location.includes("Virginia Aquarium Banquet Hall"));

  // Verify ALL 30 oral talks placed (including overflow past nominal 26)
  const scheduledIds = collectScheduledSubmissionIds(plan);
  assert.equal(scheduledIds.size, 30);
  assert.equal(plan.posters.length, 1);

  // Also test Tuesday dinner placement (like 2022.json) and TBA dates fallback
  const tuesdayWorkshop = {
    ...DEFAULT_UPCOMING_WORKSHOP,
    dinner_day_time: "Tuesday • 6:00 p.m. – 9:00 p.m.",
  };
  const tuesPlan = buildSuggestedHemsSchedule(tuesdayWorkshop, oralCandidates.slice(0, 3), []);
  assert.equal(tuesPlan.days[1].dateIso, "");
  const tuesDinner = tuesPlan.days[1].blocks.find(
    (b) => b.kind === "event" && b.eventCategory === "dinner"
  );
  assert.equal(tuesDinner?.title, "Official Workshop Dinner");
});

test("interactive talk move, manual time lock, conflict detection, and syncLocationsFromWorkshopSettings work accurately", () => {
  const subs = [
    makeSubmission("ABS-1", { title: "First Talk" }),
    makeSubmission("ABS-2", { title: "Second Talk" }),
    makeSubmission("ABS-3", { title: "Third Talk" }),
  ];
  const { oralCandidates } = extractAcceptedSubmissionsForSchedule(subs, []);
  let plan = buildSuggestedHemsSchedule(SAMPLE_WORKSHOP, oralCandidates, []);

  const session1 = plan.days[1].blocks.find((b) => b.id === "session-1");
  const session4 = plan.days[2].blocks.find((b) => b.id === "session-4");
  assert.ok(session1 && session4);
  assert.equal(session1.talks.length, 3);
  assert.equal(session1.talks[0].startTime, "10:00");
  assert.equal(session1.talks[1].startTime, "10:30");
  assert.equal(session1.talks[2].startTime, "11:00");

  // Move ABS-2 into Session IV (Day 3)
  const movingSlot = session1.talks[1];
  plan = moveTalkBetweenSessions(plan, movingSlot.slotId, session4.id, 0);
  const s1After = plan.days[1].blocks.find((b) => b.id === "session-1");
  const s4After = plan.days[2].blocks.find((b) => b.id === "session-4");
  assert.equal(s1After.talks.length, 2);
  assert.equal(s1After.talks[1].startTime, "10:30"); // Reflowed cleanly!
  assert.equal(s4After.talks.length, 1);
  assert.equal(s4After.talks[0].startTime, "08:30");

  // Manually introduce a time overlap inside Session I & verify conflict detector catches it
  plan = updateTalkTiming(plan, s1After.id, s1After.talks[0].slotId, {
    startTime: "10:20",
    durationMinutes: 40,
    rippleSubsequent: false,
  });
  const conflicts = detectScheduleTimeConflicts(plan.days[1]);
  assert.ok(
    conflicts.some((c) => c.severity === "error" && c.message.includes("Overlap")),
    "Expected conflict detector to flag overlapping talks"
  );

  // Force recalculateSessionTalkTimes & confirm conflict clears
  plan = {
    ...plan,
    days: plan.days.map((d) => ({
      ...d,
      blocks: d.blocks.map((b) =>
        b.kind === "session" ? recalculateSessionTalkTimes(b, true) : b
      ),
    })),
  };
  assert.equal(detectScheduleTimeConflicts(plan.days[1]).length, 0);

  // Unassign and reassign cleanly
  plan = removeTalkFromSession(plan, s4After.talks[0].slotId);
  assert.equal(collectScheduledSubmissionIds(plan).size, 2);
  const extraSlot = buildTalkSlotFromCandidate(oralCandidates[1], 25);
  plan = assignCandidateToSession(plan, extraSlot, "session-4");
  assert.equal(collectScheduledSubmissionIds(plan).size, 3);

  // Sync updated Workshop Settings room & dinner venue without losing talks
  const updatedWs = {
    ...SAMPLE_WORKSHOP,
    venue_session_room: "Grand Atlantic Hall",
    dinner_venue_name: "Harborfront Pavilion",
  };
  const synced = syncScheduleLocationsFromWorkshopSettings(plan, updatedWs);
  assert.equal(
    synced.days[1].blocks.find((b) => b.id === "session-1")?.location,
    "Grand Atlantic Hall"
  );
  assert.ok(
    synced.days[2].blocks
      .find((b) => b.id === "ev-day3-dinner")
      ?.location.includes("Harborfront Pavilion")
  );
  assert.equal(collectScheduledSubmissionIds(synced).size, 3);
});

test("buildConferenceSchedulePdfBytes and buildConferenceScheduleDocxBytes emit valid PDF and genuine OOXML DOCX", () => {
  const subs = [
    makeSubmission("ABS-1", {
      title: "In-situ δ¹³C and δ¹⁸O of CO₂ using $q_z = \\frac{4eV}{m r_0^2 \\Omega^2}$ at 10<sup>-6</sup> Torr",
      studentTravelAwardApplicant: true,
    }),
    makeSubmission("ABS-P1", {
      decision: "Accept (Poster)",
      presentationFormat: "Poster Presentation",
      title: "High-Pressure <i>m/z</i> Analyzer by Malte Höhn",
    }),
  ];
  const { oralCandidates, posterCandidates } = extractAcceptedSubmissionsForSchedule(subs, []);
  const plan = buildSuggestedHemsSchedule(SAMPLE_WORKSHOP, oralCandidates, posterCandidates);

  // 1. PDF binary verification
  const pdfBytes = buildConferenceSchedulePdfBytes(plan, SAMPLE_WORKSHOP);
  const pdfHead = new TextDecoder("ascii").decode(pdfBytes.subarray(0, 8));
  assert.match(pdfHead, /^%PDF-1\./);
  assert.ok(pdfBytes.length > 2500, `PDF unexpectedly small: ${pdfBytes.length} bytes`);

  // 2. Genuine OpenXML .docx binary & XML verification
  const docxBytes = buildConferenceScheduleDocxBytes(plan, SAMPLE_WORKSHOP);
  const zipEntries = parseZipStoreEntries(docxBytes);

  for (const requiredPart of [
    "[Content_Types].xml",
    "_rels/.rels",
    "word/_rels/document.xml.rels",
    "word/styles.xml",
    "word/document.xml",
  ]) {
    assert.ok(zipEntries.has(requiredPart), `Missing OOXML ZIP part: ${requiredPart}`);
  }

  const docXml = zipEntries.get("word/document.xml");
  assert.ok(docXml.includes("16th HEMS Workshop (2027)"));
  assert.ok(docXml.includes("Cape Charles Ballroom"));
  assert.ok(docXml.includes("Virginia Aquarium Banquet Hall"));
  assert.ok(docXml.includes("Malte Höhn"));
  assert.ok(docXml.includes("Frédéric Progent"));
  assert.ok(docXml.includes('<w:vertAlign w:val="superscript"/>'), "Expected native Word superscript run");
  assert.ok(docXml.includes('<w:vertAlign w:val="subscript"/>'), "Expected native Word subscript run");
  assert.ok(docXml.includes("<w:i/>"), "Expected native Word italic run for m/z");
  assert.ok(docXml.includes("Accepted Poster Presentations (1)"));

  // 3. Extended Program PDF & DOCX include top schedule + page-break-separated full abstracts
  const extPdfBytes = buildExtendedProgramPdfBytes(plan, SAMPLE_WORKSHOP, subs, []);
  const extPdfHead = new TextDecoder("ascii").decode(extPdfBytes.subarray(0, 8));
  assert.match(extPdfHead, /^%PDF-1\./);
  assert.ok(extPdfBytes.length > pdfBytes.length, "Extended PDF should exceed schedule-only PDF bytes");

  const extDocxBytes = buildExtendedProgramDocxBytes(plan, SAMPLE_WORKSHOP, subs, []);
  const extZip = parseZipStoreEntries(extDocxBytes);
  const extDocXml = extZip.get("word/document.xml");
  assert.ok(extDocXml);
  assert.ok(extDocXml.includes("16th HEMS Workshop (2027)"));
  assert.ok(extDocXml.includes("Accepted Poster Presentations (1)"));
  const breakCount = (extDocXml.match(/<w:br w:type="page"\/>/g) || []).length;
  assert.equal(breakCount, 2, "Expected 2 page breaks for 1 oral + 1 poster abstract");
  assert.ok(extDocXml.includes("Abstract body"));
});
