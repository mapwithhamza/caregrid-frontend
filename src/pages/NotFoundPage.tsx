import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-medium uppercase tracking-wide text-slate-500">404</p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-950">Page not found</h2>
      <p className="mt-2 text-slate-600">This CareGrid view has not been created.</p>
      <Link className="mt-6 inline-flex rounded-2xl bg-caregrid-navy px-4 py-2 text-sm font-medium text-white" to="/">
        Back to overview
      </Link>
    </div>
  );
}
