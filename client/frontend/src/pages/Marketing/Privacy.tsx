export default function Privacy() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold tracking-tight mb-8">Privacy Policy</h1>
      
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p className="text-muted-foreground mb-6">
          Last updated: January 1, 2026
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Collection</h2>
          <p className="text-muted-foreground mb-4">
            We collect information that you provide directly to us, including name, email address,
            phone number, and company information when you register for our services, request a
            demo, or contact us.
          </p>
          <p className="text-muted-foreground">
            We also automatically collect certain information about your device and usage of our
            services, including IP address, browser type, and pages visited.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Use of Personal Information</h2>
          <p className="text-muted-foreground mb-4">
            We use the information we collect to provide, maintain, and improve our services,
            process transactions, send communications, and respond to your inquiries.
          </p>
          <p className="text-muted-foreground">
            We do not sell your personal information to third parties. We may share information
            with service providers who assist us in operating our business.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Cookies</h2>
          <p className="text-muted-foreground">
            We use cookies and similar tracking technologies to enhance your experience on our
            website, analyze usage patterns, and personalize content. You can control cookies
            through your browser settings.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Security Measures</h2>
          <p className="text-muted-foreground">
            We implement industry-standard security measures to protect your personal information,
            including encryption, access controls, and regular security audits. However, no
            method of transmission over the internet is 100% secure.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">User Rights</h2>
          <p className="text-muted-foreground">
            You have the right to access, correct, or delete your personal information. You may
            also object to or restrict certain processing of your data. To exercise these rights,
            please contact us using the information below.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Contact for Privacy Inquiries</h2>
          <p className="text-muted-foreground">
            If you have any questions about this Privacy Policy or our data practices, please
            contact us at:
          </p>
          <p className="text-muted-foreground mt-2">
            Email: privacy@company.com
            <br />
            Address: SupportAI Privacy Team
          </p>
        </section>
      </div>
    </div>
  );
}
