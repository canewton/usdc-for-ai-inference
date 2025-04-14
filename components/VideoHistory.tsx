import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { useSession } from "@/app/contexts/SessionContext";

interface VideoHistoryItem {
  id: string;
  task_id: string;
  prompt: string;
}

const VideoHistory = () => {
  const [videoHistory, setVideoHistory] = useState<VideoHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    const fetchHistory = async () => {
      if (session?.access_token) {
        try {
          setIsLoading(true);
          const response = await fetch("/api/videos", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (!response.ok) {
            throw new Error("Failed to fetch history");
          }

          const data = await response.json();
          setVideoHistory(data.videoGenerations || []);
        } catch (error) {
          console.error("Error fetching video history:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchHistory();
  }, [session]);

  const navigateToVideo = (taskId: string): void => {
    router.push(`/video/${taskId}`);
  };

  return (
    <div className="w-full border-t border-r rounded-r-2xl border-gray-200 p-4 h-screen overflow-y-auto bg-section">
      {/* History sections */}
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-500"></div>
        </div>
      ) : (
        <>
          {/* If we have video history, show it */}
          {videoHistory.length > 0 ? (
            <div>
              {videoHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => navigateToVideo(item.task_id)}
                >
                  <p className="text-md truncate">
                    {item.prompt || "New Chat"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div></div>
          )}
        </>
      )}
    </div>
  );
};

export default VideoHistory;
