import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const sessionToken = (await cookieStore).get('session_token');

  if (!sessionToken) {
    return NextResponse.json({ authenticated: false });
  }

  // Here you would typically validate the session token
  // For now, we'll just check if it exists
  return NextResponse.json({ authenticated: true });
} 