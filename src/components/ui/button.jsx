export function Button({ className = "", children, ...props }) {
  return (
    <button
      {...props}
      className={
        "px-4 py-2 lg:py-3 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed " +
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 " +
        "min-h-[40px] flex items-center justify-center " +
        className
      }
    >
      {children}
    </button>
  );
}
