"use client";

import { useEffect, useState } from "react";
import { API_URL, getHealth, type Health } from "./api";

export type BackendStatus =
  | { state: "checking" }
  | { state: "missing" } // NEXT_PUBLIC_API_URL not set
  | { state: "unreachable" }
  | { state: "ready"; health: Health };

/** Shared, cached backend probe for the Lab experiments. */
export function useBackend(): BackendStatus {
  const [status, setStatus] = useState<BackendStatus>(API_URL ? { state: "checking" } : { state: "missing" });

  useEffect(() => {
    if (!API_URL) return;
    let cancelled = false;
    getHealth().then((health) => {
      if (!cancelled) setStatus(health ? { state: "ready", health } : { state: "unreachable" });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
