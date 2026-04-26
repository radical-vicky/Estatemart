export interface DeliveryLocation {
  id: string;
  user_id: string;
  resident_name: string;
  estate_name: string;
  house_number: string;
  landmark: string;
  delivery_instructions: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeliveryFormData {
  resident_name: string;
  estate_name: string;
  house_number: string;
  landmark: string;
  delivery_instructions: string;
}