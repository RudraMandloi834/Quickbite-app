#!/bin/bash
sed -i 's/const conflict = await checkCartConflict(restaurant.id);/const conflictRes = await checkCartConflict(restaurant.id);/g' frontend/src/app/restaurants/[id]/page.tsx
sed -i 's/if (conflict) {/if (conflictRes.conflict \&\& conflictRes.cartDisplay) {/g' frontend/src/app/restaurants/[id]/page.tsx
sed -i 's/currentCart: conflict,/currentCart: conflictRes.cartDisplay,/g' frontend/src/app/restaurants/[id]/page.tsx
sed -i 's/<Badge variant="primary">/<Badge variant="neutral">/g' frontend/src/app/restaurants/[id]/page.tsx
