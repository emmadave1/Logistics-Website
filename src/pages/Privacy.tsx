import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Privacy() {
  return (
    <Layout>
      <div className="container-custom py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl lg:text-4xl font-display font-bold mb-8">Privacy Policy</h1>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>1. Information We Collect</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm text-muted-foreground">
              <p>
                We collect information you provide directly to us, including your name, email address, 
                phone number, shipping addresses, and package details when you use our services.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>2. How We Use Your Information</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm text-muted-foreground">
              <p>
                We use the information we collect to provide, maintain, and improve our services, 
                process transactions, send notifications about your shipments, and communicate with you.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>3. Information Sharing</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm text-muted-foreground">
              <p>
                We do not sell or rent your personal information to third parties. We may share 
                information with service providers who assist us in operating our platform, 
                processing payments, or delivering packages.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>4. Data Security</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm text-muted-foreground">
              <p>
                We implement appropriate technical and organizational measures to protect your 
                personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>5. Your Rights</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm text-muted-foreground">
              <p>
                You have the right to access, correct, or delete your personal information. 
                You may also opt out of marketing communications at any time by contacting us.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm text-muted-foreground">
              <p>
                If you have questions about this Privacy Policy, please contact us at 
                privacy@movemate-lx.com or call +1 (555) 123-4567.
              </p>
            </CardContent>
          </Card>

          <p className="text-sm text-muted-foreground mt-8">
            Last updated: January 2025
          </p>
        </div>
      </div>
    </Layout>
  );
}
