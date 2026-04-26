import { Metadata } from "next"
import {
  RUO_LEGAL_CONTACT_EMAIL,
  RUO_LEGAL_LAST_UPDATED,
} from "@lib/ruo"

export const metadata: Metadata = {
  title: "Privacy Policy | CaliLean",
  description:
    "How CaliLean collects, uses, and protects information about visitors and customers.",
}

export default function PrivacyPage() {
  return (
    <div className="content-container py-16 max-w-3xl">
      <header className="mb-10">
        <h1 className="text-3xl small:text-4xl font-bold text-calilean-ink mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-calilean-fog">
          Last updated: {RUO_LEGAL_LAST_UPDATED}
        </p>
      </header>

      <div className="prose prose-sm max-w-none text-calilean-ink space-y-6 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">1. Overview</h2>
          <p>
            CaliLean (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;)
            respects your privacy. This Privacy Policy explains what we
            collect, how we use it, and the choices you have. It applies to
            information collected through our website and any orders placed
            with us.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">2. Information we collect</h2>
          <p>We collect three categories of information:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Information you provide.</strong> Contact details
              (name, email, phone), shipping and billing addresses, account
              credentials, the research-use attestation you submit at
              checkout, and any messages you send us.
            </li>
            <li>
              <strong>Order and transaction data.</strong> Items purchased,
              order totals, payment confirmations from our payment processor
              (we do not store full payment-card numbers), and order history.
            </li>
            <li>
              <strong>Automatically collected data.</strong> IP address,
              browser type, device information, pages visited, and similar
              analytics data, collected through cookies and similar
              technologies.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">3. How we use information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>process orders, payments, and shipping;</li>
            <li>provide customer support;</li>
            <li>maintain audit records of research-use attestations;</li>
            <li>operate, secure, and improve the Site;</li>
            <li>send transactional emails and order updates;</li>
            <li>comply with applicable laws and respond to lawful requests.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">4. Sharing and disclosure</h2>
          <p>
            We do not sell your personal information. We share information
            only with service providers who help us operate the business
            (payment processors, shipping carriers, email-delivery vendors,
            analytics providers, hosting and infrastructure providers), and
            only to the extent they need it to perform services for us. We may
            also disclose information when required by law, to protect our
            rights, or in connection with a merger, acquisition, or sale of
            assets.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">5. Cookies and tracking</h2>
          <p>
            We use cookies and similar technologies to keep the Site running,
            remember your cart and country selection, and measure traffic. You
            can control cookies through your browser settings; blocking some
            cookies may break parts of the Site such as the cart or checkout.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">6. Data retention</h2>
          <p>
            We retain order records, including the research-use attestation
            attached to each order, for as long as needed to satisfy our
            audit, legal, accounting, and tax obligations. Account information
            is retained while your account is active and for a reasonable
            period afterward.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">7. Your rights</h2>
          <p>
            Depending on where you live, you may have the right to access,
            correct, delete, or port your personal information, and to object
            to or limit certain uses. California residents have additional
            rights under the California Consumer Privacy Act and California
            Privacy Rights Act, including the right to know what we collect
            and to request deletion. To exercise any of these rights, email{" "}
            <a
              href={`mailto:${RUO_LEGAL_CONTACT_EMAIL}`}
              className="underline"
            >
              {RUO_LEGAL_CONTACT_EMAIL}
            </a>
            . We will not discriminate against you for exercising them.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">8. Children&rsquo;s privacy</h2>
          <p>
            The Site is intended only for users 21 years of age or older. We
            do not knowingly collect personal information from anyone under
            21. If you believe a minor has provided us information, contact us
            and we will delete it.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">9. Security</h2>
          <p>
            We use administrative, technical, and physical safeguards designed
            to protect personal information. No system is perfectly secure,
            and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">10. International users</h2>
          <p>
            CaliLean operates from the United States and ships only to U.S.
            addresses we accept at checkout. If you visit the Site from
            outside the United States, you understand that your information
            will be processed in the United States.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">11. Changes to this policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Material
            changes take effect when we post the updated policy with a new
            &ldquo;Last updated&rdquo; date. Your continued use of the Site
            after that date constitutes acceptance of the revised policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-6 mb-2">12. Contact</h2>
          <p>
            Questions or requests about your privacy? Email{" "}
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
