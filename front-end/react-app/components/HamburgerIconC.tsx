import { IconSvgProps } from '@/types/svgIcon';
import * as React from 'react';

export const HamburgerIconC: React.FC<IconSvgProps> = ({
  size = 35,
  ...props
}) => {
  return (
    <svg
      width="24"
      height="25"
      viewBox="0 0 24 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 5.75C4.58579 5.75 4.25 6.08579 4.25 6.5C4.25 6.91421 4.58579 7.25 5 7.25H19C19.4142 7.25 19.75 6.91421 19.75 6.5C19.75 6.08579 19.4142 5.75 19 5.75H5Z"
        fill="#EDF7EF"
      />
      <path
        d="M5 11.75C4.58579 11.75 4.25 12.0858 4.25 12.5C4.25 12.9142 4.58579 13.25 5 13.25H19C19.4142 13.25 19.75 12.9142 19.75 12.5C19.75 12.0858 19.4142 11.75 19 11.75H5Z"
        fill="#EDF7EF"
      />
      <path
        d="M5 17.75C4.58579 17.75 4.25 18.0858 4.25 18.5C4.25 18.9142 4.58579 19.25 5 19.25H19C19.4142 19.25 19.75 18.9142 19.75 18.5C19.75 18.0858 19.4142 17.75 19 17.75H5Z"
        fill="#EDF7EF"
      />
    </svg>
  );
};
