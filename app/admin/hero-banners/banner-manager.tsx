"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createHeroBanner,
  updateHeroBanner,
  deleteHeroBanner,
  toggleHeroBannerActive,
} from "./actions";

type BannerProduct = { id: string; name: string };

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  imageAlt: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  productId: string | null;
  theme: string;
  active: boolean;
  sortOrder: number;
  product: BannerProduct | null;
};

export function BannerManager({
  banners,
  products,
}: {
  banners: Banner[];
  products: BannerProduct[];
}) {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function openCreate() {
    setEditingBanner(null);
    setImageUrl("");
    setError(null);
    setIsFormOpen(true);
  }

  function openEdit(banner: Banner) {
    setEditingBanner(banner);
    setImageUrl(banner.imageUrl);
    setError(null);
    setIsFormOpen(true);
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
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
  }

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    formData.set("imageUrl", imageUrl);
    try {
      if (!imageUrl) {
        throw new Error("Please upload an image first");
      }
      if (editingBanner) {
        await updateHeroBanner(editingBanner.id, formData);
      } else {
        await createHeroBanner(formData);
      }
      setIsFormOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save banner");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteHeroBanner(deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete banner");
    }
  }

  async function handleToggleActive(banner: Banner) {
    try {
      await toggleHeroBannerActive(banner.id, !banner.active);
      router.refresh();
    } catch {
      // no-op; row simply won't update if this fails
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Admin / hero banners</p>
          <h1 className="text-2xl font-bold text-foreground">Homepage carousel</h1>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Add banner
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{banners.length} banners</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Linked product</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banners.map((banner) => (
                <TableRow key={banner.id}>
                  <TableCell>
                    <div className="relative h-12 w-20 overflow-hidden rounded-md bg-muted">
                      <Image src={banner.imageUrl} alt={banner.imageAlt || banner.title} fill className="object-cover" />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{banner.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{banner.product?.name ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{banner.sortOrder}</TableCell>
                  <TableCell>
                    <Badge className={banner.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}>
                      {banner.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(banner)}>Edit</Button>
                      <Button variant="outline" size="sm" onClick={() => handleToggleActive(banner)}>
                        {banner.active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteTarget(banner)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {banners.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    No banners yet — the homepage falls back to the top deal.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBanner ? "Edit banner" : "Add banner"}</DialogTitle>
          </DialogHeader>
          <form action={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="banner-title">Title</Label>
              <Input id="banner-title" name="title" required defaultValue={editingBanner?.title} />
              <p className="text-xs text-muted-foreground">Internal label only — not shown on the site.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="banner-image">Image</Label>
              <Input
                id="banner-image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                onChange={handleImageUpload}
                disabled={isUploading}
              />
              {isUploading ? <p className="text-sm text-muted-foreground">Uploading…</p> : null}
              {imageUrl ? (
                <div className="relative h-24 w-40 overflow-hidden rounded-md bg-muted">
                  <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                </div>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="banner-image-alt">Image alt text</Label>
              <Input id="banner-image-alt" name="imageAlt" defaultValue={editingBanner?.imageAlt ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="banner-cta-href">Link (where clicking the banner goes)</Label>
              <Input id="banner-cta-href" name="ctaHref" placeholder="/products" defaultValue={editingBanner?.ctaHref ?? ""} />
              <p className="text-xs text-muted-foreground">
                Leave blank to use the linked product&apos;s page instead.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="banner-product">Linked product (optional)</Label>
              <Select name="productId" defaultValue={editingBanner?.productId ?? "none"}>
                <SelectTrigger id="banner-product" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="banner-sort-order">Sort order</Label>
              <Input id="banner-sort-order" name="sortOrder" type="number" defaultValue={editingBanner?.sortOrder ?? 0} />
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox name="active" defaultChecked={editingBanner?.active ?? true} />
              Active
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button type="submit" disabled={pending}>{editingBanner ? "Save changes" : "Create banner"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete banner</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deleteTarget?.title}</strong>? This can&apos;t be undone.
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
