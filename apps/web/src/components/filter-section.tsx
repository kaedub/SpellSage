import { type ReactNode, useState } from 'react';

type FilterSectionProps = {
  readonly title: string;
  readonly children: ReactNode;
  readonly defaultOpen?: boolean;
};

export function FilterSection({
  title,
  children,
  defaultOpen = false,
}: FilterSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-800">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-300 transition-colors hover:text-gray-100"
      >
        {title}
        <span className="text-gray-500">{open ? '\u2212' : '+'}</span>
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}
