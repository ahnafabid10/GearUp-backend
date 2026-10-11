import { OrderStatus } from "../../../generated/prisma/enums";

export interface ICreateRentalOrder {
  gearId: string;
  startDate: string | Date;
  endDate: string | Date;
  notes?: string;
}

export interface IUpdateOrderStatus {
  status: OrderStatus;
}
