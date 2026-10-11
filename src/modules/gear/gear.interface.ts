export interface ICreateGear {
  title: string;
  description: string;
  brand: string;
  categoryId: string;
  dailyPrice: number;
  depositAmount?: number;
  totalStock?: number;
  images?: string[];
  specifications?: any;
  isAvailable?: boolean;
}

export interface IUpdateGear {
  title?: string;
  description?: string;
  brand?: string;
  categoryId?: string;
  dailyPrice?: number;
  depositAmount?: number;
  totalStock?: number;
  availableStock?: number;
  images?: string[];
  specifications?: any;
  isAvailable?: boolean;
}

export interface IGearQuery {
  search?: string;
  category?: string;
  categoryId?: string;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
  isAvailable?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
