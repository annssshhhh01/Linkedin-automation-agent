"use client";

import { useEffect, useState } from "react";
import { getJobs, approveJob } from "@/lib/api";
import JobCard from "@/components/JobCard";

export default function Jobs() {
  type Job = {
  id: number;
  role: string;
  company: string;
  location: string;
  matching_score: number;
};

const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    getJobs().then(res => setJobs(res.data));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Jobs</h1>

      {jobs.map(job => (
        <JobCard
          key={job.id}
          job={job}
          onApprove={async () => {
            await approveJob({ decisions: { [job.id]: true } });
          }}
        />
      ))}
    </div>
  );
}