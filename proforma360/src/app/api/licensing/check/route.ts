import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, name } = session.user;
    const userId = (session.user as any).id || email;
    
    // Default fallback if env var is missing during dev
    const apiUrl = process.env.LICENSING_API_URL;
    if (!apiUrl) {
      console.warn("LICENSING_API_URL is missing. Returning fallback free license.");
      return NextResponse.json({
        license: {
          user_id: userId,
          email: email,
          plan: 'free',
          monthly_limit: 3,
          used_this_month: 0,
          unlimited: false,
          can_export_pdf: true,
          can_share: true,
          is_active: true
        },
        isAdmin: false
      });
    }

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "check",
          user_id: userId,
          email: email,
          company_name: name || ""
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch license from remote (Status: ${response.status}).`);
      }

      const data = await response.json();
      if (data.error) {
        console.error("Remote Licensing Error:", data.error);
        throw new Error(data.error);
      }
      
      return NextResponse.json(data);
    } catch (fetchError: any) {
      console.error("Licensing fetch failed, falling back to free license:", fetchError.message);
      return NextResponse.json({
        license: {
          user_id: userId,
          email: email,
          plan: 'free',
          monthly_limit: 3,
          used_this_month: 0,
          unlimited: false,
          can_export_pdf: true,
          can_share: true,
          is_active: true
        },
        isAdmin: false
      });
    }

  } catch (error: any) {
    console.error("Licensing Check Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
