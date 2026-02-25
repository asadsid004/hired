export type JobData = {
  id: number;
  jobTitle: string;
  company: string;
  location: string | null;
  userJobRecord: {
    status: "new" | "viewed" | "saved" | "applied" | "hidden" | "rejected";
    relevanceScore: string | null | number;
  };
};

export const JobCard = ({ job }: { job: JobData }) => {
  return (
    <div className="bg-card rounded-xl border p-4 transition-all hover:shadow-md">
      <h3 className="font-semibold">{job.jobTitle}</h3>
      <p className="text-muted-foreground text-sm">{job.company}</p>
      {job.location && (
        <p className="text-muted-foreground mt-1 text-xs">{job.location}</p>
      )}
    </div>
  );
};
