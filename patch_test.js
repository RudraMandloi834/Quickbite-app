const fs = require('fs');
let code = fs.readFileSync('src/test/java/com/quickbite/payment/PaymentControllerSecurityTest.java', 'utf8');

code = code.replace(/\.andExpect\(status\(\)\.isNotFound\(\)\); \/\/ Expect 404 Not Found, not 403/, '.andExpect(status().isForbidden()); // Expect 403 because order belongs to someone else');

fs.writeFileSync('src/test/java/com/quickbite/payment/PaymentControllerSecurityTest.java', code);
