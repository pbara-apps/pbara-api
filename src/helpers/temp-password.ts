import { randomInt } from "node:crypto";

/** Letters and digits that are hard to confuse when read from an email (no 0/O, 1/l/I). */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

/** Random one-time password for a first login, e.g. "h7KpQ2xRmT". */
export function generateTempPassword(length = 10): string {
  let password = "";
  for (let i = 0; i < length; i++) {
    password += ALPHABET[randomInt(ALPHABET.length)];
  }
  return password;
}
