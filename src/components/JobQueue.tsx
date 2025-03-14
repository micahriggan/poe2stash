import React from "react";
import { Job } from "../jobs/Job";
import { Jobs } from "../services/JobQueue";
import { wait } from "../utils/wait";

interface JobQueueProps {
  jobs: Job<any>[];
  setJobs: (jobs: Job<any>[]) => void;
  setErrorMessage: (message: string) => void;
}

export async function handleJob<T>(
  job: Job<T>,
  setJobs: (jobs: Job<T>[]) => void,
  setErrorMessage: (message: string) => void,
) {
  try {
    setErrorMessage("");
    const origDone = job.onDone;
    const origFail = job.onFail;

    job.onDone = async (progress) => {
      await origDone(progress);
      await wait(10000);
      setJobs(Jobs.getRunningJobs());
    };

    job.onFail = async (progress) => {
      await origFail(progress);
      await wait(10000);
      setJobs(Jobs.getRunningJobs());
    };

    const task = Jobs.start(job);
    setJobs(Jobs.getRunningJobs());
    await task;
  } catch (error: any) {
    console.error("Error price checking items:", error);
    if (typeof error === "object" && "message" in error) {
      setErrorMessage(error.message);
    } else {
      setErrorMessage(job.name + " failed. Sorry about that");
    }
  }
}

export const JobQueue: React.FC<JobQueueProps> = ({
  jobs,
  setJobs,
  setErrorMessage,
}) => {
  const handleCancel = (jobId: string) => {
    Jobs.cancelJob(jobId);
    setErrorMessage("");
    setJobs(Jobs.getRunningJobs());
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-4">
      <h2 className="text-xl font-semibold text-white mb-4">Job Queue</h2>
      {jobs.length === 0 ? (
        <p className="text-gray-300">No active jobs</p>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="bg-gray-700 p-4 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium text-white">{job.name}</h3>
                <button
                  onClick={() => handleCancel(job.id)}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded"
                >
                  Cancel
                </button>
              </div>
              <p className="text-gray-300 text-sm mb-2">{job.description}</p>
              <p className="text-red-200 text-sm mb-2">{job.error}</p>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Status: {job.status}</span>
                {job.currentProgress && (
                  <span className="text-gray-400">
                    Progress: {job.currentProgress.current} /{" "}
                    {job.currentProgress.total}
                  </span>
                )}
              </div>
              {job.currentProgress && (
                <div className="mt-2 bg-gray-600 rounded-full h-2.5">
                  <div
                    className="bg-blue-500 h-2.5 rounded-full"
                    style={{
                      width: `${(job.currentProgress.current / job.currentProgress.total) * 100}%`,
                    }}
                  ></div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
