import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { company_name, requested_quota, phone, message } = body;

    const apiUrl = process.env.LICENSING_API_URL;
    if (!apiUrl) {
      return NextResponse.json({ success: true, id: "dummy-id" });
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "requestUpgrade",
        user_id: session.user.id,
        email: session.user.email,
        company_name,
        requested_quota,
        phone,
        message
      })
    });

    if (!response.ok) {
      throw new Error("Failed to submit request.");
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Licensing Upgrade Request Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
