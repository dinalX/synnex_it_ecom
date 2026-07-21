import "../admin-orders.css";
import "./admin-tailwind.css";

const THEME_SCRIPT = `
(function () {
  try {
    var theme = localStorage.getItem("adminTheme");
    if (theme === "dark") {
      document.documentElement.setAttribute("data-admin-theme", "dark");
    }
    if (localStorage.getItem("adminSidebarCollapsed") === "true") {
      document.documentElement.setAttribute("data-sidebar-collapsed", "true");
    }
  } catch (e) {}
})();
`;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      {/* Admin has its own design system (admin-tailwind.css) and shouldn't
          inherit the storefront's brand webfont from the shared body rule —
          this wraps every /admin/* route, including login/forgot/reset
          password which render outside the (panel) group's .admin-shell. */}
      <div className="admin-font-reset">{children}</div>
    </>
  );
}
