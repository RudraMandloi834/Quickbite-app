const fs = require('fs');
let code = fs.readFileSync('src/main/java/com/quickbite/payment/RazorpayClientWrapper.java', 'utf8');

code = code.replace(/this\.client = new RazorpayClient\(keyId, keySecret\);/, `System.out.println("RAZORPAY_KEY_ID received: [" + keyId + "]");
                System.out.println("RAZORPAY_KEY_SECRET received: [" + keySecret + "]");
                this.client = new RazorpayClient(keyId, keySecret);`);

fs.writeFileSync('src/main/java/com/quickbite/payment/RazorpayClientWrapper.java', code);
