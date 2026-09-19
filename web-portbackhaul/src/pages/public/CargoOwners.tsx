import { ArrowRight, ClipboardCheck, CreditCard, FileCheck, MapPin, Package, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

import {
  CallToAction,
  ComplianceNote,
  FeatureCard,
  Section,
  SectionHeading,
} from "@/components/public/marketing";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";

export default function CargoOwners() {
  return (
    <>
      <Seo
        title="Cargo Owners | Book Verified Trucks from Tema & Takoradi Ports | PortBackhaul"
        description="Create a shipment, invite your clearing agent, get matched with a verified truck and track delivery to any destination in Ghana or West Africa. Payment is released only after delivery is confirmed."
        path="/cargo-owners"
      />

      <Section tone="navy">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-accent">For cargo owners</p>
        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
          Know where your cargo is, and who is responsible for it
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
          Stop chasing updates by phone. Create your shipment once, invite the clearing agent you work with, and follow
          the truck from the port gate to your consignee's door.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Button asChild size="lg" className="bg-accent text-white hover:bg-accent/90">
            <Link to="/register">
              Create a shipment
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <Link to="/how-it-works">How it works</Link>
          </Button>
        </div>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="What you get"
          title="Everything about a shipment in one place"
          description="Your shipment record carries its own internal Cargo ID, the consignee details, the route and the handling instructions — and it stays accurate as the job moves."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard icon={Package} title="Create and submit shipments">
            Capture cargo description, quantity, weight, container number, consignee, pickup location, expected date
            and special instructions. Save as a draft and submit when you're ready.
          </FeatureCard>
          <FeatureCard icon={ShieldCheck} title="Invite your clearing agent">
            Assign a verified clearing agent to handle the clearance workflow and arrange transport on your behalf.
          </FeatureCard>
          <FeatureCard icon={MapPin} title="Track the trip">
            See the assigned truck and driver, the route, the live position while the trip is active, and a timestamped
            history of every status change.
          </FeatureCard>
          <FeatureCard icon={FileCheck} title="Confirm delivery properly">
            Issue a one-time delivery code, capture the receiver's name and review the photo or document evidence
            uploaded by the driver.
          </FeatureCard>
          <FeatureCard icon={CreditCard} title="Pay on your terms">
            Transport fees are held and released after delivery conditions are met. Nothing moves automatically before
            that.
          </FeatureCard>
          <FeatureCard icon={ClipboardCheck} title="Keep your history">
            Every shipment, trip, delivery confirmation and payment stays on record for your own reconciliation.
          </FeatureCard>
        </div>
      </Section>

      <Section tone="surface">
        <SectionHeading eyebrow="Your workflow" title="Five steps from booking to closed-out" />
        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { step: "Create", detail: "Enter the cargo, route and consignee details." },
            { step: "Assign", detail: "Invite a verified clearing agent to handle it." },
            { step: "Match", detail: "A verified truck and driver accept the job." },
            { step: "Track", detail: "Follow loading, transit and arrival in real time." },
            { step: "Confirm", detail: "Release the delivery code and close the payment." },
          ].map((item, index) => (
            <li key={item.step} className="panel p-5">
              <span className="font-mono text-3xl font-extrabold tabular text-accent">{index + 1}</span>
              <h3 className="mt-3 text-base font-bold">{item.step}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{item.detail}</p>
            </li>
          ))}
        </ol>
      </Section>

      <ComplianceNote />

      <CallToAction
        title="Book your next shipment with people you can verify"
        description="Register as a cargo owner, submit your verification documents and start coordinating road freight from Ghana's ports."
        primaryLabel="Register as a cargo owner"
        secondaryLabel="Talk to us"
        secondaryTo="/contact"
      />
    </>
  );
}
