import "../admin-orders.css";
import "./admin-tailwind.css";

const THEME_SCRIPT = `
(function () {
  try {
    var theme = localStorage.getItem("adminTheme");
    if (theme === "dark") {
      document.documentElement.setAttribute("data-admin-theme", "dark");
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
      {children}
    </>
  );
}
