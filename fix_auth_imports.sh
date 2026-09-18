#!/bin/bash
sed -i 's/apiLogin, apiSignup, apiLogout/login as apiLogin, signup as apiSignup/g' frontend/src/context/AuthContext.tsx
sed -i 's/apiLogout();/removeToken();/g' frontend/src/context/AuthContext.tsx
sed -i 's/saveToken/setToken/g' frontend/src/context/AuthContext.tsx
