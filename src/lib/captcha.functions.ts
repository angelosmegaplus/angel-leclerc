import { createServerFn } from "@tanstack/react-start";

export const getCaptchaChallenge = createServerFn({ method: "GET" }).handler(async () => {
  const { createChallenge } = await import("./captcha.server");
  return createChallenge();
});
