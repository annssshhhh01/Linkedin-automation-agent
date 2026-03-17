type Job = {
  id: number;
  role: string;
  company: string;
  location: string;
  matching_score: number;
};

type JobCardProps = {
  job: Job;
  onApprove: () => void;
};

export default function JobCard({ job, onApprove }: JobCardProps) {
  const getColor = (score: number) => {
    if (score > 80) return "text-green-400";
    if (score > 60) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 flex justify-between items-center mb-4 hover:scale-[1.02] transition">

      <div>
        <h2 className="text-lg font-semibold">
          {job.role} @ {job.company}
        </h2>

        <p className="text-gray-400 text-sm">
          {job.location}
        </p>

        <p className={`mt-2 font-bold ${getColor(job.matching_score)}`}>
          Score: {job.matching_score}
        </p>
      </div>

      <button
        onClick={onApprove}
        className="bg-green-500 px-4 py-2 rounded-xl hover:bg-green-600 transition"
      >
        Approve
      </button>
    </div>
  );
}