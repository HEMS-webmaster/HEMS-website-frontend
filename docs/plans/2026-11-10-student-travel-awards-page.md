# Architectural Plan: Standalone Student Travel Awards Page & Navbar Integration (`/student-awards`)

**Date:** 2026-11-10  
**Owner:** @arch  
**Execution Team:** @dev, @brand, @qa, @ops  
**Reference Source:** Legacy `https://www.hems-workshop.org/15thWS/15thstudenttravel.html`

---

## 1. Objective & Scope Constraints

1. **Move Out of Workshop Portal:** Relocate `/student-awards` out of the Attendee/Workshop Portal route group (`src/frontend/src/app/(portal)/student-awards/page.tsx`) into a top-level standalone public route ([`src/frontend/src/app/student-awards/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/student-awards/page.tsx)) and remove `Student Awards` from the Workshop Portal sidebar in [`(portal)/layout.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/layout.tsx).
2. **Navbar Link:** Add a direct **Student Travel Awards** link (`/student-awards`) to the main navigation bar ([`Navbar.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Navbar.tsx)), as well as [`Footer.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Footer.tsx) and [`sitemap.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/sitemap.ts).
3. **100% Legacy Content Alignment:** Align all sections, requirements, criteria, dates, amounts, and contact emails with `https://www.hems-workshop.org/15thWS/15thstudenttravel.html`.
4. **Strict Archive Lock:** Zero modifications to `src/frontend/src/app/archive/**` or any proceedings archive JSON datasets.

---

## 2. Canonical Content Alignment (`15thstudenttravel.html`)

| Section | Canonical Content from `15thstudenttravel.html` |
| :--- | :--- |
| **Title** | HEMS Workshop Student Travel Award (`Student Travel Awards`) |
| **Purpose** | *"The workshop award is intended to encourage interest in the topics applicable to Harsh Environment Mass Spectrometry (HEMS) and reward the scientific merit and quality of student research in the area of HEMS."* |
| **Award Amount** | For the 2025 HEMS Workshop, the proposed award is **`$1,500.00`**. |
| **Eligibility** | Any full-time graduate student pursuing an **M.S., M.A., or Ph.D.** degree within a discipline applicable to the HEMS conference. Students must be in good standing with their university. |
| **Application Guidelines** | Must include:<br>1. A letter from the student describing academic standing and interests, expected graduation date and degree, advisor's name, and (if available) a URL for a working Web page.<br>2. A detailed letter from the student's faculty advisor indicating why the student is deserving of receiving a travel award and any special circumstances.<br>3. The title of the presentation to be presented by the student at the meeting, along with the abstract, and authors.<br>4. A vita that includes the student's research interests, projects, and papers published. |
| **Criteria** | • Meets eligibility requirements<br>• Completes Guideline list<br>• Quality and intellectual merit of the abstract and research<br>• Potential for future publications from research focus |
| **Application Deadline** | **EXTENDED to Friday, August 8, 2025** |
| **Submission** | Submit applications by e-mail to **HEMS Student Awards Committee** at `hemsworkshop@hems-workshop.org` |

---

## 3. File Operations

| Action | File Path | Purpose |
| :--- | :--- | :--- |
| **[NEW]** | [`src/frontend/src/app/student-awards/page.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/student-awards/page.tsx) | Full-width standalone Student Travel Awards page aligned with `15thstudenttravel.html` |
| **[DELETE]** | `src/frontend/src/app/(portal)/student-awards/page.tsx` | Remove portal-wrapped route directory |
| **[MODIFY]** | [`src/frontend/src/app/(portal)/layout.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/%28portal%29/layout.tsx) | Remove `Student Awards` from Workshop Portal sidebar navigation |
| **[MODIFY]** | [`src/frontend/src/components/layout/Navbar.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Navbar.tsx) | Add `Student Travel Awards` link to main navigation bar with clean responsive spacing |
| **[MODIFY]** | [`src/frontend/src/components/layout/Footer.tsx`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/components/layout/Footer.tsx) | Add `Student Travel Awards` link to footer navigation |
| **[MODIFY]** | [`src/frontend/src/app/sitemap.ts`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/src/app/sitemap.ts) | Register `/student-awards` in static XML sitemap |
| **[NEW]** | [`src/frontend/content/pages/student-awards.md`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/content/pages/student-awards.md) | Canonical Decap CMS markdown source for Student Travel Awards |
| **[MODIFY]** | [`src/frontend/public/admin/config.yml`](file:///c:/AntigravityP1_2/HEMS-website/src/frontend/public/admin/config.yml) | Register `student_awards` page entry in Decap CMS |

---

## 4. Verification Gates

1. `git diff b6a0075 -- src/frontend/src/app/archive` outputs `0` lines (Archive Lock intact).
2. `npx next typegen` + `npx tsc --noEmit` in `src/frontend` exits with code `0` (strict TypeScript, zero `any`).
3. Live dev server probe returns `HTTP 200 OK` on `http://localhost:3000/student-awards/`, confirms absence of Workshop Portal sidebar, and confirms `/student-awards` link in `Navbar`.
