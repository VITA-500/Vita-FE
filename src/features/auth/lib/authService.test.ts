import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/api/http", () => ({
  requestJson: vi.fn(),
}));

describe("authService", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("creates provider authorization URLs from the API base URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.vita.test/");

    const { authService } = await import("./authService");

    expect(authService.createOAuthAuthorizationUrl("kakao")).toBe(
      "https://api.vita.test/oauth2/authorization/kakao",
    );
    expect(authService.createOAuthAuthorizationUrl("google")).toBe(
      "https://api.vita.test/oauth2/authorization/google",
    );
    expect(authService.createOAuthAuthorizationUrl("naver")).toBe(
      "https://api.vita.test/oauth2/authorization/naver",
    );
  });
});
