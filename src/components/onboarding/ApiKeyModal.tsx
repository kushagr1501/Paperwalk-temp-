"use client";

import { useState, useEffect } from "react";

const MODELS = [
  { value: "gpt-5.4-mini", label: "GPT-5.4 Mini", desc: "Fast and efficient" },
  { value: "gpt-5.4-nano", label: "GPT-5.4 Nano", desc: "Lightweight tasks" },
  { value: "gpt-5.3", label: "GPT-5.3", desc: "Strong all-rounder" },
  { value: "gpt-5.2", label: "GPT-5.2", desc: "Balanced quality" },
  { value: "gpt-5-mini", label: "GPT-5 Mini", desc: "Compact and capable" },
  { value: "gpt-5-nano", label: "GPT-5 Nano", desc: "Ultra-light" },
  {
    value: "gemini-3.1-pro",
    label: "Gemini 3.1 Pro",
    desc: "Most thorough (recommended for math-heavy papers)",
  },
  {
    value: "gemini-3-flash",
    label: "Gemini 3 Flash",
    desc: "Fast and balanced (recommended)",
  },
  {
    value: "gemini-3.1-flash-lite",
    label: "Gemini 3.1 Flash Lite",
    desc: "Fastest (recommended for long papers)",
  },
];

interface ApiKeyModalProps {
  onClose: () => void;
  required?: boolean;
}

export function ApiKeyModal({ onClose, required = false }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gemini-2.5-pro");

  useEffect(() => {
    const savedKey = localStorage.getItem("paperwalk_api_key") || "";
    const savedModel =
      localStorage.getItem("paperwalk_model") || "gemini-2.5-pro";
    setApiKey(savedKey);
    setModel(savedModel);
  }, []);

  const handleSave = () => {
    if (!apiKey.trim()) return;
    localStorage.setItem("paperwalk_api_key", apiKey.trim());
    localStorage.setItem("paperwalk_model", model);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface border border-bordercolor rounded-lg p-8 shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="font-serif text-xl font-medium text-textpri mb-6">
          API Configuration
        </h2>

        <div className="mb-6">
          <label className="block font-sans text-xs text-textmuted mb-2 uppercase tracking-wider">
            API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-frog-..."
            className="w-full bg-base border border-bordercolor rounded px-4 py-3 font-mono text-sm text-textpri outline-none focus:border-accent transition-colors"
          />
          <div className="font-mono text-xs text-textmuted mt-2">
            Base URL: https://frogapi.app/v1
          </div>
        </div>

        <div className="mb-8">
          <label className="block font-sans text-xs text-textmuted mb-2 uppercase tracking-wider">
            Model
          </label>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {MODELS.map((m) => (
              <button
                key={m.value}
                onClick={() => setModel(m.value)}
                className={`w-full text-left border rounded px-4 py-3 transition-colors ${
                  model === m.value
                    ? "border-accent bg-accent-light"
                    : "border-bordercolor bg-base hover:border-accent-dim"
                }`}
              >
                <div className="font-sans text-sm font-medium text-textpri">
                  {m.label}
                </div>
                <div className="font-sans text-xs text-textmuted mt-0.5">
                  {m.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        <p className="font-sans text-xs text-textmuted mb-6 leading-relaxed">
          Your key is stored in your browser only. It never leaves your device except to call FrogAPI.
        </p>

        <div className="flex gap-3">
          {!required && (
            <button
              onClick={onClose}
              className="flex-1 border border-bordercolor text-textmuted font-sans text-sm py-3 rounded hover:border-accent-dim hover:text-textpri transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="flex-1 bg-accent text-white font-sans text-sm py-3 rounded hover:bg-accent-dim transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
