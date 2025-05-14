import { NextResponse } from 'next/server';
import { databases } from '@/lib/appwrite';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const trackingId = searchParams.get('trackingId');

    if (!trackingId) {
        return NextResponse.json(
            { error: 'Tracking ID is required' },
            { status: 400 }
        );
    }

    try {
        // For demonstration, return mock location
        // In production, you should fetch this from your database
        const mockLocation = {
            lat: -15.3875, // Lusaka coordinates
            lng: 28.3228
        };

        return NextResponse.json(mockLocation);
    } catch (error) {
        console.error('Location fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch location' },
            { status: 500 }
        );
    }
}