import { Product } from './product.model';

export interface Catalog {
  title: string;
  products: Product[];
}
