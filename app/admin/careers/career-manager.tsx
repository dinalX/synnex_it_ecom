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
  createJobPost,
  updateJobPost,
  deleteJobPost,
  toggleJobPostPublished,
} from "./actions";

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];

type JobPost = {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  summary: string;
  requirements: string;
  published: boolean;
};

export function CareerManager({ jobs }: { jobs: JobPost[] }) {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPost | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JobPost | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function openCreate() {
    setEditingJob(null);
    setError(null);
    setIsFormOpen(true);
  }

  function openEdit(job: JobPost) {
    setEditingJob(job);
    setError(null);
    setIsFormOpen(true);
  }

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      if (editingJob) {
        await updateJobPost(editingJob.id, formData);
      } else {
        await createJobPost(formData);
      }
      setIsFormOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save job post");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteJobPost(deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete job post");
    }
  }

  async function handleTogglePublished(job: JobPost) {
    try {
      await toggleJobPostPublished(job.id, !job.published);
      router.refresh();
    } catch {
      // no-op; row simply won't update if this fails
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Admin / careers</p>
          <h1 className="text-2xl font-bold text-foreground">Career posts</h1>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Add job post
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{jobs.length} job posts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{job.department}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{job.location}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{job.type}</TableCell>
                  <TableCell>
                    <Badge className={job.published ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}>
                      {job.published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(job)}>Edit</Button>
                      <Button variant="outline" size="sm" onClick={() => handleTogglePublished(job)}>
                        {job.published ? "Unpublish" : "Publish"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteTarget(job)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {jobs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    No career posts yet.
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
            <DialogTitle>{editingJob ? "Edit job post" : "Add job post"}</DialogTitle>
          </DialogHeader>
          <form action={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="job-title">Title</Label>
              <Input id="job-title" name="title" required defaultValue={editingJob?.title} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="job-department">Department</Label>
              <Input id="job-department" name="department" required defaultValue={editingJob?.department} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="job-location">Location</Label>
              <Input id="job-location" name="location" required defaultValue={editingJob?.location} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="job-type">Type</Label>
              <Select name="type" defaultValue={editingJob?.type ?? JOB_TYPES[0]}>
                <SelectTrigger id="job-type" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {JOB_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="job-summary">Summary</Label>
              <Textarea id="job-summary" name="summary" required defaultValue={editingJob?.summary} rows={2} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="job-requirements">Requirements</Label>
              <Textarea id="job-requirements" name="requirements" required defaultValue={editingJob?.requirements} rows={4} />
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox name="published" defaultChecked={editingJob?.published ?? true} />
              Published
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button type="submit" disabled={pending}>{editingJob ? "Save changes" : "Create job post"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete job post</DialogTitle>
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
