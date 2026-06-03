/** White border + checkmark for selected gallery/dashboard photos */
export function SelectionOverlay() {
  return (
    <>
      <div
        className="absolute inset-0 border-2 border-white pointer-events-none z-10"
        aria-hidden
      />
      <div
        className="absolute top-2 right-2 z-20 w-5 h-5 bg-white flex items-center justify-center pointer-events-none"
        aria-hidden
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M2 6.5L4.5 9L10 3.5"
            stroke="#0a0a0a"
            strokeWidth="1.5"
            strokeLinecap="square"
          />
        </svg>
      </div>
    </>
  );
}
