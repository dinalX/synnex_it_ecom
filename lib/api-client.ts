import type {
  Product,
  Category,
  Cart,
  CartItem,
  Order,
  JobPost,
  DriverDownload,
  PageContent,
  Pagination,
} from "./api-types";

const API_BASE = "";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  return res.json() as Promise<T>;
}

export async function getProducts(params?: {
  search?: string;
  category?: string;
  subcategory?: string;
  sort?: string;
  page?: number;
  limit?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.search) sp.set("search", params.search);
  if (params?.category) sp.set("category", params.category);
  if (params?.subcategory) sp.set("subcategory", params.subcategory);
  if (params?.sort) sp.set("sort", params.sort);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.limit) sp.set("limit", String(params.limit));
  const query = sp.toString();
  return apiFetch<{ products: Product[]; pagination: Pagination }>(
    `/api/products${query ? `?${query}` : ""}`
  );
}

export async function getProduct(slug: string) {
  return apiFetch<{ product: Product }>(`/api/products/${slug}`);
}

export async function getCategories() {
  return apiFetch<{ categories: Category[] }>("/api/categories");
}

export async function getCategory(slug: string) {
  return apiFetch<{ category: Category }>(`/api/categories/${slug}`);
}

export async function getCart() {
  return apiFetch<{ cart: Cart }>("/api/cart");
}

export async function addToCart(data: { productId: string; variantId?: string; quantity?: number }) {
  return apiFetch<{ cart: Cart }>("/api/cart", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCartItem(itemId: string, quantity: number) {
  return apiFetch<{ cart: Cart }>("/api/cart/items", {
    method: "PATCH",
    body: JSON.stringify({ itemId, quantity }),
  });
}

export async function removeCartItem(itemId: string) {
  return apiFetch<{ cart: Cart }>("/api/cart/items", {
    method: "DELETE",
    body: JSON.stringify({ itemId }),
  });
}

export async function createOrder(data: {
  customer: string;
  email: string;
  phone: string;
  shippingAddress?: string;
  billingAddress?: string;
  notes?: string;
  paymentMode?: string;
}) {
  return apiFetch<{ order: Order }>("/api/orders", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getOrders(params?: { status?: string; page?: number; limit?: number }) {
  const sp = new URLSearchParams();
  if (params?.status) sp.set("status", params.status);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.limit) sp.set("limit", String(params.limit));
  const query = sp.toString();
  return apiFetch<{ orders: Order[]; pagination: Pagination }>(
    `/api/orders${query ? `?${query}` : ""}`
  );
}

export async function getOrder(id: string) {
  return apiFetch<{ order: Order }>(`/api/orders/${id}`);
}

export async function registerCustomer(data: { email: string; name: string; phone?: string; password: string }) {
  return apiFetch<{ customer: { id: string; email: string; name: string } }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getSession() {
  return apiFetch<{ user: { id?: string; email: string; name: string; role: string } | null; admin: { id?: string; email: string; name: string; role: string } | null }>("/api/auth/me");
}

export async function getJobs(params?: { slug?: string }) {
  const sp = new URLSearchParams();
  if (params?.slug) sp.set("slug", params.slug);
  const query = sp.toString();
  return apiFetch<{ jobs: JobPost[]; job?: JobPost }>(`/api/jobs${query ? `?${query}` : ""}`);
}

export async function getDownloads(params?: { search?: string }) {
  const sp = new URLSearchParams();
  if (params?.search) sp.set("search", params.search);
  const query = sp.toString();
  return apiFetch<{ downloads: DriverDownload[] }>(`/api/downloads${query ? `?${query}` : ""}`);
}

export async function getPage(slug: string) {
  return apiFetch<{ page: PageContent }>(`/api/pages/${slug}`);
}

export async function adminGetProducts(params?: { search?: string; category?: string; sort?: string; page?: number; limit?: number }) {
  const sp = new URLSearchParams();
  if (params?.search) sp.set("search", params.search);
  if (params?.category) sp.set("category", params.category);
  if (params?.sort) sp.set("sort", params.sort);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.limit) sp.set("limit", String(params.limit));
  const query = sp.toString();
  return apiFetch<{ products: Product[]; pagination: Pagination }>(
    `/api/admin/products${query ? `?${query}` : ""}`
  );
}

export async function adminCreateProduct(data: Partial<Product>) {
  return apiFetch<{ product: Product }>("/api/admin/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function adminUpdateProduct(id: string, data: Partial<Product>) {
  return apiFetch<{ product: Product }>(`/api/admin/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function adminDeleteProduct(id: string) {
  return apiFetch<{ success: boolean }>(`/api/admin/products/${id}`, {
    method: "DELETE",
  });
}

export async function adminGetCategories() {
  return apiFetch<{ categories: Category[]; tree: Category[] }>("/api/admin/categories");
}

export async function adminCreateCategory(data: Partial<Category>) {
  return apiFetch<{ category: Category }>("/api/admin/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function adminUpdateCategory(id: string, data: Partial<Category>) {
  return apiFetch<{ category: Category }>(`/api/admin/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function adminDeleteCategory(id: string) {
  return apiFetch<{ success: boolean }>(`/api/admin/categories/${id}`, {
    method: "DELETE",
  });
}

export async function adminGetOrders(params?: { status?: string; page?: number; limit?: number }) {
  const sp = new URLSearchParams();
  if (params?.status) sp.set("status", params.status);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.limit) sp.set("limit", String(params.limit));
  const query = sp.toString();
  return apiFetch<{ orders: Order[]; pagination: Pagination }>(
    `/api/admin/orders${query ? `?${query}` : ""}`
  );
}

export async function adminUpdateOrder(id: string, data: Partial<Order>) {
  return apiFetch<{ order: Order }>(`/api/admin/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(value);
}

export type {
  Product,
  Category,
  Cart,
  CartItem,
  Order,
  OrderItem,
  JobPost,
  DriverDownload,
  PageContent,
} from "./api-types";

export type { Pagination } from "./api-types";
