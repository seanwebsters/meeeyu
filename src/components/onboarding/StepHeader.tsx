export function StepHeader({
  step,
  total,
  title,
  subtitle,
}: {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8">
      <div className="mb-4 flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={
              "h-1.5 flex-1 rounded-full " +
              (i < step ? "bg-pink" : "bg-ink/10")
            }
          />
        ))}
      </div>
      <h1 className="text-2xl font-semibold leading-tight">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-ink-soft">{subtitle}</p>}
    </div>
  );
}
