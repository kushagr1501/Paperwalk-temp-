"use client";

import { useState } from "react";
import type { UserContext } from "@/types/paper";

const LANGUAGES = [
  "Python",
  "C++",
  "CUDA",
  "JavaScript",
  "Rust",
  "Go",
  "Java",
];

const NATIVE_LANGUAGES = [
  "English", "Mandarin", "Hindi", "Spanish", "French", "Arabic",
  "Bengali", "Portuguese", "Russian", "Japanese", "German", "Korean",
  "Tamil", "Telugu", "Turkish", "Vietnamese", "Italian", "Thai",
  "Polish", "Dutch", "Other",
];

interface UserContextIntakeProps {
  onComplete: (ctx: UserContext) => void;
}

export function UserContextIntake({ onComplete }: UserContextIntakeProps) {
  const [backgroundLevel, setBackgroundLevel] = useState<
    "beginner" | "intermediate" | "expert" | null
  >(null);
  const [programmingLanguage, setProgrammingLanguage] = useState<string>("");
  const [otherLanguage, setOtherLanguage] = useState("");
  const [nativeLanguage, setNativeLanguage] = useState("English");

  const selectedLang = programmingLanguage === "Other" ? otherLanguage : programmingLanguage;
  const canProceed = backgroundLevel && selectedLang;

  const handleSubmit = () => {
    if (!backgroundLevel || !selectedLang) return;
    onComplete({
      backgroundLevel,
      programmingLanguage: selectedLang,
      nativeLanguage,
    });
  };

  return (
    <div className="w-full max-w-xl">
      <h2 className="font-serif text-2xl font-medium mb-2 text-textpri">
        Before we begin
      </h2>
      <p className="font-serif text-textmuted mb-10 italic">
        Tell us a little about yourself so we can calibrate the walkthrough.
      </p>

      {/* Q1: Background */}
      <div className="mb-10">
        <label className="block font-sans text-xs text-textmuted mb-4 uppercase tracking-wider">
          How familiar are you with this field?
        </label>
        <div className="grid grid-cols-3 gap-3">
          {(["beginner", "intermediate", "expert"] as const).map((level) => (
            <button
              key={level}
              onClick={() => setBackgroundLevel(level)}
              className={`border rounded-lg py-4 text-center transition-colors ${
                backgroundLevel === level
                  ? "border-accent bg-accent-light text-textpri"
                  : "border-bordercolor bg-surface text-textmuted hover:border-accent-dim hover:text-textpri"
              }`}
            >
              <div className="font-serif font-medium capitalize">
                {level}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Q2: Programming Language */}
      <div className="mb-10">
        <label className="block font-sans text-xs text-textmuted mb-4 uppercase tracking-wider">
          Which programming language do you think in?
        </label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => setProgrammingLanguage(lang)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors font-sans ${
                programmingLanguage === lang
                  ? "bg-accent text-white"
                  : "bg-surface border border-bordercolor text-textpri hover:border-accent-dim"
              }`}
            >
              {lang}
            </button>
          ))}
          <button
            onClick={() => setProgrammingLanguage("Other")}
            className={`px-4 py-2 rounded-lg text-sm transition-colors font-sans ${
              programmingLanguage === "Other"
                ? "bg-accent text-white"
                : "bg-surface border border-bordercolor text-textpri hover:border-accent-dim"
            }`}
          >
            Other
          </button>
          {programmingLanguage === "Other" && (
            <input
              type="text"
              value={otherLanguage}
              onChange={(e) => setOtherLanguage(e.target.value)}
              placeholder="Type language..."
              className="bg-surface border border-bordercolor px-4 py-2 rounded-lg text-sm text-textpri outline-none focus:border-accent w-32 font-sans"
            />
          )}
        </div>
      </div>

      {/* Q3: Native Language */}
      <div className="mb-12">
        <label className="block font-sans text-xs text-textmuted mb-4 uppercase tracking-wider">
          Your first language?
        </label>
        <select
          value={nativeLanguage}
          onChange={(e) => setNativeLanguage(e.target.value)}
          className="w-full bg-surface border border-bordercolor rounded-lg px-4 py-3 font-sans text-sm text-textpri outline-none focus:border-accent appearance-none cursor-pointer"
        >
          {NATIVE_LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!canProceed}
        className="w-full bg-accent text-white font-sans text-base py-4 rounded-lg hover:bg-accent-dim transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continue to Prerequisites &rarr;
      </button>
    </div>
  );
}
