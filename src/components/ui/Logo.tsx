"use client";

import React from "react";

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({ className = "", width = 94, height = 19 }: LogoProps) {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 94 19" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Text paths - using CSS variable for text color */}
      <path 
        d="M10.4034 12.4809H8.33974V6.39934H10.4034V12.4809ZM2.12741 18.5416H0.0637207V4.3791H8.33974V6.39934H2.12741V12.4809H8.33974V14.5011H2.12741V18.5416Z" 
        fill="currentColor"
      />
      <path 
        d="M14.5933 14.5011H12.5296V6.39934H14.5933V14.5011ZM20.8056 6.39934H14.5933V4.3791H20.8056V6.39934Z" 
        fill="currentColor"
      />
      <path 
        d="M52.461 14.5011H50.376V6.39934H46.2487V14.5011H44.185V4.3791H56.5884V6.39934H52.461V14.5011ZM58.6521 14.5011H56.5884V6.39934H58.6521V14.5011Z" 
        fill="currentColor"
      />
      <path 
        d="M71.1251 12.4809H69.0614V6.39934H71.1251V12.4809ZM62.8491 18.5416H60.7854V4.3791H69.0614V6.39934H62.8491V12.4809H69.0614V14.5011H62.8491V18.5416Z" 
        fill="currentColor"
      />
      <path 
        d="M81.5273 14.5011H77.3786V12.4809H81.5273V14.5011ZM77.3786 12.4809H75.3149V6.39934H73.2513V4.3791H75.3149V0.338623H77.3786V4.3791H81.5273V6.39934H77.3786V12.4809Z" 
        fill="currentColor"
      />
      <path 
        d="M85.724 12.4809H83.6603V10.4398H85.724V12.4809ZM91.9363 6.39934H83.6603V4.3791H91.9363V6.39934ZM94 14.5011H85.724V12.4809H91.9363V10.4398H85.724V8.41958H91.9363V6.39934H94V14.5011Z" 
        fill="currentColor"
      />
      
      {/* Icon squares - using CSS variable for icon color */}
      <rect x="34.2355" y="3.65039" width="2.28475" height="2.28475" fill="currentColor" className="text-primary" />
      <rect x="36.5569" y="5.8988" width="2.28475" height="2.28475" fill="currentColor" className="text-primary" />
      <rect x="38.8783" y="8.15942" width="2.28475" height="2.28475" fill="currentColor" className="text-primary" />
      <rect x="36.5569" y="10.4199" width="2.28475" height="2.28475" fill="currentColor" className="text-primary" />
      <rect x="34.2477" y="12.6685" width="2.28475" height="2.28475" fill="currentColor" className="text-primary" />
      <rect x="29.6172" y="14.9532" width="2.28475" height="2.28475" transform="rotate(-180 29.6172 14.9532)" fill="currentColor" className="text-primary" />
      <rect x="27.2958" y="12.7048" width="2.28475" height="2.28475" transform="rotate(-180 27.2958 12.7048)" fill="currentColor" className="text-primary" />
      <rect x="24.9744" y="10.4442" width="2.28475" height="2.28475" transform="rotate(-180 24.9744 10.4442)" fill="currentColor" className="text-primary" />
      <rect x="27.2958" y="8.18359" width="2.28475" height="2.28475" transform="rotate(-180 27.2958 8.18359)" fill="currentColor" className="text-primary" />
      <rect x="29.605" y="5.93518" width="2.28475" height="2.28475" transform="rotate(-180 29.605 5.93518)" fill="currentColor" className="text-primary" />
      
      {/* Center icon - using CSS variable for accent color */}
      <rect x="34.2355" y="11.5624" width="4.61836" height="4.52113" transform="rotate(-180 34.2355 11.5624)" fill="currentColor" className="text-primary" />
    </svg>
  );
}
