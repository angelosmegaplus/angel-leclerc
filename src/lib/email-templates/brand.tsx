import * as React from "react";
import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

/** Identité graphique du site angel-leclerc.fr, appliquée à tous les e-mails. */
export const SITE_URL = "https://www.angel-leclerc.fr";
export const LOGO_URL = `${SITE_URL}/logo.png`;

export const cream = "#F6F1E8";
export const warmWhite = "#FFFDF9";
export const ink = "#181716";
export const muted = "#6b6b6b";
export const line = "#eceae5";
export const terracotta = "#CE654B";
export const fontBody = "'Inter','Helvetica Neue','Segoe UI',Arial,sans-serif";
export const fontHead = "'Manrope','Helvetica Neue','Segoe UI',Arial,sans-serif";

export const headingStyle: React.CSSProperties = {
  fontFamily: fontHead,
  fontSize: 22,
  lineHeight: 1.3,
  fontWeight: 700,
  color: ink,
  margin: "0 0 16px 0",
  letterSpacing: "-0.01em",
};

export const textStyle: React.CSSProperties = {
  fontFamily: fontBody,
  fontSize: 15,
  lineHeight: 1.65,
  color: ink,
  margin: "0 0 14px 0",
};

export const buttonStyle: React.CSSProperties = {
  backgroundColor: terracotta,
  color: "#ffffff",
  fontFamily: fontBody,
  fontSize: 15,
  fontWeight: 600,
  borderRadius: 10,
  padding: "13px 22px",
  textDecoration: "none",
  display: "inline-block",
};

export const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: "transparent",
  color: terracotta,
  border: `1px solid ${terracotta}`,
};

interface LayoutProps {
  preview: string;
  children: React.ReactNode;
  /** Affiché sous le logo, en petit. */
  tagline?: string;
  unsubscribeUrl?: string;
}

/** Gabarit commun : en-tête avec logo, contenu aéré, pied de page. */
export const EmailLayout = ({ preview, children, tagline, unsubscribeUrl }: LayoutProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>{preview}</Preview>
    <Body
      style={{
        backgroundColor: "#ffffff",
        fontFamily: fontBody,
        color: ink,
        margin: 0,
        padding: 0,
        WebkitTextSizeAdjust: "100%",
      }}
    >
      <Section style={{ backgroundColor: cream, padding: "24px 12px" }}>
        <Container
          style={{
            maxWidth: 600,
            width: "100%",
            backgroundColor: warmWhite,
            borderRadius: 16,
            overflow: "hidden",
            margin: "0 auto",
            border: `1px solid ${line}`,
          }}
        >
          <Section
            style={{ padding: "26px 28px 18px 28px", borderBottom: `3px solid ${terracotta}` }}
          >
            <Link href={SITE_URL} style={{ textDecoration: "none" }}>
              <Img
                src={LOGO_URL}
                alt="Angel Leclerc Communication"
                width="150"
                height="auto"
                style={{ display: "block", maxWidth: 150, height: "auto", border: 0 }}
              />
            </Link>
            {tagline && (
              <Text
                style={{ fontFamily: fontBody, fontSize: 13, color: muted, margin: "10px 0 0 0" }}
              >
                {tagline}
              </Text>
            )}
          </Section>

          <Section style={{ padding: "28px" }}>{children}</Section>

          <Section
            style={{ padding: "20px 28px 24px 28px", backgroundColor: cream, textAlign: "center" }}
          >
            <Text
              style={{
                fontFamily: fontBody,
                fontSize: 12,
                lineHeight: 1.7,
                color: muted,
                margin: 0,
              }}
            >
              Angel Leclerc Communication —{" "}
              <Link href={SITE_URL} style={{ color: terracotta, textDecoration: "none" }}>
                angel-leclerc.fr
              </Link>
              <br />
              <Link
                href={`${SITE_URL}/mentions-legales`}
                style={{ color: muted, textDecoration: "underline" }}
              >
                Mentions légales
              </Link>
              {" · "}
              <Link
                href={`${SITE_URL}/politique-confidentialite`}
                style={{ color: muted, textDecoration: "underline" }}
              >
                Confidentialité
              </Link>
              {" · "}
              <Link
                href={`${SITE_URL}/contact`}
                style={{ color: muted, textDecoration: "underline" }}
              >
                Contact
              </Link>
              {unsubscribeUrl && (
                <>
                  <br />
                  <Link href={unsubscribeUrl} style={{ color: muted, textDecoration: "underline" }}>
                    Se désinscrire de la newsletter
                  </Link>
                </>
              )}
            </Text>
          </Section>
        </Container>
      </Section>
    </Body>
  </Html>
);
