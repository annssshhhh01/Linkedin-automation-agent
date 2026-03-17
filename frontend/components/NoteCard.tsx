type Note = {
  id: number;
  Name: string;
  note: string;
  "Job Role": string;
};

type NoteCardProps = {
  note: Note;
  onApprove: () => void;
};

export default function NoteCard({ note, onApprove }: NoteCardProps) {
  return (
    <div className="bg-gray-800 p-4 rounded-xl mb-4">
      <h2 className="font-bold">{note.Name}</h2>
      <p>{note["Job Role"]}</p>

      <div className="grid grid-cols-2 gap-4 mt-2">
        <div>
          <p className="text-gray-400 text-sm">AI Note</p>
          <div className="bg-gray-700 p-2 rounded">{note.note}</div>
        </div>

        <textarea defaultValue={note.note} className="bg-gray-900 p-2 rounded" />
      </div>

      <button onClick={onApprove} className="mt-2 bg-purple-500 px-4 py-2 rounded">
        Approve
      </button>
    </div>
  );
}