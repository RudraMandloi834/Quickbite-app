#!/bin/bash
sed -i 's/return localStorage.getItem("token");/const t = localStorage.getItem("token");\n    if (t === "undefined" || t === "null") return null;\n    return t;/g' frontend/src/lib/auth.ts
