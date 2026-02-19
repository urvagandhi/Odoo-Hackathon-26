/**
 * Layout wrapper — renders Navbar + page content.
 */
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
