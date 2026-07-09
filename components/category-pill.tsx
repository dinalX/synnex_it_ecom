"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";

type Category = {
  id: string;
  slug: string;
  name: string;
  children?: { id: string; slug: string; name: string }[];
};

interface CategoryPillProps {
  category: Category;
  isActive: boolean;
  isOpen: boolean;
  onOpen: (slug: string) => void;
  onScheduleClose: () => void;
  onCancelClose: () => void;
}

export function CategoryPill({
  category,
  isActive,
  isOpen,
  onOpen,
  onScheduleClose,
  onCancelClose,
}: CategoryPillProps) {
  const subs = category.children || [];
  const hasSubs = subs.length > 0;

  if (!hasSubs) {
    return (
      <Link
        href={`/products?category=${category.slug}`}
        className={"category-pill" + (isActive ? " active" : "")}
      >
        {category.name}
      </Link>
    );
  }

  return (
    <div
      className={"category-pill-dropdown" + (isOpen ? " open" : "")}
      onMouseEnter={() => onOpen(category.slug)}
      onMouseLeave={onScheduleClose}
    >
      <button
        className={"category-pill" + (isActive ? " active" : "")}
        onClick={() => onOpen(isOpen ? "" : category.slug)}
      >
        {category.name}
        <ChevronDown size={14} className="pill-chevron" />
      </button>
      <div
        className="dropdown-menu"
        onMouseEnter={onCancelClose}
        onMouseLeave={onScheduleClose}
      >
        <Link href={`/products?category=${category.slug}`}>
          All {category.name}
        </Link>
        {subs.map((sub) => (
          <Link
            key={sub.slug}
            href={`/products?category=${category.slug}&subcategory=${sub.slug}`}
          >
            {sub.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
