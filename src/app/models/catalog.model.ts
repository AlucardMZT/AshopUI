import { Product } from './product.model';

export interface Catalog {
  id?: number;
  title?: string;
  name?: string;
  image?: string;    // portada o imagen del catálogo
  fileUrl?: string;  // URL del archivo (PDF/imagen) subido
  products?: Product[];
}
