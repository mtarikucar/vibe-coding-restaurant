export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  imageFile?: File; // For handling file uploads in forms
  category?: Category;
  categoryId: string;
  isAvailable: boolean;
  preparationTime?: number;
  ingredients?: string[];
  allergens?: string[];
  nutritionalInfo?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}
