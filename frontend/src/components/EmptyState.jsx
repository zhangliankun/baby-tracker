export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {Icon && <Icon className="w-16 h-16 text-text-muted mb-4" strokeWidth={1.5} />}
      <h3 className="text-h3 text-text-primary mb-2">{title}</h3>
      {description && <p className="text-sm text-text-secondary mb-4">{description}</p>}
      {action && action}
    </div>
  );
}
