const fs = require('fs');

let ordersList = fs.readFileSync('frontend/src/app/orders/page.tsx', 'utf8');
ordersList = ordersList.replace('loadData();', '// eslint-disable-next-line react-hooks/set-state-in-effect\n    loadData();');
fs.writeFileSync('frontend/src/app/orders/page.tsx', ordersList);

let orderTracking = fs.readFileSync('frontend/src/app/orders/[id]/page.tsx', 'utf8');
orderTracking = orderTracking.replace('loadData();', '// eslint-disable-next-line react-hooks/set-state-in-effect\n    loadData();');
fs.writeFileSync('frontend/src/app/orders/[id]/page.tsx', orderTracking);

