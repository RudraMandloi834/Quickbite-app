#!/usr/bin/env bash

set -e

echo "Starting QuickBite backend..."

(
  set -a
  source .env
  set +a
  mvn spring-boot:run -Dspring-boot.run.profiles=dev
) &

BACKEND_PID=$!

echo "Starting QuickBite frontend..."

(
  cd frontend
  npm run dev
) &

FRONTEND_PID=$!

trap 'kill $BACKEND_PID $FRONTEND_PID' EXIT

wait
