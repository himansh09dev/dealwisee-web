import type { AuthResult, RegisterInput, SignInInput } from "./schemas";

/*
 * Server-side boundary to the authentication API.
 *
 * NOT IMPLEMENTED YET — on purpose. There is no backend, so every call
 * reports the service as unavailable. Nothing here creates sessions, sets
 * cookies or stores credentials, so it can't be mistaken for real security.
 * The Express API phase replaces these bodies with calls to /auth/* that set
 * an httpOnly session cookie.
 */

const unavailable: AuthResult = {
  ok: false,
  message:
    "Accounts aren't available yet. Sign-in and registration will work once the PricePilot API is connected.",
};

export const authService = {
  async signIn(input: SignInInput): Promise<AuthResult> {
    void input;
    return unavailable;
  },
  async register(input: RegisterInput): Promise<AuthResult> {
    void input;
    return unavailable;
  },
};
