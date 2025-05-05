export interface OrderItem {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  price: number;
  nombre: string;
  telefono: string;
  direccion: string;
  image?: string;
}

export interface Order {
  id?: number;
  orderNumber: string;
  createdAt: string;
  status: string;
  total: number;
  nombre: string;
  telefono: string;
  direccion: string;
  items: OrderItem[];
}

export interface PlaceOrderRequest {
  items: {
    productId: number;
    productName: string;
    price: number;
    quantity: number;
    image: string;
  }[];
  nombre: string;
  telefono: string;
  direccion: string;
  total: number;
}
