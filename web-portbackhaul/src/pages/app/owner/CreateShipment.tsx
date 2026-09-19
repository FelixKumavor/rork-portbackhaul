import { Loader2, Save, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { PageHeader } from "@/components/PageHeader";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useClearingAgents, useLocations } from "@/hooks/use-platform-data";
import { useCreateShipment, useSubmitShipment, type ShipmentDraft } from "@/hooks/use-shipments";
import { describeError } from "@/lib/errors";
import { CARGO_TYPES } from "@/lib/status";

export default function CreateShipment() {
  const navigate = useNavigate();
  const { data: locations } = useLocations();
  const { data: agents } = useClearingAgents();
  const createShipment = useCreateShipment();
  const submitShipment = useSubmitShipment();

  const [description, setDescription] = useState<string>("");
  const [cargoType, setCargoType] = useState<string>("GENERAL");
  const [quantity, setQuantity] = useState<string>("");
  const [quantityUnit, setQuantityUnit] = useState<string>("tons");
  const [weight, setWeight] = useState<string>("");
  const [containerNumber, setContainerNumber] = useState<string>("");
  const [consigneeName, setConsigneeName] = useState<string>("");
  const [consigneeContact, setConsigneeContact] = useState<string>("");
  const [pickupId, setPickupId] = useState<string>("");
  const [destinationId, setDestinationId] = useState<string>("");
  const [pickupDate, setPickupDate] = useState<string>("");
  const [contactPerson, setContactPerson] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");
  const [instructions, setInstructions] = useState<string>("");
  const [fee, setFee] = useState<string>("");
  const [agentId, setAgentId] = useState<string>("");
  const [busy, setBusy] = useState<"draft" | "submit" | null>(null);

  const ports = (locations ?? []).filter((l) => l.kind === "PORT" || l.kind === "TERMINAL");
  const destinations = locations ?? [];

  function buildDraft(): ShipmentDraft {
    const pickup = (locations ?? []).find((l) => l.id === pickupId) ?? null;
    const destination = (locations ?? []).find((l) => l.id === destinationId) ?? null;

    return {
      description: description.trim(),
      cargo_type: cargoType,
      quantity: quantity ? Number(quantity) : null,
      quantity_unit: quantityUnit,
      weight_kg: weight ? Number(weight) : null,
      container_number: containerNumber.trim() || null,
      consignee_name: consigneeName.trim() || null,
      consignee_contact: consigneeContact.trim() || null,
      pickup_location_id: pickupId || null,
      pickup_location_text: pickup?.name ?? null,
      destination_location_id: destinationId || null,
      destination_city: destination?.city ?? destination?.name ?? null,
      destination_country: destination?.country ?? null,
      expected_pickup_date: pickupDate || null,
      contact_person: contactPerson.trim() || null,
      contact_phone: contactPhone.trim() || null,
      special_instructions: instructions.trim() || null,
      transport_fee_ghs: fee ? Number(fee) : null,
    };
  }

  async function handleSave(submit: boolean) {
    if (!description.trim()) {
      toast.error("Describe the cargo before saving.");
      return;
    }
    setBusy(submit ? "submit" : "draft");
    try {
      const created = await createShipment.mutateAsync(buildDraft());
      if (submit) {
        await submitShipment.mutateAsync({ shipmentId: created.id, agentId: agentId || null });
        toast.success(
          agentId ? `${created.cargo_ref} submitted and sent to your clearing agent.` : `${created.cargo_ref} submitted.`,
        );
      } else {
        toast.success(`${created.cargo_ref} saved as a draft.`);
      }
      navigate(`/app/shipments/${created.id}`);
    } catch (error) {
      toast.error(describeError(error, "Could not save the shipment."));
    } finally {
      setBusy(null);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void handleSave(true);
  }

  return (
    <div className="mx-auto w-full max-w-[980px] animate-fade space-y-7">
      <Seo title="Create shipment · PortBackhaul" description="Create a new cargo shipment." path="/app/shipments/new" noIndex />

      <PageHeader
        eyebrow="New Shipment"
        title="Create a shipment"
        subtitle="We generate an internal Cargo ID for your record. This is a PortBackhaul reference only — it is not an official customs reference."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="panel p-6">
          <h2 className="text-base font-bold">Cargo</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="description">Cargo description</Label>
              <Input
                id="description"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Cocoa Beans"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cargo-type">Cargo type</Label>
              <Select value={cargoType} onValueChange={setCargoType}>
                <SelectTrigger id="cargo-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CARGO_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="container">Container number</Label>
              <Input
                id="container"
                value={containerNumber}
                onChange={(e) => setContainerNumber(e.target.value)}
                placeholder="MSKU-000000"
                className="font-mono"
              />
            </div>

            <div className="grid grid-cols-[1fr_120px] gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" type="number" min={0} step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unit">Unit</Label>
                <Input id="unit" value={quantityUnit} onChange={(e) => setQuantityUnit(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input id="weight" type="number" min={0} step="1" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="text-base font-bold">Route & consignee</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pickup">Pickup location</Label>
              <Select value={pickupId} onValueChange={setPickupId}>
                <SelectTrigger id="pickup">
                  <SelectValue placeholder="Select a port or terminal" />
                </SelectTrigger>
                <SelectContent>
                  {ports.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="destination">Destination</Label>
              <Select value={destinationId} onValueChange={setDestinationId}>
                <SelectTrigger id="destination">
                  <SelectValue placeholder="Select a destination" />
                </SelectTrigger>
                <SelectContent>
                  {destinations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}, {location.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="consignee">Consignee</Label>
              <Input id="consignee" value={consigneeName} onChange={(e) => setConsigneeName(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="consignee-contact">Consignee contact</Label>
              <Input id="consignee-contact" value={consigneeContact} onChange={(e) => setConsigneeContact(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pickup-date">Expected pickup date</Label>
              <Input id="pickup-date" type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fee">Transport budget (GHS)</Label>
              <Input id="fee" type="number" min={0} step="10" value={fee} onChange={(e) => setFee(e.target.value)} />
            </div>
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="text-base font-bold">Contact & handling</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="contact-person">Contact person</Label>
              <Input id="contact-person" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-phone">Contact phone</Label>
              <Input id="contact-phone" type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="instructions">Special instructions</Label>
              <Textarea id="instructions" rows={3} value={instructions} onChange={(e) => setInstructions(e.target.value)} />
            </div>
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="text-base font-bold">Clearing agent</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Invite a verified clearing agent to handle clearance and arrange transport. You can also submit without
            one and assign an agent later.
          </p>
          <div className="mt-4 space-y-1.5">
            <Label htmlFor="agent">Assign to</Label>
            <Select value={agentId} onValueChange={setAgentId}>
              <SelectTrigger id="agent">
                <SelectValue placeholder="Select a clearing agent (optional)" />
              </SelectTrigger>
              <SelectContent>
                {(agents ?? []).length === 0 ? (
                  <div className="px-3 py-2.5 text-sm text-muted-foreground">No verified agents available yet.</div>
                ) : (
                  (agents ?? []).map((agent) => (
                    <SelectItem key={agent.profile_id} value={agent.profile_id}>
                      {agent.company_name}
                      {agent.licence_no ? ` · ${agent.licence_no}` : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </section>

        <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => void handleSave(false)} disabled={busy !== null}>
            {busy === "draft" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save as draft
          </Button>
          <Button type="submit" disabled={busy !== null}>
            {busy === "submit" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Submit shipment
          </Button>
        </div>
      </form>
    </div>
  );
}
