export interface ICreatePaymentIntent {
  rentalOrderId: string;
}

export interface IConfirmPayment {
  rentalOrderId: string;
  paymentIntentId: string;
}

export interface ICreateCheckoutSession {
  rentalOrderId: string;
}

export interface IVerifyCheckoutSession {
  rentalOrderId: string;
  sessionId: string;
}
