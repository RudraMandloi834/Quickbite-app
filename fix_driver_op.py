import re
with open("frontend/src/app/driver/page.tsx", "r") as f: content = f.read()
content = content.replace("user?.email", "user?.id")
with open("frontend/src/app/driver/page.tsx", "w") as f: f.write(content)

with open("frontend/src/app/operator/restaurants/page.tsx", "r") as f: content = f.read()
content = content.replace("ownerEmail", "username")
content = content.replace("r.createdAt", "r.createdAt || new Date().toISOString()")
content = content.replace("r.address", "r.location")
content = content.replace("r.contactPhone", "r.contactInfo")
with open("frontend/src/app/operator/restaurants/page.tsx", "w") as f: f.write(content)
