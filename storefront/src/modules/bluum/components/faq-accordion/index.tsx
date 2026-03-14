"use client"

import { useState } from "react"

const faqs = [
  {
    q: "Are these peptides quality tested?",
    a: "Our analytical testing is conducted by Janoshik Analytical or BioRegen, independent third-party laboratories to verify the identity, purity, and composition of our research products. Each CoA includes purity analysis, peptide sequence confirmation, and date of analysis.",
  },
  {
    q: "What are typical delivery times?",
    a: "Delivery for our free shipping option typically takes 3-5 business days. We ship from right here in the USA to all US addresses. We also provide an option for next day shipping for an extra charge.",
  },
  {
    q: "How should these compounds be stored?",
    a: "Our peptides are shipped in lyophilized form, which is stable at room temperature during transit. Once received, store unopened vials in a cool, dry place.",
  },
  {
    q: "Are products stable during shipping?",
    a: "Our peptides are shipped in lyophilized (freeze-dried) form, which ensures stability during transit. Each batch is verified for purity upon production.",
  },
  {
    q: "What are your bulk ordering options?",
    a: "For bulk inquiries and volume pricing, please contact us at hello@bluumpeptides.com.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept credit/debit cards. After you place an order, we'll email you a secure payment link. Please complete payment within 48 hours.",
  },
  {
    q: "Are these peptides legal to buy for research in the USA?",
    a: "Yes. When purchased for laboratory/research use only and handled in compliance with all applicable regulations. We sell reagents labeled 'Not for human consumption.'",
  },
  {
    q: "What is the shelf life of unopened vials?",
    a: "Lyophilized peptides stored as directed are typically stable 12-24 months (often longer at -20\u00b0C). Actual stability depends on sequence and storage conditions.",
  },
]

const FaqAccordion = () => {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="py-24 bg-bluum-bg" id="faq">
      <div className="content-container max-w-3xl mx-auto">
        <h2 className="text-3xl small:text-4xl font-bold text-center mb-12">
          You <em className="italic">ask</em>, we answer.
        </h2>
        <div className="divide-y divide-bluum-border">
          {faqs.map((faq, i) => (
            <div key={i}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex justify-between items-center py-5 text-left text-lg font-semibold text-bluum-text"
              >
                {faq.q}
                <span className={`text-2xl font-light transition-transform ${open === i ? "rotate-45" : ""}`}>+</span>
              </button>
              <div
                className="overflow-hidden transition-all duration-300"
                style={{ maxHeight: open === i ? "300px" : "0" }}
              >
                <p className="pb-5 text-bluum-muted text-base leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FaqAccordion
