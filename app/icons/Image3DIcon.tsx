interface IconProps {
  className?: string;
}

export const Image3DIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    width="25"
    height="24"
    viewBox="0 0 25 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12.25 8.77778L10 9.88889M10 9.88889L7.75 8.77778M10 9.88889V12.6667M19 5.44444L16.75 6.55556M19 5.44444L16.75 4.33333M19 5.44444V8.22222M12.25 2.11111L10 1L7.75 2.11111M1 5.44444L3.25 4.33333M1 5.44444L3.25 6.55556M1 5.44444V8.22222M10 21L7.75 19.8889M10 21L12.25 19.8889M10 21V18.2222M3.25 17.6667L1 16.5556V13.7778M16.75 17.6667L19 16.5556V13.7778"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);
