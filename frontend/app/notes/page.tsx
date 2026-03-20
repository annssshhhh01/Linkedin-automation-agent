"use client";

import { useEffect, useState } from "react";
import { getNotes, approveNote } from "@/lib/api";
import NoteCard from "@/components/NoteCard";

export default function Notes() {
 type Note = {
  id: number;
  Name: string;
  note: string;
  "Job Role": string;
};

const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    getNotes().then(res => setNotes(res.data.outreach));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Notes</h1>

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
  );
}