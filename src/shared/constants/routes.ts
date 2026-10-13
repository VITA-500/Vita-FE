export const routes = {
  home: "/",
  login: "/login",
  chat: "/chat",
  myPage: "/chat?mode=profile",
  admin: "/admin",
  adminFaqs: "/admin/faqs",
  adminPartners: "/admin/partners",
  adminStores: "/admin/stores",
  adminUnresolved: "/admin/unresolved",
  oauthCallback: "/oauth/callback",
} as const;
