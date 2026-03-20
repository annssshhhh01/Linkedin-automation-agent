"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Check, Loader2 } from "lucide-react";

type Job = {
  id: number;
  role: string;
  company: string;
  location: string;
  matching_score: number;
};

type JobCardProps = {
  job: Job;
  onApprove: () => Promise<void>;
};

export default function JobCard({ job, onApprove }: JobCardProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove();
      setIsApproved(true);
      toast.success("Job Approved!");
    } catch (e) {
      toast.error("Failed to approve job");
    } finally {
      setIsApproving(false);
    }
  };

  const getColor = (score: number) => {
    if (score > 80) return "text-green-400";
    if (score > 60) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className={`p-5 rounded-2xl border flex justify-between items-center mb-4 transition ${
      isApproved ? "bg-green-900/20 border-green-800" : "bg-gray-900 border-gray-800 hover:scale-[1.02]"
    }`}>

      <div className={isApproved ? "opacity-60" : ""}>
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
        onClick={handleApprove}
        disabled={isApproving || isApproved}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition font-medium ${
          isApproved
            ? "bg-green-600/50 text-white cursor-not-allowed"
            : "bg-green-500 hover:bg-green-600 text-white"
        }`}
      >
        {isApproving ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Approving...</>
        ) : isApproved ? (
          <><Check className="w-4 h-4" /> Approved</>
        ) : (
          "Approve"
        )}
      </button>
    </div>
  );
}