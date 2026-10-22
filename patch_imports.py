import re

with open('frontend/src/app/restaurants/page.tsx', 'r') as f:
    content = f.read()

content = content.replace('from "@/components/ui/card"', 'from "@/components/Card"')
content = content.replace('from "@/components/ui/badge"', 'from "@/components/Badge"')
content = content.replace('from "@/components/ui/button"', 'from "@/components/Button"')
content = content.replace('from "@/components/ui/container"', 'from "@/components/Container"')
content = content.replace('from "@/components/ui/image-with-fallback"', 'from "@/components/ImageWithFallback"')
content = content.replace('import Navbar from "@/components/navbar/Navbar";', 'import Navbar from "@/components/Navbar";')

with open('frontend/src/app/restaurants/page.tsx', 'w') as f:
    f.write(content)

