# Counsel-Required Questions — Irreducibly-Human-Lawyer Scope

> **Author:** Compliance · **Date:** 2026-04-26 · **Branch:** `compliance/counsel-questions-ska26`
> **Issue:** SKA-26 · **Parent:** SKA-1 · **Inputs:** SKA-25 (state posture map), SKA-2 (RUO surface)
>
> **Purpose.** A tight, pre-built ask for outside counsel when SKA-18 activates post-launch. Sharpens the engagement, controls hourly cost, stops the team from re-asking the same things. **This document is not legal advice.**

## How to use this document

- Each question is scoped so a US-licensed attorney with food/drug/pharmacy experience can answer in **≤30 minutes**.
- Each question carries: **Why we can't answer ourselves**, **Why it matters**, and a **Decision tree** keyed to the plausible answers, so counsel time converts directly to operational decisions.
- State-specific questions cite the per-state matrix in `docs/compliance/state-ruo-posture.md` (SKA-25).
- Total: **14 questions across 6 domains**, all needed before scaling spend or expanding the SKU shelf beyond Retatrutide.

---

## Domain A — RUO-attestation legal soundness

### Q1. Is RUO labeling + checkout attestation a sufficient federal-level defense to FDA OCI / FTC misbranding action, or is FDA's intended-use doctrine controlling?

- **Why we can't answer ourselves.** Intended-use doctrine (21 CFR §201.128) was amended in 2021 with explicit reference to "any relevant source of evidence" of intended use. The state of the law on whether RUO labeling alone defeats an intended-use inference is a live, lawyer-judgment-bound question.
- **Why it matters.** Drives whether the entire CaliLean storefront posture is defensible at the federal layer. If the answer is "no," every other question in this document is moot.
- **Decision tree.**
  - **RUO labeling holds:** keep current surface; revisit only on an FDA warning-letter event.
  - **RUO labeling holds only with corroborating evidence (no therapeutic claims, no dosing guidance, no testimonials):** lock CMO to a copy whitelist; bake into pre-publish review.
  - **RUO labeling does NOT hold under current marketing context:** stop sale of Retatrutide pending counsel-supervised relabel + repositioning.

### Q2. Is the checkout attestation ("I am a qualified researcher and will not consume these products") legally enforceable as a contractual representation, or is it boilerplate a court will pierce?

- **Why we can't answer ourselves.** Enforceability of a one-click consumer attestation under CA contract law (and the ToS §13 forum) requires precedent review counsel must do.
- **Why it matters.** Determines whether the attestation is a real liability shield for an injured-buyer claim, or just an FDA-facing artifact.
- **Decision tree.**
  - **Enforceable:** keep current single-checkbox UX.
  - **Enforceable only if attestation is "conspicuous" and separately consented:** Designer + CTO add a distinct attestation step (already structurally separate; may need typography/contrast tweaks).
  - **Not enforceable as a substantive defense:** treat attestation as FDA-facing only; deprioritize as a civil-liability bar; revisit insurance / waiver structure separately.

### Q3. Does our `RUO_ATTESTATION_VERSION`-tagged audit trail (per-order metadata in Medusa, see `backend/src/subscribers/ruo-attestation-audit.ts`) meet the "ordinary records of a regulated business" bar that an FDA or state-AG investigator would expect?

- **Why we can't answer ourselves.** Records-retention sufficiency is a judgment call against enforcement-practice norms counsel sees and we don't.
- **Why it matters.** A weak audit trail turns a routine inquiry into a subpoena. A strong one closes inquiries fast.
- **Decision tree.**
  - **Sufficient:** no change.
  - **Sufficient with a retention policy:** Compliance writes a retention policy; CTO confirms Medusa retention matches.
  - **Insufficient:** add IP / user-agent / signed-attestation-blob to the order metadata payload; budget a one-time backfill.

---

## Domain B — Retatrutide-specific (FDA's most-targeted peptide) and prescription-without-license exposure

### Q4. Is selling Retatrutide RUO-labeled DTC actionable under FDCA §503(b) (Rx-only restriction) or §301 (introducing an unapproved new drug into interstate commerce), notwithstanding the RUO surface?

