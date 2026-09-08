const fs = require('fs');
let code = fs.readFileSync('src/main/java/com/quickbite/customer/Customer.java', 'utf8');
if (!code.includes('setPassword')) {
    code = code.replace(/public String getPassword\(\) \{\s*return password;\s*\}/, `public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }`);
}
fs.writeFileSync('src/main/java/com/quickbite/customer/Customer.java', code);
