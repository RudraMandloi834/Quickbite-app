const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/restaurants/[id]/page.tsx', 'utf8');

if (!code.includes('useRouter')) {
    code = code.replace(/import \{ useEffect, useState \} from "react";/, 'import { useEffect, useState } from "react";\nimport { useRouter } from "next/navigation";');
    code = code.replace(/export default function RestaurantPage\(\) \{/, 'export default function RestaurantPage() {\n  const router = useRouter();');
}

if (!code.includes('import { getUser } from "@/lib/auth";')) {
    code = code.replace(/import \{ getRestaurantById, getRestaurantMenu \} from "@\/lib\/api";/, 'import { getRestaurantById, getRestaurantMenu } from "@/lib/api";\nimport { getUser } from "@/lib/auth";');
}

code = code.replace(/const handleAddToCart = async \(item: MenuItem\) => \{/, 
`const handleAddToCart = async (item: MenuItem) => {
    if (!getUser()) {
      router.push(\`/login?redirect=/restaurants/\${restaurant?.id}&message=Log in to add items to your cart.\`);
      return;
    }`);

fs.writeFileSync('frontend/src/app/restaurants/[id]/page.tsx', code);
