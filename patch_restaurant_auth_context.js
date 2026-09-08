const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/restaurants/[id]/page.tsx', 'utf8');

code = code.replace(/import \{ getUser \} from "@\/lib\/auth";/, 'import { useAuth } from "@/context/AuthContext";');

code = code.replace(/export default function RestaurantDetailsPage\(\) \{\n  const router = useRouter\(\);/, 'export default function RestaurantDetailsPage() {\n  const router = useRouter();\n  const { requireAuth } = useAuth();');

code = code.replace(/const handleAddToCart = async \(item: MenuItem\) => \{\n    if \(!getUser\(\)\) \{\n      router\.push\(`\/login\?redirect=\/restaurants\/\$\{restaurant\?\.id\}&message=Log in to add items to your cart\.`\);\n      return;\n    \}/, `const handleAddToCart = async (item: MenuItem) => {`);

code = code.replace(/onClick=\{.*?handleAddToCart\(item\)\}/, 'onClick={() => requireAuth(() => handleAddToCart(item))}');

fs.writeFileSync('frontend/src/app/restaurants/[id]/page.tsx', code);
