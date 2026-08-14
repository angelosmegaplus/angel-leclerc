import * as React from 'react'
import { render } from '@react-email/render'
import { TEMPLATES } from './registry'

const SITE_NAME = 'Angel Leclerc Communication'
const FROM_ADDRESS = process.env.ANGEL_MAIL_FROM || 'noreply@angel-leclerc.fr'
const SENDMAIL_PATH = process.env.ANGEL_SENDMAIL_PATH || '/usr/sbin/sendmail'

export type SendTemplateEmailResult =
  | { sent: true }
  | { sent: false; reason: 'recipient_suppressed' }

export interface SendTemplateEmailOptions {
  templateData?: Record<string, any>
  idempotencyKey?: string
  replyTo?: string
}

function cleanHeader(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim()
}

async function sendWithLocalMta(message: string): Promise<void> {
  const processHandle = Bun.spawn([SENDMAIL_PATH, '-t', '-i'], {
    stdin: 'pipe',
    stdout: 'pipe',
    stderr: 'pipe',
  })
  processHandle.stdin.write(message)
  processHandle.stdin.end()
  const exitCode = await processHandle.exited
  if (exitCode !== 0) {
    const errorText = await new Response(processHandle.stderr).text()
    throw new Error(`Angel Mail: sendmail a échoué (${exitCode})${errorText ? `: ${errorText.trim()}` : ''}`)
  }
}

export async function sendTemplateEmail(
  templateName: string,
  to: string,
  options: SendTemplateEmailOptions = {}
): Promise<SendTemplateEmailResult> {
  const template = TEMPLATES[templateName]
  if (!template) {
    throw new Error(`Template '${templateName}' introuvable. Disponibles : ${Object.keys(TEMPLATES).join(', ')}`)
  }

  const recipient = template.to || to
  if (!recipient) throw new Error('Destinataire requis')

  const templateData = options.templateData ?? {}
  const element = React.createElement(template.component, templateData)
  const html = await render(element)
  const text = await render(element, { plainText: true })
  const subject = typeof template.subject === 'function' ? template.subject(templateData) : template.subject

  const headers = [
    `From: ${cleanHeader(SITE_NAME)} <${cleanHeader(FROM_ADDRESS)}>`,
    `To: ${cleanHeader(recipient)}`,
    `Subject: ${cleanHeader(subject)}`,
    options.replyTo ? `Reply-To: ${cleanHeader(options.replyTo)}` : null,
    `Message-ID: <${cleanHeader(options.idempotencyKey || crypto.randomUUID())}@angel-leclerc.fr>`,
    'MIME-Version: 1.0',
    'Content-Type: multipart/alternative; boundary="angel-os-mail-boundary"',
    '',
    '--angel-os-mail-boundary',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    text,
    '',
    '--angel-os-mail-boundary',
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    html,
    '',
    '--angel-os-mail-boundary--',
    '',
  ].filter((line): line is string => line !== null)

  await sendWithLocalMta(headers.join('\r\n'))
  return { sent: true }
}
