const fs = require('fs');

let controller = fs.readFileSync('src/main/java/com/quickbite/customer/CustomerController.java', 'utf8');

const newMethod = `
    @GetMapping("/me")
    public Customer getMe() {
        Long customerId = SecurityUtils.getAuthenticatedCustomerId();
        return customerService.getCustomerById(customerId);
    }
`;

controller = controller.replace(
    '    @GetMapping("/{customerId}")',
    newMethod + '\n    @GetMapping("/{customerId}")'
);

fs.writeFileSync('src/main/java/com/quickbite/customer/CustomerController.java', controller);
