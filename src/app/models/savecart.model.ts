export interface SavedCart {
  id: number;          // <- importante para eliminar
  name: string;
  itemsJson: string;   // o items: any[], depende cómo lo devuelvas
  createdAt: string;   // opcional
}
