"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ORDER_STATUSES } from "@/lib/order-status";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL_STATUSES_VALUE = "All";

export function OrderFilters({
  initialQuery,
  initialStatus,
}: {
  initialQuery: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState(initialStatus || ALL_STATUSES_VALUE);

  function applyFilters(nextStatus = status) {
    const params = new URLSearchParams();
    if (query) params.set("search", query);
    if (nextStatus && nextStatus !== ALL_STATUSES_VALUE) params.set("status", nextStatus);
    router.push(`/admin/orders?${params.toString()}`);
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <Input
        type="text"
        placeholder="Search orders, customers..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") applyFilters(); }}
        className="max-w-xs"
      />

      <Select
        value={status}
        onValueChange={(value) => {
          setStatus(value);
          applyFilters(value);
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_STATUSES_VALUE}>All statuses</SelectItem>
          {ORDER_STATUSES.map((orderStatus) => (
            <SelectItem key={orderStatus} value={orderStatus}>{orderStatus}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button onClick={() => applyFilters()}>Apply</Button>
    </div>
  );
}
