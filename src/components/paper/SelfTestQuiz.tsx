"use client";

import { useEffect, useState } from "react";
import { usePaperStore } from "@/stores/paper";
import { callLLMJSON } from "@/lib/anthropic";
import { buildQuizPrompt, buildQuizEvalPrompt } from "@/lib/prompts/quiz";
import { buildSystemPrompt } from "@/lib/prompts/system-prefix";
import type { QuizQuestion, QuizResult } from "@/types/paper";

export function SelfTestQuiz() {
  const store = usePaperStore();
  const [questions, setQuestions] = useState<QuizQuestion[]>(store.quizQuestions);
  const [loading, setLoading] = useState(questions.length === 0);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [shortAnswer, setShortAnswer] = useState("");
  const [results, setResults] = useState<QuizResult[]>(store.quizResults);
  const [currentExplanation, setCurrentExplanation] = useState<string | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [showScoreCard, setShowScoreCard] = useState(false);

  useEffect(() => {
    if (questions.length > 0 || !store.userContext || !store.metadata) return;

    async function load() {
      try {
        const result = await callLLMJSON<{ questions: QuizQuestion[] }>(
          [
            {
              role: "user",
              content: buildQuizPrompt(
                store.metadata!.title,
                store.sections,
                store.userContext!
              ),
            },
          ],
          buildSystemPrompt(store.userContext!)
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const qs: QuizQuestion[] = (result.questions || []).map((q: any, i: number) => ({
          id: (q.id as string) || `q${i + 1}`,
          type: (q.type as "mcq" | "short" | "open") || "mcq",
          question: (q.question as string) || "",
          options: (q.options as string[]) || undefined,
          correctAnswer: (q.correct_answer as string) || (q.correctAnswer as string) || undefined,
          modelAnswer: (q.model_answer as string) || (q.modelAnswer as string) || undefined,
          keyConcepts: (q.key_concepts as string[]) || (q.keyConcepts as string[]) || undefined,
          section: (q.section as string) || undefined,
        }));

        setQuestions(qs);
        store.setQuizQuestions(qs);
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentQuestion = questions[currentQ];

  const handleMCQAnswer = async (option: string) => {
    if (selectedOption || !currentQuestion) return;
    setSelectedOption(option);

    const correctAnswer = (currentQuestion.correctAnswer || "").trim();
    const optionIndex = (currentQuestion.options || []).indexOf(option);
    const letterMap = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const optionLetter = optionIndex >= 0 ? letterMap[optionIndex] : "";

    const isCorrect =
      option.toLowerCase() === correctAnswer.toLowerCase() ||
      optionLetter.toLowerCase() === correctAnswer.toLowerCase() ||
      correctAnswer.toLowerCase().startsWith(optionLetter.toLowerCase() + ".") ||
      correctAnswer.toLowerCase().startsWith(optionLetter.toLowerCase() + ")") ||
      option.toLowerCase().includes(correctAnswer.toLowerCase()) ||
      correctAnswer.toLowerCase().includes(option.toLowerCase());

    const correctDisplay =
      correctAnswer.length <= 2 && currentQuestion.options
        ? currentQuestion.options[letterMap.indexOf(correctAnswer.toUpperCase())] || correctAnswer
        : correctAnswer;

    const result: QuizResult = {
      questionId: currentQuestion.id,
      userAnswer: option,
      correct: isCorrect,
      explanation: correctAnswer
        ? `The correct answer is "${correctDisplay}".`
        : "",
      section: currentQuestion.section,
    };

    setResults((prev) => [...prev, result]);
    store.addQuizResult(result);
    setCurrentExplanation(result.explanation);
  };

  const handleTextAnswer = async () => {
    if (evaluating || !shortAnswer.trim() || !currentQuestion) return;
    setEvaluating(true);

    try {
      const evalResult = await callLLMJSON<{
        correct: boolean;
        explanation: string;
      }>(
        [
          {
            role: "user",
            content: buildQuizEvalPrompt(
              currentQuestion.question,
              shortAnswer,
              currentQuestion.modelAnswer,
              currentQuestion.keyConcepts
            ),
          },
        ],
        "You evaluate quiz answers. Be specific about what was correct and what was missing. Never say just 'correct' or 'wrong'."
      );

      const result: QuizResult = {
        questionId: currentQuestion.id,
        userAnswer: shortAnswer,
        correct: evalResult.correct,
        explanation: evalResult.explanation,
        section: currentQuestion.section,
      };

      setResults((prev) => [...prev, result]);
      store.addQuizResult(result);
      setCurrentExplanation(evalResult.explanation);
    } catch {
      setCurrentExplanation("Could not evaluate. Check your API key.");
    } finally {
      setEvaluating(false);
    }
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((p) => p + 1);
      setSelectedOption(null);
      setShortAnswer("");
      setCurrentExplanation(null);
    } else {
      const score = results.filter((r) => r.correct).length;
      store.setQuizScore(score);
      setShowScoreCard(true);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-8 py-16">
        <div className="font-serif text-base text-textmuted italic animate-pulse">
          Generating quiz...
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-8 py-16">
        <p className="font-serif text-sm text-textmuted italic">
          Could not generate quiz questions. Check your API key.
        </p>
      </div>
    );
  }

  // Score card
  if (showScoreCard) {
    const score = results.filter((r) => r.correct).length;
    const total = results.length;

    let guidance = "";
    if (score >= 8) guidance = "You can read the original paper.";
    else if (score >= 5) {
      const weakSections = results
        .filter((r) => !r.correct && r.section)
        .map((r) => r.section)
        .filter((v, i, a) => a.indexOf(v) === i);
      guidance = `Re-read ${weakSections.join(" and ")} before returning to the original paper.`;
    } else {
      guidance = "Go back through the section walkthrough before the quiz.";
    }

    return (
      <div className="max-w-2xl mx-auto px-8 py-16">
        <h2 className="font-serif text-2xl font-medium text-textpri mb-10">
          Quiz Complete
        </h2>

        <div className="border border-bordercolor rounded-lg p-8 mb-8">
          <div className="font-serif text-4xl text-textpri mb-8 text-center">
            {score} / {total}
          </div>

          <div className="space-y-3 mb-8">
            {results.map((r, i) => {
              const q = questions.find((q) => q.id === r.questionId);
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 font-serif text-sm"
                >
                  <span className={r.correct ? "text-success" : "text-error"}>
                    {r.correct ? "\u2713" : "\u2717"}
                  </span>
                  <span className="text-textsec">
                    Q{i + 1}: {q?.question?.slice(0, 60)}...
                  </span>
                  {!r.correct && r.section && (
                    <span className="text-textmuted font-sans text-xs">&rarr; {r.section}</span>
                  )}
                </div>
              );
            })}
          </div>

          <p className="font-serif text-base text-textpri">{guidance}</p>
        </div>
      </div>
    );
  }

  // Current question
  return (
    <div className="max-w-2xl mx-auto px-8 py-16">
      <div className="flex justify-between items-center mb-10">
        <h2 className="font-serif text-2xl font-medium text-textpri">
          Self-Test
        </h2>
        <span className="font-sans text-xs text-textmuted">
          {currentQ + 1}/{questions.length}
        </span>
      </div>

      <div className="font-serif text-sm text-textmuted italic mb-6">
        10 questions on the paper. This shows you what landed and what might
        need another read.
      </div>

      <div className="border border-bordercolor rounded-lg p-8 mb-8">
        <p className="font-serif text-base text-textpri mb-8 leading-relaxed">
          {currentQuestion.question}
        </p>

        {/* MCQ */}
        {currentQuestion.type === "mcq" && currentQuestion.options && (
          <div className="space-y-3">
            {currentQuestion.options.map((opt, optIdx) => {
              const isSelected = selectedOption === opt;
              const ca = (currentQuestion.correctAnswer || "").trim();
              const letterMap = ["A", "B", "C", "D", "E", "F", "G", "H"];
              const optLetter = letterMap[optIdx] || "";
              const isCorrect =
                selectedOption &&
                (opt.toLowerCase() === ca.toLowerCase() ||
                  optLetter.toLowerCase() === ca.toLowerCase() ||
                  ca.toLowerCase().startsWith(optLetter.toLowerCase() + ".") ||
                  ca.toLowerCase().startsWith(optLetter.toLowerCase() + ")") ||
                  opt.toLowerCase().includes(ca.toLowerCase()) ||
                  ca.toLowerCase().includes(opt.toLowerCase()));

              return (
                <button
                  key={opt}
                  onClick={() => handleMCQAnswer(opt)}
                  disabled={!!selectedOption}
                  className={`w-full text-left border rounded-lg px-4 py-3 font-serif text-sm transition-colors ${
                    isSelected && isCorrect
                      ? "border-success bg-success/10 text-textpri"
                      : isSelected && !isCorrect
                        ? "border-error bg-error/10 text-textpri"
                        : !selectedOption
                          ? "border-bordercolor bg-surface text-textpri hover:border-accent-dim"
                          : isCorrect
                            ? "border-success/50 bg-success/5 text-textpri"
                            : "border-bordercolor bg-surface text-textmuted"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {/* Short answer / Open */}
        {(currentQuestion.type === "short" ||
          currentQuestion.type === "open") && (
          <div>
            <textarea
              value={shortAnswer}
              onChange={(e) => setShortAnswer(e.target.value)}
              placeholder="Type your answer..."
              rows={currentQuestion.type === "open" ? 6 : 3}
              className="w-full bg-surface border border-bordercolor rounded-lg px-4 py-3 font-serif text-sm text-textpri outline-none focus:border-accent transition-colors resize-none mb-3"
              disabled={!!currentExplanation}
            />
            {!currentExplanation && (
              <button
                onClick={handleTextAnswer}
                disabled={evaluating || !shortAnswer.trim()}
                className="bg-accent text-white font-sans text-sm px-6 py-2 rounded-lg hover:bg-accent-dim transition-colors disabled:opacity-40"
              >
                {evaluating ? "Evaluating..." : "Submit"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Explanation */}
      {currentExplanation && (
        <div className="bg-accent-light border border-accent-dim/20 rounded-lg p-6 mb-8">
          <p className="font-serif text-sm text-textsec leading-relaxed">
            {currentExplanation}
          </p>
        </div>
      )}

      {/* Next button */}
      {currentExplanation && (
        <button
          onClick={nextQuestion}
          className="w-full bg-accent text-white font-sans text-base py-3.5 rounded-lg hover:bg-accent-dim transition-colors"
        >
          {currentQ < questions.length - 1
            ? `Question ${currentQ + 2} \u2192`
            : "See results \u2192"}
        </button>
      )}
    </div>
  );
}
