"use client";

import { scrapeJobs, scrapePeople, generateNotes, sendConnections } from "@/lib/api";

export default function Automation() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Automation</h1>

      <div className="grid grid-cols-2 gap-6">
        <Btn text="Scrape Jobs" fn={scrapeJobs} />
        <Btn text="Scrape People" fn={scrapePeople} />
        <Btn text="Generate Notes" fn={generateNotes} />
        <Btn text="Send Connections" fn={sendConnections} />
      </div>
    </div>
  );
}

type BtnProps = {
  text: string;
  fn: () => void;
};

function Btn({ text, fn }: BtnProps) {
  return (
    <button onClick={fn} className="bg-blue-600 p-4 rounded-xl">
      {text}
    </button>
  );
}