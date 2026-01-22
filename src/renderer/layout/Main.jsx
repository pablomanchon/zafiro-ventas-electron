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
        h-screen w-full overflow-y-auto
        bg-stone-900 bg-opacity-50 rounded border-black border shadow-inner shadow-black
        ${props.className}
      `}
    >
      <div
        className="w-full p-2 h-full rounded shadow-inner shadow-black border-black border-2 flex flex-col overflow-auto relative"
      >
        {children}
      </div>
    </main>
  );
}
