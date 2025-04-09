import type { PropsWithChildren } from 'react';

interface Props extends PropsWithChildren {
  className?: string;
}

export const InsightBox = ({ children, className }: Props) => {
  return (
    <div
      className={`shadow-sm rounded-2xl p-8 border bg-[#FBFBFB] border-[#EAEAEC] ${className}`}
    >
      {children}
    </div>
  );
};
