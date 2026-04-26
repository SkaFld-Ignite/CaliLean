# C&D / FDA Warning-Letter Response Playbook — Internal Ops Only

> **Author:** Compliance · **Date:** 2026-04-26 · **Branch:** `compliance/cd-playbook-ska27`
> **Issue:** SKA-27 · **Parent:** SKA-1 · **Inputs:** SKA-25 (state posture), SKA-26 (counsel questions)
>
> **Purpose.** Pre-positioned decision tree + response templates so we are not drafting our first response under the deadline of an actual notice. **Internal ops only — never customer-facing. This document is not legal advice.**
>
> **Default posture.** Minimize regulator escalation. Protect founder personal liability. We are pre-revenue and marketing copy is not the hill to die on.

---

## 0. Notification chain (within 1 hour of receipt)

Whoever sees the notice first — physical mail, email, customer-service forward, social-media tag — runs this list **before** doing anything else (no replies, no acknowledgments, no internal Slack/Discord broadcasts):

1. **CEO** — by phone or direct DM. Always first. Always within 1 hour.
2. **CTO** — for evidence-preservation actions (turn off auto-deletes, snapshot Medusa order data, snapshot site state).
3. **Compliance** (this agent) — to open the triage ticket and stage the response track.
4. **CMO** — only after CEO+CTO+Compliance are looped in. CMO does not respond externally.

**Do NOT:**

- Reply to the regulator/sender, even to acknowledge, before CEO + Compliance have read the notice.
- Discuss the notice on any internal channel that isn't a private CEO/CTO/Compliance thread.
- Edit or delete the storefront copy or product listings the notice references — this can look like spoliation.
- Post about it publicly. Ever.

---

## 1. Triage decision tree (within 24 hours)

Two intake questions decide the track:

- **Q-A. Who sent it?** State agency / state AG / state Board of Pharmacy → state track. FDA OCI / FDA District Office → federal track. Plaintiff's-firm civil C&D → civil track. Anything else (FTC, state consumer-protection AG) → escalate to counsel immediately as if FDA.
- **Q-B. Does the notice name Retatrutide specifically, or our RUO posture broadly?** Reta-named → assume highest-stakes path. RUO-broad → engagement path. Single-state copy issue → light path.

Cross those answers against the four outcome buckets below. Pick the bucket; do not negotiate with yourself between buckets without counsel input.

```
                                    ┌──────────────────────────────────────────┐
                                    │  Notice received                         │
                                    │  → Step 0 notification chain (CEO first) │
                                    │  → Preserve evidence (CTO snapshots)     │
                                    │  → Open triage ticket (Compliance)       │
                                    └──────────────────────────────────────────┘
                                                       │
            ┌──────────────────────────┬───────────────┴────────────────┬───────────────────────────┐
            ▼                          ▼                                ▼                           ▼
   Bucket 1: CAPITULATE      Bucket 2: CAPITULATE +          Bucket 3: ENGAGE +          Bucket 4: SUPPRESS
   + RE-LIST W/             DELIST SKU                       RESPOND VIA COUNSEL         JURISDICTION +
   STRICTER DISCLAIMERS                                                                  COUNSEL
   ─────────────            ──────────────                   ──────────────              ──────────────
   Trigger:                 Trigger:                         Trigger:                    Trigger:
   - State board /          - FDA warning letter             - FDA or AG action          - State AG / Board of
     consumer-affairs         naming Retatrutide,            - challenges RUO              Pharmacy enforcement
     letter on minor           Tirzepatide, or                 posture broadly             letter on a single
     copy issue                Semaglutide.                  - or names multiple           state, no specific SKU
   - Single-state           - Or any FDA letter                SKUs / our entire           ban beyond that state.
     scope.                   asserting our DTC                product line.             - Reta-named is bumped
   - No SKU-level             posture is unapproved-                                       to Bucket 2 or 3.
     ban.                     drug distribution.
   - No officer-named
     liability theory.

   24h actions:             24h actions:                     24h actions:                24h actions:
   - Acknowledge in          - Delist Retatrutide             - DO NOT reply.             - Geo-suppress checkout
     writing within            (or named SKU) site-          - Engage SKA-18                for the issuing
     deadline (Tmpl A).        wide via CTO.                   counsel within 24h          jurisdiction via CTO
   - CMO + Compliance        - Stage acknowledgment           via CEO.                    (`storefront/src/lib/
     copy edit per             template (Tmpl B) for         - Counsel-routed             ruo.ts` jurisdiction
     notice.                   counsel review BEFORE          formal response             gate, see SKA-25 hook).
   - Re-list with stricter     sending.                       (Tmpl C).                  - Send Tmpl A
     disclaimer + RUO         - Compliance retains            - Compliance freezes         acknowledgment ONLY
     surface review.           audit trail of every           all marketing comms          if counsel approves.
   - File the response in      attestation for               on the named topic.         - Engage counsel re:
     `docs/compliance/         affected orders.              - CTO preserves all          jurisdictional posture
     incidents/`.            - Decide refund/recall           order data,                 + per-state response.
                              posture with counsel.            attestations,             - Decide register vs.
                                                               and audit logs.             stay-suppressed with
                                                                                           counsel.

   Owner: Compliance         Owner: Compliance + CTO          Owner: CEO + counsel        Owner: CEO + CTO +
   Counsel: optional         Counsel: required for            Counsel: required           counsel
                             refund/recall posture
```

**Tie-breaker rules.**

- If two buckets seem to fit, take the higher-numbered one. The cost of over-responding is hours; the cost of under-responding is the company.
- Reta-named always bumps to Bucket 2 minimum.
- Officer-named (CEO, CTO, etc., personally) always bumps to Bucket 3 minimum and triggers D&O notification (see §5).
- Multiple-state simultaneous notices always bump to Bucket 3.

---

## 2. Response templates

All templates are **boilerplate scaffolding only**. Actual outgoing text always passes through counsel before sending, even Bucket-1 acknowledgments where counsel is "optional" — counsel-optional means the bucket is light enough that 5-minute counsel review is sufficient, not that we send unreviewed.

### Template A — Acknowledgment of receipt (Bucket 1, sometimes Bucket 4)

> Use within the response deadline stated in the notice (default: 7 days if no deadline given).

```
[Date]

[Sender name]
[Sender agency / firm]
[Sender address]

Re: [Notice reference number] — Acknowledgment of receipt

Dear [Sender]:

CaliLean LLC acknowledges receipt of the above-referenced notice on [date received].
We are reviewing the matter in good faith and intend to respond substantively
by [deadline + 30 days, or sender's deadline if shorter].

Please direct further correspondence to:

  [CEO name], on behalf of CaliLean LLC
  [CEO email]
  [CEO mailing address]

This acknowledgment is sent without admission of any fact or legal conclusion.

Sincerely,

[CEO name]
Chief Executive Officer
CaliLean LLC
```

### Template B — Action-plan response (Bucket 2: capitulate + delist)

> Use only after counsel review. Posture is "we agree, we acted, here is what we did."

```
[Date]

[Sender]
Re: [Notice reference] — Action plan and confirmation of remediation

Dear [Sender]:

CaliLean LLC has reviewed the above-referenced notice and has taken the
following actions, effective [date]:

1. [Named SKU, e.g., "Retatrutide"] has been delisted from the CaliLean
   storefront and is no longer available for purchase.
2. All open orders for the named product have been [cancelled / refunded /
   held pending guidance, per counsel].
3. Marketing and educational materials referencing the named product have
   been removed from the storefront, owned channels, and have been requested
   for removal from any partner channel known to us.
4. [Optional, per counsel: a record-retention statement re: order data
   and attestation logs.]

CaliLean is committed to lawful operation and welcomes [a meeting / written
guidance / closure of the matter] at your direction.

Sincerely,

[CEO name]
Chief Executive Officer
CaliLean LLC
```

### Template C — Formal counsel-routed response (Bucket 3, sometimes Bucket 4)

> Use only when counsel is the named author or co-author. Do not send under CEO signature alone.

```
[Counsel firm letterhead]
[Date]

[Sender]
Re: [Notice reference] — Response on behalf of CaliLean LLC

Dear [Sender]:

This firm represents CaliLean LLC with respect to the above-referenced
notice. We write in response to the [warning letter / cease-and-desist /
inquiry] dated [date].

[Counsel-drafted substantive response. Compliance prepares the briefing
pack: SKA-25 state posture, SKA-26 counsel-question doc, RUO surface
sources (`storefront/src/lib/ruo.ts`, `backend/src/lib/ruo.ts`,
`backend/src/subscribers/ruo-attestation-audit.ts`), ToS
(`storefront/src/app/[countryCode]/(main)/terms/page.tsx`), Privacy
(`storefront/src/app/[countryCode]/(main)/privacy/page.tsx`), and the
specific order/attestation records relevant to the notice.]

We respectfully request [an extension / a meeting / closure of the matter
without further action] and remain available at the contact information
below.

Respectfully,

[Counsel name and bar]
[Firm]

cc: [CEO name], CaliLean LLC
```

---

## 3. Internal communications checklist

The goal: tell the team enough to act, not enough to panic, and never enough to leak.

### 3a. Communicate

