import re
with open("frontend/src/app/driver/page.tsx", "r") as f: content = f.read()
content = content.replace("user?.id", "user?.sub")
with open("frontend/src/app/driver/page.tsx", "w") as f: f.write(content)
