import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.JWT_SECRET || 'super_secret_mksu_key_2026_change_in_production_fallback_key_that_is_long_enough';
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10h')
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload;
}

export async function loginSession(admissionNumber: string, role: string) {
  // Create the session
  const expires = new Date(Date.now() + 10 * 60 * 60 * 1000);
  const session = await encrypt({ admissionNumber, role, expires });

  // Save the session in a cookie
  (await cookies()).set('session', session, { expires, httpOnly: true, sameSite: 'lax', path: '/' });
}

export async function logout() {
  (await cookies()).set('session', '', { expires: new Date(0) });
}

export async function getSession() {
  const session = (await cookies()).get('session')?.value;
  if (!session) return null;
  return await decrypt(session);
}
