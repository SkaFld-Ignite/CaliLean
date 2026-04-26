import { Metadata } from "next"
import {
  RUO_DISCLAIMER_LONG,
  RUO_LEGAL_CONTACT_EMAIL,
  RUO_LEGAL_LAST_UPDATED,
} from "@lib/ruo"

export const metadata: Metadata = {
  title: "Terms of Service | CaliLean",
  description:
    "Terms of service governing the sale and use of CaliLean research-use-only peptides.",
}

export default function TermsPage() {
  return (
    <div className="content-container py-16 max-w-3xl">
      <header className="mb-10">
        <h1 className="text-3xl small:text-4xl font-bold text-calilean-ink mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-calilean-fog">
          Last updated: {RUO_LEGAL_LAST_UPDATED}
        </p>
      </header>

      <div className="prose prose-sm max-w-none text-calilean-ink space-y-6 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">1. Acceptance of these terms</h2>
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) govern your access to
            and use of the CaliLean website (the &ldquo;Site&rdquo;) and the
            purchase of any products offered through the Site (the
            &ldquo;Products&rdquo;). By accessing the Site or placing an order,
            you agree to be bound by these Terms. If you do not agree, do not
            use the Site.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">2. Eligibility</h2>
          <p>
            You must be at least 21 years old and a qualified researcher to
            access the Site or purchase any Product. By using the Site you
            represent and warrant that you meet these requirements and that the
            information you provide to us is accurate and complete.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">
            3. Research-use-only carve-out
          </h2>
          <p>{RUO_DISCLAIMER_LONG}</p>
          <p>
            You agree that you will not (a) consume any Product, (b) administer
            any Product to another person or animal, (c) resell or redistribute
            any Product to a person who you reasonably believe intends to
            consume it, or (d) represent any Product as a therapeutic,
            cosmetic, or dietary product. Your purchase requires you to attest
            to these terms at checkout, and that attestation is recorded for
            audit.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">4. Account registration</h2>
          <p>
            To place an order you may need to create an account. You are
            responsible for keeping your credentials confidential and for any
            activity that occurs under your account. Notify us promptly of any
            unauthorized use.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">5. Orders, pricing, and payment</h2>
          <p>
            All orders are subject to acceptance and product availability.
            Prices and availability are subject to change without notice. We
            may refuse, limit, or cancel any order at our discretion, including
            orders that we believe were placed in violation of these Terms.
            Payment is processed by our third-party payment processors;
            submitting an order authorizes us to charge your selected payment
            method for the total amount of the order.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">6. Shipping and delivery</h2>
          <p>
            We ship within the United States to addresses we accept at
            checkout. Title and risk of loss pass to you when the carrier
            delivers the Product to your address. Delivery times are estimates
            only.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">7. Returns and refunds</h2>
          <p>
            Because Products are research compounds shipped under controlled
            conditions, we do not accept returns of opened or temperature-
            compromised Products. If a Product arrives damaged or materially
            non-conforming, contact us within seven (7) days of delivery at{" "}
            <a
              href={`mailto:${RUO_LEGAL_CONTACT_EMAIL}`}
              className="underline"
            >
              {RUO_LEGAL_CONTACT_EMAIL}
            </a>{" "}
            and we will work with you in good faith on a replacement or refund.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">8. Prohibited uses</h2>
          <p>
            You may not use the Site or any Product (a) for any unlawful
            purpose, (b) to violate any applicable federal, state, or local
            regulation, (c) to harass, abuse, or harm another person, or (d) to
            interfere with the security or integrity of the Site. We may
            terminate your access at any time for any violation of these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">9. Intellectual property</h2>
          <p>
            The Site and all associated content, including the CaliLean name,
            logo, product photography, and copy, are owned by CaliLean or its
            licensors and are protected by copyright, trademark, and other
            laws. We grant you a limited, non-exclusive, non-transferable
            license to access and use the Site for personal, non-commercial
            purposes consistent with these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">10. Disclaimers</h2>
          <p>
            THE SITE AND PRODUCTS ARE PROVIDED &ldquo;AS IS&rdquo; AND
            &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EITHER
            EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY,
            FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. CaliLean
            does not warrant that the Site will be uninterrupted or
            error-free. Products are sold solely for in-vitro research; no
            warranty of fitness for human or animal use is given or implied.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">11. Limitation of liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, CaliLean WILL NOT BE LIABLE
            FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
            DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED
            DIRECTLY OR INDIRECTLY. CaliLean&rsquo;s total aggregate liability
            for any claim arising out of or relating to these Terms or the
            Products will not exceed the amount you paid for the Product
            giving rise to the claim.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">12. Indemnification</h2>
          <p>
            You agree to indemnify and hold CaliLean and its officers,
            employees, and agents harmless from any claim, demand, loss, or
            expense (including reasonable attorneys&rsquo; fees) arising out of
            or related to (a) your use of the Site or any Product, (b) your
            breach of these Terms, or (c) your violation of any law or the
            rights of any third party.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">13. Governing law</h2>
          <p>
            These Terms are governed by the laws of the State of California
            without regard to its conflict-of-laws principles. The exclusive
            venue for any dispute arising out of these Terms is the state and
            federal courts located in Los Angeles County, California.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">14. Changes to these terms</h2>
          <p>
            We may update these Terms from time to time. Material changes take
            effect when we post the updated Terms with a new &ldquo;Last
            updated&rdquo; date. Your continued use of the Site after that date
            constitutes acceptance of the revised Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">15. Contact</h2>
          <p>
            Questions about these Terms? Email{" "}
            <a
              href={`mailto:${RUO_LEGAL_CONTACT_EMAIL}`}
              className="underline"
            >
              {RUO_LEGAL_CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
