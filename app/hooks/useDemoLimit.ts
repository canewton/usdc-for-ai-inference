import { useEffect, useState } from "react";
import { toast } from "sonner";

export function useDemoLimit() {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkLimit() {
      try {
        const response = await fetch("/api/check-demo-limit");
        const data = await response.json();

        if (response.ok) {
          setRemaining(data.remaining);
        } else {
          toast.error("Failed to check demo limit");
        }
      } catch (error) {
        console.error("Error checking demo limit:", error);
        toast.error("Failed to check demo limit");
      } finally {
        setLoading(false);
      }
    }

    checkLimit();
  }, []);

  return { remaining, loading };
}
