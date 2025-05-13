import { useEffect, useRef, useState } from 'react';

export interface PollingOptions {
  url: string;
  body: any;
  interval?: number;
  isPolling?: boolean;
  onCheckPollingFinished: (result: any) => boolean;
  onError?: (error: any) => void;
}

export function usePolling({
  url,
  body,
  interval = 5000,
  isPolling = false,
  onCheckPollingFinished,
  onError,
}: PollingOptions) {
  const [data, setData] = useState<any>(null);
  const [isFinished, setIsFinished] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = async () => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);

      if (onCheckPollingFinished(result)) {
        setIsFinished(true);
      }
    } catch (err) {
      console.error('Polling error:', err);
      setIsFinished(true);
      if (onError) {
        onError(err);
      } else {
        console.error('No error handler provided:', err);
      }
    }
  };

  // Start/stop polling based on isPolling and isFinished
  useEffect(() => {
    if (!isPolling || isFinished) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial fetch immediately when polling starts
    fetchData();

    // Set up interval for subsequent fetches
    intervalRef.current = setInterval(fetchData, interval);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [url, JSON.stringify(body), interval, isPolling, isFinished]);

  // Reset finished state when polling restarts
  useEffect(() => {
    if (isPolling && isFinished) {
      setIsFinished(false);
    }
  }, [isPolling]);

  return data;
}
