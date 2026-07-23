"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const ALL_VALUE = "All";

export function AuditLogFilters({
  entities,
  admins,
  initialEntity,
  initialAdminId,
}: {
  entities: string[];
  admins: { id: string; name: string }[];
  initialEntity: string;
  initialAdminId: string;
}) {
  const router = useRouter();
  const [entity, setEntity] = useState(initialEntity || ALL_VALUE);
  const [adminId, setAdminId] = useState(initialAdminId || ALL_VALUE);

  function applyFilters(nextEntity = entity, nextAdminId = adminId) {
    const params = new URLSearchParams();
    if (nextEntity && nextEntity !== ALL_VALUE) params.set("entity", nextEntity);
    if (nextAdminId && nextAdminId !== ALL_VALUE) params.set("adminId", nextAdminId);
    router.push(`/admin/audit-log?${params.toString()}`);
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <Select
        value={entity}
        onValueChange={(value) => {
          setEntity(value);
          applyFilters(value, adminId);
        }}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="All entities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>All entities</SelectItem>
          {entities.map((e) => (
            <SelectItem key={e} value={e}>{e}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={adminId}
        onValueChange={(value) => {
          setAdminId(value);
          applyFilters(entity, value);
        }}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="All admins" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>All admins</SelectItem>
          {admins.map((a) => (
            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {(entity !== ALL_VALUE || adminId !== ALL_VALUE) && (
        <Button
          variant="outline"
          onClick={() => {
            setEntity(ALL_VALUE);
            setAdminId(ALL_VALUE);
            router.push("/admin/audit-log");
          }}
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
