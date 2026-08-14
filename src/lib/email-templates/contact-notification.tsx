import * as React from 'react'
import { Button, Heading, Hr, Section, Text } from '@react-email/components'
import {
  EmailLayout,
  buttonStyle,
  headingStyle,
  ink,
  muted,
  secondaryButtonStyle,
  textStyle,
  terracotta,
} from './brand'

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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <table width="100%" cellPadding={0} cellSpacing={0} role="presentation" style={{ borderBottom: '1px solid #eceae5' }}>
      <tbody>
        <tr>
          <td style={{ padding: '10px 12px 10px 0', color: muted, fontSize: 12, width: 150, verticalAlign: 'top' }}>
            {label}
          </td>
          <td style={{ padding: '10px 0', color: ink, fontSize: 14, fontWeight: 600 }}>{value}</td>
        </tr>
      </tbody>
    </table>
  )
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
  <EmailLayout preview={`Nouveau message — ${fullName} — ${projectType}`} tagline="Nouveau message reçu depuis angel-leclerc.fr">
    <Text style={{ ...textStyle, color: terracotta, fontSize: 12, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 10 }}>
      Nouveau contact
    </Text>
    <Heading style={headingStyle}>{projectType}</Heading>

    <Section style={{ backgroundColor: '#F7F5F2', borderRadius: 16, padding: '6px 16px', margin: '18px 0 22px 0' }}>
      <Row label="Nom" value={fullName} />
      <Row label="E-mail" value={email} />
      <Row label="Téléphone" value={phone || '—'} />
      <Row label="Structure" value={structure || '—'} />
      <Row label="Budget" value={budget || '—'} />
      <Row label="Échéance" value={deadline || '—'} />
      <Row label="Reçu le" value={sentAt} />
    </Section>

    <Text style={{ ...textStyle, fontWeight: 700, margin: '0 0 8px 0' }}>Récapitulatif</Text>
    <Text style={{ ...textStyle, whiteSpace: 'pre-wrap', margin: 0 }}>{description}</Text>

    <Hr style={{ border: 'none', borderTop: '1px solid #E8E5E1', margin: '26px 0' }} />

    <Button href={`mailto:${email}?subject=${encodeURIComponent(`Re : ${projectType}`)}`} style={buttonStyle}>
      Répondre à {fullName.split(' ')[0]}
    </Button>

    {signedUrl && attachmentName && (
      <Text style={{ ...textStyle, margin: '20px 0 0 0' }}>
        Fichier joint : <strong>{attachmentName}</strong>
        <br />
        <a href={signedUrl} style={{ ...secondaryButtonStyle, marginTop: 10 }}>
          Télécharger le fichier
        </a>
      </Text>
    )}
  </EmailLayout>
)

export default ContactNotificationEmail
