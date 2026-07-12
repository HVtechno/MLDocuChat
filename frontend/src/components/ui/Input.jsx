export function Input({ label, error, className = "", ...props }) {
  return (
    <label className="block">
      {label && (
        <span className="block text-sm font-medium text-slate-700 mb-1.5">{label}</span>
      )}
      <input
        className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[15px]
          text-ink placeholder:text-slate-400 transition-colors
          focus:border-iris focus:ring-2 focus:ring-iris/20 focus:outline-none ${className}`}
        {...props}
      />
      {error && <span className="block text-sm text-red-600 mt-1.5">{error}</span>}
    </label>
  );
}
