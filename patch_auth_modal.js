const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/AuthModal.tsx', 'utf8');

// Inside <button type="button" onClick={() => setView("signup")}...
code = code.replace(/onClick=\{\(\) => setView\("signup"\)\}/g, 'onClick={() => { setView("signup"); setError(""); }}');
code = code.replace(/onClick=\{\(\) => setView\("login"\)\}/g, 'onClick={() => { setView("login"); setError(""); }}');

fs.writeFileSync('frontend/src/components/AuthModal.tsx', code);
