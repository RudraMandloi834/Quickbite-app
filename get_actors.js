const { execSync } = require('child_process');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('quickbite_db.mv.db'); // Wait, it's H2! I need to use a JDBC script or an API.
