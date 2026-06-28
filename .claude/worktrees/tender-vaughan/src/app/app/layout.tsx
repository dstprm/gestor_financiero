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
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return "";
    const org = await prisma.organization.findFirst({ where: { ownerId: user.id } });
    return org?.id ?? "";
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
    <div className="h-full flex flex-col bg-gray-50 dark:bg-slate-950 antialiased min-h-screen">
      <TrialBanner organizationId={orgId} />
      {children}
    </div>
  );
}
