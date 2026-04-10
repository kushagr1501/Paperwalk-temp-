"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { setPdf } from "@/lib/idb";

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleFile = useCallback(
    (file: File) => {
      if (file.type !== "application/pdf") {
        setError("Only PDF files are supported.");
        return;
      }
      const localId = `upload-${Date.now()}`;

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          await setPdf(
            `paperwalk_upload_${localId}`,
            reader.result as string
          );
          router.push(`/paper/${localId}`);
        } catch (err: unknown) {
          console.error("Failed to store PDF:", err);
          const msg = err instanceof Error ? err.message : "File too large for browser storage. Try a smaller PDF.";
          setError(msg);
        }
      };
      reader.readAsDataURL(file);
    },
    [router]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="absolute inset-0 overflow-y-auto w-full flex flex-col items-center pt-24 px-4">
      <h1 className="font-serif text-3xl font-medium text-textpri mb-2">
        Upload a PDF
      </h1>
      <p className="font-serif text-base text-textmuted italic mb-14">
        Drop a research paper PDF and walk through it.
      </p>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`w-full max-w-lg border border-dashed rounded-lg p-16 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-accent bg-accent-light"
            : "border-bordercolor hover:border-accent-dim"
        }`}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <div className="font-serif text-4xl text-textmuted mb-4">&#128196;</div>
        <p className="font-serif text-textsec mb-2">
          Drop your PDF here, or click to browse.
        </p>
        <p className="font-sans text-xs text-textmuted">PDF files only</p>
        <input
          id="file-input"
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {error && (
        <div className="mt-6 border border-error/30 rounded-lg px-4 py-3 font-sans text-sm text-error bg-error/5 max-w-lg w-full">
          {error}
        </div>
      )}
    </div>
  );
}
