import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

/** Identité graphique du site angel-leclerc.fr, appliquée à tous les e-mails. */
export const SITE_URL = 'https://www.angel-leclerc.fr'

export const cream = '#F7F5F2'
export const warmWhite = '#FFFFFF'
export const ink = '#171717'
export const muted = '#6F6F73'
export const line = '#E8E5E1'
export const terracotta = '#CE654B'
export const navy = '#151922'
export const fontBody = "'Inter','Helvetica Neue','Segoe UI',Arial,sans-serif"
export const fontHead = "'Manrope','Helvetica Neue','Segoe UI',Arial,sans-serif"

export const headingStyle: React.CSSProperties = {
  fontFamily: fontHead,
  fontSize: 25,
  lineHeight: 1.24,
  fontWeight: 750,
  color: ink,
  margin: '0 0 16px 0',
  letterSpacing: '-0.025em',
}

export const textStyle: React.CSSProperties = {
  fontFamily: fontBody,
  fontSize: 15,
  lineHeight: 1.68,
  color: ink,
  margin: '0 0 14px 0',
}

export const buttonStyle: React.CSSProperties = {
  backgroundColor: terracotta,
  color: '#ffffff',
  fontFamily: fontBody,
  fontSize: 14,
  fontWeight: 700,
  borderRadius: 999,
  padding: '13px 22px',
  textDecoration: 'none',
  display: 'inline-block',
}

export const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: 'transparent',
  color: terracotta,
  border: `1px solid ${terracotta}`,
}

interface LayoutProps {
  preview: string
  children: React.ReactNode
  tagline?: string
  unsubscribeUrl?: string
}

/** Gabarit commun sans ancien logo bitmap : identité typographique actuelle et robuste dans tous les clients mail. */
export const EmailLayout = ({ preview, children, tagline, unsubscribeUrl }: LayoutProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>{preview}</Preview>
    <Body
      style={{
        backgroundColor: cream,
        fontFamily: fontBody,
        color: ink,
        margin: 0,
        padding: 0,
        WebkitTextSizeAdjust: '100%',
      }}
    >
      <Section style={{ backgroundColor: cream, padding: '28px 12px' }}>
        <Container
          style={{
            maxWidth: 600,
            width: '100%',
            backgroundColor: warmWhite,
            borderRadius: 24,
            overflow: 'hidden',
            margin: '0 auto',
            border: `1px solid ${line}`,
            boxShadow: '0 12px 40px rgba(22,24,29,.08)',
          }}
        >
          <Section style={{ backgroundColor: navy, padding: '26px 30px 24px 30px' }}>
            <Link href={SITE_URL} style={{ textDecoration: 'none' }}>
              <Text style={{ fontFamily: fontHead, fontSize: 22, lineHeight: 1.05, fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.03em' }}>
                Angel Leclerc
              </Text>
              <Text style={{ fontFamily: fontBody, fontSize: 11, lineHeight: 1.4, fontWeight: 700, color: '#F1B8A9', margin: '6px 0 0 0', letterSpacing: '.13em', textTransform: 'uppercase' }}>
                Communication
              </Text>
            </Link>
            {tagline && (
              <Text style={{ fontFamily: fontBody, fontSize: 13, color: '#C9CDD5', margin: '12px 0 0 0' }}>
                {tagline}
              </Text>
            )}
          </Section>

          <Section style={{ padding: '32px 30px 28px 30px' }}>{children}</Section>

          <Section style={{ padding: '20px 28px 24px 28px', backgroundColor: '#F3F1EE', textAlign: 'center' }}>
            <Text style={{ fontFamily: fontBody, fontSize: 12, lineHeight: 1.7, color: muted, margin: 0 }}>
              Angel Leclerc Communication ·{' '}
              <Link href={SITE_URL} style={{ color: terracotta, textDecoration: 'none', fontWeight: 700 }}>
                angel-leclerc.fr
              </Link>
              <br />
              <Link href={`${SITE_URL}/mentions-legales`} style={{ color: muted, textDecoration: 'underline' }}>
                Mentions légales
              </Link>
              {' · '}
              <Link href={`${SITE_URL}/politique-confidentialite`} style={{ color: muted, textDecoration: 'underline' }}>
                Confidentialité
              </Link>
              {' · '}
              <Link href={`${SITE_URL}/contact`} style={{ color: muted, textDecoration: 'underline' }}>
                Contact
              </Link>
              {unsubscribeUrl && (
                <>
                  <br />
                  <Link href={unsubscribeUrl} style={{ color: muted, textDecoration: 'underline' }}>
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
)
