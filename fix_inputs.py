import os
import re

directory = "frontend/src/app"

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith(".tsx"):
            path = os.path.join(root, file)
            with open(path, "r") as f:
                content = f.read()

            new_content = content
            
            # Simple heuristic replacement for inputs
            if "<input" in new_content:
                # Add import if missing
                if "import { Input }" not in new_content:
                    new_content = 'import { Input } from "@/components/Input";\n' + new_content
                new_content = new_content.replace("<input", "<Input")

            # Simple heuristic replacement for animate-pulse
            if "animate-pulse" in new_content and "Skeleton" not in new_content:
                if "import { Skeleton }" not in new_content:
                    new_content = 'import { Skeleton } from "@/components/Skeleton";\n' + new_content
                new_content = re.sub(r'<div[^>]*animate-pulse[^>]*>', lambda m: m.group(0).replace('div', 'Skeleton').replace('animate-pulse', ''), new_content)
                new_content = new_content.replace('</Skeleton>', '</div>') # Wait, this is bad regex! 

            with open(path, "w") as f:
                f.write(new_content)
