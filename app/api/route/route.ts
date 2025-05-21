import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!start || !end) {
    return NextResponse.json({ error: "Missing start or end parameters" }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_ORS_API_KEY;
  const url = `https://api.openrouteservice.org/v2/directions/driving-car?start=${start}&end=${end}`;

  try {
    const orsRes = await fetch(url, {
      headers: {
        Authorization: apiKey as string,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const data = await orsRes.json();
    return NextResponse.json(data, { status: orsRes.status });
  } catch (error) {
    console.error("Error fetching route:", error);
    return NextResponse.json({ error: "Failed to fetch route" }, { status: 500 });
  }
}
