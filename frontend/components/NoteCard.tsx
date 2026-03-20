"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Check, Loader2 } from "lucide-react";

type Note = {
  id: number;
  Name: string;
  note: string;
  "Job Role": string;
};

type NoteCardProps = {
  note: Note;
  onApprove: (editedNote: string) => Promise<void>;
};

export default function NoteCard({ note, onApprove }: NoteCardProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [editedNote, setEditedNote] = useState(note.note);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove(editedNote);
      setIsApproved(true);
      toast.success("Note Approved!");
    } catch (e) {
      toast.error("Failed to approve note");
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className={`p-5 rounded-xl mb-4 border transition ${
      isApproved ? "bg-purple-900/20 border-purple-800" : "bg-gray-800 border-gray-700 hover:scale-[1.01]"
    }`}>
      <div className={isApproved ? "opacity-60" : ""}>
      <h2 className="font-bold">{note.Name}</h2>
      <p>{note["Job Role"]}</p>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <p className="text-gray-400 text-sm mb-1">Generated Note</p>
          <div className="bg-gray-700/50 p-3 rounded-lg text-sm h-32 overflow-y-auto">
            {note.note}
          </div>
        </div>

        <div>
          <p className="text-gray-400 text-sm mb-1">Edit Note (Optional)</p>
          <textarea 
            value={editedNote}
            onChange={(e) => setEditedNote(e.target.value)}
            disabled={isApproved || isApproving}
            className="bg-gray-900/50 p-3 rounded-lg text-sm w-full h-32 resize-none border border-gray-700 focus:border-purple-500 focus:outline-none transition" 
          />
        </div>
      </div>

      <button 
        onClick={handleApprove} 
        disabled={isApproving || isApproved}
        className={`mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-medium transition ${
          isApproved
            ? "bg-purple-600/50 text-white cursor-not-allowed"
            : "bg-purple-500 hover:bg-purple-600 text-white"
        }`}
      >
        {isApproving ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Approving...</>
        ) : isApproved ? (
          <><Check className="w-4 h-4" /> Approved</>
        ) : (
          "Approve & Send"
        )}
      </button>
      </div>
    </div>
  );
}