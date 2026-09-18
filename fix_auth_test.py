import re
file_path = "src/test/java/com/quickbite/auth/AuthControllerTest.java"
with open(file_path, "r") as f:
    content = f.read()

content = re.sub(r'new SignupRequest\(([^,]+),\s*([^,]+),\s*([^,)]+)\)', r'new SignupRequest(\1, \2, \3, "ROLE_CUSTOMER")', content)

with open(file_path, "w") as f:
    f.write(content)
