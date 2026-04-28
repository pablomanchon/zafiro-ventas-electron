import React from "react";

export default function Main({
  children,
  ...props
}) {
  return (
    <main
      {...props}
      className={`
        md:col-start-2
        flex h-full min-h-0 w-full flex-1 overflow-hidden
        bg-stone-900 bg-opacity-50 rounded border border-black shadow-inner shadow-black
        ${props.className}
      `}
    >
      <div
        className="relative flex h-full min-h-0 w-full flex-col overflow-auto rounded p-2 sm:p-3"
      >
        {children}
      </div>
    </main>
  );
}
