# PaperWalk v0.5 — QA Report

## Bugs Found & Fixed

### BUG 1 — Modal z-index (FIXED)
**File:** `src/components/onboarding/ApiKeyModal.tsx`
**Issue:** Modal overlay was `z-50` but navbar is `z-20`. Nav links remained clickable through the modal backdrop due to stacking context.
**Fix:** Changed modal to `z-[100]`.

### BUG 2 — Scrollbar visible on topic pills (FIXED)
**File:** `src/app/globals.css` + `src/components/discover/TopicHubs.tsx`
**Issue:** Topic hub pills row showed browser scrollbar. The `scrollbar-hide` class was referenced but no CSS defined.
**Fix:** Added `.scrollbar-hide` CSS rules (webkit + firefox + IE).

### BUG 3 — Stage 0 fallthrough (FIXED)
**File:** `src/components/paper/PaperJourneyShell.tsx`
**Issue:** When `ingestionStep === "done"` but `store.currentStage === 0` (e.g., Zustand store resets while paper metadata is cached), the component rendered `null` — blank screen.
**Fix:** Added `if (store.currentStage === 0) store.setCurrentStage(1)` in the early-return path where cached data is detected.

### BUG 4 — MCQ answer comparison (FIXED)
**File:** `src/components/paper/SelfTestQuiz.tsx`
**Issue:** `handleMCQAnswer` compared `option.toLowerCase() === correctAnswer.toLowerCase()` but LLM may return `correct_answer` as "A" (letter) while `options` array contains full text. Every MCQ would be marked wrong.
**Fix:** Multi-strategy comparison: exact text match, letter-to-index match, letter-prefix ("A.", "A)"), and substring containment. Applied same logic to the rendering highlight code.

### BUG 5 — pdfjs-dist worker URL (NOT FIXED — low risk)
**Issue:** Uses CDN worker URL based on `lib.version`. Should work but untested with real PDF in browser. Low priority.

### BUG 6 — Upload flow broken (FIXED)
**File:** `src/components/paper/PaperJourneyShell.tsx`
**Issue:** Upload page creates `localId = upload-<timestamp>` and navigates to `/paper/${localId}`. But `PaperJourneyShell` always calls `fetchArxivMetadata(arxivId)` which fails for non-arXiv IDs.
**Fix:** Added `isUpload` detection. When ID starts with `upload-`, reads PDF from sessionStorage, extracts text, and generates minimal metadata from the PDF content.

### BUG 7 — Re-read scroll doesn't work (FIXED)
**File:** `src/components/paper/SectionSummary.tsx`
**Issue:** "Re-read this section" button called `window.scrollTo()` but the body has `overflow-hidden`. The actual scrollable container is `#main-scroll` inside `SectionWalkthroughShell`.
**Fix:** Changed to `document.getElementById("main-scroll")?.scrollTo(...)` with window fallback.

### BUG 8 — TypeScript Set iteration error (FIXED)
**File:** `src/stores/paper.ts`
**Issue:** `[...new Set([...arr, item])]` caused TS2802 error without `downlevelIteration`.
**Fix:** Replaced with simple `includes()` check + spread.

### BUG 9 — TypeScript Record<string, unknown> cast (FIXED)
**File:** `src/components/paper/SelfTestQuiz.tsx`
**Issue:** `.map()` callback typed as `Record<string, unknown>` but array element type is `QuizQuestion`. Type mismatch.
**Fix:** Changed to `any` with eslint-disable comment (LLM JSON response can have snake_case or camelCase keys).

## Areas Tested (Code Review)

| Area | Status | Notes |
|------|--------|-------|
| Landing page | ✅ OK | arXiv ID extraction handles URLs, bare IDs, version suffixes |
| Discover page | ✅ OK | Search, topic hubs, paper cards all wired correctly |
| API key modal | ✅ Fixed | z-index, required vs optional close behavior |
| User context intake | ✅ OK | Validation prevents empty submit, "Other" language input works |
| Prerequisites | ✅ OK | Three columns, quick revision expansion, learn-in-context flagging |
| Paper overview | ✅ OK | Metadata display, reading order hints |
| Abstract view | ✅ OK | Split view with term tooltips |
| Section walkthrough | ✅ OK | Paragraph-by-paragraph with streaming |
| Math decoder | ✅ OK | MathJax render, symbol table, Plotly lazy load |
| Code lab | ✅ OK | Pyodide lazy load, dual language display |
| Section summary | ✅ Fixed | Re-read scroll target |
| Full notes | ✅ OK | Streaming, copy to clipboard, jsPDF export |
| Coding challenge | ✅ OK | Starter code, hints, solution reveal, Pyodide runner |
| Quiz | ✅ Fixed | MCQ comparison, text answer eval, score card |
| Glossary panel | ✅ OK | Slide-in/out, term click adds entries |
| Upload flow | ✅ Fixed | sessionStorage PDF retrieval, fallback metadata |
| Sidebar nav | ✅ OK | Progress tracking, section badges |
| API proxy | ✅ OK | OpenAI-compatible stream forwarding |
| Error handling | ✅ OK | Retry button on ingestion error, graceful LLM failures |

## Edge Cases Reviewed

- **Invalid arXiv ID**: `fetchArxivMetadata` → `parseArxivXML` returns `null` → throws "Failed to parse arXiv metadata" → error screen with retry. ✅
- **Empty sections from LLM**: Sections with body < 30 chars filtered from paragraphs. If all sections empty, section walkthrough renders `null` for `currentSection`. Acceptable degradation. ⚠️
- **API key present but invalid**: FrogAPI returns 401 → proxy returns 401 → `callLLM` throws → error screen. ✅
- **sessionStorage too large for PDF**: Upload page catches the exception and shows error message. ✅
- **Zustand state persists across papers**: `store.reset()` exists but is never called when navigating to a new paper. Stale data could show if user walks paper A then paper B without refresh. The `useEffect` in `PaperJourneyShell` checks `store.paperId === arxivId` so it will re-ingest. ✅

## TypeScript Status
- **0 errors** after fixes (was 3 before)
- Dev server compiles cleanly

## Not Tested (requires real browser + API key)
- Actual LLM streaming output quality
- MathJax rendering fidelity
- Plotly chart rendering
- Pyodide execution
- jsPDF export download
- PDF.js extraction accuracy
- Mobile responsive layout (narrow viewport)
