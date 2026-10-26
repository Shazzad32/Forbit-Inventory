"use client";

// Submit button that asks before submitting its form.
export default function ConfirmButton({ message, children, className, label }) {
  return (
    <button
      type="submit"
      className={className}
      aria-label={label}
      title={label}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
