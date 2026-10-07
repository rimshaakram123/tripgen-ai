export default function Loading() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-midnight px-6 py-24">
      <div className="app-grid absolute inset-0 opacity-40" />
      <div className="animate-glow absolute left-1/2 top-20 h-80 w-80 -translate-x-1/2 rounded-full bg-violet/15 blur-[120px]" />
      <div className="relative mx-auto max-w-6xl">
        <div className="h-10 w-40 rounded-2xl shimmer" />
        <div className="mt-14 h-12 max-w-xl rounded-2xl shimmer" />
        <div className="mt-4 h-5 max-w-md rounded-xl shimmer" />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[0,1,2].map((item)=><div key={item} className="glass-panel h-40 rounded-[28px] p-5"><div className="h-10 w-10 rounded-2xl shimmer"/><div className="mt-6 h-5 w-2/3 rounded-lg shimmer"/><div className="mt-3 h-3 w-full rounded-lg shimmer"/></div>)}
        </div>
      </div>
    </main>
  );
}
