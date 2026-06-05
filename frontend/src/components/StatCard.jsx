export default function StatCard({ label, value, unit, icon: Icon, color, bgColor }) {
  return (
    <div className="card flex items-center gap-3 py-3 px-4">
      {Icon && (
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: bgColor || (color + '18') }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs text-text-secondary truncate">{label}</p>
        <p className="text-h2 text-text-primary flex items-baseline gap-1">
          <span className="text-h2 font-bold">{value}</span>
          {unit && <span className="text-sm font-normal text-text-secondary">{unit}</span>}
        </p>
      </div>
    </div>
  );
}
