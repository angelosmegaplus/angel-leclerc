import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

const cream = '#F6F1E8'
const warmWhite = '#FFFDF9'
const ink = '#181716'
const terracotta = '#CE654B'
const fontBody = "'Inter','Helvetica Neue','Segoe UI',Arial,sans-serif"
const fontHead = "'Manrope','Helvetica Neue','Segoe UI',Arial,sans-serif"

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Votre lien de connexion pour {siteName}</Preview>
    <Body style={{ backgroundColor: cream, fontFamily: fontBody, color: ink, margin: 0, padding: 0 }}>
      <Container style={{ maxWidth: 600, backgroundColor: warmWhite, borderRadius: 14, overflow: 'hidden', margin: '32px auto', boxShadow: '0 1px 3px rgba(24,23,22,0.06)' }}>
        <div style={{ padding: '28px 32px 8px 32px', borderBottom: `3px solid ${terracotta}` }}>
          <Heading style={{ fontFamily: fontHead, fontSize: 18, fontWeight: 700, color: ink, margin: 0, letterSpacing: '-0.01em' }}>
            {siteName}
          </Heading>
        </div>
        <div style={{ padding: '28px 32px' }}>
          <Heading style={{ fontFamily: fontHead, fontSize: 22, fontWeight: 700, color: ink, margin: '0 0 20px 0', letterSpacing: '-0.01em' }}>
            Votre lien de connexion
          </Heading>
          <Text style={{ fontSize: 15, lineHeight: 1.6, margin: '0 0 25px 0' }}>
            Cliquez sur le bouton ci-dessous pour vous connecter à {siteName}. Ce lien expirera prochainement.
          </Text>
          <Button style={{ backgroundColor: terracotta, color: '#fff', fontSize: 15, borderRadius: 8, padding: '12px 20px', textDecoration: 'none', display: 'inline-block', fontWeight: 600 }} href={confirmationUrl}>
            Se connecter
          </Button>
          <Text style={{ fontSize: 12, color: '#8a8a8a', margin: '30px 0 0 0' }}>
            Si vous n'avez pas demandé ce lien, vous pouvez ignorer cet e-mail en toute sécurité.
          </Text>
        </div>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail
