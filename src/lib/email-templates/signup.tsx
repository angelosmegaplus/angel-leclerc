import * as React from "react";

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from "@react-email/components";

interface SignupEmailProps {
  siteName: string;
  siteUrl: string;
  recipient: string;
  confirmationUrl: string;
}

const cream = "#F6F1E8";
const warmWhite = "#FFFDF9";
const ink = "#181716";
const terracotta = "#CE654B";
const fontBody = "'Inter','Helvetica Neue','Segoe UI',Arial,sans-serif";
const fontHead = "'Manrope','Helvetica Neue','Segoe UI',Arial,sans-serif";

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Confirmez votre adresse e-mail pour {siteName}</Preview>
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
            {siteName}
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
            Confirmez votre adresse e-mail
          </Heading>
          <Text style={{ fontSize: 15, lineHeight: 1.6, margin: "0 0 25px 0" }}>
            Merci de votre inscription sur{" "}
            <Link href={siteUrl} style={{ color: terracotta, textDecoration: "underline" }}>
              <strong>{siteName}</strong>
            </Link>{" "}
            !
          </Text>
          <Text style={{ fontSize: 15, lineHeight: 1.6, margin: "0 0 25px 0" }}>
            Veuillez confirmer votre adresse e-mail ({" "}
            <Link
              href={`mailto:${recipient}`}
              style={{ color: terracotta, textDecoration: "underline" }}
            >
              {recipient}
            </Link>
            ) en cliquant sur le bouton ci-dessous :
          </Text>
          <Button
            style={{
              backgroundColor: terracotta,
              color: "#fff",
              fontSize: 15,
              borderRadius: 8,
              padding: "12px 20px",
              textDecoration: "none",
              display: "inline-block",
              fontWeight: 600,
            }}
            href={confirmationUrl}
          >
            Vérifier mon e-mail
          </Button>
          <Text style={{ fontSize: 12, color: "#8a8a8a", margin: "30px 0 0 0" }}>
            Si vous n'avez pas créé de compte, vous pouvez ignorer cet e-mail en toute sécurité.
          </Text>
        </div>
      </Container>
    </Body>
  </Html>
);

export default SignupEmail;
