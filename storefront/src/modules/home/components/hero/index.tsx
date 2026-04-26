import LocalizedClientLink from "@modules/common/components/localized-client-link"

const Hero = () => {
  return (
    <section className="py-24 small:py-32 text-center relative overflow-hidden bg-bluum-bg">
      <div className="content-container">
        <h1 className="font-display text-5xl small:text-7xl large:text-8xl font-normal leading-[1.05] tracking-tight max-w-4xl mx-auto mb-8">
          Research-grade peptides. Plainly labeled.
        </h1>
        <p className="text-lg text-calilean-fog max-w-xl mx-auto mb-12 leading-relaxed">
          Third-party assayed. Batch-traceable. Built for the South Bay.
        </p>
        <LocalizedClientLink
          href="/store"
          className="inline-flex items-center justify-center px-7 py-3 bg-calilean-coa text-calilean-bg rounded-btn font-medium text-base hover:opacity-85 transition-all hover:-translate-y-0.5"
        >
          Shop Peptides
        </LocalizedClientLink>
      </div>
    </section>
  )
}

export default Hero
