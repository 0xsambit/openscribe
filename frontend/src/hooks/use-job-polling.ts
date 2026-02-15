import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useJobResult } from './use-analysis';

export type JobPhase = 'idle' | 'queued' | 'thinking' | 'completed' | 'failed';

interface UseJobPollingOptions {
  /** Query keys to invalidate once the job completes */
  invalidateKeys?: string[][];
  /** Callback fired when the job transitions to 'completed' */
  onComplete?: () => void;
  /** Callback fired when the job transitions to 'failed' */
  onFailed?: (error?: string) => void;
}

interface JobPollingState {
  phase: JobPhase;
  progress: number;
  error: string | null;
  isThinking: boolean;
}

/**
 * Reusable hook that wraps `useJobResult` and provides a clean
 * thinking / progress / done lifecycle for async AI jobs.
 *
 * Usage:
 *   const [jobId, setJobId] = useState<string | null>(null);
 *   const job = useJobPolling(jobId, { invalidateKeys: [['strategy']] });
 *   // job.phase  -> 'idle' | 'queued' | 'thinking' | 'completed' | 'failed'
 *   // job.isThinking -> true while AI is running
 */
export function useJobPolling(
  jobId: string | null,
  options: UseJobPollingOptions = {},
): JobPollingState {
  const { invalidateKeys = [], onComplete, onFailed } = options;
  const queryClient = useQueryClient();

  const { data: jobData } = useJobResult(jobId);

  const [phase, setPhase] = useState<JobPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = useCallback(() => {
    for (const key of invalidateKeys) {
      queryClient.invalidateQueries({ queryKey: key });
    }
    onComplete?.();
  }, [invalidateKeys, queryClient, onComplete]);

  const handleFailed = useCallback(
    (msg?: string) => {
      onFailed?.(msg);
    },
    [onFailed],
  );

  useEffect(() => {
    if (!jobId) {
      setPhase('idle');
      setProgress(0);
      setError(null);
      return;
    }

    if (!jobData?.data) {
      setPhase('queued');
      return;
    }

    const job = jobData.data;
    const status: string = job.status;
    const jobProgress: number = job.progress ?? 0;

    setProgress(jobProgress);

    if (status === 'completed' && phase !== 'completed') {
      setPhase('completed');
      setProgress(100);
      handleComplete();
    } else if (status === 'failed' && phase !== 'failed') {
      setPhase('failed');
      setError(job.errorMessage ?? 'Job failed');
      handleFailed(job.errorMessage);
    } else if (status === 'processing') {
      setPhase('thinking');
    } else if (status === 'pending') {
      setPhase('queued');
    }
  }, [jobId, jobData, phase, handleComplete, handleFailed]);

  return {
    phase,
    progress,
    error,
    isThinking: phase === 'queued' || phase === 'thinking',
  };
}
