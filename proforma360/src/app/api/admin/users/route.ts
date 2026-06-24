import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { UserRegistry } from "@/lib/cloud/userRegistry";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email } = session.user;
    const userId = (session.user as any).id || email || "anonymous";
    const userInfo = UserRegistry.getUserInfo(userId);

    // Strict admin authentication check
    if (!userInfo.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = UserRegistry.getAllUsers();
    const logs = UserRegistry.getAllLogs();

    // Calculate MRR & plan distribution details
    let mrr = 0;
    let freeCount = 0;
    let starterCount = 0;
    let businessCount = 0;
    let enterpriseCount = 0;

    users.forEach(u => {
      const plan = u.subscription?.plan || "free";
      if (plan === "free") freeCount++;
      else if (plan === "starter") {
        starterCount++;
        mrr += u.subscription?.billingCycle === "yearly" ? 490 / 12 : 49; // Simulated values in USD
      } else if (plan === "business") {
        businessCount++;
        mrr += u.subscription?.billingCycle === "yearly" ? 1490 / 12 : 149;
      } else if (plan === "enterprise") {
        enterpriseCount++;
        mrr += 499;
      }
    });

    return NextResponse.json({
      users,
      logs,
      metrics: {
        totalUsers: users.length,
        mrr: parseFloat(mrr.toFixed(2)),
        distribution: {
          free: freeCount,
          starter: starterCount,
          business: businessCount,
          enterprise: enterpriseCount
        }
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
