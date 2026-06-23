/**
 * Optional Slack notifications via incoming webhook.
 * Free: https://api.slack.com/messaging/webhooks
 * No-op when SLACK_WEBHOOK_URL is not configured — never throws.
 */
export async function notifySlack(text: string): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      // Don't let a slow webhook block the request path
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Notifications are best-effort by design.
  }
}
