import { NextResponse } from "next/server";

import { getAIStatus } from "@/services/aiProviderService";

export async function GET() {
  const status = await getAIStatus();
  return NextResponse.json(status);
}
