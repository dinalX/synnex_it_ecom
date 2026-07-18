"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ShieldCheck } from "lucide-react";
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
import { PERMISSION_GROUPS } from "@/lib/permissions";
import { createAdmin, setAdminPermissions, toggleAdminActive } from "./actions";

type TeamMember = {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  lastLoginAt: string | null;
  permissions: string[];
};

export function TeamManager({
  teamMembers,
  currentAdminId,
}: {
  teamMembers: TeamMember[];
  currentAdminId: string;
}) {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<TeamMember | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function openPermissionEditor(admin: TeamMember) {
    setEditingAdmin(admin);
    setSelectedPermissions(new Set(admin.permissions));
    setError(null);
  }

  function togglePermission(key: string) {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleCreateSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      await createAdmin(formData);
      setIsCreateOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create admin");
    } finally {
      setPending(false);
    }
  }

  async function handleSavePermissions() {
    if (!editingAdmin) return;
    setPending(true);
    setError(null);
    try {
      await setAdminPermissions(editingAdmin.id, Array.from(selectedPermissions));
      setEditingAdmin(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save permissions");
    } finally {
      setPending(false);
    }
  }

  async function handleToggleActive(admin: TeamMember) {
    try {
      await toggleAdminActive(admin.id, !admin.active);
      router.refresh();
    } catch {
      // no-op; row simply won't update if this fails
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Admin / team</p>
          <h1 className="text-2xl font-bold text-foreground">Team &amp; permissions</h1>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus size={16} /> Add admin
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{teamMembers.length} admin accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">{admin.email}</TableCell>
                  <TableCell>{admin.name}</TableCell>
                  <TableCell>
                    {admin.role === "SuperAdmin" ? (
                      <Badge className="gap-1 bg-violet-100 text-violet-800">
                        <ShieldCheck size={12} /> SuperAdmin
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Admin</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={admin.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}>
                      {admin.active ? "Active" : "Deactivated"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString() : "Never"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {admin.role !== "SuperAdmin" && (
                        <Button variant="outline" size="sm" onClick={() => openPermissionEditor(admin)}>
                          Permissions
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={admin.id === currentAdminId}
                        onClick={() => handleToggleActive(admin)}
                      >
                        {admin.active ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add admin</DialogTitle>
          </DialogHeader>
          <form action={handleCreateSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-admin-email">Email</Label>
              <Input id="new-admin-email" name="email" type="email" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-admin-name">Name</Label>
              <Input id="new-admin-name" name="name" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-admin-password">Password</Label>
              <Input id="new-admin-password" name="password" type="password" minLength={8} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-admin-role">Role</Label>
              <Select name="role" defaultValue="Admin">
                <SelectTrigger id="new-admin-role" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin (custom permissions)</SelectItem>
                  <SelectItem value="SuperAdmin">SuperAdmin (full access)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button type="submit" disabled={pending}>Create admin</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editingAdmin !== null} onOpenChange={(open) => !open && setEditingAdmin(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Permissions for {editingAdmin?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-5">
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.label} className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-foreground">{group.label}</p>
                <div className="flex flex-col gap-2 pl-1">
                  {group.keys.map((key) => (
                    <label key={key} className="flex items-center gap-2 text-sm text-foreground">
                      <Checkbox
                        checked={selectedPermissions.has(key)}
                        onCheckedChange={() => togglePermission(key)}
                      />
                      {key}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <DialogFooter>
            <Button onClick={handleSavePermissions} disabled={pending}>Save permissions</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
