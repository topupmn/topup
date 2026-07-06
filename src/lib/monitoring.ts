import { prisma } from "./prisma";
import { checkQPayHealth } from "./qpay";
import { getReloadlyAccountBalance } from "./reloadly";
import { sendTelegramMessage } from "./telegram";

interface MonitorCheck {
  name: string;
  ok: boolean;
  detail: string;
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://topup.mn";
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

async function runCheck(
  name: string,
  check: () => Promise<string>
): Promise<MonitorCheck> {
  try {
    return {
      name,
      ok: true,
      detail: await check(),
    };
  } catch (error) {
    return {
      name,
      ok: false,
      detail: errorMessage(error),
    };
  }
}

async function checkWeb() {
  const response = await fetch(getAppUrl(), {
    method: "HEAD",
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return `HTTP ${response.status}`;
}

async function checkDatabase() {
  await prisma.$queryRaw`SELECT 1`;
  return "query OK";
}

async function checkQPay() {
  await checkQPayHealth();
  return "auth OK";
}

async function checkReloadlyBalance() {
  const balance = await getReloadlyAccountBalance();
  const available = Math.max(0, balance.balance - (balance.frozenBalance ?? 0));
  return `${available.toFixed(2)} ${balance.currencyCode}`;
}

export async function getSystemStatus() {
  return Promise.all([
    runCheck("Web", checkWeb),
    runCheck("Database", checkDatabase),
    runCheck("QPay", checkQPay),
    runCheck("Reloadly balance", checkReloadlyBalance),
  ]);
}

export function formatStatusMessage(checks: MonitorCheck[]) {
  const allOk = checks.every((check) => check.ok);
  const lines = checks.map((check) => {
    const status = check.ok ? "OK" : "FAIL";
    return `${check.name}: ${status} - ${check.detail}`;
  });

  return [
    "topup.mn hourly status",
    `Overall: ${allOk ? "OK" : "ATTENTION"}`,
    `Time: ${new Date().toISOString()}`,
    "",
    ...lines,
  ].join("\n");
}

export async function sendHourlyStatusToTelegram() {
  const checks = await getSystemStatus();
  const message = formatStatusMessage(checks);
  await sendTelegramMessage(message);
  return { checks, message };
}
