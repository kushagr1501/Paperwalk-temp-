"use client";

import { useEffect, useState, useRef } from "react";
import { usePaperStore } from "@/stores/paper";
import { callLLMJSON } from "@/lib/anthropic";
import { buildCodeLabPrompt } from "@/lib/prompts/code-lab";
import { buildSystemPrompt } from "@/lib/prompts/system-prefix";

interface CodeBlock {
  id: string;
  label: string;
  code: string;
  annotation: string;
}

interface CodeLabData {
  description: string;
  paper_language: string;
  code_blocks: CodeBlock[];
  user_language_code: string | null;
  language_note: string | null;
}

interface InlineCodeLabProps {
  sectionId: string;
  sectionBody: string;
  equationsList: string;
}

export function InlineCodeLab({
  sectionId,
  sectionBody,
  equationsList,
}: InlineCodeLabProps) {
  const store = usePaperStore();
  const [data, setData] = useState<CodeLabData | null>(
    (store.codeLabs[sectionId] as CodeLabData) || null
  );
  const [loading, setLoading] = useState(!data);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pyodideRef = useRef<unknown>(null);

  useEffect(() => {
    if (data || !store.userContext) return;

    async function load() {
      try {
        const result = await callLLMJSON<CodeLabData>(
          [
            {
              role: "user",
              content: buildCodeLabPrompt(
                sectionBody,
                equationsList,
                store.userContext!
              ),
            },
          ],
          buildSystemPrompt(store.userContext!)
        );
        setData(result);
        store.setCodeLab(sectionId, result);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [sectionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const runCode = async () => {
    if (!data) return;
    setRunning(true);
    setOutput(null);
    setError(null);

    try {
      if (!pyodideRef.current) {
        setOutput("> Loading Python runtime (first time only)...\n");
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

      const fullCode = data.code_blocks.map((b) => b.code).join("\n\n");

      let captured = "";
      pyodide.setStdout({
        batched: (s: string) => {
          captured += s + "\n";
        },
      });

      await pyodide.runPythonAsync(fullCode);
      setOutput(captured || "> Execution successful. No printed output.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Execution failed";
      setError(msg);
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="mb-14 border border-bordercolor rounded-lg p-4 font-serif text-sm text-textmuted italic animate-pulse">
        Generating code implementation...
      </div>
    );
  }

  if (!data) return null;

  const userLang = store.userContext?.programmingLanguage || "Python";
  const showDualLanguage =
    data.user_language_code && userLang.toLowerCase() !== "python";

  return (
    <div className="mb-14 border border-bordercolor rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-elevated border-b border-bordercolor px-4 py-2.5 flex justify-between items-center">
        <div className="font-sans text-xs text-textmuted">
          {data.description}
        </div>
        {showDualLanguage && (
          <div className="font-sans text-xs text-textmuted flex space-x-4">
            <span className="text-accent">Paper: Python</span>
            <span className="text-bordercolor">|</span>
            <span className="text-accent-dim">Your Pref: {userLang}</span>
          </div>
        )}
      </div>

      {/* Annotations */}
      {data.code_blocks.map((block) => (
        <div key={block.id}>
          {block.annotation && (
            <div className="bg-accent-light/50 px-4 py-3 border-l-2 border-accent text-[15px] font-serif text-textsec leading-relaxed">
              {block.annotation}
            </div>
          )}
        </div>
      ))}

      {/* Code */}
      {showDualLanguage ? (
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-bordercolor">
          <div className="bg-codebg p-4 overflow-x-auto font-mono text-xs leading-relaxed text-textsec">
            <pre>
              <code>{data.code_blocks.map((b) => b.code).join("\n\n")}</code>
            </pre>
          </div>
          <div className="bg-codebg p-4 overflow-x-auto font-mono text-xs leading-relaxed text-textsec">
            <pre>
              <code>{data.user_language_code}</code>
            </pre>
          </div>
        </div>
      ) : (
        <div className="bg-codebg p-4 overflow-x-auto font-mono text-xs leading-relaxed text-textsec">
          <pre>
            <code>{data.code_blocks.map((b) => b.code).join("\n\n")}</code>
          </pre>
        </div>
      )}

      {data.language_note && (
        <div className="bg-elevated px-4 py-2 border-t border-bordercolor font-sans text-xs text-textmuted">
          {data.language_note}
        </div>
      )}

      {/* Runner */}
      <div className="bg-elevated border-t border-bordercolor px-4 py-3 flex justify-between items-center">
        <button
          onClick={runCode}
          disabled={running}
          className="font-sans text-sm bg-accent hover:bg-accent-dim px-4 py-1.5 rounded-lg transition-colors text-white disabled:opacity-50"
        >
          {running ? "Running..." : "Run Code"}
        </button>
      </div>

      {/* Terminal output */}
      {(output || error) && (
        <div className="bg-codebg border-t border-bordercolor p-4 font-mono text-xs leading-loose">
          {output && (
            <pre className="text-textsec whitespace-pre-wrap">{output}</pre>
          )}
          {error && (
            <pre className="text-error whitespace-pre-wrap">{error}</pre>
          )}
        </div>
      )}
    </div>
  );
}
