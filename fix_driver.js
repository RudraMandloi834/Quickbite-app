const fs = require('fs');
let order = fs.readFileSync('frontend/src/app/orders/[id]/page.tsx', 'utf8');

order = order.replace(`        if (delData && delData.deliveryAgentId) {
          const driverData = await getCustomerById(delData.deliveryAgentId);
          setDriver(driverData);
        }`, `        if (delData && delData.driverName) {
          setDriver({ name: delData.driverName, phone: delData.driverPhone });
        }`);

fs.writeFileSync('frontend/src/app/orders/[id]/page.tsx', order);
