export interface UserContext {
  backgroundLevel: "beginner" | "intermediate" | "expert";
  programmingLanguage: string;
  nativeLanguage: string;
}

export interface ParsedEquation {
  id: string;
  latex: string;
  label: string;
}

export interface ReadingOrderHint {
  sectionId: string;
  type: "read-first" | "dense-equations" | "forward-ref";
  text: string;
}

export interface ParsedSection {
  id: string;
  heading: string;
  body: string;
  paragraphs: string[];
  equations: ParsedEquation[];
  hasAlgorithm: boolean;
  readingOrderHints: ReadingOrderHint[];
}

export interface PaperMetadata {
  title: string;
  authors: string[];
  year: string;
  venue: string;
  abstract: string;
  citationCount?: number;
  arxivId?: string;
  sectionCount: number;
  equationCount: number;
  hasCode: boolean;
  coreContribution: string;
  tags: string[];
  estimatedTime: string;
}

export interface GlossaryEntry {
  term: string;
  definition: string;
  firstSeenSection: string;
  exampleSentence: string;
}

export interface TermMap {
  [term: string]: string;
}

export interface QuizQuestion {
  id: string;
  type: "mcq" | "short" | "open";
  question: string;
  options?: string[];
  correctAnswer?: string;
  modelAnswer?: string;
  keyConcepts?: string[];
  section?: string;
}

export interface QuizResult {
  questionId: string;
  userAnswer: string;
  correct: boolean;
  explanation: string;
  section?: string;
}

export type Stage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type LoadingStage =
  | "idle"
  | "parsing"
  | "prereqs"
  | "section"
  | "notes"
  | "quiz";

export interface PrerequisiteItem {
  concept: string;
  status: "unset" | "know-it" | "quick-revision" | "learn-in-context";
  revisionContent?: {
    explanation: string;
    analogy: string;
    workedExample: string;
    selfCheckQuestion: string;
  };
}

export interface Prerequisites {
  maths: PrerequisiteItem[];
  systems: PrerequisiteItem[];
  coding: PrerequisiteItem[];
}
