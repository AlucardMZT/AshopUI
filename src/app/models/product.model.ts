import { Category } from './category.model';

export interface Product {
  id: number;
  name: string;
  price: number; // Este puede seguir usándose internamente
  originalPrice?: number; // 👈 Precio antes del descuento
  finalPrice?: number;    // 👈 Precio con descuento aplicado

  image: string;
  image2?: string;
  image3?: string;
  description: string;
  stock: number;
  size: string;
  sizes?: string[];
  category: Category;

  discountPrice?: number;
  hasDiscount?: boolean;
  discountPercentage?: number;
  discountSource?: 'PRODUCT' | 'CATEGORY' | 'NONE';
  discountId?: number;
  startDate?: string;
  endDate?: string;
}
