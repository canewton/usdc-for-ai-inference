interface IconProps {
  className?: string;
}

export const SortIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M1 5.5L5.5 1M5.5 1L10 5.5M5.5 1V14.5M19 14.5L14.5 19M14.5 19L10 14.5M14.5 19V5.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
