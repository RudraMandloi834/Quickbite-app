const fs = require('fs');
let code = fs.readFileSync('frontend/src/context/AuthContext.tsx', 'utf8');

if (!code.includes('auth_unauthorized')) {
    code = code.replace(/useEffect\(\(\) => \{\n\s*setUser\(getUser\(\)\);\n\s*setLoading\(false\);\n\s*\}, \[\]\);/, `useEffect(() => {
    setUser(getUser());
    setLoading(false);
    
    const handleUnauthorized = () => {
      removeToken();
      setUser(null);
      setIsModalOpen(true);
    };
    
    window.addEventListener("auth_unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth_unauthorized", handleUnauthorized);
  }, []);`);
    fs.writeFileSync('frontend/src/context/AuthContext.tsx', code);
}
