import * as React from "react";
import { Button, Heading, Hr, Text } from "@react-email/components";
import { EmailLayout, SITE_URL, buttonStyle, headingStyle, line, muted, textStyle } from "./brand";
import type { TemplateEntry } from "./registry";

interface OrderShippedProps {
  firstName?: string;
  orderRef?: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  items?: Array<{ name: string; quantity: number }>;
  shippingAddress?: string;
}

export const OrderShippedEmail = ({
  firstName,
  orderRef,
  carrier,
  trackingNumber,
  trackingUrl,
  items = [],
  shippingAddress,
}: OrderShippedProps) => (
  <EmailLayout
    preview="Votre commande ALC! vient d'être expédiée"
    tagline="Boutique ALC! — Angel Leclerc Communication"
  >
    <Heading style={headingStyle}>Votre commande est en route</Heading>
    <Text style={textStyle}>Bonjour{firstName ? ` ${firstName}` : ""},</Text>
    <Text style={textStyle}>
      Bonne nouvelle : votre commande vient de quitter l'atelier d'impression.
      {carrier ? ` Elle est confiée à ${carrier}.` : ""}
    </Text>

    {trackingNumber && (
      <Text style={{ ...textStyle, color: muted }}>
        Numéro de suivi : <strong style={{ color: "#181716" }}>{trackingNumber}</strong>
      </Text>
    )}

    {trackingUrl && (
      <Button href={trackingUrl} style={{ ...buttonStyle, marginTop: 4 }}>
        Suivre mon colis
      </Button>
    )}

    <Hr style={{ border: "none", borderTop: `1px solid ${line}`, margin: "26px 0 16px 0" }} />

    {orderRef && (
      <Text style={{ ...textStyle, color: muted, margin: "0 0 8px 0" }}>
        Référence de commande : <strong style={{ color: "#181716" }}>{orderRef}</strong>
      </Text>
    )}
    {items.map((item) => (
      <Text key={`${item.name}-${item.quantity}`} style={{ ...textStyle, margin: "2px 0" }}>
        {item.quantity} × {item.name}
      </Text>
    ))}
    {shippingAddress && (
      <Text style={{ ...textStyle, color: muted, whiteSpace: "pre-line", marginTop: 12 }}>
        Livraison :{"\n"}
        {shippingAddress}
      </Text>
    )}

    <Text style={{ ...textStyle, fontSize: 12, color: muted, margin: "18px 0 0 0" }}>
      Le suivi peut mettre quelques heures à s'activer chez le transporteur. Une question ? Répondez
      simplement à cet e-mail.
    </Text>
    <Text style={{ ...textStyle, fontSize: 12, color: muted, margin: "6px 0 0 0" }}>
      <a href={`${SITE_URL}/boutique`} style={{ color: muted }}>
        Retourner à la boutique ALC!
      </a>
    </Text>
  </EmailLayout>
);

export const template = {
  component: OrderShippedEmail,
  subject: "Votre commande ALC! est expédiée",
  displayName: "Expédition et suivi de commande",
  previewData: {
    firstName: "Marie",
    orderRef: "ALC-2026-0001",
    carrier: "Colissimo",
    trackingNumber: "6A123456789FR",
    trackingUrl: "https://www.laposte.fr/outils/suivre-vos-envois?code=6A123456789FR",
    items: [{ name: "Tasse ALC!", quantity: 1 }],
    shippingAddress: "12 rue des Consuls\n24200 Sarlat-la-Canéda\nFR",
  },
} satisfies TemplateEntry;

export default OrderShippedEmail;
