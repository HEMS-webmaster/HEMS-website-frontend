import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { execFileSync } from "node:child_process";
import os from "node:os";

import {
  buildSafePresenterLastNameSlug,
  buildSafeProceedingSlugWords,
  decodeTextBufferSmart,
  fixMojibakeAndNormalize,
  foldLatinDiacriticsToAscii,
  foldSuperSubscriptsToAscii,
  hasRichScientificMarkup,
  normalizeForArchiveSearch,
  sanitizeDeepUnicode,
  toBibTeXScientificText,
  toPlainScientificText,
} from "../../src/frontend/src/utils/unicodeText.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

const MOJIBAKE_RE =
  /(?:\u00C3[\u0080-\u00BF\u0152-\u017E\u2018-\u2026\u20AC]|\u00C2[\u0080-\u00BF]|\u00CE[\u0091-\u00BF]|\u00E2\u20AC[\u0098-\u00BF\u2013-\u203A\u2122]|\uFFFD|[\uF0B7\uF0A7\uF076\uF0D8\uF0A8])/;

test("fixMojibakeAndNormalize repairs single- and double-encoded UTF-8/CP1252 sequences cleanly", () => {
  const cases = [
    ["Î´C and Î´O", "δC and δO"],
    ["Ryan BlasÃ©", "Ryan Blasé"],
    ["Brauhaus FRÃœH am Dom", "Brauhaus FRÜH am Dom"],
    ["Malte HÃ¶hn", "Malte Höhn"],
    ["Malte HÃƒÂ¶hn", "Malte Höhn"],
    ["FrÃ©dÃ©ric Progent", "Frédéric Progent"],
    ["FrÃƒÂ©dÃƒÂ©ric Progent", "Frédéric Progent"],
    ["JÃƒÂ©rÃƒÂ´me Tupinier", "Jérôme Tupinier"],
    ["SÃƒÂ©bastien Vigne", "Sébastien Vigne"],
    ["Yessica BrachthÃƒÂ¤user", "Yessica Brachthäuser"],
    ["RÃƒÂ¼diger Reuter", "Rüdiger Reuter"],
    ["Marie-JosÃ©e Binette", "Marie-Josée Binette"],
    ["FranÃƒÂ§ois Raulin", "François Raulin"],
    ["Sandra SiljestrÃƒÂ¶m", "Sandra Siljeström"],
    ["Ä°stanbul Technical University", "İstanbul Technical University"],
    ["50 Â°C Â± 0.5 Âµm â€“ Test", "50 °C ± 0.5 µm – Test"],
  ];

  for (const [corrupt, expected] of cases) {
    assert.equal(fixMojibakeAndNormalize(corrupt), expected);
  }
});

test("fixMojibakeAndNormalize preserves clean scientific, Greek, Korean, and diacritic text + NFC composition", () => {
  const cleanSamples = [
    "In-situ Measurements of δ¹³C and δ¹⁸O of Dissolved CO₂ using an Underwater Mass Spectrometer",
    "Characterization of a Mini Membrane Inlet Mass Spectrometer Operating at High Pressure (~ 1×10⁻³ torr)",
    "δ¹³C, δ¹⁸O, α, β, γ, μ, Ω, Δ, ≈, ≤, ≥, ±0.5‰, 10 Å², É®",
    "Régulo Miguel Ramírez Wong",
    "Jörg Müller",
    "Université Paris-Est Créteil (LISA)",
    "삼양화학 분석기기연구소",
  ];

  for (const sample of cleanSamples) {
    assert.equal(fixMojibakeAndNormalize(sample), sample.normalize("NFC"));
  }

  // NFD decomposed accents normalize to NFC precomposed form
  const nfd = "Fre\u0301de\u0301ric Ho\u0308hn".normalize("NFD");
  assert.equal(fixMojibakeAndNormalize(nfd), "Frédéric Höhn");
});

