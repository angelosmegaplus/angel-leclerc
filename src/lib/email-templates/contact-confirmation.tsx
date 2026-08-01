import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface ContactConfirmationProps {
  firstName?: string
}

const cream = '#F6F1E8'
const warmWhite = '#FFFDF9'
const ink = '#181716'
const terracotta = '#CE654B'
const fontBody = "'Inter','Helvetica Neue','Segoe UI',Arial,sans-serif"
const fontHead = "'Manrope','Helvetica Neue','Segoe UI',Arial,sans-serif"

export const ContactConfirmationEmail = ({ firstName }: ContactConfirmationProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Votre demande a bien été reçue — Angel Leclerc Communication</Preview>
    <Body style={{ backgroundColor: cream, fontFamily: fontBody, color: ink, margin: 0, padding: 0 }}>
      <Container style={{ maxWidth: 600, backgroundColor: warmWhite, borderRadius: 14, overflow: 'hidden', margin: '32px auto', boxShadow: '0 1px 3px rgba(24,23,22,0.06)' }}>
        <Section style={{ padding: '28px 32px 8px 32px', borderBottom: `3px solid ${terracotta}` }}>
          <Heading style={{ fontFamily: fontHead, fontSize: 18, fontWeight: 700, color: ink, margin: 0, letterSpacing: '-0.01em' }}>
            Angel Leclerc Communication
          </Heading>
          <Text style={{ fontFamily: fontBody, fontSize: 13, color: '#6b6b6b', margin: '2px 0 0 0' }}>
            Donner du souffle à vos idées
          </Text>
        </Section>
        <Section style={{ padding: '28px 32px' }}>
          <Heading style={{ fontFamily: fontHead, fontSize: 22, fontWeight: 700, color: ink, margin: '0 0 16px 0', letterSpacing: '-0.01em' }}>
            Votre demande a bien été reçue
          </Heading>
          <Text style={{ fontSize: 15, lineHeight: 1.6, margin: '0 0 12px 0' }}>
            Bonjour {firstName || 'vous'},
          </Text>
          <Text style={{ fontSize: 15, lineHeight: 1.6, margin: '0 0 12px 0' }}>
            Votre demande a bien été transmise à <strong>Angel Leclerc Communication</strong>.
          </Text>
          <Text style={{ fontSize: 15, lineHeight: 1.6, margin: '0 0 20px 0' }}>
            Je reviendrai vers vous dès que possible afin d'échanger sur votre projet.
          </Text>
          <Text style={{ fontSize: 15, lineHeight: 1.6, margin: 0 }}>
            Cordialement,
            <br />
            <span style={{ color: terracotta, fontWeight: 600 }}>Angel Leclerc</span>
          </Text>
          <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '24px 0' }} />
          <Text style={{ fontSize: 12, color: '#8a8a8a', margin: 0 }}>
            Cet e-mail confirme la bonne réception de votre demande. Il ne contient pas d'information confidentielle.
          </Text>
        </Section>
        <Section style={{ padding: '20px 32px', backgroundColor: cream, textAlign: 'center' }}>
          <Text style={{ fontSize: 12, color: '#8a8a8a', margin: 0 }}>
            Angel Leclerc Communication ·{' '}
            <Link href="https://angel-leclerc.fr" style={{ color: terracotta, textDecoration: 'none' }}>
              angel-leclerc.fr
            </Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ContactConfirmationEmail
