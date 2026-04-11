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
        min-h-[calc(100vh-1rem)] md:min-h-screen w-full overflow-y-auto
        bg-stone-900 bg-opacity-50 rounded border-black border shadow-inner shadow-black
        ${props.className}
      `}
    >
      <div
        className="w-full min-h-full p-2 sm:p-3 rounded shadow-inner shadow-black border-black border-2 flex flex-col overflow-auto relative"
      >
        {children}
      </div>
    </main>
  );
}
