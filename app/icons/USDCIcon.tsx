interface IconProps {
  className?: string;
}

export const USDCIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    width="24"
    height="25"
    viewBox="0 0 24 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M14.6411 8.55H11.3781C10.8542 8.55 10.3519 8.75808 9.98151 9.12846C9.61113 9.49885 9.40305 10.0012 9.40305 10.525C9.40305 11.615 10.2871 12.5 11.3781 12.5H13.1011C14.1911 12.5 15.0761 13.384 15.0761 14.476C15.0755 14.9997 14.8671 15.5018 14.4966 15.872C14.1261 16.2421 13.6238 16.45 13.1001 16.45H9.83805M12.2401 8.55V7.231M12.2401 17.768V16.451M9.36605 3.5C5.39805 4.57 2.47705 8.194 2.47705 12.5C2.47705 16.806 5.39705 20.43 9.36605 21.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M14.634 3.5C18.602 4.57 21.523 8.194 21.523 12.5C21.523 16.806 18.603 20.43 14.634 21.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);
