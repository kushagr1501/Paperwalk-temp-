import { create } from "zustand";
import type {
  UserContext,
  ParsedSection,
  PaperMetadata,
  GlossaryEntry,
  Stage,
  LoadingStage,
  Prerequisites,
  TermMap,
  QuizQuestion,
  QuizResult,
} from "@/types/paper";

interface PaperStore {
  // Identity
  paperId: string | null;
  metadata: PaperMetadata | null;

  // Parsed content
  sections: ParsedSection[];
  rawAbstract: string;

  // User
  userContext: UserContext | null;

  // Prerequisites
  prerequisites: Prerequisites | null;
  learnInContextFlags: string[];

  // Hard English decoder maps (per section)
  termMaps: Record<string, TermMap>;
  phraseMaps: Record<string, TermMap>;

  // Journey progress
  currentStage: Stage;
  currentSectionIndex: number;
  completedSections: string[];
  checkedEquations: string[];

  // Glossary
  glossary: Record<string, GlossaryEntry>;

  // Abstract walkthrough
  abstractWalkthrough: string | null;

  // Section walkthroughs
  sectionWalkthroughs: Record<string, string>;
  paragraphWalkthroughs: Record<string, string>;

  // Math decodings
  mathDecodings: Record<string, unknown>;

  // Code labs
  codeLabs: Record<string, unknown>;

  // Section summaries
  sectionSummaries: Record<string, unknown>;

  // Notes
  fullNotes: string | null;

  // Quiz
  quizQuestions: QuizQuestion[];
  quizResults: QuizResult[];
  quizScore: number | null;

  // Coding challenge
  codingChallenge: unknown | null;

  // Loading
  loadingStage: LoadingStage;
  streamingText: string;

  // Actions
  setPaperId: (id: string) => void;
  setMetadata: (metadata: PaperMetadata) => void;
  setSections: (sections: ParsedSection[]) => void;
  setRawAbstract: (text: string) => void;
  setUserContext: (ctx: UserContext) => void;
  setPrerequisites: (prereqs: Prerequisites) => void;
  addLearnInContextFlag: (concept: string) => void;
  setTermMap: (sectionId: string, map: TermMap) => void;
  setPhraseMap: (sectionId: string, map: TermMap) => void;
  setCurrentStage: (stage: Stage) => void;
  setCurrentSectionIndex: (idx: number) => void;
  completeSection: (sectionId: string) => void;
  checkEquation: (equationId: string) => void;
  addGlossaryEntry: (term: string, entry: GlossaryEntry) => void;
  setAbstractWalkthrough: (text: string) => void;
  setParagraphWalkthrough: (key: string, text: string) => void;
  setMathDecoding: (eqId: string, data: unknown) => void;
  setCodeLab: (sectionId: string, data: unknown) => void;
  setSectionSummary: (sectionId: string, data: unknown) => void;
  setFullNotes: (notes: string) => void;
  setQuizQuestions: (questions: QuizQuestion[]) => void;
  addQuizResult: (result: QuizResult) => void;
  setQuizScore: (score: number) => void;
  setCodingChallenge: (challenge: unknown) => void;
  setLoadingStage: (stage: LoadingStage) => void;
  setStreamingText: (text: string) => void;
  appendStreamingText: (chunk: string) => void;
  reset: () => void;
}

const initialState = {
  paperId: null,
  metadata: null,
  sections: [],
  rawAbstract: "",
  userContext: null,
  prerequisites: null,
  learnInContextFlags: [],
  termMaps: {},
  phraseMaps: {},
  currentStage: 0 as Stage,
  currentSectionIndex: 0,
  completedSections: [],
  checkedEquations: [],
  glossary: {},
  abstractWalkthrough: null,
  sectionWalkthroughs: {},
  paragraphWalkthroughs: {},
  mathDecodings: {},
  codeLabs: {},
  sectionSummaries: {},
  fullNotes: null,
  quizQuestions: [],
  quizResults: [],
  quizScore: null,
  codingChallenge: null,
  loadingStage: "idle" as LoadingStage,
  streamingText: "",
};

export const usePaperStore = create<PaperStore>((set) => ({
  ...initialState,

  setPaperId: (id) => set({ paperId: id }),
  setMetadata: (metadata) => set({ metadata }),
  setSections: (sections) => set({ sections }),
  setRawAbstract: (text) => set({ rawAbstract: text }),
  setUserContext: (ctx) => {
    localStorage.setItem("paperwalk_user_context", JSON.stringify(ctx));
    set({ userContext: ctx });
  },
  setPrerequisites: (prereqs) => set({ prerequisites: prereqs }),
  addLearnInContextFlag: (concept) =>
    set((s) => ({
      learnInContextFlags: [...s.learnInContextFlags, concept],
    })),
  setTermMap: (sectionId, map) =>
    set((s) => ({ termMaps: { ...s.termMaps, [sectionId]: map } })),
  setPhraseMap: (sectionId, map) =>
    set((s) => ({ phraseMaps: { ...s.phraseMaps, [sectionId]: map } })),
  setCurrentStage: (stage) => set({ currentStage: stage }),
  setCurrentSectionIndex: (idx) => set({ currentSectionIndex: idx }),
  completeSection: (sectionId) =>
    set((s) => ({
      completedSections: s.completedSections.includes(sectionId) ? s.completedSections : [...s.completedSections, sectionId],
    })),
  checkEquation: (equationId) =>
    set((s) => ({
      checkedEquations: s.checkedEquations.includes(equationId) ? s.checkedEquations : [...s.checkedEquations, equationId],
    })),
  addGlossaryEntry: (term, entry) =>
    set((s) => ({ glossary: { ...s.glossary, [term]: entry } })),
  setAbstractWalkthrough: (text) => set({ abstractWalkthrough: text }),
  setParagraphWalkthrough: (key, text) =>
    set((s) => ({
      paragraphWalkthroughs: { ...s.paragraphWalkthroughs, [key]: text },
    })),
  setMathDecoding: (eqId, data) =>
    set((s) => ({ mathDecodings: { ...s.mathDecodings, [eqId]: data } })),
  setCodeLab: (sectionId, data) =>
    set((s) => ({ codeLabs: { ...s.codeLabs, [sectionId]: data } })),
  setSectionSummary: (sectionId, data) =>
    set((s) => ({
      sectionSummaries: { ...s.sectionSummaries, [sectionId]: data },
    })),
  setFullNotes: (notes) => set({ fullNotes: notes }),
  setQuizQuestions: (questions) => set({ quizQuestions: questions }),
  addQuizResult: (result) =>
    set((s) => ({ quizResults: [...s.quizResults, result] })),
  setQuizScore: (score) => set({ quizScore: score }),
  setCodingChallenge: (challenge) => set({ codingChallenge: challenge }),
  setLoadingStage: (stage) => set({ loadingStage: stage }),
  setStreamingText: (text) => set({ streamingText: text }),
  appendStreamingText: (chunk) =>
    set((s) => ({ streamingText: s.streamingText + chunk })),
  reset: () => set(initialState),
}));
