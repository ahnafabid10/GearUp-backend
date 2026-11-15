export interface ICreateCategory {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
}

export interface IUpdateCategory {
  isActive?: boolean;
  name?: string;
  slug?: string;
  description?: string;
  image?: string;
}
