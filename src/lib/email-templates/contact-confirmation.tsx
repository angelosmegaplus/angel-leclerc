import * as React from 'react'
import { Button, Heading, Hr, Section, Text } from '@react-email/components'
import {
  EmailLayout,
  SITE_URL,
  buttonStyle,
  headingStyle,
  muted,
  textStyle,
  terracotta,
} from './brand'

interface ContactConfirmationProps {
  firstName?: string
  subject?: string
}

export const ContactConfirmationEmail = ({ firstName, subject }: ContactConfirmationProps) => (
  <EmailLayout
    preview="Message bien reçu — Angel Leclerc"
    tagline="Votre demande est arrivée."
  >
    <Text style={{ ...textStyle, color: terracotta, fontSize: 12, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 10 }}>
      Confirmation de réception
    </Text>
    <Heading style={headingStyle}>Votre message est bien arrivé.</Heading>
    <Text style={textStyle}>Bonjour{firstName ? ` ${firstName}` : ''},</Text>
    <Text style={textStyle}>
      Merci pour votre message. Il a bien été transmis à Angel Leclerc et sera consulté directement.
    </Text>
    {subject && (
      <Section style={{ backgroundColor: '#F7F5F2', borderRadius: 14, padding: '14px 16px', margin: '18px 0' }}>
        <Text style={{ ...textStyle, color: muted, fontSize: 12, margin: '0 0 4px 0' }}>Votre demande</Text>
        <Text style={{ ...textStyle, fontWeight: 700, margin: 0 }}>{subject}</Text>
      </Section>
    )}
    <Text style={textStyle}>
      Une réponse vous sera apportée dès que possible. Pour une proposition d’alternance, les informations transmises permettent déjà de préparer l’échange.
    </Text>
    <Button href={SITE_URL} style={{ ...buttonStyle, marginTop: 8 }}>
      Voir angel-leclerc.fr
    </Button>
    <Hr style={{ border: 'none', borderTop: '1px solid #E8E5E1', margin: '28px 0 16px 0' }} />
    <Text style={{ ...textStyle, fontSize: 12, color: muted, margin: 0 }}>
      Ce message est une confirmation automatique. Vous n’avez rien d’autre à faire pour que votre demande soit prise en compte.
    </Text>
  </EmailLayout>
)

export default ContactConfirmationEmail
