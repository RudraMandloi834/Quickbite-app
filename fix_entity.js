const fs = require('fs');

let entity = fs.readFileSync('src/main/java/com/quickbite/restaurant/Restaurant.java', 'utf8');

const gettersSetters = `
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getOpeningTime() { return openingTime; }
    public void setOpeningTime(String openingTime) { this.openingTime = openingTime; }
    public String getClosingTime() { return closingTime; }
    public void setClosingTime(String closingTime) { this.closingTime = closingTime; }
`;

entity = entity.substring(0, entity.lastIndexOf('}')) + gettersSetters + '}\n';

fs.writeFileSync('src/main/java/com/quickbite/restaurant/Restaurant.java', entity);
