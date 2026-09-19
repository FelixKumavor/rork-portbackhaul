import { ArrowRight, BellRing, FileCheck, MapPin, Truck, Wallet } from "lucide-react";
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

export default function TruckDrivers() {
  return (
    <>
      <Seo
        title="Truck Owners & Drivers | Find Cargo Loads from Ghana's Ports | PortBackhaul"
        description="Register your trucks, link your drivers and receive cargo job offers from Tema Port and Takoradi Port. Accept jobs you want, track the trip and get paid after confirmed delivery."
        path="/truck-drivers"
      />

      <Section tone="navy">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
          For truck owners & drivers
        </p>
        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
          Fill your trucks with cargo moving off the port
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
          Register your fleet, get verified once, and receive job offers that actually match your truck — with the
          route, weight, pickup time and fee stated up front.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Button asChild size="lg" className="bg-accent text-white hover:bg-accent/90">
            <Link to="/register">
              Register your truck
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
          eyebrow="No surprises"
          title="Every offer tells you what you're accepting"
          description="You see the full job before you commit — and nothing is ever assigned to you without your acceptance."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard icon={BellRing} title="Clear job offers">
            Route, cargo type, weight, pickup location, pickup time, transport fee and job ID — before you accept or
            decline.
          </FeatureCard>
          <FeatureCard icon={Truck} title="Matched to your truck">
            Offers come to you because your truck type, capacity, verification status and location fit the load, not
            because you happened to call first.
          </FeatureCard>
          <FeatureCard icon={FileCheck} title="QR at the gate">
            Show your trip QR code at the loading point. The operator scans it to confirm you, the truck and the cargo
            before loading begins.
          </FeatureCard>
          <FeatureCard icon={MapPin} title="Tracking only on trips">
            Location is shared while a trip is active, then stops. You are never tracked when you are off duty.
          </FeatureCard>
          <FeatureCard icon={Wallet} title="Transparent earnings">
            See your share after the platform commission, your payout status and your full earnings history.
          </FeatureCard>
          <FeatureCard icon={FileCheck} title="One verification, many jobs">
            Upload your ID and licence once. Truck owners add vehicle documents once. Verified accounts keep working.
          </FeatureCard>
        </div>
      </Section>

      <Section tone="surface">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="panel p-6">
            <h2 className="text-lg font-bold">Truck owners</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {[
                "Register trucks with registration number, type, capacity and trailer details",
                "Upload vehicle documents for verification",
                "Link verified drivers to specific trucks",
                "Set trucks available or unavailable at any time",
                "See active jobs, completed jobs and earnings in one place",
              ].map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="panel p-6">
            <h2 className="text-lg font-bold">Drivers</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {[
                "Switch Available for Cargo on when you're ready to work",
                "Accept or decline job invitations with full details",
                "Confirm arrival, loading, trip start and delivery with large, simple buttons",
                "Upload delivery evidence and record the receiver's name",
                "Track your earnings and request payouts",
              ].map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <ComplianceNote />

      <CallToAction
        title="Get verified and start accepting loads"
        description="Register as a truck owner or driver, submit your documents for verification, and receive matching cargo offers from Ghana's ports."
        primaryLabel="Register now"
        secondaryLabel="Contact us"
        secondaryTo="/contact"
      />
    </>
  );
}
