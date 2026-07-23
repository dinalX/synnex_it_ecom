"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCategory, updateCategory } from "@/app/admin/(panel)/categories/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NO_PARENT = "none";
const NO_ICON = "none";
const ICON_OPTIONS = ["Monitor", "Barcode", "Fingerprint", "Printer"];

export interface CategoryFormParentOption {
  id: string;
  name: string;
}

interface CategoryFormProps {
  parentOptions: CategoryFormParentOption[];
  initialData?: {
    id?: string;
    name: string;
    slug: string;
    parentId: string | null;
    icon: string | null;
    accent: string;
    shortDescription: string | null;
    published: boolean;
  };
  onSuccess?: () => void;
}

export function CategoryForm({ parentOptions, initialData, onSuccess }: CategoryFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError(null);

    if (formData.get("parentId") === NO_PARENT) formData.set("parentId", "");
    if (formData.get("icon") === NO_ICON) formData.set("icon", "");

    try {
      if (initialData?.id) {
        await updateCategory(initialData.id, formData);
      } else {
        await createCategory(formData);
      }
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred while saving the category");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form action={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
      )}

      <div className="flex flex-col gap-4">
        <p className="text-sm font-semibold text-muted-foreground">Identity</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="category-name">Name</Label>
            <Input id="category-name" name="name" required defaultValue={initialData?.name} placeholder="e.g. Barcode Solution" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="category-slug">Slug</Label>
            <Input id="category-slug" name="slug" defaultValue={initialData?.slug} placeholder="Optional — leave blank to keep current slug" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="category-parent">Parent category</Label>
            <Select name="parentId" defaultValue={initialData?.parentId || NO_PARENT}>
              <SelectTrigger id="category-parent" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PARENT}>None (top-level)</SelectItem>
                {parentOptions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="category-icon">Icon</Label>
            <Select name="icon" defaultValue={initialData?.icon || NO_ICON}>
              <SelectTrigger id="category-icon" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_ICON}>None</SelectItem>
                {ICON_OPTIONS.map((icon) => (
                  <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <p className="text-sm font-semibold text-muted-foreground">Appearance</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="category-accent">Accent color</Label>
            <input
              id="category-accent"
              name="accent"
              type="color"
              defaultValue={initialData?.accent || "#1f8a70"}
              className="h-9 w-full rounded-md border border-input"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="category-short-description">Short description</Label>
          <Textarea
            id="category-short-description"
            name="shortDescription"
            defaultValue={initialData?.shortDescription ?? undefined}
            placeholder="Shown on category cards (optional)"
            rows={2}
          />
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

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : initialData?.id ? "Update Category" : "Create Category"}
        </Button>
      </div>
    </form>
  );
}
