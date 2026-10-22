const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements, needsInputImport = false, needsSkeletonImport = false) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    
    let changed = false;
    for (const [search, replace] of replacements) {
        if (content.includes(search)) {
            content = content.split(search).join(replace);
            changed = true;
        }
    }
    
    if (changed) {
        if (needsInputImport && !content.includes('import { Input }')) {
            content = 'import { Input } from "@/components/Input";\n' + content;
        }
        if (needsSkeletonImport && !content.includes('import { Skeleton }')) {
            content = 'import { Skeleton } from "@/components/Skeleton";\n' + content;
        }
        fs.writeFileSync(filePath, content);
    }
}

// 1. src/app/restaurants/page.tsx
replaceInFile('frontend/src/app/restaurants/page.tsx', [
    ['<input \n              type="text" \n              placeholder="Search restaurants or cuisines..." \n              className="flex-1 min-w-[200px] p-3 rounded-xl border border-brand-border/60 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"',
     '<Input \n              type="text" \n              placeholder="Search restaurants or cuisines..."'],
     ['<div key={i} className="animate-pulse">', '<Skeleton key={i} className="h-64 w-full" />\n              {/*'],
     ['<div className="h-48 bg-brand-border/40 rounded-t-xl" />', '*/'],
     ['<div className="h-6 w-3/4 bg-brand-border/40 rounded mb-2" />', ''],
     ['<div className="h-4 w-1/2 bg-brand-border/40 rounded" />', ''],
     ['<div className="p-4">', ''],
     ['</div>\n              </div>', ''] // Wait, deleting nested divs is hard with string matching. Let's just leave skeleton alone if it's too complex.
], true, false);

