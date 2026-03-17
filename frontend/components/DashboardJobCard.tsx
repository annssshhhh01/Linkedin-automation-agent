"use client";

import { Check, X, MapPin, Building2, TrendingUp } from "lucide-react";

type Job = {
  id: number;
  role: string;
  company: string;
  location: string;
  matching_score: number;
  matching_reason?: string;
  status?: string;
};

type DashboardJobCardProps = {
  job: Job;
  onApprove: () => void;
  onReject: () => void;
};

export default function DashboardJobCard({ job, onApprove, onReject }: DashboardJobCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: "bg-green-500/15", text: "text-green-400", border: "border-green-500/30" };
    if (score >= 60) return { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30" };
    return { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30" };
  };

  const colors = getScoreColor(job.matching_score || 0);
  const isApproved = job.status === "approved";
  const isRejected = job.status === "rejected";

  return (
    <div
      className={`glass-card p-5 transition-all duration-300 ${
        isApproved ? "border-green-500/20" : isRejected ? "border-red-500/20 opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[15px] text-[var(--text-primary)] truncate">
            {job.role}
          </h3>

          <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-secondary)]">
            <span className="flex items-center gap-1">
              <Building2 size={12} /> {job.company}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={12} /> {job.location}
            </span>
          </div>

          {job.matching_reason && (
            <p className="text-xs text-[var(--text-muted)] mt-2 line-clamp-2">
              {job.matching_reason}
            </p>
          )}
        </div>

        {/* Score Badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${colors.bg} ${colors.border} shrink-0`}>
          <TrendingUp size={14} className={colors.text} />
          <span className={`text-sm font-bold ${colors.text}`}>
            {job.matching_score || "—"}
          </span>
        </div>
      </div>

      {/* Actions */}
      {!isApproved && !isRejected && (
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[var(--border-glass)]">
          <button
            onClick={onApprove}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/20 transition-colors"
          >
            <Check size={14} /> Approve
          </button>
          <button
            onClick={onReject}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors"
          >
            <X size={14} /> Reject
          </button>
        </div>
      )}

      {isApproved && (
        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-[var(--border-glass)] text-green-400 text-xs">
          <Check size={14} /> Approved
        </div>
      )}
    </div>
  );
}
