#!/bin/bash
sed -i '/\/\/ old code removed/{N;d;}' frontend/src/lib/api.ts
