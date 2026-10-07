export default function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="app-grid absolute inset-0 opacity-60" />
      <div className="animate-glow absolute -left-24 top-24 h-80 w-80 rounded-full bg-violet/15 blur-[110px]" />
      <div className="animate-floaty absolute right-[-7rem] top-20 h-96 w-96 rounded-full bg-cyan/10 blur-[120px]" />
      <div className="absolute bottom-[-12rem] left-1/3 h-[34rem] w-[34rem] rounded-full bg-violet/10 blur-[150px]" />
    </div>
  );
}
