#!/bin/bash
cat << 'INNER_EOF' >> frontend/src/lib/api.ts

export const getWsBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
};
INNER_EOF
