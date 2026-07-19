"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
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
  createPageContent,
  updatePageContent,
  deletePageContent,
  togglePageContentPublished,
} from "./actions";

type PageContent = {
  id: string;
  title: string;
  summary: string;
  body: string;
  seoTitle: string | null;
  seoDescription: string | null;
  published: boolean;
  updatedAt: Date;
};

export function PageManager({ pages }: { pages: PageContent[] }) {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<PageContent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PageContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function openCreate() {
    setEditingPage(null);
    setError(null);
    setIsFormOpen(true);
  }

  function openEdit(page: PageContent) {
    setEditingPage(page);
    setError(null);
    setIsFormOpen(true);
  }

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      if (editingPage) {
        await updatePageContent(editingPage.id, formData);
      } else {
        await createPageContent(formData);
      }
      setIsFormOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save page");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deletePageContent(deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete page");
    }
  }

  async function handleTogglePublished(page: PageContent) {
    try {
      await togglePageContentPublished(page.id, !page.published);
      router.refresh();
    } catch {
      // no-op; row simply won't update if this fails
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Admin / pages</p>
          <h1 className="text-2xl font-bold text-foreground">Pages and SEO</h1>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Add page
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{pages.length} pages</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell className="font-medium">{page.title}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{page.summary}</TableCell>
                  <TableCell>
                    <Badge className={page.published ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}>
                      {page.published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {page.updatedAt.toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(page)}>Edit</Button>
                      <Button variant="outline" size="sm" onClick={() => handleTogglePublished(page)}>
                        {page.published ? "Unpublish" : "Publish"}
                      </Button>
                      <Button variant="outline" size="sm" aria-label="Delete" onClick={() => { setError(null); setDeleteTarget(page); }}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {pages.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    No pages yet.
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
            <DialogTitle>{editingPage ? "Edit page" : "Add page"}</DialogTitle>
          </DialogHeader>
          <form action={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="page-title">Title</Label>
              <Input id="page-title" name="title" required defaultValue={editingPage?.title} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="page-summary">Summary</Label>
              <Textarea id="page-summary" name="summary" required defaultValue={editingPage?.summary} rows={2} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="page-body">Body</Label>
              <Textarea id="page-body" name="body" required defaultValue={editingPage?.body} rows={6} />
            </div>
            <Separator />
            <p className="text-sm font-semibold text-muted-foreground">SEO (optional)</p>
            <div className="flex flex-col gap-2">
              <Label htmlFor="page-seo-title">SEO title</Label>
              <Input id="page-seo-title" name="seoTitle" defaultValue={editingPage?.seoTitle ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="page-seo-description">SEO description</Label>
              <Textarea id="page-seo-description" name="seoDescription" defaultValue={editingPage?.seoDescription ?? ""} rows={2} />
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox name="published" defaultChecked={editingPage?.published ?? true} />
              Published
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button type="submit" disabled={pending}>{editingPage ? "Save changes" : "Create page"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete page</DialogTitle>
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