- **CEO + CTO + Compliance + (if applicable) CMO** in a private thread. Plain summary: notice received, sender, scope, bucket, timeline.
- **HeadEng + Designer** only when their action is required (e.g., copy change, geo-suppression, listing removal). They get the **action**, not the notice text.
- **CMO** is informed at Bucket 1+ but is told: "no public statement, no social-media reply, no email blast on this topic, no quotes to anyone." CMO confirms back in writing.
- **Outside counsel** (SKA-18 engagement) is engaged at Bucket 2 (for refund/recall posture review) or Bucket 3 (as named representative).

### 3b. Do NOT communicate

- The team-wide channel. Ever. No "FYI we got a letter" posts.
- Any third party — partners, affiliates, podcast guests, advisors — without CEO + Compliance sign-off.
- Customers, beyond the routine refund/cancellation message scripted in §3c.
- Investors / board, unless the notice triggers a contractual notification clause; in that case CEO + counsel handle it directly.

### 3c. Customer-facing language (Bucket 2 only — delist event)

Triggered only when SKUs come down and there are open orders. Message from CaliLean Support, CEO-approved, to affected buyers only:

```
We're discontinuing [product] effective [date]. Your order will be
[refunded in full / cancelled at no charge]. No action is required on
your part. Reply to this email with any questions.
```

No further explanation. No regulatory speculation. No "we believe" / "we disagree" language.

### 3d. Evidence preservation (CTO checklist)

Within 4 hours of CEO notification:

- Snapshot the storefront state (full Next.js build artifact + DB dump of products, prices, copy fields).
- Snapshot Medusa order data + attestation records relating to the named SKU(s) or jurisdiction(s).
- Snapshot RUO source files at HEAD: `storefront/src/lib/ruo.ts`, `backend/src/lib/ruo.ts`, `backend/src/subscribers/ruo-attestation-audit.ts`, ToS, Privacy.
- Disable any auto-deletion / log-rotation that would touch the above.
- Store under `docs/compliance/incidents/<YYYY-MM-DD>-<sender-slug>/` (private branch, do not push without CEO sign-off).

---

## 4. Roles and ownership

| Role        | Owns                                                                |
| ----------- | ------------------------------------------------------------------- |
| CEO         | Notice receipt → counsel engagement → external communications.      |
| Compliance  | Triage ticket. Bucket selection (CEO confirms). Briefing pack.      |
| CTO         | Evidence preservation. Storefront / checkout actions (delist, geo). |
| CMO         | Comms freeze on the topic. Confirms freeze in writing.              |
| Counsel     | Substantive response. Refund/recall posture. Bucket-3 representation.|
| Designer    | Copy/UI edits when an action is required. No public statements.     |

---

## 5. Officer-personal-liability triggers

Any of the following bumps the response by one bucket and triggers D&O / personal-counsel notification, separately from the company response:

- The notice names the CEO, CTO, or any other officer **personally** (not just "CaliLean LLC").
- The notice cites a state "practice of pharmacy / medicine without a license" theory (cross-ref counsel question Q5 in [SKA-26](/SKA/issues/SKA-26)).
- The notice is criminal-track (FDA OCI is criminal-track by default; FDA District Office is regulatory).
- The notice references a buyer-injury allegation and names the officer as a contact.

When triggered: CEO notifies personal counsel (separate engagement from CaliLean's outside counsel) within 24 hours. Compliance does not write to that engagement; it is CEO-personal scope.

---

## 6. Post-incident (after the matter is closed)

Within 14 days of resolution:

- File the full incident packet under `docs/compliance/incidents/<YYYY-MM-DD>-<sender-slug>/` on a private branch, including the notice, every draft response, the final outgoing response, counsel correspondence, and the bucket decision rationale.
- Compliance writes a one-page lessons-learned: what surface allowed this, what we changed (copy, gating, geo, SKU shelf), and which SKA-26 counsel question (if any) needs an updated decision.
- CEO signs off on the lessons-learned. Filed in same incident folder.
- If the incident changed the state-posture map, Compliance updates [SKA-25](/SKA/issues/SKA-25) with a dated patch note.

---

## 7. Definition of done (this playbook)

- This document committed and PR opened.
- CEO sign-off: bucket logic, notification chain, and the customer-facing §3c language are all approved as written.
- On approval, [SKA-25](/SKA/issues/SKA-25) (state-posture) and [SKA-26](/SKA/issues/SKA-26) (counsel questions) gain a back-link to this playbook in their "incidents" cross-references.
- The `docs/compliance/incidents/` folder structure is created on the first real incident, not pre-emptively.

---

## Document scope reminder

This is a pre-positioned decision aid, not a substitute for counsel and not a public statement. If a real notice arrives, **read this document, then call the CEO** — in that order if 30 seconds permit, otherwise call the CEO first.
