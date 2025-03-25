interface IconProps {
  className?: string;
}

export const ImageIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    width="25"
    height="24"
    viewBox="0 0 25 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M6.11111 1V21M18.8889 1V21M1 6H6.11111M18.8889 6H24M1 11H24M1 16H6.11111M18.8889 16H24M2.27778 21H22.7222C23.0611 21 23.3861 20.8683 23.6257 20.6339C23.8654 20.3995 24 20.0815 24 19.75V2.25C24 1.91848 23.8654 1.60054 23.6257 1.36612C23.3861 1.1317 23.0611 1 22.7222 1H2.27778C1.93889 1 1.61388 1.1317 1.37425 1.36612C1.13462 1.60054 1 1.91848 1 2.25V19.75C1 20.0815 1.13462 20.3995 1.37425 20.6339C1.61388 20.8683 1.93889 21 2.27778 21Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);
