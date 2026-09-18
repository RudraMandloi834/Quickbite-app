import re

file_path = "src/main/java/com/quickbite/payment/PaymentController.java"
with open(file_path, "r") as f:
    content = f.read()

new_method = """
    @PostMapping("/{paymentId}/fail")
    public Payment failPayment(@PathVariable Long paymentId) {
        return paymentService.failPayment(paymentId);
    }
}
"""
content = content.replace("}\n", new_method, 1)

with open(file_path, "w") as f:
    f.write(content)
