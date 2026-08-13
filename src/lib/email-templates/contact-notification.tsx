import * as React from "react";
import { Button, Heading, Hr, Text } from "@react-email/components";
import {
  EmailLayout,
  buttonStyle,
  headingStyle,
  ink,
  muted,
  secondaryButtonStyle,
  textStyle,
} from "./brand";

interface ContactNotificationProps {
  fullName: string;
  email: string;
  phone?: string;
  structure?: string;
  projectType: string;
  budget?: string;
  deadline?: string;
  description: string;
  sentAt: string;
  attachmentName?: string;
  signedUrl?: string;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <table
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      role="presentation"
      style={{ borderBottom: "1px solid #f1efea" }}
    >
      <tbody>
        <tr>
          <td
            style={{
              padding: "9px 12px 9px 0",
              color: muted,
              fontSize: 13,
              width: 160,
              verticalAlign: "top",
            }}
          >
            {label}
          </td>
          <td style={{ padding: "9px 0", color: ink, fontSize: 14, fontWeight: 500 }}>{value}</td>
        </tr>
      </tbody>
    </table>
  );
}

export const ContactNotificationEmail = ({
  fullName,
  email,
  phone,
  structure,
  projectType,
  budget,
  deadline,
  description,
  sentAt,
  attachmentName,
  signedUrl,
}: ContactNotificationProps) => (
  <EmailLayout
    preview={`Nouveau message — ${fullName} — ${projectType}`}
    tagline="Nouveau message reçu depuis le site"
  >
    <Heading style={headingStyle}>Nouvelle demande de projet</Heading>

    <Row label="Nom et prénom" value={fullName} />
    <Row label="E-mail" value={email} />
    <Row label="Téléphone" value={phone || "—"} />
    <Row label="Structure" value={structure || "—"} />
    <Row label="Sujet" value={projectType} />
    <Row label="Budget approximatif" value={budget || "—"} />
    <Row label="Date ou délai souhaité" value={deadline || "—"} />
    <Row label="Envoyé le" value={sentAt} />

    <Text style={{ ...textStyle, fontWeight: 600, margin: "22px 0 8px 0" }}>Message</Text>
    <Text style={{ ...textStyle, whiteSpace: "pre-wrap", margin: 0 }}>{description}</Text>

    <Hr style={{ border: "none", borderTop: "1px solid #eceae5", margin: "24px 0" }} />

    <Button
      href={`mailto:${email}?subject=${encodeURIComponent(`Re : ${projectType}`)}`}
      style={buttonStyle}
    >
      Répondre à {fullName.split(" ")[0]}
    </Button>

    {signedUrl && attachmentName && (
      <Text style={{ ...textStyle, margin: "20px 0 0 0" }}>
        Fichier joint : <strong>{attachmentName}</strong>
        <br />
        <a href={signedUrl} style={{ ...secondaryButtonStyle, marginTop: 10 }}>
          Télécharger le fichier
        </a>
      </Text>
    )}
  </EmailLayout>
);

export default ContactNotificationEmail;
