/* Foliq logo mark — folio (a manuscript leaf) as the root idea.
 *
 * Concept: a document page whose lines resolve into a single bright
 * mark — the "answer" surfacing from the page. It reads as both a
 * document and a spark of understanding, which is the product's whole
 * idea. Works down to 20px; the spark is the one accent.
 *
 * `tone` controls color: "brand" (iris on ink) for the app chrome,
 * or "mono" to inherit currentColor.
 */
export function Logo({ size = 28, tone = "brand", className = "" }) {
  const ink = tone === "brand" ? "#12131a" : "currentColor";
  const accent = tone === "brand" ? "#5b5bd6" : "currentColor";
  const spark = tone === "brand" ? "#c68a2e" : "currentColor";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      role="img"
      aria-label="Foliq"
    >
      {/* page */}
      <rect x="6" y="4" width="20" height="24" rx="4" fill={ink} />
      {/* text lines */}
      <rect x="10" y="10" width="9" height="1.8" rx="0.9" fill="#ffffff" opacity="0.55" />
      <rect x="10" y="14" width="12" height="1.8" rx="0.9" fill="#ffffff" opacity="0.55" />
      <rect x="10" y="18" width="7" height="1.8" rx="0.9" fill={accent} />
      {/* the answer spark — resolves out of the page */}
      <path
        d="M22.5 19.2l0.9 2.1 2.1 0.9-2.1 0.9-0.9 2.1-0.9-2.1-2.1-0.9 2.1-0.9z"
        fill={spark}
      />
    </svg>
  );
}
