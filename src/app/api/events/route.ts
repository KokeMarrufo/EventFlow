import { NextResponse } from "next/server";
import { getEventSummaries } from "@/lib/reports";

export async function GET() {
  const { events, grandTotal } = await getEventSummaries();
  return NextResponse.json({ events, grandTotal });
}
