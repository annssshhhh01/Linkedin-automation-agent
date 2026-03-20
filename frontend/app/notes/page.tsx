"use client";

import { useEffect, useState } from "react";
import { getNotes, approveNote } from "@/lib/api";
import NoteCard from "@/components/NoteCard";

import { Loader2 } from "lucide-react";

export default function Notes() {
 type Note = {
  id: number;
  Name: string;
  note: string;
  "Job Role": string;
};

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotes().then(res => {
      const data = res.outreach || res.data?.outreach || [];
      setNotes(data);
    }).catch(() => {
      setNotes([]);
    }).finally(() => setLoading(false));

    // 3D Parallax Mouse Tracking
    const handleMouseMove = (e: MouseEvent) => {
      const px = e.clientX / window.innerWidth;
      const py = e.clientY / window.innerHeight;
      const rxDeg = (py - 0.5) * -10;
      const ryDeg = (px - 0.5) * 10;
      document.documentElement.style.setProperty('--rot-x', `${rxDeg}deg`);
      document.documentElement.style.setProperty('--rot-y', `${ryDeg}deg`);
    };
    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white relative p-8 overflow-hidden">
      {/* Background Effects */}
      <div className="dash-bg-mesh" />
      <div className="dash-grid-overlay" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="mb-10 flex items-center justify-between">
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Pending <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ff87] to-[#00c96a]">Notes</span>
          </h1>
          <div className="text-xs font-mono text-[#00ff87] bg-[#00ff87]/10 px-4 py-2 rounded-full border border-[#00ff87]/20 backdrop-blur-md shadow-[0_0_15px_rgba(0,255,135,0.1)]">
            {notes.length} notes found
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="w-10 h-10 animate-spin text-[#00ff87] mb-6 drop-shadow-[0_0_10px_rgba(0,255,135,0.5)]" />
            <p className="text-gray-400 font-mono text-xs uppercase tracking-widest">Loading outreach notes...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-8 border border-white/10 rounded-2xl bg-white/[0.03] backdrop-blur-xl shadow-2xl">
            <div className="text-5xl mb-6 opacity-30 text-[#00ff87]">◎</div>
            <p className="text-gray-400 font-mono text-sm">No pending notes found.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {notes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onApprove={async (editedNote: string) => {
                  await approveNote({ 
                    note_decision: { 
                      id: note.id,
                      status: "approved",
                      edited: editedNote
                    } 
                  });
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}