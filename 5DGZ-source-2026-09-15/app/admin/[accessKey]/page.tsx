import { env } from "cloudflare:workers";
import { notFound } from "next/navigation";
import AdminClient from "./AdminClient";

export default async function AdminPage({ params }: { params: Promise<{ accessKey: string }> }) {
  const { accessKey } = await params;
  const runtime = env as unknown as { ADMIN_ACCESS_KEY?: string };

  if (!runtime.ADMIN_ACCESS_KEY || accessKey !== runtime.ADMIN_ACCESS_KEY) notFound();

  return <AdminClient adminToken={accessKey} />;
}
