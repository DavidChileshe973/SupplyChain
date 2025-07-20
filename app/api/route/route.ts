// app/api/route/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!start || !end) {
    return NextResponse.json({ error: "Missing start or end parameters" }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_ORS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ORS API key not configured" }, { status: 500 });
  }

  const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${start}&end=${end}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch route" }, { status: 500 });
  }
}
                                                    

