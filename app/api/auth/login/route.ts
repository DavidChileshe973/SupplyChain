import { NextResponse } from 'next/server';
import { account } from '@/lib/appwrite';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    try {
      // Create session with Appwrite
      const session = await account.createEmailPasswordSession(email, password);
      
      // Get user details
      const user = await account.get();

      return NextResponse.json({ 
        success: true,
        user: {
          id: user.$id,
          name: user.name,
          email: user.email,
          session: session.$id
        }
      });
    } catch (appwriteError: any) {
      console.error('Appwrite error:', appwriteError);
      
      // Handle specific Appwrite errors
      if (appwriteError.type === 'user_invalid_credentials') {
        return NextResponse.json(
          { message: 'Invalid email or password' },
          { status: 401 }
        );
      }

      if (appwriteError.type === 'user_not_found') {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        );
      }

      // Return the specific error message from Appwrite if available
      return NextResponse.json(
        { message: appwriteError.message || 'Authentication failed' },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 