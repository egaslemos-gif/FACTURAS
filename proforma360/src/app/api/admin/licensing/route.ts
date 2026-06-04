import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, target_user_id, updates } = body;

    const apiUrl = process.env.LICENSING_API_URL;
    if (!apiUrl) {
       return NextResponse.json({ error: "API URL missing" }, { status: 500 });
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: action, // adminListUsers, adminListRequests, adminUpdateUser
        user_id: session.user.id,
        email: session.user.email, // Apps Script verifies this email is an admin
        target_user_id,
        updates
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status === 403) {
      return NextResponse.json({ error: "Admin access denied" }, { status: 403 });
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Admin Licensing Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
