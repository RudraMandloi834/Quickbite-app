const fs = require('fs');
let code = fs.readFileSync('src/main/java/com/quickbite/order/OrderService.java', 'utf8');

// Remove cart clearing from createOrderFromCart
code = code.replace(/        cartItemRepository\.deleteByCartId\(cartId\);\n        cart\.setTotalAmount\(BigDecimal\.ZERO\);\n        cartRepository\.save\(cart\);/g, '');

fs.writeFileSync('src/main/java/com/quickbite/order/OrderService.java', code);
