export interface CategoryDiscount {
  id: number;
  categoryId: number;
  percentage: number;
  description: string;
  startDate: string;
  endDate: string;
  category?: { id: number; name: string };
}

