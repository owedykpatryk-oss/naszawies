type Props = {
  children: React.ReactNode;
  className?: string;
};

/** Sticky dolny pasek akcji na mobile (formularze panelu). */
export function PasekAkcjiMobilny({ children, className = "" }: Props) {
  return (
    <div className={`soltys-pasek-akcji flex flex-wrap items-center gap-2 ${className}`.trim()}>{children}</div>
  );
}
