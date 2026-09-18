#!/bin/bash
sed -i 's/export const getApiBaseUrl = (): string => {/export const getApiBaseUrl = (): string => {\n  return process.env.NEXT_PUBLIC_API_URL || "http:\/\/localhost:8080";\n};\n\n\/\/ old code removed/g' frontend/src/lib/api.ts
sed -i '/\/\/ old code removed/{n;N;N;N;d;}' frontend/src/lib/api.ts
