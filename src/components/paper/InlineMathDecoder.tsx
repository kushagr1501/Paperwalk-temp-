"use client";

import { useEffect, useState, useRef } from "react";
import { usePaperStore } from "@/stores/paper";
import { callLLMJSON } from "@/lib/anthropic";
import { buildMathDecoderPrompt } from "@/lib/prompts/math-decoder";
import { buildSystemPrompt } from "@/lib/prompts/system-prefix";
import type { ParsedEquation } from "@/types/paper";

interface MathDecoderData {
  name: string;
  what_it_computes: string;
  symbol_breakdown: { symbol: string; meaning: string }[];
  worked_example: {
    setup: string;
    steps: string[];
  };
  plot_data: {
    should_plot: boolean;
    x?: number[];
    y?: number[];
    xlabel?: string;
    ylabel?: string;
    title?: string;
  };
}

interface InlineMathDecoderProps {
  equation: ParsedEquation;
  sectionBody: string;
}

export function InlineMathDecoder({
  equation,
  sectionBody,
}: InlineMathDecoderProps) {
  const store = usePaperStore();
  const [data, setData] = useState<MathDecoderData | null>(
    (store.mathDecodings[equation.id] as MathDecoderData) || null
  );
  const [loading, setLoading] = useState(!data);
  const [isChecked, setIsChecked] = useState(
    store.checkedEquations.includes(equation.id)
  );
  const mathRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mathRef.current && typeof window !== "undefined") {
      const win = window as unknown as { MathJax?: { typesetPromise?: (el: HTMLElement[]) => void } };
      if (win.MathJax?.typesetPromise) {
        win.MathJax.typesetPromise([mathRef.current]);
      }
    }
  }, [equation.latex]);

  useEffect(() => {
    if (data || !store.userContext) return;

    async function decode() {
      try {
        const result = await callLLMJSON<MathDecoderData>(
          [
            {
              role: "user",
              content: buildMathDecoderPrompt(
                equation.latex,
                equation.label,
                sectionBody,
                store.userContext!
              ),
            },
          ],
          buildSystemPrompt(store.userContext!)
        );
        setData(result);
        store.setMathDecoding(equation.id, result);
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    }

    decode();
  }, [equation.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!data?.plot_data?.should_plot || !plotRef.current) return;

    async function renderPlot() {
      try {
        const win = window as unknown as Record<string, unknown>;
        if (!win.Plotly) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdn.plot.ly/plotly-2.32.0.min.js";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load Plotly"));
            document.head.appendChild(script);
          });
        }
        const Plotly = win.Plotly as { newPlot: (...args: unknown[]) => void };
        Plotly.newPlot(
          plotRef.current!,
          [
            {
              x: data!.plot_data.x,
              y: data!.plot_data.y,
              type: "scatter",
              mode: "lines+markers",
              marker: { color: "#b05a3a" },
              line: { color: "#b05a3a", width: 2 },
            },
          ],
          {
            title: {
              text: data!.plot_data.title || "",
              font: { color: "#1a1a1a", family: "Newsreader", size: 14 },
            },
            xaxis: {
              title: data!.plot_data.xlabel || "",
              color: "#888580",
              gridcolor: "#e0dbd3",
            },
            yaxis: {
              title: data!.plot_data.ylabel || "",
              color: "#888580",
              gridcolor: "#e0dbd3",
            },
            paper_bgcolor: "#fdf6e3",
            plot_bgcolor: "#fdf6e3",
            font: { color: "#1a1a1a", family: "Newsreader" },
            margin: { t: 40, r: 20, b: 50, l: 60 },
          },
          { responsive: true, displayModeBar: false }
        );
      } catch {
        // Plotly load failed
      }
    }

    renderPlot();
  }, [data]);

  const handleCheck = () => {
    setIsChecked(true);
    store.checkEquation(equation.id);
  };

  return (
    <div className="mb-14 bg-math-highlight border border-warning/15 rounded-lg p-6">
      {/* Equation label */}
      <p className="font-sans text-[10px] text-warning mb-5 uppercase tracking-[0.15em] font-medium">
        Equation {equation.label}
      </p>

      {/* Rendered equation */}
      <div
        ref={mathRef}
        className="text-xl text-center py-6 overflow-x-auto text-textpri"
      >
        {`$$${equation.latex}$$`}
      </div>

      {loading && (
        <div className="font-serif text-sm text-textmuted italic animate-pulse mt-4">
          Decoding equation...
        </div>
      )}

      {data && (
        <>
          <p className="font-serif text-[15px] text-textsec mb-6 leading-relaxed">
            {data.what_it_computes}
          </p>

          {/* Symbol table */}
          {data.symbol_breakdown.length > 0 && (
            <table className="w-full font-serif text-sm text-left border-collapse mb-6">
              <thead>
                <tr className="border-b border-bordercolor">
                  <th className="py-2 font-sans text-xs font-normal text-textmuted uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="py-2 font-sans text-xs font-normal text-textmuted uppercase tracking-wider">
                    Meaning
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.symbol_breakdown.map((sym, i) => (
                  <tr
                    key={i}
                    className="border-b border-bordercolor/50 last:border-0"
                  >
                    <td className="py-3 font-mono text-sm text-accent">{sym.symbol}</td>
                    <td className="py-3 text-textsec">{sym.meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Worked example */}
          {data.worked_example && (
            <div className="bg-elevated border border-bordercolor rounded-lg p-4 mb-6">
              <div className="font-sans text-[10px] text-textmuted uppercase tracking-[0.15em] mb-3">
                Worked Example
              </div>
              <p className="font-serif text-sm text-textsec mb-3">
                {data.worked_example.setup}
              </p>
              <div className="space-y-2">
                {data.worked_example.steps.map((step, i) => (
                  <p
                    key={i}
                    className="font-mono text-xs text-textsec leading-relaxed"
                  >
                    {step}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Plot */}
          {data.plot_data?.should_plot && (
            <div ref={plotRef} className="w-full h-64 mb-6 rounded-lg overflow-hidden" />
          )}
        </>
      )}

      {/* Checkbox gate */}
      <label className="flex items-center space-x-3 cursor-pointer group mt-4">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={handleCheck}
          className="w-4 h-4 rounded border-bordercolor bg-surface text-accent focus:ring-accent accent-accent"
        />
        <span className="font-sans text-sm text-textmuted group-hover:text-textpri transition-colors">
          I understand what this equation computes
        </span>
      </label>
    </div>
  );
}
