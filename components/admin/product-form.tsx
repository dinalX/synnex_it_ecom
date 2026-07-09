"use client";

import React, { useState, useEffect } from "react";
import { createProduct, updateProduct } from "@/app/admin/products/actions";
import { useRouter } from "next/navigation";

interface ProductFormProps {
  initialData?: {
    id?: string;
    name: string;
    slug?: string;
    category: string;
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

export function ProductForm({ initialData, onSuccess }: ProductFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <form action={handleSubmit} className="settings-form">
      <div className="span-2">
        <h3 style={{ marginBottom: "20px", fontSize: "1.2rem", fontWeight: 800 }}>
          {initialData?.id ? "Edit Product" : "Add New Product"}
        </h3>
      </div>

      {error && (
        <div className="form-error span-2" style={{ marginBottom: "20px" }}>
          {error}
        </div>
      )}

      <label>
        Name
        <input
          name="name"
          type="text"
          required
          defaultValue={initialData?.name}
          placeholder="e.g. POS Thermal Printer"
        />
      </label>

      <label>
        Slug
        <input
          name="slug"
          type="text"
          defaultValue={initialData?.slug}
          placeholder="Optional - leave blank to keep current slug"
        />
      </label>

      <label>
        Category
        <input
          name="category"
          type="text"
          required
          defaultValue={initialData?.category}
          placeholder="e.g. POS Solution"
        />
      </label>

      <label>
        Price (LKR)
        <input
          name="price"
          type="number"
          required
          defaultValue={initialData?.price}
          placeholder="0"
        />
      </label>

      <label>
        Compare At Price (LKR)
        <input
          name="compareAt"
          type="number"
          defaultValue={initialData?.compareAt}
          placeholder="Optional"
        />
      </label>

      <label>
        Inventory
        <input
          name="inventory"
          type="number"
          required
          defaultValue={initialData?.inventory}
          placeholder="0"
        />
      </label>

      <label>
        SKU
        <input
          name="sku"
          type="text"
          defaultValue={initialData?.sku}
          placeholder="Optional"
        />
      </label>

      <label>
        Image URL
        <input
          name="image"
          type="text"
          required
          defaultValue={initialData?.image}
          placeholder="/products/product-1.svg"
        />
      </label>

      <label>
        Accent Color
        <input
          name="accent"
          type="color"
          defaultValue={initialData?.accent || "#1f8a70"}
        />
      </label>

      <label className="span-2">
        Short Description
        <textarea
          name="shortDescription"
          defaultValue={initialData?.shortDescription}
          placeholder="Brief product summary (shown on product cards)"
          rows={2}
        />
      </label>

      <label className="span-2">
        Description
        <textarea
          name="description"
          required
          defaultValue={initialData?.description}
          placeholder="Product description..."
        />
      </label>

      <label className="span-2">
        Specifications (Markdown or plain text)
        <textarea
          name="specs"
          required
          defaultValue={initialData?.specs}
          placeholder="Weight: 1.2kg&#10;Dimensions: 10x10x10cm"
        />
      </label>

      <label className="span-2" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
        <input
          name="published"
          type="checkbox"
          defaultChecked={initialData?.published ?? true}
        />
        <span>Published to store</span>
      </label>

      <div className="span-2" style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
        <button 
          type="submit" 
          className="primary-action" 
          disabled={isLoading}
          style={{ flex: 1 }}
        >
          {isLoading ? "Saving..." : initialData?.id ? "Update Product" : "Create Product"}
        </button>
      </div>
    </form>
  );
}
