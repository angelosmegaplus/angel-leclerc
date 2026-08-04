import * as React from 'react'
import { Button, Heading, Hr, Img, Section, Text } from '@react-email/components'
import { EmailLayout, buttonStyle, headingStyle, ink, line, muted, textStyle } from './brand'

export interface NewsletterArticle {
  title: string
  excerpt?: string
  url: string
  imageUrl?: string
  date: string
}

interface WeeklyNewsletterProps {
  intro?: string
  articles: NewsletterArticle[]
  unsubscribeUrl: string
}

export const WeeklyNewsletterEmail = ({
  intro,
  articles = [],
  unsubscribeUrl,
}: WeeklyNewsletterProps) => (
  <EmailLayout
    preview={`Les articles de la semaine — ${articles.length} publication(s)`}
    tagline="La lettre hebdomadaire"
    unsubscribeUrl={unsubscribeUrl}
  >
    <Heading style={headingStyle}>Les articles de la semaine</Heading>
    <Text style={textStyle}>
      {intro ||
        "Voici les publications parues cette semaine sur angel-leclerc.fr : communication, société et idées pour comprendre ce qui change."}
    </Text>

    {articles.map((article, index) => (
      <Section key={article.url}>
        {index > 0 && <Hr style={{ border: 'none', borderTop: `1px solid ${line}`, margin: '24px 0' }} />}
        {article.imageUrl && (
          <Img
            src={article.imageUrl}
            alt={article.title}
            width="544"
            height="auto"
            style={{ display: 'block', width: '100%', maxWidth: 544, height: 'auto', borderRadius: 12, border: 0, marginBottom: 14 }}
          />
        )}
        <Text style={{ fontSize: 12, color: muted, margin: '0 0 6px 0' }}>{article.date}</Text>
        <Text style={{ ...textStyle, fontSize: 18, fontWeight: 700, color: ink, margin: '0 0 8px 0' }}>
          {article.title}
        </Text>
        {article.excerpt && (
          <Text style={{ ...textStyle, color: '#4b4b4b', margin: '0 0 14px 0' }}>{article.excerpt}</Text>
        )}
        <Button href={article.url} style={buttonStyle}>
          Lire l'article
        </Button>
      </Section>
    ))}
  </EmailLayout>
)

export default WeeklyNewsletterEmail