test("decodeTextBufferSmart handles UTF-8 BOM, UTF-8, and raw Windows-1252 Excel CSV bytes", () => {
  const sample = "First Name,Last Name,Note\nFrançois,Höhn,δ¹³C";
  const utf8WithBom = new Uint8Array([0xef, 0xbb, 0xbf, ...new TextEncoder().encode(sample)]);
  assert.equal(decodeTextBufferSmart(utf8WithBom), sample);

  // Raw Windows-1252 bytes for: François,Höhn,Brachthäuser,Siljeström
  // ç=0xE7, ö=0xF6, ä=0xE4
  const cp1252Bytes = Uint8Array.from([
    0x46, 0x72, 0x61, 0x6e, 0xe7, 0x6f, 0x69, 0x73, 0x2c, // François,
    0x48, 0xf6, 0x68, 0x6e, 0x2c, // Höhn,
    0x42, 0x72, 0x61, 0x63, 0x68, 0x74, 0x68, 0xe4, 0x75, 0x73, 0x65, 0x72, 0x2c, // Brachthäuser,
    0x53, 0x69, 0x6c, 0x6a, 0x65, 0x73, 0x74, 0x72, 0xf6, 0x6d, // Siljeström
  ]);
  assert.equal(
    decodeTextBufferSmart(cp1252Bytes),
    "François,Höhn,Brachthäuser,Siljeström"
  );
});

test("foldSuperSubscriptsToAscii folds isotope super/subscripts cleanly for search", () => {
  assert.equal(
    foldSuperSubscriptsToAscii("δ¹³C and δ¹⁸O of CO₂ at 1×10⁻³ torr"),
    "δ13C and δ18O of CO2 at 1×10-3 torr"
  );
  const nested = sanitizeDeepUnicode({ arr: ["Malte HÃƒÂ¶hn", "Î´C"] });
  assert.deepEqual(nested, { arr: ["Malte Höhn", "δC"] });
});

test("All historical archive JSONs, master catalog, public indexes, and SEO registry have zero mojibake", () => {
  const archiveFiles = fs
    .readdirSync(path.join(repoRoot, "src/frontend/src/data/archives"))
    .filter((f) => f.endsWith(".json") && f !== "template.json")
    .map((f) => `src/frontend/src/data/archives/${f}`);

  const targets = [
    "src/frontend/src/data/master_workshops.json",
    "src/frontend/src/data/corporate_registry.json",
    ...archiveFiles,
    "src/frontend/public/archives-index.json",
    "src/frontend/public/mock-pdf-chunks.json",
    "src/frontend/public/llms-full.txt",
    "docs/registries/pdf_seo_registry.md",
  ];

  for (const rel of targets) {
    const content = fs.readFileSync(path.join(repoRoot, rel), "utf8");
    const match = MOJIBAKE_RE.exec(content);
    assert.equal(
      match,
      null,
      `Found mojibake/corrupt glyph in ${rel}: ${match ? JSON.stringify(match[0]) : ""}`
    );
  }
});

test("Wieman 2019 isotope title and 2005 membrane title are properly restored across master and archive catalogs", () => {
  const expectedWiemanTitle =
    "In-situ Measurements of δ¹³C and δ¹⁸O of Dissolved CO₂ using an Underwater Mass Spectrometer";
  const expected2005Title =
    "Characterization of a Mini Membrane Inlet Mass Spectrometer Operating at High Pressure (~ 1×10⁻³ torr) Using Different Types of Microporous Membranes";

  const master = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "src/frontend/src/data/master_workshops.json"), "utf8")
  );
  const ws2019 = master.find((w) => String(w.year) === "2019");
  const ws2005 = master.find((w) => String(w.year) === "2005");
  assert.ok(
    ws2019.posters.some((p) => p.title === expectedWiemanTitle),
    "master_workshops.json 2019 poster missing restored Wieman δ¹³C/δ¹⁸O/CO₂ title"
  );
  assert.ok(
    ws2005.posters.some((p) => p.title === expected2005Title),
    "master_workshops.json 2005 poster missing restored ~ 1×10⁻³ torr title"
  );

  const arch2019Src = fs.readFileSync(
    path.join(repoRoot, "src/frontend/src/data/archives/2019.json"),
    "utf8"
  );
  const arch2005Src = fs.readFileSync(
    path.join(repoRoot, "src/frontend/src/data/archives/2005.json"),
    "utf8"
  );
  assert.ok(arch2019Src.includes(expectedWiemanTitle), "archives/2019.json missing restored Wieman title");
  assert.ok(arch2005Src.includes(expected2005Title), "archives/2005.json missing restored 2005 title");
});

