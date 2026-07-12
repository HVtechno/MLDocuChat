export function Button({ variant = "primary", size = "md", className = "", ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = {
    sm: "text-sm px-3 py-1.5",
    md: "text-sm px-4 py-2.5",
    lg: "text-base px-6 py-3",
  };
  const variants = {
    primary: "bg-iris text-white hover:bg-iris-deep shadow-soft hover:shadow-lift",
    ghost: "text-slate-600 hover:text-ink hover:bg-slate-100",
    outline: "border border-slate-200 text-ink hover:border-slate-300 hover:bg-slate-50",
    danger: "text-red-600 hover:bg-red-50",
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props} />
  );
}
