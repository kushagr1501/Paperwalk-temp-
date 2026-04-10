"use client";

import { useEffect, useState, useRef } from "react";
import { usePaperStore } from "@/stores/paper";
import { callLLMJSON } from "@/lib/anthropic";
import { buildCodingChallengePrompt } from "@/lib/prompts/coding-challenge";
import { buildSystemPrompt } from "@/lib/prompts/system-prefix";

interface ChallengeData {
  section_ref: string;
  task_description: string;
  starter_code: string;
  hints: string[];
  solution_code: string;
  test_code: string;
}

interface CodingChallengeProps {
  onContinue: () => void;
}

export function CodingChallenge({ onContinue }: CodingChallengeProps) {
  const store = usePaperStore();
  const [data, setData] = useState<ChallengeData | null>(
    store.codingChallenge as ChallengeData | null
  );
  const [loading, setLoading] = useState(!data);
  const [code, setCode] = useState("");
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const pyodideRef = useRef<unknown>(null);

  useEffect(() => {
    if (data || !store.userContext) return;

    async function load() {
      try {
        const result = await callLLMJSON<ChallengeData>(
          [
            {
              role: "user",
              content: buildCodingChallengePrompt(
                store.sections,
                store.userContext!
              ),
            },
          ],
          buildSystemPrompt(store.userContext!)
        );
        setData(result);
        setCode(result.starter_code);
        store.setCodingChallenge(result);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const runCode = async () => {
    setRunning(true);
    setOutput(null);

    try {
      if (!pyodideRef.current) {
        setOutput("> Loading Python runtime...\n");
        const win = window as unknown as Record<string, unknown>;
        if (!win.loadPyodide) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load Pyodide"));
            document.head.appendChild(script);
          });
        }
        const loadPyodide = (win as unknown as { loadPyodide: (opts: { indexURL: string }) => Promise<unknown> }).loadPyodide;
        const pyodide = await loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/",
        });
        await (pyodide as { loadPackage: (pkgs: string[]) => Promise<void> }).loadPackage(["numpy"]);
        pyodideRef.current = pyodide;
      }

      const pyodide = pyodideRef.current as {
        runPythonAsync: (code: string) => Promise<unknown>;
        setStdout: (opts: { batched: (s: string) => void }) => void;
      };

      let captured = "";
      pyodide.setStdout({
        batched: (s: string) => { captured += s + "\n"; },
      });

      const fullCode = code + "\n\n" + (data?.test_code || "");
      await pyodide.runPythonAsync(fullCode);
      setOutput(captured || "> Execution successful.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Execution failed";
      setOutput(`Error: ${msg}`);
    } finally {
      setRunning(false);
    }
  };

  const revealHint = () => {
    if (data && hintsRevealed < data.hints.length) {
      setHintsRevealed((p) => p + 1);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-8 py-16">
        <div className="font-serif text-base text-textmuted italic animate-pulse">
          Generating coding challenge...
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-2xl mx-auto px-8 py-16">
      <h2 className="font-serif text-2xl font-medium text-textpri mb-8">
        Coding Challenge
      </h2>

      {/* Task description */}
      <div className="bg-elevated border border-bordercolor rounded-lg p-6 mb-8">
        <p className="font-serif text-sm text-textsec leading-relaxed whitespace-pre-wrap">
          {data.task_description}
        </p>
        <p className="font-sans text-xs text-textmuted mt-3">
          From: {data.section_ref}
        </p>
      </div>

      {/* Code editor */}
      <div className="border border-bordercolor rounded-lg overflow-hidden mb-8">
        <div className="bg-elevated border-b border-bordercolor px-4 py-2 font-sans text-xs text-textmuted">
          {store.userContext?.programmingLanguage || "Python"}
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full bg-codebg p-4 font-mono text-xs text-textsec leading-relaxed outline-none resize-none"
          rows={20}
          spellCheck={false}
        />
        <div className="bg-elevated border-t border-bordercolor px-4 py-3 flex justify-between items-center">
          <button
            onClick={runCode}
            disabled={running}
            className="font-sans text-sm bg-accent hover:bg-accent-dim px-4 py-1.5 rounded-lg transition-colors text-white disabled:opacity-50"
          >
            {running ? "Running..." : "Run Code"}
          </button>
          <div className="flex gap-3">
            <button
              onClick={revealHint}
              disabled={hintsRevealed >= data.hints.length}
              className="font-sans text-xs text-textmuted hover:text-textpri transition-colors disabled:opacity-30"
            >
              Hint ({hintsRevealed}/{data.hints.length})
            </button>
            <button
              onClick={() => setShowSolution(true)}
              className="font-sans text-xs text-textmuted hover:text-textpri transition-colors"
            >
              Show solution
            </button>
          </div>
        </div>
      </div>

      {/* Output */}
      {output && (
        <div className="bg-codebg border border-bordercolor rounded-lg p-4 font-mono text-xs leading-loose mb-8">
          <pre className={`whitespace-pre-wrap ${output.startsWith("Error") ? "text-error" : "text-textsec"}`}>
            {output}
          </pre>
        </div>
      )}

      {/* Hints */}
      {hintsRevealed > 0 && (
        <div className="space-y-3 mb-8">
          {data.hints.slice(0, hintsRevealed).map((hint, i) => (
            <div
              key={i}
              className="bg-accent-light border border-accent-dim/20 rounded-lg p-4"
            >
              <div className="font-sans text-xs text-accent mb-1">
                Hint {i + 1}
              </div>
              <p className="font-serif text-sm text-textsec">{hint}</p>
            </div>
          ))}
        </div>
      )}

      {/* Solution */}
      {showSolution && (
        <div className="bg-codebg border border-bordercolor rounded-lg overflow-hidden mb-8">
          <div className="bg-elevated border-b border-bordercolor px-4 py-2 font-sans text-xs text-textmuted">
            Solution
          </div>
          <pre className="p-4 font-mono text-xs text-textsec leading-relaxed overflow-x-auto">
            <code>{data.solution_code}</code>
          </pre>
        </div>
      )}

      <button
        onClick={onContinue}
        className="w-full mt-4 bg-accent text-white font-sans text-base py-4 rounded-lg hover:bg-accent-dim transition-colors"
      >
        Continue to quiz &rarr;
      </button>
    </div>
  );
}
