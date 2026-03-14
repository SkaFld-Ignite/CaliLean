const values = [
  {
    title: "Lab-Verified Purity",
    description: "Every batch undergoes third-party testing by Janoshik Analytical or BioRegen. We publish full Certificates of Analysis.",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none" stroke="#1F2937" strokeWidth="1.5">
        <path d="M24 4L20 16H8l10 7-4 13 10-7 10 7-4-13 10-7H28L24 4z"/>
      </svg>
    ),
  },
  {
    title: "Fast USA Shipping",
    description: "Our U.S. facility ships your order the same day. No customs, no international delays.",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none" stroke="#1F2937" strokeWidth="1.5">
        <path d="M4 36l20-28 20 28H4z"/><path d="M16 28h16M20 22h8"/>
      </svg>
    ),
  },
  {
    title: "Next-Generation Compounds",
    description: "From established staples to the latest innovations in peptide research, our catalogue evolves with the science.",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none" stroke="#1F2937" strokeWidth="1.5">
        <circle cx="24" cy="24" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="36" cy="12" r="4"/>
        <line x1="15" y1="14" x2="20" y2="20"/><line x1="33" y1="14" x2="28" y2="20"/>
      </svg>
    ),
  },
]

const ValueProps = () => {
  return (
    <section className="py-24 bg-bluum-bg">
      <div className="content-container">
        <div className="grid grid-cols-1 small:grid-cols-3 gap-16">
          {values.map((v) => (
            <div key={v.title} className="text-center">
              <div className="flex justify-center mb-4">{v.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{v.title}</h3>
              <p className="text-bluum-muted text-base leading-relaxed">{v.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ValueProps
