import * as React from 'react'
import { Button, Heading, Hr, Text } from '@react-email/components'
import {
  EmailLayout,
  SITE_URL,
  buttonStyle,
  headingStyle,
  muted,
  textStyle,
} from './brand'

interface ContactConfirmationProps {
  firstName?: string
  subject?: string
}

export const ContactConfirmationEmail = ({ firstName, subject }: ContactConfirmationProps) => (
  <EmailLayout
    preview="Votre message a bien été reçu — Angel Leclerc Communication"
    tagline="Donner du souffle à vos idées"
  >
    <Heading style={headingStyle}>Votre message a bien été reçu</Heading>
    <Text style={textStyle}>Bonjour{firstName ? ` ${firstName}` : ''},</Text>
    <Text style={textStyle}>
      Merci pour votre message : il est bien arrivé et je l'ai sous les yeux.
    </Text>
    {subject && (
      <Text style={{ ...textStyle, color: muted }}>
        Objet de votre demande : <strong style={{ color: '#181716' }}>{subject}</strong>
      </Text>
    )}
    <Text style={textStyle}>
      Je reviendrai vers vous dès que possible pour échanger sur votre projet.
    </Text>
    <Button href={SITE_URL} style={{ ...buttonStyle, marginTop: 8 }}>
      Retourner sur angel-leclerc.fr
    </Button>
    <Hr style={{ border: 'none', borderTop: '1px solid #eceae5', margin: '26px 0 16px 0' }} />
    <Text style={{ ...textStyle, fontSize: 12, color: muted, margin: 0 }}>
      Cet e-mail confirme la bonne réception de votre demande. Inutile d'y répondre.
    </Text>
  </EmailLayout>
)

export default ContactConfirmationEmail
