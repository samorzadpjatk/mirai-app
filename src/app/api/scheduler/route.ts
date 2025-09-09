import { NextResponse } from "next/server";
import { api } from "~/trpc/server";

// This endpoint will be called by a cron job every minute
export async function POST() {
  try {
    console.log("Scheduler: Checking for scheduled notifications...");

    const result = await api.notificationSchedule.sendScheduledNotifications();

    console.log(`Scheduler: Executed ${result.total}, Sent ${result.sent}, Failed ${result.failed}`);

    return NextResponse.json({
      success: result.success,
      executed: result.total,
      sent: result.sent,
      failed: result.failed,
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