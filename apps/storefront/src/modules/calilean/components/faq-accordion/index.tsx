"use client"

import { useState } from "react"

const faqs = [
  {
    q: 'What does "research-grade" actually mean?',
    a: "Each batch ships with an independent Certificate of Analysis confirming identity, mass, and purity by HPLC and mass spectrometry. The COA is on the product page and on the inner box flap. Your vial's lot number is the same one on the report.",
  },
  {
    q: "Who runs your assays?",
    a: "Janoshik Analytical and BioRegen, both independent ISO-accredited labs. Each COA names the lab, the analyst, and the date.",
  },
  {
    q: "Where do you ship from? How long does it take?",
    a: "We ship from El Segundo, California. Standard delivery is 2 business days to most US addresses. Next-day delivery is available at checkout.",
  },
  {
    q: "How should peptides be stored?",
    a: "Lyophilized vials are stable at room temperature in transit. Once received, store unopened vials below 25\u00b0C. After reconstitution, refrigerate at 2-8\u00b0C and use per your protocol.",
  },
  {
    q: "Are these legal to purchase in the United States?",
    a: "Yes, when purchased and handled for in-vitro laboratory research only. Our products are sold strictly under research-use-only terms. They are not drugs, supplements, cosmetics, or food, and they are not for human or animal consumption.",
  },
  {
    q: "How do I pay?",
    a: "Major credit and debit cards at checkout. Encrypted end-to-end. We do not store card numbers.",
  },
  {
    q: "Do you offer bulk pricing for institutional researchers?",
    a: "Yes. Email hello@calilean.com with your institution and the SKUs you need. We respond within one business day.",
  },
  {
    q: "What is the shelf life of an unopened vial?",
    a: "Lyophilized peptides stored as directed are typically stable for 12 to 24 months, often longer below -20\u00b0C. Actual stability depends on sequence and storage conditions.",
  },
]

const FaqAccordion = () => {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="py-24 bg-calilean-bg" id="faq">
      <div className="content-container max-w-3xl mx-auto">
        <h2 className="text-3xl small:text-4xl font-bold text-center mb-12">
          You ask. We answer.
        </h2>
        <div className="divide-y divide-calilean-sand">
          {faqs.map((faq, i) => (
            <div key={i}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                aria-controls={`faq-panel-${i}`}
                className="w-full flex justify-between items-center py-5 text-left text-lg font-semibold text-calilean-ink"
              >
                {faq.q}
                <span
                  className={`text-2xl font-light transition-transform ${
                    open === i ? "rotate-45" : ""
                  }`}
                >
                  +
                </span>
              </button>
              <div
                id={`faq-panel-${i}`}
                role="region"
                className="overflow-hidden transition-all duration-300"
                style={{ maxHeight: open === i ? "300px" : "0" }}
              >
                <p className="pb-5 text-calilean-fog text-base leading-relaxed">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FaqAccordion
