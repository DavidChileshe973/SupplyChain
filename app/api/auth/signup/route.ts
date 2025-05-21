import { NextResponse } from 'next/server';
import { databases } from '@/lib/appwrite';
import { ID } from 'appwrite';

export async function POST(request: Request) {
  try {
    const { name, email } = await request.json();

    // Create user document in the database
    const user = await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!,
      ID.unique(),
      {
        name,
        email,
        role: 'user',
        created_at: new Date().toISOString(),
      }
    );

    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.$id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { message: 'Failed to create user account' },
      { status: 500 }
    );
  }
} 