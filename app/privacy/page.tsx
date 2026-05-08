export const metadata = {
  title: "Privacy Policy | SmarterEats",
  description: "Privacy Policy for SmarterEats",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-gray-700">
        {children}
      </div>
    </section>
  );
}

function SubSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
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

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:px-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Privacy Policy for SmarterEats
        </h1>
        <p className="mt-3 text-sm text-gray-500">
          Effective Date: April 21, 2026
        </p>

        <div className="mt-8 text-sm leading-relaxed text-gray-700 space-y-4">
          <p>
            SmarterEats is operated by Smarter Foundry LLC (“SmarterEats,” “we,”
            “our,” or “us”). This Privacy Policy explains how we collect, use,
            and protect your information when you use the SmarterEats mobile
            application (the “App”) and website (collectively, the “Service”).
          </p>
          <p>
            By using the Service, you agree to the practices described in this
            Privacy Policy.
          </p>
        </div>

        <Section title="1. Information We Collect">
          <SubSection title="a. Information You Provide">
            <p>
              We may collect information you voluntarily provide, including:
            </p>
            <List
              items={[
                "Email address (if you contact us)",
                "Preferences and goals (for example, dietary goals)",
                "Food exclusions or allergen preferences",
                "Feedback submitted through the App",
                "Foods you scan, search, log, compare, or save",
              ]}
            />
          </SubSection>

          <SubSection title="b. Automatically Collected Information">
            <p>We may automatically collect certain information, including:</p>
            <List
              items={[
                "Device information (such as device type and operating system)",
                "Usage data (such as features used and session duration)",
                "Diagnostic data (such as crash logs)",
                "Anonymous or pseudonymous identifiers associated with your device",
              ]}
            />
          </SubSection>

          <SubSection title="c. Camera Access and Image Processing">
            <p>
              SmarterEats requests access to your device’s camera to scan
              barcodes and capture nutrition labels.
            </p>
            <p>Images captured through the App:</p>
            <List
              items={[
                "May be temporarily stored on your device",
                "Are transmitted securely to our backend for processing",
                "May be processed by third-party service providers to analyze nutrition information and generate food scores, comparisons, recommendations, and insights",
              ]}
            />
            <p>
              We do not use images for purposes unrelated to providing and
              improving App functionality.
            </p>
          </SubSection>

          <SubSection title="d. Device-Linked Data">
            <p>
              We may associate certain data, such as saved items, usage history,
              and preferences, with a device identifier. This allows us to
              provide features such as saved foods, recommendations, and
              preferences without requiring a user account.
            </p>
            <p>
              This data is not directly linked to your identity, such as your
              name, email address, or phone number.
            </p>
          </SubSection>
        </Section>

        <Section title="2. How We Use Your Information">
          <p>We use your information to:</p>
          <List
            items={[
              "Provide, operate, and improve the Service",
              "Generate food scores, comparisons, recommendations, and nutrition insights",
              "Personalize your experience based on your goals and preferences",
              "Filter or reduce recommendations containing allergens or excluded ingredients that you select",
              "Analyze usage to improve features, performance, and recommendation quality",
              "Respond to feedback and support requests",
              "Detect, prevent, or address technical issues and abuse of the Service",
            ]}
          />
        </Section>

        <Section title="3. Analytics and Third-Party Services">
          <p>
            We use third-party services to help operate and improve the Service.
            These services may process data on our behalf.
          </p>
          <p>These may include:</p>
          <List
            items={[
              "Analytics providers, such as Mixpanel, to understand how users interact with the App",
              "AI and processing services, such as OpenAI, to analyze food data and generate scores, comparisons, and recommendations",
              "Cloud infrastructure and hosting providers",
            ]}
          />
          <p>
            These services may receive data necessary to perform their
            functions, such as food images, nutritional information, or usage
            events, and operate under their own privacy policies.
          </p>
        </Section>

        <Section title="4. Sharing Features">
          <p>
            The App may allow you to share food scores, comparisons, or other
            content. Any content you choose to share may be visible to others,
            depending on how it is shared.
          </p>
          <p>Please use discretion when sharing information.</p>
        </Section>

        <Section title="5. Food Allergies and Dietary Restrictions">
          <p>
            SmarterEats may allow users to identify allergens, sensitivities, or
            dietary exclusions in order to reduce the likelihood that certain
            foods or ingredients appear in recommendations, comparisons, or
            suggested alternatives.
          </p>
          <p>
            Ingredient information, manufacturer formulations, restaurant
            preparation methods, and product labeling may change at any time and
            may be incomplete, inaccurate, or unavailable within the Service.
          </p>
          <p>
            SmarterEats does not verify ingredient lists, manufacturing
            environments, or cross-contamination risks, and does not guarantee
            that any food or recommendation is allergen-free or safe for
            consumption.
          </p>
          <p>
            Users are solely responsible for independently reviewing ingredient
            labels, packaging, restaurant disclosures, and other official
            product information before consuming any food product.
          </p>
        </Section>

        <Section title="6. Data Retention">
          <p>We retain your data only as long as necessary to:</p>
          <List
            items={[
              "Provide the Service’s functionality",
              "Maintain saved items, preferences, and recommendation quality",
              "Comply with legal obligations",
              "Improve and support the Service",
            ]}
          />
          <p>
            Images may be stored temporarily for processing and may be deleted
            after use.
          </p>
        </Section>

        <Section title="7. Data Security">
          <p>
            We use reasonable safeguards to protect your information, including
            secure transmission over HTTPS. However, no method of transmission
            or storage is completely secure, and we cannot guarantee absolute
            security.
          </p>
        </Section>

        <Section title="8. Children’s Privacy">
          <p>
            SmarterEats is not intended for children under the age of 13, and we
            do not knowingly collect personal information from children.
          </p>
        </Section>

        <Section title="9. Your Rights and Choices">
          <p>You may request deletion of your data at any time.</p>
          <p>
            You can also use the in-app “Delete My Data” feature, which deletes
            data associated with your device from our systems and removes local
            history stored on your device.
          </p>
          <p>
            Contact:{" "}
            <a
              href="mailto:support@smartereats.ai"
              className="text-blue-600 underline"
            >
              support@smartereats.ai
            </a>
          </p>
        </Section>

        <Section title="10. Changes to This Privacy Policy">
          <p>
            We may update this Privacy Policy from time to time. If we make
            material changes, we will update the Effective Date above.
          </p>
          <p>
            Continued use of the Service after changes become effective
            constitutes acceptance of the updated Privacy Policy.
          </p>
        </Section>

        <Section title="11. Contact Us">
          <p>
            Email:{" "}
            <a
              href="mailto:support@smartereats.ai"
              className="text-blue-600 underline"
            >
              support@smartereats.ai
            </a>
          </p>
          <p>Company: Smarter Foundry LLC</p>
          <p>Website: smartereats.ai</p>
        </Section>

        <Section title="12. Health Disclaimer">
          <p>
            SmarterEats provides informational food scoring, comparisons,
            nutrition insights, and recommendations only. The Service is not a
            medical, nutritional, or dietary advice service.
          </p>
          <p>
            You should not rely on the Service as a substitute for professional
            medical advice, diagnosis, or treatment. Always consult a qualified
            healthcare professional regarding any dietary, medical,
            allergy-related, or health concerns.
          </p>
          <p>
            Food and ingredient information may be incomplete or inaccurate, and
            recommendations generated by the Service may not be appropriate for
            all users or dietary needs.
          </p>
        </Section>
      </div>
    </main>
  );
}
