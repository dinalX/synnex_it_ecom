"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SortableList } from "@/components/admin/sortable-list";
import { formatCurrency } from "@/lib/api-client";
import { addToHomeSection, removeFromHomeSection, reorderHomeSection } from "./actions";

type SectionDef = { key: string; label: string };
type ProductLite = { id: string; name: string; sku: string | null };
type SectionItem = {
  id: string;
  section: string;
  productId: string;
  sortOrder: number;
  product: { id: string; name: string; image: string; price: number };
};

export function HomeSectionManager({
  sections,
  items,
  products,
}: {
  sections: SectionDef[];
  items: SectionItem[];
  products: ProductLite[];
}) {
  const router = useRouter();
  const [activeKey, setActiveKey] = useState(sections[0]?.key);
  const [itemsBySection, setItemsBySection] = useState(() => groupBySection(items));
  const [prevItems, setPrevItems] = useState(items);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Re-sync when the server sends fresh curated items (e.g. after
  // router.refresh()) — adjusting state during render, not an effect.
  if (items !== prevItems) {
    setPrevItems(items);
    setItemsBySection(groupBySection(items));
  }

  const activeItems = useMemo(() => itemsBySection[activeKey] ?? [], [itemsBySection, activeKey]);

  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    const curatedIds = new Set(activeItems.map((item) => item.productId));
    return products
      .filter((p) => !curatedIds.has(p.id))
      .filter((p) => p.name.toLowerCase().includes(query) || p.sku?.toLowerCase().includes(query))
      .slice(0, 8);
  }, [search, products, activeItems]);

  async function handleAdd(productId: string) {
    setError(null);
    try {
      await addToHomeSection(activeKey, productId);
      setSearch("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add product");
    }
  }

  async function handleRemove(itemId: string) {
    setError(null);
    setItemsBySection((prev) => ({
      ...prev,
      [activeKey]: (prev[activeKey] ?? []).filter((item) => item.id !== itemId),
    }));
    try {
      await removeFromHomeSection(itemId);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove product");
      router.refresh();
    }
  }

  async function handleReorder(orderedIds: string[]) {
    const byId = new Map(activeItems.map((item) => [item.id, item]));
    setItemsBySection((prev) => ({ ...prev, [activeKey]: orderedIds.map((id) => byId.get(id)!) }));
    try {
      await reorderHomeSection(orderedIds);
    } catch {
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Admin / home sections</p>
        <h1 className="text-2xl font-bold text-foreground">Homepage merchandising</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hand-pick which products appear in a section and their order. Leave a section empty to keep its automatic
          behavior (top discounts, top rated, or newest, depending on the section).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardContent className="flex flex-col gap-1 p-3">
            {sections.map((section) => {
              const count = itemsBySection[section.key]?.length ?? 0;
              return (
                <Button
                  key={section.key}
                  variant={section.key === activeKey ? "secondary" : "ghost"}
                  className="h-auto justify-between whitespace-normal py-2 text-left"
                  onClick={() => {
                    setActiveKey(section.key);
                    setSearch("");
                    setError(null);
                  }}
                >
                  {section.label}
                  {count > 0 ? <span className="text-xs text-muted-foreground">{count}</span> : null}
                </Button>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{sections.find((s) => s.key === activeKey)?.label}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="relative">
              <Input
                placeholder="Search products by name or SKU to add…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {searchResults.length > 0 ? (
                <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
                  {searchResults.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                      onClick={() => handleAdd(product.id)}
                    >
                      <span>{product.name}</span>
                      <Plus size={14} />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            {activeItems.length === 0 ? (
              <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Nothing curated yet — this section shows its automatic product list on the homepage.
              </p>
            ) : (
              <SortableList
                dndContextId="admin-home-section-list"
                items={activeItems}
                onReorder={handleReorder}
                renderItem={(item) => (
                  <div className="flex items-center gap-3 rounded-md border border-border bg-card p-2">
                    <div className="relative h-12 w-12 flex-none overflow-hidden rounded bg-muted">
                      <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(item.product.price)}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleRemove(item.id)} aria-label="Remove">
                      <X size={14} />
                    </Button>
                  </div>
                )}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function groupBySection(items: SectionItem[]): Record<string, SectionItem[]> {
  const map: Record<string, SectionItem[]> = {};
  for (const item of items) {
    (map[item.section] ??= []).push(item);
  }
  return map;
}
