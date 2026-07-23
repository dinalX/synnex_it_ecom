import { arrayMove } from "@dnd-kit/sortable";

export interface TreeNode<Self extends TreeNode<Self> = never> {
  id: string;
  parentId: string | null;
  children: Self[];
}

export type FlattenedNode<T extends TreeNode<T>> = Omit<T, "children"> & { depth: number };

/** Depth-first flatten, preserving sibling order (which is the sortOrder). */
export function flattenTree<T extends TreeNode<T>>(nodes: T[], depth = 0): FlattenedNode<T>[] {
  return nodes.flatMap((node) => {
    const { children, ...rest } = node;
    return [{ ...rest, depth } as FlattenedNode<T>, ...flattenTree(children, depth + 1)];
  });
}

/** Rebuilds a nested tree from a flat, depth-first-ordered list. */
export function buildTree<T extends TreeNode<T>>(flat: FlattenedNode<T>[]): T[] {
  const roots: T[] = [];
  const stack: { node: T; depth: number }[] = [];

  for (const item of flat) {
    const { depth, ...rest } = item;
    const node = { ...rest, children: [] } as unknown as T;

    while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }

    stack.push({ node, depth });
  }

  return roots;
}

/** ids of every descendant of `id` (contiguous run after it while depth > its own). */
export function getDescendantIds<T extends TreeNode<T>>(flat: FlattenedNode<T>[], id: string): string[] {
  const index = flat.findIndex((item) => item.id === id);
  if (index === -1) return [];
  const depth = flat[index].depth;
  const ids: string[] = [];
  for (let i = index + 1; i < flat.length; i++) {
    if (flat[i].depth <= depth) break;
    ids.push(flat[i].id);
  }
  return ids;
}

export interface Projection {
  depth: number;
  parentId: string | null;
  maxDepth: number;
  minDepth: number;
}

/**
 * Given the visible (active item's own descendants excluded) flattened list,
 * works out where the dragged item would land: how deep (based on horizontal
 * drag offset) and therefore which item becomes its new parent. Depth is
 * clamped between the item below it (can't be deeper than that) and one
 * level deeper than the item above it (can't skip a generation).
 */
export function getProjection<T extends TreeNode<T>>(
  visibleItems: FlattenedNode<T>[],
  activeId: string,
  overId: string,
  dragOffsetX: number,
  indentationWidth: number,
): Projection {
  const activeIndex = visibleItems.findIndex((item) => item.id === activeId);
  const overIndex = visibleItems.findIndex((item) => item.id === overId);
  const activeItem = visibleItems[activeIndex];
  const newItems = arrayMove(visibleItems, activeIndex, overIndex);
  const previousItem = newItems[overIndex - 1];
  const nextItem = newItems[overIndex + 1];

  const dragDepth = Math.round(dragOffsetX / indentationWidth);
  const projectedDepth = activeItem.depth + dragDepth;

  const maxDepth = previousItem ? previousItem.depth + 1 : 0;
  const minDepth = nextItem ? nextItem.depth : 0;

  let depth = projectedDepth;
  if (projectedDepth >= maxDepth) depth = maxDepth;
  else if (projectedDepth < minDepth) depth = minDepth;

  function getParentId(): string | null {
    if (depth === 0 || !previousItem) return null;
    if (depth === previousItem.depth) return previousItem.parentId;
    if (depth > previousItem.depth) return previousItem.id;

    const newParent = newItems
      .slice(0, overIndex)
      .reverse()
      .find((item) => item.depth === depth)?.parentId;
    return newParent ?? null;
  }

  return { depth, parentId: getParentId(), maxDepth, minDepth };
}
