const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/Navbar.tsx', 'utf8');

code = code.replace(/import \{ getUser, removeToken \} from "@\/lib\/auth";/, 'import { useAuth } from "@/context/AuthContext";');
code = code.replace(/const \[user, setUser\] = useState<ReturnType<typeof getUser> \| null>\(null\);\n  const isLoggedIn = !!user;[\s\S]*?setUser\(null\);\n  \};/, `const { user, logout, requireAuth } = useAuth();
  const isLoggedIn = !!user;

  const handleLogout = () => {
    logout();
    router.push("/");
  };`);
  
// Replace login and signup Links with modal triggers
code = code.replace(/<Link href="\/login".*?>\s*Log in\s*<\/Link>/, `<button onClick={() => requireAuth(() => {})} className="text-sm font-medium text-brand-fg hover:text-brand-primary transition-colors">Log in</button>`);
code = code.replace(/<Link\s*href="\/signup"\s*className="rounded-full bg-brand-fg px-4 py-2 text-sm font-medium text-brand-bg hover:bg-brand-fg\/90 transition-colors"\s*>\s*Sign up\s*<\/Link>/, `<button onClick={() => requireAuth(() => {})} className="rounded-full bg-brand-fg px-4 py-2 text-sm font-medium text-brand-bg hover:bg-brand-fg/90 transition-colors">Sign up</button>`);

fs.writeFileSync('frontend/src/components/Navbar.tsx', code);
