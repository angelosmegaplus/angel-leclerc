import * as React from "react";
import { Button, Heading, Hr, Text } from "@react-email/components";
import { EmailLayout, SITE_URL, buttonStyle, headingStyle, muted, textStyle } from "./brand";

interface SubscribeWelcomeProps {
  firstName?: string;
  confirmUrl: string;
  unsubscribeUrl: string;
}

export const SubscribeWelcomeEmail = ({
  firstName,
  confirmUrl,
  unsubscribeUrl,
}: SubscribeWelcomeProps) => (
  <EmailLayout
    preview="Confirmez votre inscription aux articles d'Angel Leclerc"
    tagline="Communication, société et idées"
    unsubscribeUrl={unsubscribeUrl}
  >
    <Heading style={headingStyle}>Bienvenue{firstName ? `, ${firstName}` : ""} !</Heading>
    <Text style={textStyle}>
      Merci de votre intérêt. Il reste une étape : confirmez votre adresse e-mail pour recevoir la
      sélection des articles.
    </Text>
    <Button href={confirmUrl} style={{ ...buttonStyle, marginBottom: 8 }}>
      Confirmer mon inscription
    </Button>
    <Hr style={{ border: "none", borderTop: "1px solid #eceae5", margin: "24px 0 18px 0" }} />
    <Text style={textStyle}>
      <strong>Comment ça marche&nbsp;?</strong> Une seule lettre par semaine, le dimanche soir, avec
      les articles publiés dans la semaine. Aucun envoi si aucun article n'a été publié.
    </Text>
    <a href={`${SITE_URL}/articles`} style={{ color: "#CE654B", fontSize: 14, fontWeight: 600 }}>
      Découvrir les derniers articles →
    </a>
    <Text style={{ ...textStyle, fontSize: 12, color: muted, margin: "22px 0 0 0" }}>
      Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement cet e-mail.
    </Text>
  </EmailLayout>
);

export default SubscribeWelcomeEmail;
