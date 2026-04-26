import { RUO_DISCLAIMER_SHORT } from "@lib/ruo"

const ResearchDisclaimer = () => {
  return (
    <p
      role="note"
      aria-label="Research use only disclaimer"
      data-ruo-disclaimer="inline"
      className="text-xs uppercase tracking-wide text-stone-400 border-t border-stone-200 pt-4"
    >
      {RUO_DISCLAIMER_SHORT}
    </p>
  )
}

export default ResearchDisclaimer
