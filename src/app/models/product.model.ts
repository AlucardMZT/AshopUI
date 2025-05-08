import { Category } from './category.model';

export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  image2?: string;
  image3?: string;
  description: string;
  stock: number;
  size: string;
  sizes?: string[];
  category: Category;
}
