import type { Metadata } from "next";
import "../globals.css";
import TrialBanner from "@/components/billing/TrialBanner";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "SimplyOrg — Org Chart Tool",
  description: "Consultant-grade org chart and structure design tool",
};

async function getOrgId(): Promise<string> {
  if (!process.env.DATABASE_URL) return "";
  try {
    const { userId } = await auth();
    if (!userId) return "";
    const { prisma } = await import("@/lib/db");
    const user = await prisma.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
    if (!user) return "";
    // Use the most recently joined membership so the banner reflects the
    // org the user is actually viewing, not necessarily the one they own.
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