- **Why we can't answer ourselves.** Retatrutide is unapproved (Phase 3 as of 2026); its regulatory status is in motion. Whether RUO labeling is a defense at the §301/§503(b) layer specifically — versus the general misbranding question in Q1 — needs counsel.
- **Why it matters.** Retatrutide is THE first-launch SKU and FDA's most-watched peptide alongside Tirzepatide/Semaglutide. The answer scopes our exposure on the lead product.
- **Decision tree.**
  - **Defensible under RUO:** continue as-is.
  - **Defensible only with additional gating (e.g., institutional-buyer attestation):** Compliance + CTO add a "research institution / lab" attestation field; reassess UX impact.
  - **Not defensible:** delist Retatrutide pending an FDA-acceptable structure (likely impossible pre-approval); re-anchor lead SKU on a peptide with a clearer RUO history (e.g., BPC-157, MOTS-c).

### Q5. What is the personal exposure to CaliLean officers (CEO, CTO, etc.) under "practice of pharmacy / medicine without a license" theories at the state level if any state board determines the RUO posture is sham?

- **Why we can't answer ourselves.** Officer-personal-liability risk varies sharply by state and by enforcement posture; counsel-judgment territory.
- **Why it matters.** Determines whether officers should carry separate D&O / indemnification structures and whether ops should be sequestered into a separate operating LLC (links to Q6).
- **Decision tree.**
  - **Personal exposure is low under current structure:** no change.
  - **Personal exposure is non-trivial in 1–3 priority states (CA, NJ, MA per SKA-25):** add D&O coverage; document board indemnification; consider geo-suppression of those states only on warning-letter signal.
  - **Personal exposure is material across most states:** restructure operations under a separate LLC with arms-length governance before scaling spend.

---

## Domain C — LLC liability shield adequacy

### Q6. Does the current single-LLC structure provide officer-personal-asset protection under FDA enforcement and state consumer-protection actions, or do typical fraud / willfulness exceptions pierce the shield in this product context — and at what scale should we restructure (separate IP-holding LLC + ops LLC)?

- **Why we can't answer ourselves.** Veil-piercing under FDCA enforcement and under state consumer-protection statutes (e.g., CA UCL §17200, NY GBL §349) involves equitable doctrines counsel must weigh against the actual ops record.
- **Why it matters.** Determines the right corporate structure before scaling. Restructuring is much cheaper before revenue than after.
- **Decision tree.**
  - **Single LLC is adequate up to ~$5M ARR:** no restructure now; revisit at that ARR threshold.
  - **Restructure recommended before launch:** spin out a CaliLean IP LLC (holds brand + content) and a CaliLean Ops LLC (handles fulfillment + customer contracts); 2–4 week formation lift.
  - **Single LLC is structurally inadequate for this product line at any scale:** counsel-supervised restructure, possibly including a separate licensed-pharmacy partner if any SKU requires it.

---

## Domain D — ToS / Privacy enforceability for an RUO-positioned product

### Q7. Are the ToS §3 (RUO carve-out + no-medical-advice) and §13 (CA governing law, LA County venue) clauses enforceable against an out-of-state buyer who claims injury after consuming an RUO-labeled product? See `storefront/src/app/[countryCode]/(main)/terms/page.tsx`.

- **Why we can't answer ourselves.** Forum-selection and choice-of-law enforceability against consumers varies by state; some states (notably CA itself, also MA) limit waiver of consumer protections.
- **Why it matters.** Determines whether disputes will be heard in our chosen forum or in a buyer-state court, which materially changes defense cost and outcome distribution.
- **Decision tree.**
  - **Both clauses enforceable in priority states:** keep ToS as-is.
  - **§13 enforceable; §3 RUO carve-out partially enforceable:** strengthen §3 with explicit consideration recital + bolded conspicuous notice; Designer/CTO ships copy edit.
  - **Either clause unenforceable in MA / NJ / CA-resident contexts:** consider a more aggressive waiver structure or explicit per-state addenda; coordinate with Q11/Q12 on those states.

### Q8. Does the privacy policy (`storefront/src/app/[countryCode]/(main)/privacy/page.tsx`) adequately disclaim the medical / clinical inferences a buyer might draw from purchase history, given the RUO posture and peptide context?

