import re
import os

for path in ["frontend/src/app/orders/page.tsx", "frontend/src/app/orders/[id]/page.tsx"]:
    with open(path, "r") as f:
        content = f.read()
    
    content = content.replace('case "PENDING":', 'case "CREATED":\n      case "PAYMENT_PENDING":')
    content = content.replace('case "READY":', 'case "READY_FOR_PICKUP":')
    
    with open(path, "w") as f:
        f.write(content)
