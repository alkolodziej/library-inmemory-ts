type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="empty-state" role="status" aria-live="polite">
      <span className="empty-state-icon" aria-hidden="true">
        ○
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
