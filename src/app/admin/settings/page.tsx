import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({ title: "Settings" });

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Store and site configuration." />
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="video">Video</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="grid gap-2">
                <Label htmlFor="store-name">Store name</Label>
                <Input id="store-name" defaultValue={siteConfig.name} className="max-w-sm" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="support-email">Support email</Label>
                <Input id="support-email" defaultValue={siteConfig.supportEmail} className="max-w-sm" />
              </div>
              <Label className="font-normal">
                <Switch defaultChecked />
                Show cookie banner to new visitors
              </Label>
              <Button size="sm">Save changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardContent className="space-y-4 pt-6 text-sm text-muted-foreground">
              Stripe keys, currency and VAT settings. (Scaffold placeholder.)
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="video">
          <Card>
            <CardContent className="space-y-4 pt-6 text-sm text-muted-foreground">
              Video provider, signed-URL TTL, concurrent device limit and download limits.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardContent className="space-y-4 pt-6 text-sm text-muted-foreground">
              Default meta title/description, OpenGraph image and analytics IDs.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
