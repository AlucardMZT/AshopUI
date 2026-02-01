import { Product } from './product.model';

export interface Catalog {
  id?: number;
  title?: string;
  name?: string;
  image?: string;
  fileUrl?: string;
  catalog_pdf?: string | null;
  products?: Product[];
}
