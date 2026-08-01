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

interface BlogNewArticleProps {
  title: string
  excerpt?: string
  url: string
  unsubscribeUrl: string
}

const cream = '#F6F1E8'
const warmWhite = '#FFFDF9'
const ink = '#181716'
const terracotta = '#CE654B'
const fontBody = "'Inter','Helvetica Neue','Segoe UI',Arial,sans-serif"
const fontHead = "'Manrope','Helvetica Neue','Segoe UI',Arial,sans-serif"

export const BlogNewArticleEmail = ({ title, excerpt, url, unsubscribeUrl }: BlogNewArticleProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Nouvel article sur le blog — {title}</Preview>
    <Body style={{ backgroundColor: cream, fontFamily: fontBody, color: ink, margin: 0, padding: 0 }}>
      <Container style={{ maxWidth: 600, backgroundColor: warmWhite, borderRadius: 14, overflow: 'hidden', margin: '32px auto', boxShadow: '0 1px 3px rgba(24,23,22,0.06)' }}>
        <Section style={{ padding: '28px 32px 8px 32px', borderBottom: `3px solid ${terracotta}` }}>
          <Heading style={{ fontFamily: fontHead, fontSize: 18, fontWeight: 700, color: ink, margin: 0, letterSpacing: '-0.01em' }}>
            Angel Leclerc Communication
          </Heading>
          <Text style={{ fontFamily: fontBody, fontSize: 13, color: '#6b6b6b', margin: '2px 0 0 0' }}>
            Nouvel article sur le blog
          </Text>
        </Section>
        <Section style={{ padding: '28px 32px' }}>
          <Heading style={{ fontFamily: fontHead, fontSize: 22, fontWeight: 700, color: ink, margin: '0 0 12px 0', letterSpacing: '-0.01em' }}>
            {title}
          </Heading>
          {excerpt && (
            <Text style={{ fontSize: 15, lineHeight: 1.6, color: '#4b4b4b', margin: '0 0 20px 0' }}>
              {excerpt}
            </Text>
          )}
          <Button href={url} style={{ backgroundColor: terracotta, color: '#fff', fontSize: 15, borderRadius: 8, padding: '12px 20px', textDecoration: 'none', display: 'inline-block', fontWeight: 600 }}>
            Lire l'article
          </Button>
        </Section>
        <Section style={{ padding: '20px 32px', backgroundColor: cream, textAlign: 'center' }}>
          <Text style={{ fontSize: 12, color: '#8a8a8a', margin: 0 }}>
            Vous recevez cet e-mail car vous êtes abonné au blog.
            <br />
            <Link href={unsubscribeUrl} style={{ color: terracotta, textDecoration: 'none' }}>
              Se désabonner
            </Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default BlogNewArticleEmail
