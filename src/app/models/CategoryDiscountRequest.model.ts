export interface CategoryDiscountRequestModel {
  id?: number;
  categoryId: number;
  percentage: number;
  startDate: string;
  endDate: string;
  description: string;
}
