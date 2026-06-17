export default function PaymentsLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
        <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
    </div>
  );
}
