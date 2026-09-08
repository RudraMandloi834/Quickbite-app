const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/restaurants/[id]/page.tsx', 'utf8');

// Imports
code = code.replace(/import \{ addItemToCart \} from "@\/lib\/cart";/, 'import { addItemToCart, checkCartConflict } from "@/lib/cart";\nimport { ReplaceCartModal } from "@/components/ReplaceCartModal";\nimport { CartDisplay } from "@/types/cart";');

// State hooks
const stateHooks = `  const [addingItemId, setAddingItemId] = useState<number | null>(null);
  const [cartToast, setCartToast] = useState<{ message: string; subtext?: string } | null>(null);
  
  const [pendingReplacement, setPendingReplacement] = useState<{
    currentCart: CartDisplay;
    newItem: MenuItem;
  } | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);`;

code = code.replace(/const \[addingItemId, setAddingItemId\] = useState<number \| null>\(null\);\n\s*const \[cartToast, setCartToast\] = useState<\{ message: string; subtext\?: string \} \| null>\(null\);/, stateHooks);

// handleAddToCart
const handleAddToCartReplacement = `const handleAddToCart = async (item: MenuItem, forceReplace = false) => {
    if (!restaurant) return;
    
    if (!forceReplace) {
       setAddingItemId(item.id);
       try {
         const conflictCheck = await checkCartConflict(restaurant.id);
         if (conflictCheck.conflict) {
            setPendingReplacement({ currentCart: conflictCheck.cartDisplay, newItem: item });
            setAddingItemId(null);
            return;
         }
       } catch (err) {
         // ignore and proceed
       }
    } else {
       setAddingItemId(item.id);
    }
    
    try {
      const { replacedRestaurant } = await addItemToCart(restaurant.id, item.id, 1, forceReplace);
      setCartToast({
        message: \`Added "\${item.name}" to cart\`,
        subtext: replacedRestaurant
          ? "Replaced items from your previous restaurant"
          : undefined,
      });
      setTimeout(() => setCartToast(null), 4000);
      if (forceReplace) {
         setPendingReplacement(null);
      }
    } catch (err) {
      if (err instanceof Error && err.message === "CART_CONFLICT") {
         // Should not happen as we catch it before, but just in case
         return;
      }
      setCartToast({
        message: "Failed to add item to cart",
        subtext: err instanceof Error ? err.message : "Please try again",
      });
      setTimeout(() => setCartToast(null), 4000);
    } finally {
      setAddingItemId(null);
      setIsReplacing(false);
    }
  };

  const confirmReplacement = async () => {
    if (!pendingReplacement || !restaurant) return;
    setIsReplacing(true);
    await handleAddToCart(pendingReplacement.newItem, true);
  };`;

code = code.replace(/const handleAddToCart = async \([\s\S]*?setAddingItemId\(null\);\n\s*\}\n\s*\};/, handleAddToCartReplacement);

// Render modal
const modalRender = `      {/* Replacement Modal */}
      <ReplaceCartModal
        isOpen={!!pendingReplacement}
        onClose={() => setPendingReplacement(null)}
        onConfirm={confirmReplacement}
        currentCart={pendingReplacement?.currentCart || null}
        newRestaurant={restaurant}
        newItem={pendingReplacement?.newItem || null}
        isReplacing={isReplacing}
      />
      
      <Container>`;

code = code.replace(/<Container>/, modalRender);

fs.writeFileSync('frontend/src/app/restaurants/[id]/page.tsx', code);
