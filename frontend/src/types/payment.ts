export interface PaymentInitiationResponse {
  paymentId: number;
  orderId: number;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  razorpayKeyId: string;
}

export interface PaymentVerificationRequest {
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

export interface Payment {
  id: number;
  orderId: number;
  amount: number;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
}
