import { UiShowcase } from "@/app/dev/ui/showcase";
import { notFound } from "next/navigation";

export const metadata = {
  title: "UI Showcase",
  robots: { index: false, follow: false },
};

/** Dev-only component gallery. Hidden in production. */
export default function DevUiPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <UiShowcase />;
}
