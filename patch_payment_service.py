import re

file_path = "src/main/java/com/quickbite/payment/PaymentService.java"
with open(file_path, "r") as f:
    content = f.read()

# Add OrderLifecycleService
content = content.replace("private final OrderRepository orderRepository;", "private final OrderRepository orderRepository;\n    private final org.springframework.context.annotation.Lazy @org.springframework.beans.factory.annotation.Autowired com.quickbite.order.OrderLifecycleService lifecycleService;")

# Fix status checks
content = content.replace("OrderStatus.PENDING", "OrderStatus.PAYMENT_PENDING")

# Fix verifyPayment
verify_old = """order.confirm();
        orderRepository.save(order);"""
verify_new = """Long userId = com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId();
        lifecycleService.transitionOrder(order.getId(), OrderStatus.PAID, userId, "ROLE_CUSTOMER", "Payment verified");
        lifecycleService.transitionOrder(order.getId(), OrderStatus.CONFIRMED, userId, "ROLE_SYSTEM", "Auto-confirmed post payment");"""
content = content.replace(verify_old, verify_new)

# Add failPayment method
fail_payment_method = """
    @Transactional
    public Payment failPayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
        Long userId = com.quickbite.security.SecurityUtils.getAuthenticatedCustomerId();
        payment.setStatus(PaymentStatus.FAILED);
        payment = paymentRepository.save(payment);
        lifecycleService.transitionOrder(payment.getOrderId(), OrderStatus.PAYMENT_FAILED, userId, "ROLE_CUSTOMER", "Payment failed");
        return payment;
    }
"""
content = content.replace("public Payment getPayment(Long paymentId) {", fail_payment_method + "\n    public Payment getPayment(Long paymentId) {")

with open(file_path, "w") as f:
    f.write(content)

