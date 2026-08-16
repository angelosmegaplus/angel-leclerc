// Provider catalogue — no secrets here, safe to import anywhere on the server.
export type ProviderId =
  | "google"
  | "youtube"
  | "microsoft"
  | "meta"
  | "linkedin"
  | "x"
  | "github"
  | "canva"
  | "adobe";

export type ProviderConfig = {
  id: ProviderId;
  name: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string[];
  usePkce?: boolean;
  extraAuthParams?: Record<string, string>;
  /** Optional endpoint used to label the connected account. */
  identity?: { url: string; field: string[] };
  supportsRefresh: boolean;
};

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  google: {
    id: "google",
    name: "Google Workspace",
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/drive.file",
    ],
    extraAuthParams: { access_type: "offline", prompt: "consent", include_granted_scopes: "true" },
    identity: { url: "https://openidconnect.googleapis.com/v1/userinfo", field: ["email", "name"] },
    supportsRefresh: true,
  },
  youtube: {
    id: "youtube",
    name: "YouTube",
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: ["openid", "email", "https://www.googleapis.com/auth/youtube.upload"],
    extraAuthParams: { access_type: "offline", prompt: "consent", include_granted_scopes: "true" },
    identity: { url: "https://openidconnect.googleapis.com/v1/userinfo", field: ["email", "name"] },
    supportsRefresh: true,
  },
  microsoft: {
    id: "microsoft",
    name: "Microsoft 365",
    clientIdEnv: "MS_CLIENT_ID",
    clientSecretEnv: "MS_CLIENT_SECRET",
    authorizeUrl: "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
    scopes: [
      "offline_access",
      "openid",
      "email",
      "User.Read",
      "Mail.ReadWrite",
      "Mail.Send",
      "Files.ReadWrite",
      "Calendars.ReadWrite",
    ],
    identity: { url: "https://graph.microsoft.com/v1.0/me", field: ["mail", "userPrincipalName"] },
    supportsRefresh: true,
  },
  meta: {
    id: "meta",
    name: "Facebook / Instagram",
    clientIdEnv: "META_APP_ID",
    clientSecretEnv: "META_APP_SECRET",
    authorizeUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
    scopes: ["pages_show_list", "pages_manage_posts", "pages_read_engagement", "instagram_basic"],
    identity: { url: "https://graph.facebook.com/v19.0/me?fields=name", field: ["name"] },
    supportsRefresh: false,
  },
  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    clientIdEnv: "LINKEDIN_CLIENT_ID",
    clientSecretEnv: "LINKEDIN_CLIENT_SECRET",
    authorizeUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    scopes: ["openid", "profile", "email", "w_member_social"],
    identity: { url: "https://api.linkedin.com/v2/userinfo", field: ["email", "name"] },
    supportsRefresh: false,
  },
  x: {
    id: "x",
    name: "X",
    clientIdEnv: "X_CLIENT_ID",
    clientSecretEnv: "X_CLIENT_SECRET",
    authorizeUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
    scopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
    usePkce: true,
    identity: { url: "https://api.twitter.com/2/users/me", field: ["data.username"] },
    supportsRefresh: true,
  },
  github: {
    id: "github",
    name: "GitHub",
    clientIdEnv: "GITHUB_CLIENT_ID",
    clientSecretEnv: "GITHUB_CLIENT_SECRET",
    authorizeUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    scopes: ["repo", "read:user"],
    identity: { url: "https://api.github.com/user", field: ["login"] },
    supportsRefresh: false,
  },
  canva: {
    id: "canva",
    name: "Canva",
    clientIdEnv: "CANVA_CLIENT_ID",
    clientSecretEnv: "CANVA_CLIENT_SECRET",
    authorizeUrl: "https://www.canva.com/api/oauth/authorize",
    tokenUrl: "https://api.canva.com/rest/v1/oauth/token",
    scopes: ["design:content:read", "asset:read"],
    usePkce: true,
    supportsRefresh: true,
  },
  adobe: {
    id: "adobe",
    name: "Adobe Express / Creative Cloud",
    clientIdEnv: "ADOBE_CLIENT_ID",
    clientSecretEnv: "ADOBE_CLIENT_SECRET",
    authorizeUrl: "https://ims-na1.adobelogin.com/ims/authorize/v2",
    tokenUrl: "https://ims-na1.adobelogin.com/ims/token/v3",
    scopes: ["openid", "AdobeID", "creative_sdk"],
    supportsRefresh: true,
  },
};

export function isProviderId(value: string): value is ProviderId {
  return Object.prototype.hasOwnProperty.call(PROVIDERS, value);
}
