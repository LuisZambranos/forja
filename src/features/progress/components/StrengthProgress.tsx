export function StrengthProgress() {
  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      <div className="bg-surface border border-border rounded-2xl p-6 text-center shadow-sm">
        <span className="text-4xl block mb-2">🏋️‍♂️</span>
        <h3 className="text-lg font-black text-text mb-1">Fuerza y Récords</h3>
        <p className="text-sm text-text-muted">Progresión del peso y 1RM por ejercicio.</p>
      </div>
    </div>
  );
}
