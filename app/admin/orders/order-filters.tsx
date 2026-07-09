"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ORDER_STATUSES } from "@/lib/order-status";

export function OrderFilters({
  initialQuery,
  initialStatus,
}: {
  initialQuery: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState(initialStatus);

  function applyFilters() {
    const params = new URLSearchParams();
    if (query) params.set("search", query);
    if (status) params.set("status", status);
    router.push(`/admin/orders?${params.toString()}`);
  }

  return (
    <div className="order-filters">
      <div>
        <input
          type="text"
          placeholder="Search orders, customers..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") applyFilters(); }}
          className="search-input"
        />
      </div>

      <select
        value={status}
        onChange={(e) => { setStatus(e.target.value); }}
        className="filter-select"
      >
        <option value="">All statuses</option>
        {ORDER_STATUSES.map((orderStatus) => (
          <option key={orderStatus} value={orderStatus}>{orderStatus}</option>
        ))}
      </select>

      <button onClick={applyFilters} className="primary-action compact-action">
        Apply
      </button>
    </div>
  );
}
