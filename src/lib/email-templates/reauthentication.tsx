import * as React from "react";

import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";

interface ReauthenticationEmailProps {
  token: string;
}

const cream = "#F6F1E8";
const warmWhite = "#FFFDF9";
const ink = "#181716";
const terracotta = "#CE654B";
const fontBody = "'Inter','Helvetica Neue','Segoe UI',Arial,sans-serif";
const fontHead = "'Manrope','Helvetica Neue','Segoe UI',Arial,sans-serif";

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Votre code de vérification</Preview>
    <Body
      style={{ backgroundColor: cream, fontFamily: fontBody, color: ink, margin: 0, padding: 0 }}
    >
      <Container
        style={{
          maxWidth: 600,
          backgroundColor: warmWhite,
          borderRadius: 14,
          overflow: "hidden",
          margin: "32px auto",
          boxShadow: "0 1px 3px rgba(24,23,22,0.06)",
        }}
      >
        <div style={{ padding: "28px 32px 8px 32px", borderBottom: `3px solid ${terracotta}` }}>
          <Heading
            style={{
              fontFamily: fontHead,
              fontSize: 18,
              fontWeight: 700,
              color: ink,
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            Angel Leclerc Communication
          </Heading>
        </div>
        <div style={{ padding: "28px 32px" }}>
          <Heading
            style={{
              fontFamily: fontHead,
              fontSize: 22,
              fontWeight: 700,
              color: ink,
              margin: "0 0 20px 0",
              letterSpacing: "-0.01em",
            }}
          >
            Confirmer votre identité
          </Heading>
          <Text style={{ fontSize: 15, lineHeight: 1.6, margin: "0 0 25px 0" }}>
            Utilisez le code ci-dessous pour confirmer votre identité :
          </Text>
          <Text
            style={{
              fontFamily: "Courier, monospace",
              fontSize: 28,
              fontWeight: 700,
              color: ink,
              margin: "0 0 30px 0",
              letterSpacing: 4,
            }}
          >
            {token}
          </Text>
          <Text style={{ fontSize: 12, color: "#8a8a8a", margin: 0 }}>
            Ce code expirera prochainement. Si vous n'avez pas demandé cette vérification, vous
            pouvez ignorer cet e-mail en toute sécurité.
          </Text>
        </div>
      </Container>
    </Body>
  </Html>
);

export default ReauthenticationEmail;
