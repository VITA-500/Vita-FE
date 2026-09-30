import { beforeEach, describe, expect, it } from "vitest";
import { tokenStorage } from "./tokenStorage";

describe("tokenStorage", () => {
  beforeEach(() => {
    document.cookie = "vita_has_access_token=; path=/; max-age=0; SameSite=Lax";
  });

  it("stores an auth hint cookie", () => {
    tokenStorage.setAuthHint();

    expect(tokenStorage.hasAccessTokenHint()).toBe(true);
  });

  it("removes the auth hint cookie", () => {
    tokenStorage.setAuthHint();
    tokenStorage.removeAuthHint();

    expect(tokenStorage.hasAccessTokenHint()).toBe(false);
  });
});
