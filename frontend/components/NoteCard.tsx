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
    <div 
      style={{ transform: 'perspective(1000px) rotateX(var(--rot-x, 0deg)) rotateY(var(--rot-y, 0deg))', transformStyle: 'preserve-3d', willChange: 'transform' }}
      className={`p-5 rounded-xl mb-4 border transition-all duration-300 ${
        isApproved 
          ? "bg-green-900/10 border-green-800/30 backdrop-blur-md shadow-none" 
          : "bg-white/[0.03] border-white/10 hover:border-green-400/40 hover:bg-white/[0.05] hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] backdrop-blur-xl"
      }`}
    >
      <div className={isApproved ? "opacity-60" : ""}>
      <h2 className="font-bold text-white">{note.Name}</h2>
      <p className="text-gray-400 text-sm">{note["Job Role"]}</p>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-2 font-mono">Generated Note</p>
          <div className="bg-black/40 border border-white/5 p-3 rounded-lg text-sm h-32 overflow-y-auto text-gray-200">
            {note.note}
          </div>
        </div>

        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-2 font-mono">Edit Note (Optional)</p>
          <textarea 
            value={editedNote}
            onChange={(e) => setEditedNote(e.target.value)}
            disabled={isApproved || isApproving}
            className="bg-black/20 p-3 rounded-lg text-sm w-full h-32 resize-none border border-white/10 focus:border-green-400 focus:bg-black/40 focus:outline-none transition-all text-gray-200" 
          />
        </div>
      </div>

      <button 
        onClick={handleApprove} 
        disabled={isApproving || isApproved}
        className={`mt-5 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-medium transition-all duration-300 ${
          isApproved
            ? "bg-green-500/10 text-green-500 border border-green-500/20 cursor-not-allowed"
            : "bg-gradient-to-r from-[#00ff87] to-[#00c96a] hover:from-[#00c96a] hover:to-[#00a555] text-black border border-[#00ff87]/50 shadow-[0_0_15px_rgba(0,255,135,0.2)] hover:shadow-[0_0_25px_rgba(0,255,135,0.4)] hover:-translate-y-0.5"
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