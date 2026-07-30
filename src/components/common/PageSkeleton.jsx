export default function PageSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-5">
      <div className="surface animate-pulse p-6">
        <div className="h-4 w-24 rounded bg-slate-200" />
        <div className="mt-3 h-8 w-2/3 rounded bg-slate-200" />
        <div className="mt-2 h-4 w-1/2 rounded bg-slate-100" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="surface animate-pulse p-5">
            <div className="h-4 w-20 rounded bg-slate-200" />
            <div className="mt-5 h-8 w-24 rounded bg-slate-200" />
            <div className="mt-3 h-4 w-28 rounded bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="surface animate-pulse p-5 xl:col-span-2">
          <div className="h-5 w-40 rounded bg-slate-200" />
          <div className="mt-6 h-56 rounded-xl bg-slate-100" />
        </div>
        <div className="surface animate-pulse p-5">
          <div className="h-5 w-36 rounded bg-slate-200" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: rows }).map((_, index) => (
              <div key={index} className="h-20 rounded-xl bg-slate-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
