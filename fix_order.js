const fs = require('fs');
let code = fs.readFileSync('src/main/java/com/quickbite/order/Order.java', 'utf8');

const additions = `
    @jakarta.persistence.Transient
    private String customerName;
    @jakarta.persistence.Transient
    private String customerPhone;
    @jakarta.persistence.Transient
    private String deliveryAddress;
    @jakarta.persistence.Transient
    private String paymentMethod;

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
`;

code = code.substring(0, code.lastIndexOf('}')) + additions + '}\n';
fs.writeFileSync('src/main/java/com/quickbite/order/Order.java', code);
