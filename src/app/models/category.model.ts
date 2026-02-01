export interface Category {
  id: number;
  name: string;
  type?: string;
  image?: string;
  // Referencia al archivo de catálogo almacenado (uuid, path o url)
  catalog_pdf?: string | null;
  // URL directa del archivo (si la API la proporciona)
  fileUrl?: string | null;
}
