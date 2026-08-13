import * as React from "react";
import { Button, Heading, Hr, Text } from "@react-email/components";
import { EmailLayout, SITE_URL, buttonStyle, headingStyle, muted, textStyle } from "./brand";
import type { TemplateEntry } from "./registry";

interface OrderConfirmationProps {
  firstName?: string;
  orderRef?: string;
  total?: string;
  items?: Array<{ name: string; quantity: number; price: string }>;
  shippingAddress?: string;
}

export const OrderConfirmationEmail = ({
  firstName,
  orderRef,
  total,
  items = [],
  shippingAddress,
}: OrderConfirmationProps) => (
  <EmailLayout
    preview="Votre commande ALC! est confirmée"
    tagline="Boutique ALC! — Angel Leclerc Communication"
  >
    <Heading style={headingStyle}>Merci pour votre commande</Heading>
    <Text style={textStyle}>Bonjour{firstName ? ` ${firstName}` : ""},</Text>
    <Text style={textStyle}>
      Votre paiement est confirmé. Votre commande part en production chez notre atelier
      d'impression, puis vous sera expédiée sous 5 à 10 jours ouvrés.
    </Text>
    {orderRef && (
      <Text style={{ ...textStyle, color: muted }}>
        Référence de commande : <strong style={{ color: "#181716" }}>{orderRef}</strong>
      </Text>
    )}
    {items.map((item) => (
      <Text key={`${item.name}-${item.quantity}`} style={{ ...textStyle, margin: "4px 0" }}>
        {item.quantity} × {item.name} — {item.price}
      </Text>
    ))}
    {total && <Text style={{ ...textStyle, fontWeight: 700 }}>Total payé : {total}</Text>}
    {shippingAddress && (
      <Text style={{ ...textStyle, color: muted, whiteSpace: "pre-line" }}>
        Livraison :{"\n"}
        {shippingAddress}
      </Text>
    )}
    <Button href={`${SITE_URL}/boutique`} style={{ ...buttonStyle, marginTop: 8 }}>
      Retourner à la boutique
    </Button>
    <Hr style={{ border: "none", borderTop: "1px solid #eceae5", margin: "26px 0 16px 0" }} />
    <Text style={{ ...textStyle, fontSize: 12, color: muted, margin: 0 }}>
      Une question sur votre commande ? Répondez simplement à cet e-mail.
    </Text>
  </EmailLayout>
);

export const template = {
  component: OrderConfirmationEmail,
  subject: "Votre commande ALC! est confirmée",
  displayName: "Confirmation de commande boutique",
  previewData: {
    firstName: "Marie",
    orderRef: "ALC-2026-0001",
    total: "23,90 €",
    items: [{ name: "Tasse ALC!", quantity: 1, price: "19,00 €" }],
    shippingAddress: "12 rue des Consuls\n24200 Sarlat-la-Canéda\nFR",
  },
} satisfies TemplateEntry;

export default OrderConfirmationEmail;