- **Why we can't answer ourselves.** Disclaiming an implied medical relationship while still selling a product the buyer associates with health is a counsel-judgment line.
- **Why it matters.** Mis-positioned privacy copy can be evidence of intended use (loops back to Q1) and can attract state AG attention under unfair/deceptive practices statutes.
- **Decision tree.**
  - **Adequate:** no change.
  - **Adequate with explicit "we are not your healthcare provider" recital:** add a single paragraph to privacy + checkout footer.
  - **Inadequate:** counsel-drafted rewrite of the privacy doc's RUO carve-out section.

---

## Domain E — Customer-data handling under HIPAA-adjacent contexts

### Q9. Confirm CaliLean is NOT a HIPAA Covered Entity, Business Associate, or Subcontractor under 45 CFR §160.103. Identify the failure modes (e.g., a future telehealth partner integration, accepting insurance) that would change that status.

- **Why we can't answer ourselves.** HIPAA scoping is bright-line in the obvious cases but counsel-judgment in the "are we adjacent enough to be pulled in" cases.
- **Why it matters.** A correct "we are not HIPAA" answer eliminates a large class of compliance overhead (BAAs, privacy-notice rules, breach-notification timelines). A wrong answer creates federal exposure on day 1.
- **Decision tree.**
  - **Not HIPAA, no foreseeable trigger:** confirm in writing; no operational change.
  - **Not HIPAA today, but trigger if X (e.g., telehealth partner):** Compliance owns a "HIPAA trigger watchlist" that CTO and CMO must consult before adding any X-shaped feature.
  - **Already HIPAA (unexpected):** stop processing pending counsel-supervised compliance buildout (BAAs, NPP, breach plan, training).

### Q10. Which state-level health-data statutes apply to peptide-purchase histories regardless of HIPAA status — specifically WA My Health My Data Act (RCW 19.373), NV SB 370, NY SHIELD Act, IL BIPA (if any biometric data is ever ingested), CA CMIA — and what are the required notices / consent structures?

- **Why we can't answer ourselves.** State health-data statutes have proliferated since 2023; the applicability to a peptide DTC is a per-state legal-judgment exercise.
- **Why it matters.** WA MHMDA in particular has a private right of action and is being actively used. If purchase data is "consumer health data," we need a separate WA-specific privacy notice and consent flow.
- **Decision tree.**
  - **None apply at our current data surface:** confirm; no change.
  - **WA MHMDA (and possibly NV SB 370) apply:** Compliance + CTO add a state-specific privacy notice + consent banner for WA / NV residents; ~1-week build.
  - **Multiple statutes apply with conflicting notice requirements:** counsel drafts a unified multi-state notice; CTO ships geo-targeted banners.

---

## Domain F — Interstate commerce posture (state-by-state RUO peptide sales)

> Each question below is grounded in the per-state matrix and "what I could not determine" section of [SKA-25](/SKA/issues/SKA-25). The state-posture map is the working hypothesis; counsel's role is to verify or overturn it in the priority states.

### Q11. NJ Drug Wholesaler / Manufacturer registration. Does shipping an RUO-labeled, non-Rx, non-controlled peptide from CA to a NJ consumer trigger registration under NJSA 24:6B / NJ Div. of Consumer Affairs Drug Control Unit? If yes, what is the cost, timeline, and ongoing-reporting obligation?

- **Why we can't answer ourselves.** NJ's Drug Wholesaler reach over RUO-labeled non-Rx products is not addressed in publicly available guidance; it requires either a counsel-judgment read of NJSA 24:6B against our fact pattern, or a formal inquiry to the NJ Division.
- **Why it matters.** NJ is the highest registration-risk state in the priority list (per SKA-25). Either we register, we suppress NJ, or we ship without registering and accept the residual risk — and we need counsel input to choose.
- **Decision tree.**
  - **Registration not required:** ship to NJ as today.
  - **Registration required, low cost / fast timeline:** register; ship to NJ.
  - **Registration required, high cost / slow timeline (>$25k or >90 days):** suppress NJ at checkout; revisit after launch traction validates the spend.

### Q12. MA Board of Pharmacy out-of-state reach. Does MA assert jurisdiction over an out-of-state RUO DTC seller under MGL c.94C, and does RUO labeling defeat that assertion or does intended-use doctrine control under MA's expansive (post-NECC) "drug" interpretation?

