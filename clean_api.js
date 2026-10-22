const fs = require('fs');

let api = fs.readFileSync('frontend/src/lib/api.ts', 'utf8');

api = api.replace(/export const getMyStaffRequests[\s\S]*?res\.json\(\);\n};\n/g, '');
api = api.replace(/export const createInvitation[\s\S]*?res\.json\(\);\n};\n/g, '');
api = api.replace(/export const joinWithCode[\s\S]*?res\.json\(\);\n};\n/g, '');
api = api.replace(/export const getMyJoinRequests[\s\S]*?res\.json\(\);\n};\n/g, '');
api = api.replace(/export const getRestaurantJoinRequests[\s\S]*?res\.json\(\);\n};\n/g, '');
api = api.replace(/export const approveJoinRequest[\s\S]*?res\.json\(\);\n};\n/g, '');
api = api.replace(/export const rejectJoinRequest[\s\S]*?res\.json\(\);\n};\n/g, '');

fs.writeFileSync('frontend/src/lib/api.ts', api);
