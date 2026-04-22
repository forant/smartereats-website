export const metadata = {
  title: "Terms of Service | SmarterEats",
  description: "Terms of Service for SmarterEats",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-gray-700">
        {children}
      </div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="text-base font-medium">{title}</h3>
      <div className="mt-2 space-y-3">{children}</div>
    </div>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:px-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Terms of Service for SmarterEats
        </h1>

        <p className="mt-3 text-sm text-gray-500">
          Effective Date: April 21, 2026
        </p>

        <div className="mt-8 text-sm leading-relaxed text-gray-700 space-y-4">
          <p>
            SmarterEats (“we,” “our,” or “us”) provides food analysis, nutrition insights,
            and comparison tools through the SmarterEats mobile application and website
            (the “Service”).
          </p>
          <p>
            By using the Service, you agree to these Terms of Service (“Terms”). If you do
            not agree, please do not use the Service.
          </p>
        </div>

        <Section title="1. Use of the Service">
          <p>
            You agree to use SmarterEats only for lawful purposes and in accordance with
            these Terms.
          </p>

          <p>You must not:</p>

          <List
            items={[
              "Use the Service in any way that violates applicable laws or regulations",
              "Attempt to interfere with or disrupt the Service",
              "Reverse engineer or attempt to extract source code",
            ]}
          />
        </Section>

        <Section title="2. No Medical or Professional Advice">
          <p>
            SmarterEats provides general nutrition and food-related information for
            informational purposes only.
          </p>

          <p className="font-medium text-gray-900">
            The Service does not provide medical advice, diagnosis, or treatment.
          </p>

          <p>
            You should not rely on the Service as a substitute for professional medical
            advice. Always consult a qualified healthcare provider regarding any dietary
            or health concerns.
          </p>
        </Section>

        <Section title="3. Accuracy of Information">
          <p>
            We strive to provide accurate and helpful information, but food data,
            ingredients, and nutrition information may be incomplete or inaccurate.
          </p>

          <p>
            Scores and recommendations are based on available data and internal logic.
            We do not guarantee the accuracy, completeness, or usefulness of any
            information provided.
          </p>
        </Section>

        <Section title="4. Privacy">
          <p>
            Your use of the Service is also governed by our{" "}
            <a href="/privacy" className="text-blue-600 underline">
              Privacy Policy
            </a>.
          </p>
        </Section>

        <Section title="5. Intellectual Property">
          <p>
            All content, features, and functionality of the Service—including text,
            graphics, logos, and software—are owned by SmarterEats or its licensors and
            are protected by applicable laws.
          </p>

          <p>
            You may not copy, modify, distribute, or create derivative works without our
            permission.
          </p>
        </Section>

        <Section title="6. Third-Party Data and Services">
          <p>
            SmarterEats may rely on third-party data sources for food and nutrition
            information.
          </p>

          <p>
            We are not responsible for the accuracy or availability of third-party data.
          </p>
        </Section>

        <Section title="7. Disclaimer of Warranties">
          <p>
            The Service is provided “as is” and “as available” without warranties of any
            kind, express or implied.
          </p>

          <p>We do not guarantee that:</p>

          <List
            items={[
              "The Service will be uninterrupted or error-free",
              "Results or insights will meet your expectations",
            ]}
          />
        </Section>

        <Section title="8. Limitation of Liability">
          <p>
            To the fullest extent permitted by law, SmarterEats shall not be liable for
            any indirect, incidental, or consequential damages arising from your use of
            the Service.
          </p>

          <p>Your use of the Service is at your own risk.</p>
        </Section>

        <Section title="9. Changes to These Terms">
          <p>
            We may update these Terms from time to time. We will update the Effective Date
            when changes are made.
          </p>

          <p>
            Continued use of the Service constitutes acceptance of the updated Terms.
          </p>
        </Section>

        <Section title="10. Termination">
          <p>
            We reserve the right to suspend or terminate access to the Service at any
            time, without notice, for any reason.
          </p>
        </Section>

        <Section title="11. Governing Law">
          <p>
            These Terms are governed by the laws of the State of California, without
            regard to conflict of law principles.
          </p>
        </Section>

        <Section title="12. Contact Us">
          <p>If you have any questions about these Terms, please contact us at:</p>

          <p>
            Email: [Insert Contact Email]
            <br />
            Website: smartereats.ai
          </p>
        </Section>
      </div>
    </main>
  );
}