interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
}

export function SectionHeader({ eyebrow, title, description }: SectionHeaderProps) {
  return (
    <div className="mb-12">
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h2 className="section-heading">{title}</h2>
      {description && (
        <p className="mt-4 text-lg text-ink/70 max-w-2xl">{description}</p>
      )}
    </div>
  );
}
