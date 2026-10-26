import { describe, expect, it } from "vitest";
import { buildLoginHref, sanitizeLoginReturnTo } from "./loginReturn";

describe("login destinations", () => {
  it("keeps the chat mode while rejecting external and authentication destinations", () => {
    expect(buildLoginHref("/chat?mode=store")).toBe(
      "/login?returnTo=%2Fchat%3Fmode%3Dstore",
    );
    for (const path of [
      "https://old.example.com",
      "//old.example.com",
      "/login",
      "/oauth/callback",
      "/\\evil",
      "/\nevil",
    ])
      expect(sanitizeLoginReturnTo(path)).toBeNull();
  });
});
