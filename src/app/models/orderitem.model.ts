export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  discountPercentage?: number;
  nombre: string;
  telefono: string;
  direccion: string;
  image?: string;
  size: string;
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
  estado: string;
  municipio: string;
  items: OrderItem[]

  user?: {
    address: string;
    address2?: string;
    address3?: string;
    address4?: string;
    houseDescription?: string;
    municipality?: string;
    state?: string;
    postalCode?: string;
    name?: string;
    email?: string;
    phone?: string;
    countryName?: string;
    country?: string;
    countryId?: string;
  };
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
