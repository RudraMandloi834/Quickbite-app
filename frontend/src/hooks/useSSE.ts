import { useEffect, useState, useRef } from "react";
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
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!token) {
      setConnectionStatus("Disconnected");
      return;
    }

    const connect = () => {
      abortControllerRef.current = new AbortController();
      setConnectionStatus("Connecting");

      fetchEventSource(getApiBaseUrl() + "/api/events/stream", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        },
        signal: abortControllerRef.current.signal,
        onopen: async (res) => {
          if (res.ok && res.status === 200) {
            setConnectionStatus("Connected");
          } else if (res.status >= 400 && res.status < 500 && res.status !== 429) {
            // Client error, do not retry
            setConnectionStatus("Disconnected");
            throw new Error(`Failed with ${res.status}`);
          }
        },
        onmessage: (msg) => {
          if (msg.event === "PING" || msg.data.includes('"type":"PING"')) {
             return;
          }
          if (msg.data) {
             const eventData = JSON.parse(msg.data) as SseEvent;
             onEvent(eventData);
          }
        },
        onclose: () => {
          setConnectionStatus("Disconnected");
        },
        onerror: (err) => {
          setConnectionStatus("Disconnected");
          // throw error to retry
          throw err;
        },
      });
    };

    connect();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [token]);

  return { connectionStatus };
}
