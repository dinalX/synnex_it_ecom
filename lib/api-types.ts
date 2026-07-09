export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  categoryId: string | null;
  price: number;
  compareAt: number | null;
  rating: number;
  inventory: number;
  sku: string | null;
  image: string;
  accent: string;
  description: string;
  specs: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  categoryRef?: Category | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
};

export type ProductImage = {
  id: string;
  productId: string;
  url: string;
  alt: string | null;
  sortOrder: number;
};

export type ProductVariant = {
  id: string;
  productId: string;
  sku: string;
  name: string;
  optionName: string | null;
  optionValue: string | null;
  price: number;
  compareAt: number | null;
  inventory: number;
  imageUrl: string | null;
  active: boolean;
  sortOrder: number;
};

export type Category = {
  id: string;
  parentId: string | null;
  slug: string;
  path: string | null;
  name: string;
  shortDescription: string | null;
  description: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  bannerImageUrl: string | null;
  icon: string | null;
  accent: string;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  sortOrder: number;
  featured: boolean;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  children?: Category[];
  parent?: Category | null;
};

export type CartItem = {
  id: string;
  cartId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  createdAt: string;
  updatedAt: string;
  product?: Product;
  variant?: ProductVariant;
};

export type Cart = {
  id: string;
  customerId: string | null;
  sessionId: string | null;
  status: string;
  currency: string;
  subtotal: number;
  createdAt: string;
  updatedAt: string;
  items: CartItem[];
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string | null;
  variantId: string | null;
  sku: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  productData: string | null;
  product?: Product;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerId: string | null;
  assignedAdminId: string | null;
  customer: string;
  email: string | null;
  phone: string | null;
  status: string;
  paymentMode: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  total: number;
  currency: string;
  notes: string | null;
  billingAddress: string | null;
  shippingAddress: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
};

export type JobPost = {
  id: string;
  slug: string;
  title: string;
  department: string;
  location: string;
  type: string;
  summary: string;
  requirements: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DriverDownload = {
  id: string;
  slug: string;
  title: string;
  deviceType: string;
  version: string;
  os: string;
  fileUrl: string;
  notes: string;
  published: boolean;
  updatedAt: string;
};

export type PageContent = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  seoTitle: string | null;
  seoDescription: string | null;
  published: boolean;
  updatedAt: string;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
