import { Category } from './category.model';

export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  finalPrice?: number;

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
