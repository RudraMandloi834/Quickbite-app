#!/bin/bash
sed -i '/const getApiBaseUrl = () => {/,/};/d' frontend/src/app/driver/page.tsx
