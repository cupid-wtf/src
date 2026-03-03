import { SignJWT, jwtVerify } from "jose";
import { cookies, type UnsafeUnwrappedCookies } from "next/headers";
const secretKey = process.env.AUTH_SECRET; 
const key = new TextEncoder().encode(secretKey);
export interface user {
    id: string;
}
export async function encrypt(payload: { user: { id: string }; expires: Date; }) {
  return await new SignJWT(
      payload
  )
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("4 days from now")
      .sign(key);
}
  export async function decrypt(input: string): Promise<unknown> {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
    });
    return payload;
  }  


  export function setSessionCookie(session: string, expires: Date) {
    (cookies() as unknown as UnsafeUnwrappedCookies).set(".CATPICS", session, {
      expires,
      httpOnly: true,
      sameSite: "lax",
      secure: true,
    });
  }

  export async function logout() {
    (await cookies()).set(".CATPICS", "", { expires: new Date(0) });
  }
  
  export async function getSession(): Promise<user | null> {
    const session = (await cookies()).get(".CATPICS")?.value;
    if (!session) return null;
    
    try {
      const payload = await decrypt(session) as { user: user };
      return payload.user;
    } catch (error) {
      console.error("Invalid session:", error);
      return null;
    }
  }
  