import { PageHeader } from "@/components/layout/page-header";
import { ProfileForm } from "@/features/auth/components/profile-form";
import { buildMetadata } from "@/lib/seo";
import { getCurrentUser } from "@/server/current-user";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = buildMetadata({ title: "Profile" });

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/account/profile");

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Update your personal information." />
      <ProfileForm initial={{ name: user.name, email: user.email, image: user.image }} />
    </div>
  );
}
