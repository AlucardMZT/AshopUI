export interface UpdateUserRequest {
  email: string;
  password?: string;
  nickname: string;
  name: string;
  address: string;
  postalCode: string;
  phone: string;
  state: string;
  municipality: string;
  houseDescription: string;
}