test("Workshop Manager and frontend user-input pipelines enforce UTF-8 charset and Unicode normalization", () => {
  const saveRouteSrc = fs.readFileSync(
    path.join(repoRoot, "tools/manager/src/app/api/manager/save/route.ts"),
    "utf8"
  );
  assert.ok(
    saveRouteSrc.includes("sanitizeDeepUnicode") &&
      saveRouteSrc.includes("existingHostCorp") &&
      saveRouteSrc.includes("consumeExistingTalkId"),
    "tools/manager save/route.ts must sanitize Unicode and preserve host_corporation metadata and talk IDs"
  );

  for (const rel of [
    "tools/manager/src/app/api/manager/preview/route.ts",
    "tools/manager/src/app/api/manager/serve/route.ts",
  ]) {
    const src = fs.readFileSync(path.join(repoRoot, rel), "utf8");
    assert.ok(
      src.includes("text/plain; charset=utf-8"),
      `${rel} must declare explicit text/plain; charset=utf-8`
    );
  }

  for (const rel of [
    "src/frontend/src/app/(portal)/admin/page.tsx",
    "src/frontend/src/app/(portal)/operations/mailing-list/page.tsx",
    "src/frontend/src/hooks/useWorkshopConfigAdmin.ts",
    "src/frontend/src/components/workshop/AbstractSubmissionClient.tsx",
  ]) {
    const src = fs.readFileSync(path.join(repoRoot, rel), "utf8");
    assert.ok(
      src.includes("readUploadedTextFileSmart"),
      `${rel} must read uploaded text/CSV files via readUploadedTextFileSmart`
    );
  }
});

test("toPlainScientificText & toBibTeXScientificText cleanly format Word equations, sub/superscripts & currency prose", () => {
  assert.equal(
    toPlainScientificText(
      "Quadrupole $q_z = \\frac{4eV}{m r_0^2 \\Omega^2}$ at 1.4 \\times 10<sup>-6</sup> Torr for \\mathrm{CO_2} & <i>m/z</i> [M+H]<sup>+</sup> [FIGURE]"
    ),
    "Quadrupole q_z = 4eV/(m r₀² Ω²) at 1.4 × 10⁻⁶ Torr for CO₂ & m/z [M+H]⁺"
  );
  assert.equal(
    toPlainScientificText("δ<sup>13</sup>C and $\\sqrt{E/q}$ with $500 and $250 grants"),
    "δ¹³C and √(E/q) with $500 and $250 grants"
  );
  assert.equal(
    toBibTeXScientificText("<i>m/z</i> Profiling of CO<sub>2</sub> & δ<sup>13</sup>C with $q_z$"),
    "\\textit{m/z} Profiling of CO$_{2}$ & δ$^{13}$C with $q_z$"
  );
  assert.equal(hasRichScientificMarkup("Plain ASCII Title"), false);
  assert.equal(hasRichScientificMarkup("<i>In-situ</i> $q_z$ CO<sub>2</sub>"), true);
  assert.equal(hasRichScientificMarkup("$500 and $250"), false);
});

