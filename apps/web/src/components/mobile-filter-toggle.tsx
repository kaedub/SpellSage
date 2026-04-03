import { type ReactNode, useState } from 'react';

type MobileFilterToggleProps = {
  readonly children: ReactNode;
};

export function MobileFilterToggle({ children }: MobileFilterToggleProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-300 transition-colors hover:text-gray-100"
      >
        <span>Filters</span>
        <span className="text-gray-500">{open ? '\u2212' : '+'}</span>
      </button>
      {open && <div className="max-h-[60vh] overflow-y-auto">{children}</div>}
    </>
  );
}
