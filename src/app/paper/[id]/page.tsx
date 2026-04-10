"use client";

import { useParams } from "next/navigation";
import { PaperJourneyShell } from "@/components/paper/PaperJourneyShell";

export default function PaperPage() {
  const params = useParams();
  const id = params.id as string;

  return <PaperJourneyShell arxivId={id} />;
}
