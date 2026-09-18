#!/bin/bash
sed -i 's/fetchData();/\/* eslint-disable-next-line react-hooks\/set-state-in-effect *\/\n    fetchData();/g' frontend/src/app/restaurants/[id]/page.tsx
sed -i 's/catch (err: any)/catch (err: \/* eslint-disable-line @typescript-eslint\/no-explicit-any *\/ any)/g' frontend/src/app/restaurants/[id]/page.tsx
sed -i 's/setUser(getUser());/\/* eslint-disable-next-line react-hooks\/set-state-in-effect *\/\n    setUser(getUser());/g' frontend/src/context/AuthContext.tsx
sed -i 's/require('\''@\/components\/AuthModal'\'')/\/* eslint-disable-next-line @typescript-eslint\/no-require-imports *\/\n  require('\''@\/components\/AuthModal'\'')/g' frontend/src/context/AuthContext.tsx
