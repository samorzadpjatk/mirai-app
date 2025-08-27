import { NextRequest, NextResponse } from "next/server";
import { ScheduledNotificationService } from "~/server/services/scheduledNotificationService";

// This endpoint will be called by a cron job every minute
export async function GET(request: NextRequest) {
  try {
    // Optional: Add some basic authentication/API key check
    const authHeader = request.headers.get("authorization");
    const expectedAuth = process.env.SCHEDULER_API_KEY;
    
    if (expectedAuth && authHeader !== `Bearer ${expectedAuth}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("Scheduler: Checking for scheduled notifications...");

    const result = await ScheduledNotificationService.executeScheduledNotifications();

    console.log(`Scheduler: Executed ${result.executed}, Failed ${result.failed}, Skipped ${result.skipped}`);

    return NextResponse.json({
      success: true,
      executed: result.executed,
      failed: result.failed,
      skipped: result.skipped,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Scheduler error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type = "ranking" } = body;

    console.log(`Manual scheduler trigger: ${type}`);

    let result;
    
    if (type === "ranking") {
      result = await ScheduledNotificationService.sendRankingUpdate("Manual Trigger");
    } else if (type === "weekly") {
      result = await ScheduledNotificationService.sendWeeklySummary();
    } else {
      return NextResponse.json(
        { error: "Invalid notification type. Use 'ranking' or 'weekly'" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      type,
      sent: result.sent,
      failed: result.failed,
      totalUsers: result.totalUsers,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Manual scheduler error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
