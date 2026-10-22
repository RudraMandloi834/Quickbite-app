import { useEffect, useState, useRef, useCallback } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { getApiBaseUrl } from "@/lib/api";

type SseEvent = {
  eventId: string;
  type: string;
  orderId?: number;
  restaurantId?: number;
  customerId?: number;
  driverId?: number;
  status: string;
  occurredAt: string;
};

export function useSSE(token: string | null, onEvent: (event: SseEvent) => void) {
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("disconnected");
  const abortControllerRef = useRef<AbortController | null>(null);
  const onEventRef = useRef(onEvent);
  const retryCount = useRef(0);

  // Keep ref fresh so we don't need it in dependency array
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const connect = useCallback(() => {
    if (!token) {
      setConnectionStatus("disconnected");
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    setConnectionStatus("connecting");

    fetchEventSource(getApiBaseUrl() + "/api/events/stream", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/event-stream",
      },
      signal: abortControllerRef.current.signal,
      async onopen(res) {
        if (res.ok && res.status === 200) {
          setConnectionStatus("connected");
          retryCount.current = 0;
        } else if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          setConnectionStatus("disconnected");
          // E.g., 401 Unauthorized -> we should throw to abort retries until a new token is given
          throw new Error(`Failed with ${res.status}`);
        }
      },
      onmessage(msg) {
        if (msg.event === "PING" || msg.data.includes('"type":"PING"') || msg.event === "INIT" || msg.data.includes('"type":"INIT"')) {
           return;
        }
        if (msg.data) {
           try {
             const eventData = JSON.parse(msg.data) as SseEvent;
             onEventRef.current(eventData);
           } catch (e) {
             console.error("Failed to parse SSE msg:", e);
           }
        }
      },
      onclose() {
        setConnectionStatus("connecting");
        // Throw an error to trigger onerror -> auto-retry via fetchEventSource
        throw new Error("Connection closed gracefully by server");
      },
      onerror(err) {
        setConnectionStatus("connecting");
        if (err && err.message && err.message.includes("401")) {
          setConnectionStatus("disconnected");
          throw err; // Stop retrying entirely if 401
        }
        // Exponential backoff
        const timeout = Math.min(1000 * Math.pow(2, retryCount.current), 15000);
        retryCount.current += 1;
        return timeout; 
      },
    }).catch((err) => {
      setConnectionStatus("disconnected");
      console.warn("SSE stream failed:", err.message);
    });
  }, [token]);

  useEffect(() => {
    connect();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [connect]);

  return { connectionStatus };
}
