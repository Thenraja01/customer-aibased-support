import { Card, CardContent } from "@/components/ui/card";
import { Target, Eye, Users } from "lucide-react";

export default function About() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight mb-4">About Us</h1>
        <p className="text-lg text-muted-foreground">
          We help businesses transform customer service with AI-powered automation.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Who We Are</h3>
            <p className="text-muted-foreground">
              We help businesses transform customer service with AI-powered automation. Our platform
              combines conversational AI with human support to deliver fast, accurate, and
              personalized customer experiences.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Target className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Our Mission</h3>
            <p className="text-muted-foreground">
              To make customer support faster, smarter, and available anytime.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Eye className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Our Vision</h3>
            <p className="text-muted-foreground">
              To empower every business with intelligent customer service solutions that improve
              efficiency and customer loyalty.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}