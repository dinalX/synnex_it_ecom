"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryForm, type CategoryFormParentOption } from "@/components/admin/category-form";
import {
  flattenTree,
  buildTree,
  getDescendantIds,
  getProjection,
  type FlattenedNode,
} from "@/lib/category-tree";
import { deleteCategory, reorderCategoryTree } from "./actions";

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  icon: string | null;
  accent: string;
  shortDescription: string | null;
  published: boolean;
  children: CategoryRow[];
}

interface CategoryManagerProps {
  categories: CategoryRow[];
}

const INDENTATION_WIDTH = 24;

function countAll(rows: CategoryRow[]): number {
  return rows.reduce((sum, row) => sum + 1 + countAll(row.children), 0);
}

function filterTree(rows: CategoryRow[], query: string): CategoryRow[] {
  return rows
    .map((row) => {
      const children = filterTree(row.children, query);
      const selfMatches = row.name.toLowerCase().includes(query);
      if (!selfMatches && children.length === 0) return null;
      return { ...row, children };
    })
    .filter((row): row is CategoryRow => row !== null);
}

function flattenWithLabels(rows: CategoryRow[], depth = 0): { id: string; name: string }[] {
  return rows.flatMap((row) => [
    { id: row.id, name: `${"— ".repeat(depth)}${row.name}` },
    ...flattenWithLabels(row.children, depth + 1),
  ]);
}

