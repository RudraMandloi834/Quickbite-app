const fs = require('fs');

let entity = fs.readFileSync('src/main/java/com/quickbite/restaurant/Restaurant.java', 'utf8');

entity = entity.replace(
  'private String rejectionReason;',
  `private String rejectionReason;
    
    private String phone;
    private String email;
    private String openingTime;
    private String closingTime;`
);

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

entity = entity.replace(/}$/, gettersSetters + '\n}');

fs.writeFileSync('src/main/java/com/quickbite/restaurant/Restaurant.java', entity);

let dto = fs.readFileSync('src/main/java/com/quickbite/restaurant/CreateRestaurantRequest.java', 'utf8');
dto = dto.replace(
  'String name,',
  `String name,
        String phone,
        String email,
        String openingTime,
        String closingTime,`
);
fs.writeFileSync('src/main/java/com/quickbite/restaurant/CreateRestaurantRequest.java', dto);
