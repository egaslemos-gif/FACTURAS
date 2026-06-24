import { NextResponse } from "next/server";
import { Redis } from '@upstash/redis';

// Only connect to Redis if credentials exist in the environment
const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) 
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Fallback for local development if KV is not yet configured
let fallbackRequests: any[] = [];
let fallbackAudit: any[] = [];

/**
 * Lightweight Control-Plane: SaaS Governance Data
 * Uses Upstash Redis (KV) to persist upgrade requests and audit trails.
 */
export async function GET(req: Request) {
  try {
    let requests = fallbackRequests;
    let audit = fallbackAudit;

    if (redis) {
      requests = (await redis.get("proforma360_upgrade_requests")) || [];
      audit = (await redis.get("proforma360_audit_trail")) || [];
    }

    return NextResponse.json({ requests, audit });
  } catch (error) {
    console.error("[ControlPlane] Failed to fetch from KV:", error);
    return NextResponse.json({ error: "Failed to fetch governance data" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    let requests = redis ? ((await redis.get<any[]>("proforma360_upgrade_requests")) || []) : fallbackRequests;
    let audit = redis ? ((await redis.get<any[]>("proforma360_audit_trail")) || []) : fallbackAudit;

    if (action === "REQUEST_UPGRADE") {
      const request = {
        id: crypto.randomUUID(),
        ...payload,
        status: "PENDING",
        createdAt: new Date().toISOString()
      };
      
      requests.push(request);
      
      if (redis) {
        await redis.set("proforma360_upgrade_requests", requests);
      }
      
      return NextResponse.json({ success: true, request });
    }

    if (action === "APPROVE_UPGRADE") {
      const { requestId, adminId } = payload;
      const requestIndex = requests.findIndex((r: any) => r.id === requestId);
      
      if (requestIndex !== -1) {
        requests[requestIndex].status = "APPROVED";
        requests[requestIndex].reviewedBy = adminId;
        requests[requestIndex].reviewedAt = new Date().toISOString();
        
        audit.push({
          id: crypto.randomUUID(),
          eventType: "ADMIN_PLAN_OVERRIDE",
          adminId,
          targetUserId: requests[requestIndex].userId,
          details: `Approved upgrade to ${requests[requestIndex].requestedPlan}`,
          timestamp: new Date().toISOString()
        });

        if (redis) {
          await redis.set("proforma360_upgrade_requests", requests);
          await redis.set("proforma360_audit_trail", audit);
        }

        // The UI will likely ping /api/admin/licensing directly after this succeeds
        return NextResponse.json({ success: true, request: requests[requestIndex] });
      }
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("[ControlPlane] Subscriptions Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
