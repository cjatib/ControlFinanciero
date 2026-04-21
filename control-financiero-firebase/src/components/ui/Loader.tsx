export function Loader({ label = 'Cargando...' }: { label?: string }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 text-center text-slate-300">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-accent" />
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  );
}

