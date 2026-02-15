import { SignJWT, jwtVerify } from 'jose';
import { env } from '../../config/env';

const accessSecret = new TextEncoder().encode(env.JWT_SECRET);
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

export interface TokenPayload {
  sub: string;
  email: string;
}

export async function generateAccessToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('15m')
    .setIssuer('openscribe')
    .sign(accessSecret);
}

export async function generateRefreshToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('7d')
    .setIssuer('openscribe')
    .sign(refreshSecret);
}

export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, accessSecret, {
    algorithms: ['HS256'],
    issuer: 'openscribe',
  });
  return {
    sub: payload.sub as string,
    email: payload.email as string,
  };
}

export async function verifyRefreshToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, refreshSecret, {
    algorithms: ['HS256'],
    issuer: 'openscribe',
  });
  return {
    sub: payload.sub as string,
    email: payload.email as string,
  };
}