export function CategoryManager({ categories }: CategoryManagerProps) {
  const [tree, setTree] = useState(categories);
  const [prevCategories, setPrevCategories] = useState(categories);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editing, setEditing] = useState<FlattenedNode<CategoryRow> | CategoryRow | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState<{ id: string; name: string } | null>(null);
  const [search, setSearch] = useState("");

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [offsetLeft, setOffsetLeft] = useState(0);

  // Re-sync local (optimistic) tree when the server sends a fresh categories
  // list - adjusting state during render per React's recommended pattern.
  if (categories !== prevCategories) {
    setPrevCategories(categories);
    setTree(categories);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const flatItems = useMemo(() => flattenTree(tree), [tree]);

  // While dragging, hide the active item's own descendants from the
  // sortable list - they move implicitly with it (buildTree reconnects
  // them afterwards) rather than each being independently draggable mid-drag.
  const visibleItems = useMemo(() => {
    if (!activeId) return flatItems;
    const hidden = new Set(getDescendantIds(flatItems, activeId));
    return flatItems.filter((item) => !hidden.has(item.id));
  }, [flatItems, activeId]);

  const sortedIds = useMemo(() => visibleItems.map((item) => item.id), [visibleItems]);

  const childCountById = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of flatItems) {
      if (item.parentId) map.set(item.parentId, (map.get(item.parentId) ?? 0) + 1);
    }
    return map;
  }, [flatItems]);

  const projected = useMemo(() => {
    if (!activeId || !overId) return null;
    if (!visibleItems.some((i) => i.id === overId)) return null;
    return getProjection(visibleItems, activeId, overId, offsetLeft, INDENTATION_WIDTH);
  }, [activeId, overId, offsetLeft, visibleItems]);

  const parentOptions: CategoryFormParentOption[] = useMemo(() => flattenWithLabels(tree), [tree]);

  const query = search.trim().toLowerCase();
  const filtered = useMemo(() => (query ? filterTree(tree, query) : tree), [tree, query]);
  const isFiltered = query !== "";

  const activeItem = activeId ? flatItems.find((i) => i.id === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
    setOverId(event.active.id as string);
    setOffsetLeft(0);
  }

  function handleDragMove(event: DragMoveEvent) {
    setOffsetLeft(event.delta.x);
  }

  function handleDragOver(event: DragOverEvent) {
    setOverId((event.over?.id as string) ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    resetDragState();
    if (!over || active.id === over.id) return;

    const finalProjection = getProjection(visibleItems, active.id as string, over.id as string, offsetLeft, INDENTATION_WIDTH);

    const activeIndex = flatItems.findIndex((i) => i.id === active.id);
    const descendantIds = new Set(getDescendantIds(flatItems, active.id as string));
    const activeBlock = [flatItems[activeIndex], ...flatItems.filter((i) => descendantIds.has(i.id))];

    const withoutBlock = flatItems.filter((i) => i.id !== active.id && !descendantIds.has(i.id));
    const overIndexInRemaining = withoutBlock.findIndex((i) => i.id === over.id);
    const insertAt = overIndexInRemaining === -1 ? withoutBlock.length : overIndexInRemaining;

    const reordered: FlattenedNode<CategoryRow>[] = [
      ...withoutBlock.slice(0, insertAt),
      { ...activeBlock[0], depth: finalProjection.depth, parentId: finalProjection.parentId },
      ...activeBlock.slice(1),
      ...withoutBlock.slice(insertAt),
    ];

    const newTree = buildTree(reordered);
    setTree(newTree);

    const flatForSave = flattenTree(newTree).map((item) => ({ id: item.id, parentId: item.parentId }));
    try {
      await reorderCategoryTree(flatForSave);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to save the new order");
      setTree(categories);
    }
  }

  function resetDragState() {
    setActiveId(null);
    setOverId(null);
    setOffsetLeft(0);
  }

  const handleDelete = async () => {
    if (!isDeleteOpen) return;
    try {
      await deleteCategory(isDeleteOpen.id);
      setIsDeleteOpen(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete category");
    }
  };

  function renderRow(row: FlattenedNode<CategoryRow>, depth: number) {
    return (
      <SortableCategoryRow
        key={row.id}
        row={row}
        depth={depth}
        childCount={childCountById.get(row.id) ?? 0}
        onEdit={() => setEditing(row)}
        onDelete={() => setIsDeleteOpen({ id: row.id, name: row.name })}
      />
    );
  }

  function renderFilteredRow(row: CategoryRow, depth = 0) {
    return (
      <div key={row.id} className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3" style={{ marginLeft: depth * INDENTATION_WIDTH }}>
          <div className="min-w-0 flex-1 basis-full sm:basis-auto">
            <p className="truncate font-medium text-foreground">{row.name}</p>
            <p className="truncate text-sm text-muted-foreground">/{row.slug}</p>
          </div>
          {!row.published && <Badge variant="outline">Draft</Badge>}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(row)}>Edit</Button>
            <Button variant="outline" size="sm" aria-label="Delete" onClick={() => setIsDeleteOpen({ id: row.id, name: row.name })}>
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
        {row.children.map((child) => renderFilteredRow(child, depth + 1))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Admin / categories</p>
          <h1 className="text-2xl font-bold text-foreground">Category management</h1>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus size={16} /> Add category
        </Button>
      </div>

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-lg">
            {tree.length} top-level {tree.length === 1 ? "category" : "categories"} · {countAll(tree)} total
          </CardTitle>
          <Input
            placeholder="Search categories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isFiltered ? (
            <>
              <p className="text-xs text-muted-foreground">
                Drag-to-reorder is disabled while searching — clear the search to drag categories.
              </p>
              {filtered.map((row) => renderFilteredRow(row))}
              {filtered.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">No categories match this search.</p>
              )}
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Drag up/down to reorder, or drag left/right to change level — dropping a category onto another nests
                it one level deeper; dragging it back out promotes it (a subcategory can become top-level, and vice
                versa). Its own subcategories move with it.
              </p>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragMove={handleDragMove}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDragCancel={resetDragState}
              >
                <SortableContext items={sortedIds} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-col gap-2">
                    {visibleItems.map((item) => {
                      const depth = item.id === activeId && projected ? projected.depth : item.depth;
                      return renderRow(item, depth);
                    })}
                  </div>
                </SortableContext>
                <DragOverlay>
                  {activeItem ? (
                    <div className="rounded-md border border-border bg-card p-3 shadow-lg">
                      <p className="font-medium text-foreground">{activeItem.name}</p>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <CategoryForm parentOptions={parentOptions} onSuccess={() => setIsAddOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {editing && (
            <CategoryForm
              parentOptions={parentOptions.filter((p) => p.id !== editing.id)}
              initialData={editing}
              onSuccess={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!isDeleteOpen} onOpenChange={(open) => !open && setIsDeleteOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{isDeleteOpen?.name}</strong>? Subcategories and products under
            it will not be deleted, but will be unassigned from it. This action cannot be undone.
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

function SortableCategoryRow({
  row,
  depth,
  childCount,
  onEdit,
  onDelete,
}: {
  row: FlattenedNode<CategoryRow>;
  depth: number;
  childCount: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    marginLeft: depth * INDENTATION_WIDTH,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card p-3"
    >
      <button type="button" className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing" aria-label="Drag to reorder or re-nest" {...attributes} {...listeners}>
        <GripVertical size={16} />
      </button>
      <div className="min-w-0 flex-1 basis-full sm:basis-auto">
        <p className="truncate font-medium text-foreground">{row.name}</p>
        <p className="truncate text-sm text-muted-foreground">
          /{row.slug}
          {childCount > 0 ? ` · ${childCount} ${childCount === 1 ? "subcategory" : "subcategories"}` : ""}
        </p>
      </div>
      {!row.published && <Badge variant="outline">Draft</Badge>}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onEdit}>Edit</Button>
        <Button variant="outline" size="sm" aria-label="Delete" onClick={onDelete}>
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  );
}
