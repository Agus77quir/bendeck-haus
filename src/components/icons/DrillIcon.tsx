import { forwardRef, SVGProps } from "react";

interface DrillIconProps extends SVGProps<SVGSVGElement> {
  className?: string;
}

export const DrillIcon = forwardRef<SVGSVGElement, DrillIconProps>(
  ({ className, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14 4h4v4h-4z" />
      <path d="M2 12h6l2-2h4l2 2h6" />
      <path d="M14 8v4" />
      <path d="M10 8v4" />
      <path d="M4 16h16v4H4z" />
      <path d="M22 12l-2 4" />
      <path d="M2 12l2 4" />
    </svg>
  )
);

DrillIcon.displayName = 'DrillIcon';
