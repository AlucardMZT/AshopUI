import { Category } from './category.model';

export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
  category: Category;
}
