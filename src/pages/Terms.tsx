import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Terms() {
  return (
    <Layout>
      <div className="container-custom py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl lg:text-4xl font-display font-bold mb-8">Terms of Service</h1>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>1. Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm text-muted-foreground">
              <p>
                By accessing or using Movemate LogisticExpress services, you agree to be bound by 
                these Terms of Service and all applicable laws and regulations.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>2. Service Description</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm text-muted-foreground">
              <p>
                Movemate LogisticExpress provides logistics and shipping services including package 
                pickup, transportation, tracking, and delivery. Service availability may vary by location.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>3. User Responsibilities</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm text-muted-foreground">
              <p>
                Users are responsible for providing accurate shipment information, ensuring packages 
                comply with shipping regulations, and properly packaging items to prevent damage.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>4. Prohibited Items</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm text-muted-foreground">
              <p>
                Users may not ship hazardous materials, illegal substances, weapons, or any items 
                prohibited by local, national, or international law. Violations may result in 
                termination of service and legal action.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>5. Liability</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm text-muted-foreground">
              <p>
                Our liability for lost or damaged packages is limited to the declared value of the 
                shipment. Additional insurance coverage is available for high-value items.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>6. Delivery Terms</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm text-muted-foreground">
              <p>
                Estimated delivery times are not guaranteed and may be affected by weather, 
                customs processing, or other factors beyond our control. We will make reasonable 
                efforts to meet delivery estimates.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm text-muted-foreground">
              <p>
                We reserve the right to modify these terms at any time. Continued use of our 
                services after changes constitutes acceptance of the modified terms.
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
