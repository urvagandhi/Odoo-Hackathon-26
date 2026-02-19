/**
 * Dashboard page — landing overview.
 */
import { Link } from "react-router-dom";
import { useItems } from "../hooks/useItems";

export default function Dashboard() {
  const { items, loading } = useItems();

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold">Welcome to HackStack ⚡</h1>
        <p className="mt-2 text-indigo-100 max-w-xl">
          Your hackathon-ready full-stack boilerplate. Start building features — the infrastructure is done.
        </p>
        <Link
          to="/items/new"
          className="inline-block mt-5 px-6 py-2.5 bg-white text-indigo-700 font-semibold rounded-lg hover:bg-indigo-50 transition-colors text-sm"
        >
          Create Your First Item →
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Total Items"
          value={loading ? '...' : items.length.toString()}
          icon="📦"
          color="indigo"
        />
        <StatCard
          title="Stack"
          value="React + FastAPI"
          icon="🛠️"
          color="emerald"
        />
        <StatCard
          title="Database"
          value="PostgreSQL"
          icon="🗄️"
          color="amber"
        />
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <QuickLink label="Swagger API Docs" href="http://localhost:8000/docs" external />
          <QuickLink label="ReDoc" href="http://localhost:8000/redoc" external />
          <QuickLink label="View All Items" to="/items" />
          <QuickLink label="Create New Item" to="/items/new" />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: string;
  color: string;
}) {
  const bgMap: Record<string, string> = {
    indigo: "bg-indigo-50",
    emerald: "bg-emerald-50",
    amber: "bg-amber-50",
  };

  return (
    <div className={`${bgMap[color] || "bg-slate-50"} rounded-xl p-5`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );
}

function QuickLink({
  label,
  to,
  href,
  external,
}: {
  label: string;
  to?: string;
  href?: string;
  external?: boolean;
}) {
  const cls =
    "flex items-center gap-2 px-4 py-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors";

  if (external && href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {label} <span className="text-xs text-slate-400">↗</span>
      </a>
    );
  }

  return (
    <Link to={to || '/'} className={cls}>
      {label}
    </Link>
  );
}
