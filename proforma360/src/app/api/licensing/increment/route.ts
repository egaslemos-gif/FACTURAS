import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiUrl = process.env.LICENSING_API_URL;
    if (!apiUrl) {
      console.warn("LICENSING_API_URL is missing. Simulating success.");
      return NextResponse.json({ success: true, dummy: true });
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "increment",
        user_id: session.user.id,
        email: session.user.email
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Apps Script returns 403 status inside its JSON payload if limit reached
    if (data.status === 403 && data.error === 'LIMIT_REACHED') {
       return NextResponse.json(data, { status: 403 });
    }

    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 400 });
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Licensing Increment Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
