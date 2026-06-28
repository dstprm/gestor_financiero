import type { Metadata } from "next";
import "../globals.css";
import TrialBanner from "@/components/billing/TrialBanner";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "ClaudeKit App",
  description: "Your SaaS dashboard",
};

async function getOrgId(): Promise<string> {
  if (!process.env.DATABASE_URL) return "";
  try {
    const { userId } = await auth();
    if (!userId) return "";
    const { prisma } = await import("@/lib/db");
    const user = await prisma.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
    if (!user) return "";
    const membership = await prisma.orgMembership.findFirst({
      where: { userId: user.id },
      orderBy: { joinedAt: "desc" },
      select: { organizationId: true },
    });
    return membership?.organizationId ?? "";
  } catch {
    return "";
  }
}

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const orgId = await getOrgId();

  return (
    <div className="h-dvh flex flex-col bg-gray-50 dark:bg-slate-950 antialiased overflow-hidden">
      <TrialBanner organizationId={orgId} />
      {children}
    </div>
  );
}