- **Why we can't answer ourselves.** MA's enforcement culture is the most aggressive of the priority states (per SKA-25). The reach question is fact-specific and counsel-judgment-bound.
- **Why it matters.** MA is the highest interpretive-risk state. A wrong call here can trigger a Board of Pharmacy proceeding even on small order volume.
- **Decision tree.**
  - **No jurisdiction over an out-of-state RUO DTC:** ship MA as today.
  - **Jurisdiction yes, but RUO defeats the "drug" classification:** ship MA, with a counsel-blessed MA-specific disclaimer if recommended.
  - **Jurisdiction yes and RUO does NOT defeat classification:** suppress MA at checkout pending licensed-MA-pharmacy partner or licensed importer arrangement.

### Q13. PA Wholesale Drug Distributor licensing. Does shipping RUO peptides into PA require licensing under 35 P.S. §§780-101+? (60-day verification flag from SKA-25.)

- **Why we can't answer ourselves.** PA's Wholesale Drug Distributor regime has the same "is RUO a drug" ambiguity as NJ and MA; needs counsel.
- **Why it matters.** PA is a top-5 state by population and a likely scale market. Licensing required vs. not is a meaningful operational decision.
- **Decision tree.** Same shape as Q11 (NJ): not required → ship; required, low cost → register; required, high cost → suppress.

### Q14. Is there ANY US state — priority or non-priority — that explicitly forbids the sale of RUO-labeled peptides to non-licensed buyers, such that day-0 geo-suppression is the only defensible posture? (Cross-check against the SKA-25 watchlist: LA, IN, MS, SD, NYC sub-jurisdiction.)

- **Why we can't answer ourselves.** SKA-25 was unable to surface any such state from publicly available material at research depth, but absence-of-evidence at our depth ≠ evidence-of-absence at counsel depth.
- **Why it matters.** A "yes, suppress X" answer is a one-line CTO change. A "no, ship everywhere" answer closes the geo-question and unlocks marketing spend nationwide.
- **Decision tree.**
  - **No state forbids:** ship to all 50 states + DC; geo-suppression hooks remain hot-fixable on a warning-letter event (SKA-27).
  - **1–2 states forbid:** CTO ships per-state suppression for those states; document rationale.
  - **More than 2 states forbid:** Compliance + CTO build a formal state-posture config (data-driven, not hard-coded) so we can iterate as the legal landscape moves.

---

## Exclusions — what we explicitly do NOT need a lawyer for

We are intentionally not asking counsel to opine on these areas. They are owned in-house or are out of scope for the pre-launch engagement.

- **Wordsmithing of boilerplate ToS and privacy copy.** Per the SKA-2 phase-5 rescope, copy-level disclaimer language is owned by Compliance + CMO. Counsel is asked about *enforceability* (Q7, Q8), not *prose*.
- **Marketing copy review on a per-asset basis.** CMO operates within the RUO copy guardrails (`storefront/src/lib/ruo.ts`). Counsel is engaged for guardrails and exceptions, not asset-by-asset review.
- **Trademark / brand-name clearance.** Separate workstream, separate (likely IP-specialist) counsel; not in this engagement.
- **Employment, contractor, and HR matters.** Not in scope; engaged separately if/when we hire W-2 employees.
- **Sales tax nexus and state tax registration.** CFO / accountant scope, not legal scope.
- **Web accessibility (WCAG / ADA).** Owned by Designer + CTO; not in this engagement unless a demand letter arrives.
- **Data-breach response specifics.** Operational playbook owned by CTO + Compliance; counsel only after a real incident.
- **Federal scheduling questions on already-unscheduled peptides.** SKA-25 confirmed none of the named CaliLean peptides are federally controlled; re-asking is outside the irreducibly-human-lawyer scope.

---

## Estimated counsel time

- **Per question:** ≤30 minutes if the engagement letter scopes to this list and the SKA-25 doc is provided as a briefing pack.
- **Total:** ~7 billable hours for Q&A across all 14 questions, plus ~2 hours read-in time on the SKA-25 posture map and the existing RUO surface (`storefront/src/lib/ruo.ts`, `backend/src/subscribers/ruo-attestation-audit.ts`, ToS, Privacy).
- **Budget anchor for SKA-18 engagement:** ~10 billable hours total for the first pass.

---

## Definition of done

- This document committed and PR opened.
- CEO signs off on the question list (no additions, no removals) before SKA-18 activates.
- On SKA-18 activation, counsel receives this document plus the SKA-25 posture map plus the RUO source-of-truth file as the briefing pack.
