export interface ProductDiscountRequest {
  productId: number;
  percentage: number;
  startDate?: string; // Opcional si no quieres forzar fechas
  endDate?: string;   // Opcional
  description?: string;
}
