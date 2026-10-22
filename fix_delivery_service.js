const fs = require('fs');
let code = fs.readFileSync('src/main/java/com/quickbite/delivery/DeliveryService.java', 'utf8');

code = code.replace(
  'public class DeliveryService {',
  '@org.springframework.transaction.annotation.Transactional\npublic class DeliveryService {'
);

code = code.replace(/@org\.springframework\.transaction\.annotation\.Transactional/g, '');
code = code.replace(
  'public class DeliveryService {',
  '@org.springframework.transaction.annotation.Transactional\npublic class DeliveryService {'
);

fs.writeFileSync('src/main/java/com/quickbite/delivery/DeliveryService.java', code);
