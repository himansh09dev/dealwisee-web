import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

/*
 * Password hashing with scrypt from Node's standard library (memory-hard,
 * listed by OWASP; avoids a native dependency). Stored format:
 *   scrypt$<logN>$<r>$<p>$<salt b64>$<hash b64>
 * Parameters live in the hash, so the cost can be raised later and old
 * hashes still verify.
 */

const KEY_LENGTH = 64;
const R = 8;
const P = 1;

function derive(password: string, salt: Buffer, logN: number, r: number, p: number): Promise<Buffer> {
  const N = 2 ** logN;
  const options: ScryptOptions = { N, r, p, maxmem: 256 * N * r };
  return new Promise((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, options, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

export async function hashPassword(password: string, logN: number): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, logN, R, P);
  return ["scrypt", logN, R, P, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, logN, r, p, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !logN || !r || !p || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const actual = await derive(password, Buffer.from(salt, "base64"), Number(logN), Number(r), Number(p));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
