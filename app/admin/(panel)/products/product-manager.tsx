"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductForm, type ProductFormCategory } from "@/components/admin/product-form";
import { SortableList } from "@/components/admin/sortable-list";
import { deleteProduct, reorderProducts } from "./actions";
import { formatCurrency } from "@/lib/api-client";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  inventory: number;
  sku: string | null;
}

interface ProductManagerProps {
  products: Product[];
  categories: ProductFormCategory[];
}

const ALL_CATEGORIES = "all";

export function ProductManager({ products, categories: formCategories }: ProductManagerProps) {
  const [items, setItems] = useState(products);
  const [prevProducts, setPrevProducts] = useState(products);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState<{ id: string; name: string } | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL_CATEGORIES);

  // Re-sync local (optimistic) order when the server sends a fresh products
  // list — adjusting state during render per React's recommended pattern.
  if (products !== prevProducts) {
    setPrevProducts(products);
    setItems(products);
  }

  const categories = useMemo(() => {
    return Array.from(new Set(items.map((p) => p.category))).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((p) => {
      const matchesSearch = !query || p.name.toLowerCase().includes(query);
      const matchesCategory = category === ALL_CATEGORIES || p.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [items, search, category]);

  const isFiltered = search.trim() !== "" || category !== ALL_CATEGORIES;

  const handleDelete = async () => {
    if (!isDeleteOpen) return;
    try {
      await deleteProduct(isDeleteOpen.id);
      setIsDeleteOpen(null);
    } catch (e: any) {
      alert(e.message || "Failed to delete product");
    }
  };

  async function handleReorder(orderedIds: string[]) {
    const byId = new Map(items.map((item) => [item.id, item]));
    setItems(orderedIds.map((id) => byId.get(id)!));
    try {
      await reorderProducts(orderedIds);
    } catch {
      setItems(products);
    }
  }

  function renderRow(product: Product) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card p-3">
        <div className="min-w-0 flex-1 basis-full sm:basis-auto">
          <p className="truncate font-medium text-foreground">{product.name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {product.category} · {product.sku ?? "No SKU"}
          </p>
        </div>
        <span className="text-sm text-muted-foreground">{formatCurrency(product.price)}</span>
        <span className="text-sm text-muted-foreground">{product.inventory} in stock</span>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/products/${product.id}`}>Edit</Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-label="Delete"
            onClick={() => setIsDeleteOpen({ id: product.id, name: product.name })}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Admin / products</p>
          <h1 className="text-2xl font-bold text-foreground">Product management</h1>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus size={16} /> Add product
        </Button>
      </div>

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-lg">{filtered.length} of {items.length} products</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Search by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56"
            />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {isFiltered ? (
            <>
              <p className="text-xs text-muted-foreground">
                Drag-to-reorder is disabled while filtering — clear the search and category filters to reorder.
              </p>
              {filtered.map((product) => (
                <div key={product.id}>{renderRow(product)}</div>
              ))}
              {filtered.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">No products match this filter.</p>
              )}
            </>
          ) : (
            <SortableList
              dndContextId="admin-products-list"
              items={items}
              onReorder={handleReorder}
              renderItem={renderRow}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <ProductForm categories={formCategories} onSuccess={() => setIsAddOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!isDeleteOpen} onOpenChange={(open) => !open && setIsDeleteOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{isDeleteOpen?.name}</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
