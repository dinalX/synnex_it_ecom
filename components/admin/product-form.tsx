"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct } from "@/app/admin/products/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ProductFormCategory {
  id: string;
  name: string;
  parentId: string;
  parentName: string;
}

interface ProductFormProps {
  categories: ProductFormCategory[];
  initialData?: {
    id?: string;
    name: string;
    slug?: string;
    category?: string;
    price: number;
    compareAt?: number;
    inventory: number;
    sku?: string;
    image: string;
    accent: string;
    description: string;
    shortDescription?: string;
    specs: string;
    published: boolean;
  };
  onSuccess?: () => void;
}

export function ProductForm({ categories, initialData, onSuccess }: ProductFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState(initialData?.image || "");
  const [isUploading, setIsUploading] = useState(false);

  const groupedCategories = categories.reduce<Record<string, ProductFormCategory[]>>((acc, cat) => {
    (acc[cat.parentName] ??= []).push(cat);
    return acc;
  }, {});
  const selectedCategoryId = categories.find((cat) => cat.name === initialData?.category)?.id;

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/uploads", {
        method: "POST",
        body,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Upload failed");
      }
      setImageUrl(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError(null);

    try {
      if (initialData?.id) {
        await updateProduct(initialData.id, formData);
      } else {
        await createProduct(formData);
      }
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (e: any) {
      setError(e.message || "An error occurred while saving the product");
    } finally {
      setIsLoading(false);
    }
  };

  // Guards the missing-photo case with preventDefault, before the form's
  // `action` fires — the action prop resets uncontrolled fields on every
  // completed submission (including an early return), so this check can't
  // live inside handleSubmit without wiping the rest of the form.
  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (!imageUrl) {
      event.preventDefault();
      setError("Please choose a photo before saving.");
    }
  };

  return (
    <form action={handleSubmit} onSubmit={handleFormSubmit} className="flex flex-col gap-6">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="flex flex-col gap-4">
        <p className="text-sm font-semibold text-muted-foreground">Identity</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="product-name">Name</Label>
            <Input id="product-name" name="name" required defaultValue={initialData?.name} placeholder="e.g. POS Thermal Printer" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="product-slug">Slug</Label>
            <Input id="product-slug" name="slug" defaultValue={initialData?.slug} placeholder="Optional — leave blank to keep current slug" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="product-category">Category</Label>
            <Select name="categoryId" defaultValue={selectedCategoryId}>
              <SelectTrigger id="product-category" className="w-full"><SelectValue placeholder="Select a category" /></SelectTrigger>
              <SelectContent>
                {Object.entries(groupedCategories).map(([parentName, items]) => (
                  <SelectGroup key={parentName}>
                    <SelectLabel>{parentName}</SelectLabel>
                    {items.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="product-sku">SKU</Label>
            <Input id="product-sku" name="sku" defaultValue={initialData?.sku} placeholder="Optional" />
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <p className="text-sm font-semibold text-muted-foreground">Pricing &amp; inventory</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="product-price">Price (LKR)</Label>
            <Input id="product-price" name="price" type="number" required defaultValue={initialData?.price} placeholder="0" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="product-compare-at">Compare at price (LKR)</Label>
            <Input id="product-compare-at" name="compareAt" type="number" defaultValue={initialData?.compareAt} placeholder="Optional" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="product-inventory">Inventory</Label>
            <Input id="product-inventory" name="inventory" type="number" required defaultValue={initialData?.inventory} placeholder="0" />
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <p className="text-sm font-semibold text-muted-foreground">Media</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="product-accent">Accent color</Label>
            <input
              id="product-accent"
              name="accent"
              type="color"
              defaultValue={initialData?.accent || "#1f8a70"}
              className="h-9 w-full rounded-md border border-input"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="product-image-upload">Photo</Label>
            <Button asChild variant="outline" className="w-fit" disabled={isUploading}>
              <label htmlFor="product-image-upload" className="cursor-pointer">
                {isUploading ? "Uploading…" : "Choose photo"}
              </label>
            </Button>
            <input
              id="product-image-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              onChange={handleImageUpload}
              disabled={isUploading}
              className="hidden"
            />
            <input type="hidden" name="image" value={imageUrl} />
          </div>

          {imageUrl && (
            <div className="md:col-span-2">
              <div className="relative h-40 w-40 overflow-hidden rounded-md border border-border bg-muted">
                <Image src={imageUrl} alt="Product preview" fill sizes="160px" className="object-cover" />
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <p className="text-sm font-semibold text-muted-foreground">Content</p>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="product-short-description">Short description</Label>
            <Textarea id="product-short-description" name="shortDescription" defaultValue={initialData?.shortDescription} placeholder="Brief product summary (shown on product cards)" rows={2} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="product-description">Description</Label>
            <Textarea id="product-description" name="description" required defaultValue={initialData?.description} placeholder="Product description..." />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="product-specs">Specifications (Markdown or plain text)</Label>
            <Textarea id="product-specs" name="specs" required defaultValue={initialData?.specs} placeholder={"Weight: 1.2kg\nDimensions: 10x10x10cm"} />
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <p className="text-sm font-semibold text-muted-foreground">Status</p>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox name="published" defaultChecked={initialData?.published ?? true} />
          Published to store
        </label>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Saving..." : initialData?.id ? "Update Product" : "Create Product"}
      </Button>
    </form>
  );
}
