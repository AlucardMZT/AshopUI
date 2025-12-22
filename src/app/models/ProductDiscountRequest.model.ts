export interface ProductDiscountRequest {
  productId: number;
  percentage: number;
  startDate?: string;
  endDate?: string;
  description?: string;
}
