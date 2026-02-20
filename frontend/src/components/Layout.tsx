/**
 * Layout wrapper — renders Navbar + auto-generated breadcrumbs + page content.
 */
import { Outlet, useLocation, Link } from "react-router-dom";
import Navbar from "./Navbar";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/Breadcrumb";

/* ── Human-readable labels for route segments ──────────── */
const LABELS: Record<string, string> = {
  "": "Home",
  items: "Items",
  new: "New",
  demo: "UI Demo",
  profile: "Profile",
  settings: "Settings",
};

function label(segment: string): string {
  return LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
}

export default function Layout() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  // Build crumbs: each has { label, path }
  const crumbs = segments.map((seg, i) => ({
    label: label(seg),
    path: "/" + segments.slice(0, i + 1).join("/"),
  }));

  const isHome = segments.length === 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb bar */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            {/* Always show Home */}
            <BreadcrumbItem>
              {isHome ? (
                <BreadcrumbPage>Home</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>

            {crumbs.map((crumb, i) => {
              const isLast = i === crumbs.length - 1;
              return (
                <span key={crumb.path} className="contents">
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to={crumb.path}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </span>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