test("buildSafePresenterLastNameSlug, buildSafeProceedingSlugWords & normalizeForArchiveSearch handle accents and markup safely", () => {
  assert.equal(buildSafePresenterLastNameSlug("Malte Höhn"), "Hohn");
  assert.equal(buildSafePresenterLastNameSlug("Ryan Blasé"), "Blase");
  assert.equal(buildSafePresenterLastNameSlug("Scott T. Wieman"), "Wieman");
  assert.equal(foldLatinDiacriticsToAscii("Søren Åström — Straßen"), "Soren Astrom — Strassen");

  // Backward compatibility + HTML/TeX cleanup
  assert.equal(
    buildSafeProceedingSlugWords(
      "In-situ Measurements of δ¹³C and δ¹⁸O of Dissolved CO₂ using an Underwater Mass Spectrometer"
    ),
    "Insitu_Measurements_of"
  );
  assert.equal(
    buildSafeProceedingSlugWords(
      "<i>In-situ</i> Measurements of δ<sup>13</sup>C & CO<sub>2</sub>"
    ),
    "Insitu_Measurements_of"
  );
  assert.equal(
    buildSafeProceedingSlugWords("Characterization of $\\frac{E}{q}$ Analyzers"),
    "Characterization_of_E"
  );

  assert.equal(normalizeForArchiveSearch("Malte Höhn"), "malte hohn");
  assert.equal(
    normalizeForArchiveSearch("CO<sub>2</sub> δ<sup>13</sup>C <i>m/z</i>"),
    "co2 δ13c m/z"
  );
});

test("Public Archive pages, Search Hub, Citations, JSON-LD & Workshop Manager wire ScientificText & Word paste", () => {
  for (const rel of [
    "src/frontend/src/app/archive/[year]/page.tsx",
    "src/frontend/src/components/FrontendPreviewHover.tsx",
    "src/frontend/src/components/CitationModal.tsx",
    "src/frontend/src/components/archive/ArchiveHubClient.tsx",
    "tools/manager/src/components/PreviewHover.tsx",
  ]) {
    const src = fs.readFileSync(path.join(repoRoot, rel), "utf8");
    assert.ok(src.includes("<ScientificText"), `${rel} must render titles/text with <ScientificText />`);
  }

  for (const rel of [
    "tools/manager/src/components/PresentationsManager.tsx",
    "tools/manager/src/components/PostersManager.tsx",
    "tools/manager/src/components/StudentsManager.tsx",
    "tools/manager/src/components/EventsManager.tsx",
  ]) {
    const src = fs.readFileSync(path.join(repoRoot, rel), "utf8");
    assert.ok(
      src.includes("applyWordPasteToField"),
      `${rel} must wire applyWordPasteToField for Word-pasted equations and symbols`
    );
  }

  const jsonLdSrc = fs.readFileSync(
    path.join(repoRoot, "src/frontend/src/utils/generateArchiveJsonLd.ts"),
    "utf8"
  );
  assert.ok(
    jsonLdSrc.includes("toPlainScientificText"),
    "generateArchiveJsonLd.ts must clean rich markup via toPlainScientificText"
  );
});

test("tools/manager/scripts/preview_generator.py extracts UTF-8 NFC abstract previews cleanly", (t) => {
  const samplePdf = path.join(
    repoRoot,
    "local_data/proceedings/13th/Posters/13th_Wieman_Insitu_Measurements_of_Abstract.pdf"
  );
  const scriptPath = path.join(repoRoot, "tools/manager/scripts/preview_generator.py");
  assert.ok(fs.existsSync(scriptPath), "preview_generator.py must exist under tools/manager/scripts/");
  if (!fs.existsSync(samplePdf)) {
    t.skip("Sample PDF not present in this checkout");
    return;
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "hems-preview-test-"));
  try {
    const copiedPdf = path.join(tmpDir, "13th_Wieman_Insitu_Measurements_of_Abstract.pdf");
    fs.copyFileSync(samplePdf, copiedPdf);
    execFileSync("python", [scriptPath, copiedPdf], { stdio: "pipe" });
    const outTxt = path.join(tmpDir, "13th_Wieman_Insitu_Measurements_of_Abstract_preview.txt");
    assert.ok(fs.existsSync(outTxt), "Expected _preview.txt to be generated next to PDF");
    const content = fs.readFileSync(outTxt, "utf8");
    assert.ok(content.includes("δ"), "Extracted preview text must preserve Greek delta δ in UTF-8");
    assert.equal(MOJIBAKE_RE.test(content), false, "Extracted preview text must contain zero mojibake");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
