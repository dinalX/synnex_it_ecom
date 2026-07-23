import test from "node:test";
import assert from "node:assert/strict";

import { flattenTree, buildTree, getDescendantIds, getProjection, type TreeNode } from "@/lib/category-tree";

interface Cat extends TreeNode<Cat> {
  name: string;
}

function tree(): Cat[] {
  return [
    {
      id: "a",
      parentId: null,
      name: "A",
      children: [
        { id: "a1", parentId: "a", name: "A1", children: [] },
        {
          id: "a2",
          parentId: "a",
          name: "A2",
          children: [{ id: "a2i", parentId: "a2", name: "A2i", children: [] }],
        },
      ],
    },
    { id: "b", parentId: null, name: "B", children: [] },
  ];
}

test("flattenTree preserves depth-first order and assigns depth", () => {
  const flat = flattenTree(tree());
  assert.deepEqual(
    flat.map((n) => [n.id, n.depth]),
    [
      ["a", 0],
      ["a1", 1],
      ["a2", 1],
      ["a2i", 2],
      ["b", 0],
    ],
  );
});

test("buildTree reverses flattenTree (round trip)", () => {
  const original = tree();
  const rebuilt = buildTree(flattenTree(original));
  assert.deepEqual(rebuilt, original);
});

test("getDescendantIds returns only the contiguous deeper run after an item", () => {
  const flat = flattenTree(tree());
  assert.deepEqual(getDescendantIds(flat, "a"), ["a1", "a2", "a2i"]);
  assert.deepEqual(getDescendantIds(flat, "a2"), ["a2i"]);
  assert.deepEqual(getDescendantIds(flat, "a1"), []);
  assert.deepEqual(getDescendantIds(flat, "b"), []);
});

test("getProjection promotes a 3rd-level item to top-level (L3 -> L1) when dragged far left over a root item", () => {
  // a2i (currently depth 2, parent a2) dragged to sit right after "b" with a large negative offset.
  const withoutA2iAsActiveDescendant = flattenTree(tree()).filter((n) => n.id !== "a2i" || true);
  const items = withoutA2iAsActiveDescendant; // a2i has no descendants of its own, nothing to exclude
  const indentationWidth = 24;
  const projection = getProjection(items, "a2i", "b", -3 * indentationWidth, indentationWidth);
  assert.equal(projection.depth, 0);
  assert.equal(projection.parentId, null);
});

test("getProjection nests an item under the row it's dropped onto when dragged right", () => {
  const items = flattenTree(tree());
  const indentationWidth = 24;
  // "a1" (depth 1) dropped onto "a2i" (depth 2) with a positive offset -> becomes a2i's child (depth 3).
  const projection = getProjection(items, "a1", "a2i", 2 * indentationWidth, indentationWidth);
  assert.equal(projection.depth, 3);
  assert.equal(projection.parentId, "a2i");
});

test("getProjection clamps depth so a drop can't skip a generation", () => {
  const items = flattenTree(tree());
  const indentationWidth = 24;
  // "b" (depth 0) dropped onto "a2i" lands just before it in the new order (previous item
  // becomes "a2", depth 1) - depth can go at most one deeper than that, not all the way to 3.
  const projection = getProjection(items, "b", "a2i", 3 * indentationWidth, indentationWidth);
  assert.equal(projection.depth, 2);
  assert.equal(projection.parentId, "a2");
});

test("getProjection keeps the same parent when depth matches the item above it (plain sibling reorder)", () => {
  const items = flattenTree(tree());
  const indentationWidth = 24;
  // "a2" (depth 1) dropped right after "a1" (depth 1) with no horizontal offset -> stays a sibling of a1 under "a".
  const projection = getProjection(items, "a2", "a1", 0, indentationWidth);
  assert.equal(projection.depth, 1);
  assert.equal(projection.parentId, "a");
});
