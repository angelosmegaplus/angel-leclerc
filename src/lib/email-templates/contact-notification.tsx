import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface ContactNotificationProps {
  fullName: string
  email: string
  phone?: string
  structure?: string
  projectType: string
  budget?: string
  deadline?: string
  description: string
  sentAt: string
  attachmentName?: string
  signedUrl?: string
}

const cream = '#F6F1E8'
const warmWhite = '#FFFDF9'
const ink = '#181716'
const terracotta = '#CE654B'
const fontBody = "'Inter','Helvetica Neue','Segoe UI',Arial,sans-serif"
const fontHead = "'Manrope','Helvetica Neue','Segoe UI',Arial,sans-serif"

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
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Nouvelle demande de projet — {fullName} — {projectType}</Preview>
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
          <Heading style={{ fontFamily: fontHead, fontSize: 22, fontWeight: 700, color: ink, margin: '0 0 20px 0', letterSpacing: '-0.01em' }}>
            Nouvelle demande de projet
          </Heading>

          <Row label="Nom" value={fullName} />
          <Row label="E-mail" value={email} />
          <Row label="Téléphone" value={phone || '—'} />
          <Row label="Structure" value={structure || '—'} />
          <Row label="Type de projet" value={projectType} />
          <Row label="Budget approximatif" value={budget || '—'} />
          <Row label="Date ou délai souhaité" value={deadline || '—'} />
          <Row label="Envoyé le" value={sentAt} />

          <Heading style={{ fontFamily: fontHead, fontSize: 16, fontWeight: 600, color: ink, margin: '24px 0 8px 0' }}>
            Description
          </Heading>
          <Text style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
            {description}
          </Text>

          {signedUrl && attachmentName && (
            <Text style={{ fontSize: 14, lineHeight: 1.6, margin: '20px 0 0 0' }}>
              Fichier joint : <strong>{attachmentName}</strong>
              <br />
              <Button href={signedUrl} style={{ backgroundColor: terracotta, color: '#fff', fontSize: 14, borderRadius: 8, padding: '12px 20px', textDecoration: 'none', marginTop: 8, display: 'inline-block' }}>
                Télécharger le fichier
              </Button>
            </Text>
          )}
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
      <Text style={{ width: 160, color: '#6b6b6b', fontSize: 14, margin: 0, paddingRight: 16 }}>
        {label}
      </Text>
      <Text style={{ flex: 1, fontWeight: 500, color: ink, fontSize: 14, margin: 0 }}>
        {value}
      </Text>
    </div>
  )
}

export default ContactNotificationEmail
