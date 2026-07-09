"use client";

import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { Modal } from "@/components/admin/modal";
import { ProductForm } from "@/components/admin/product-form";
import { deleteProduct } from "./actions";
import { formatCurrency } from "@/lib/api-client";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  inventory: number;
}

interface ProductManagerProps {
  products: Product[];
}

export function ProductManager({ products }: ProductManagerProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState<{ id: string; name: string } | null>(null);

  const handleDelete = async () => {
    if (!isDeleteOpen) return;
    
    try {
      await deleteProduct(isDeleteOpen.id);
      setIsDeleteOpen(null);
    } catch (e: any) {
      alert(e.message || "Failed to delete product");
    }
  };

  return (
    <>
      <div className="admin-topbar">
        <div>
          <p className="eyebrow">Admin / products</p>
          <h1>Product management</h1>
        </div>
        <Link href="/admin" className="secondary-action">Dashboard</Link>
      </div>

      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Catalog</p>
            <h2>Products</h2>
          </div>
          <button onClick={() => setIsAddOpen(true)}>
            <Plus size={16} />
            Add product
          </button>
        </div>
        <div className="management-table">
          {products.map((product) => (
            <article key={product.id}>
              <div>
                <strong>{product.name}</strong>
                <span>{product.category} · {product.id.toUpperCase()}</span>
              </div>
              <span>{formatCurrency(product.price)}</span> 
              <em>{product.inventory} in stock</em>
              <div style={{ display: "flex", gap: "8px" }}>
                <Link 
                  href={`/admin/products/${product.id}`} 
                  className="secondary-action" 
                  style={{ padding: "4px 8px", fontSize: "0.8rem" }}
                >
                  Edit
                </Link>
                <button 
                  onClick={() => setIsDeleteOpen({ id: product.id, name: product.name })}
                  className="secondary-action" 
                  style={{ padding: "4px 8px", fontSize: "0.8rem", color: "var(--orange)", borderColor: "var(--line)" }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <Modal 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        title="Add New Product"
      >
        <ProductForm onSuccess={() => setIsAddOpen(false)} />
      </Modal>

      <Modal 
        isOpen={!!isDeleteOpen} 
        onClose={() => setIsDeleteOpen(null)} 
        title="Delete Product"
      >
        <div style={{ textAlign: "center", padding: "20px" }}>
          <p style={{ fontSize: "1.1rem", marginBottom: "24px" }}>
            Are you sure you want to delete <strong>{isDeleteOpen?.name}</strong>?
            <br />
            <small style={{ color: "var(--muted)", fontWeight: "normal" }}>This action cannot be undone.</small>
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button 
              className="secondary-action" 
              onClick={() => setIsDeleteOpen(null)}
              style={{ minWidth: "120px" }}
            >
              Cancel
            </button>
            <button 
              className="primary-action" 
              onClick={handleDelete}
              style={{ minWidth: "120px", background: "var(--orange)" }}
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
