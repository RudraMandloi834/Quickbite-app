import re

filepath = "frontend/src/lib/api.ts"
with open(filepath, "r") as f:
    content = f.read()

# Replace any occurrence of `return res.json();` without a preceding `if (!res.ok)` block.
# Actually, it's safer to just change `authFetch` wrapper so it throws automatically!

# Wait, the easiest way is to modify `authFetch`:
# function authFetch(...)
# res = await fetch(...)
# if (!res.ok) {
#   let msg = await res.text().catch(() => "");
#   throw new ApiError(msg, res.status);
# }

