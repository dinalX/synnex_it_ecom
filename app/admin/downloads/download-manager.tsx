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
  createDriverDownload,
  updateDriverDownload,
  deleteDriverDownload,
  toggleDriverDownloadPublished,
} from "./actions";

type DriverDownload = {
  id: string;
  title: string;
  deviceType: string;
  version: string;
  os: string;
  fileUrl: string;
  notes: string;
  published: boolean;
};

export function DownloadManager({ downloads }: { downloads: DriverDownload[] }) {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDownload, setEditingDownload] = useState<DriverDownload | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DriverDownload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function openCreate() {
    setEditingDownload(null);
    setError(null);
    setIsFormOpen(true);
  }

  function openEdit(download: DriverDownload) {
    setEditingDownload(download);
    setError(null);
    setIsFormOpen(true);
  }

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      if (editingDownload) {
        await updateDriverDownload(editingDownload.id, formData);
      } else {
        await createDriverDownload(formData);
      }
      setIsFormOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save download");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteDriverDownload(deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete download");
    }
  }

  async function handleTogglePublished(download: DriverDownload) {
    try {
      await toggleDriverDownloadPublished(download.id, !download.published);
      router.refresh();
    } catch {
      // no-op; row simply won't update if this fails
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Admin / downloads</p>
          <h1 className="text-2xl font-bold text-foreground">Driver downloads</h1>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Add download
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{downloads.length} downloads</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Device type</TableHead>
                <TableHead>OS</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {downloads.map((download) => (
                <TableRow key={download.id}>
                  <TableCell className="font-medium">{download.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{download.deviceType}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{download.os}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">v{download.version}</TableCell>
                  <TableCell>
                    <Badge className={download.published ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}>
                      {download.published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(download)}>Edit</Button>
                      <Button variant="outline" size="sm" onClick={() => handleTogglePublished(download)}>
                        {download.published ? "Unpublish" : "Publish"}
                      </Button>
                      <Button variant="outline" size="sm" aria-label="Delete" onClick={() => setDeleteTarget(download)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {downloads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    No downloads yet.
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
            <DialogTitle>{editingDownload ? "Edit download" : "Add download"}</DialogTitle>
          </DialogHeader>
          <form action={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="download-title">Title</Label>
              <Input id="download-title" name="title" required defaultValue={editingDownload?.title} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="download-device-type">Device type</Label>
              <Input id="download-device-type" name="deviceType" required defaultValue={editingDownload?.deviceType} placeholder="e.g. POS Printer" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="download-os">Operating system</Label>
              <Input id="download-os" name="os" required defaultValue={editingDownload?.os} placeholder="e.g. Windows 10/11" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="download-version">Version</Label>
              <Input id="download-version" name="version" required defaultValue={editingDownload?.version} placeholder="e.g. 3.0.0" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="download-file-url">File URL</Label>
              <Input id="download-file-url" name="fileUrl" required defaultValue={editingDownload?.fileUrl} placeholder="https://... or /downloads/file.exe" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="download-notes">Notes</Label>
              <Textarea id="download-notes" name="notes" defaultValue={editingDownload?.notes} rows={3} />
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox name="published" defaultChecked={editingDownload?.published ?? true} />
              Published
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button type="submit" disabled={pending}>{editingDownload ? "Save changes" : "Create download"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete download</DialogTitle>
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
