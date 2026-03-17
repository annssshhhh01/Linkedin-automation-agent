"use client";

import StepCard from "@/components/StepCard";
import { scrapeJobs, generateNotes, sendConnections } from "@/lib/api";

export default function Pipeline() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Pipeline</h1>

      <div className="flex gap-4">
        <StepCard title="Scrape Jobs" onClick={scrapeJobs} />
        <StepCard title="Generate Notes" onClick={generateNotes} />
        <StepCard title="Send Connections" onClick={sendConnections} />
      </div>
    </div>
  );
}