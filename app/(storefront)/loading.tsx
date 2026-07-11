import { Loader2 } from "lucide-react";

export default function StorefrontLoading() {
  return (
    <main className="simple-page" aria-busy="true">
      <div className="route-loading" role="status">
        <Loader2 size={32} className="spin" aria-hidden="true" />
        <span>Loading…</span>
      </div>
    </main>
  );
}
