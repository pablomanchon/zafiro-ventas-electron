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
        bg-stone-900 bg-opacity-50 rounded border-black border shadow-inner shadow-black
        ${props.className}
      `}
    >
      <div
        className="relative flex h-full min-h-0 w-full flex-col overflow-auto rounded border-2 border-black p-2 shadow-inner shadow-black sm:p-3"
      >
        {children}
      </div>
    </main>
  );
}
