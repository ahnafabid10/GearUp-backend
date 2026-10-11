export interface ICreatePaymentIntent {
  rentalOrderId: string;
}

export interface IConfirmPayment {
  rentalOrderId: string;
  paymentIntentId: string;
}
