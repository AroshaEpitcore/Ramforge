"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { manualGrantAccess, revokeGrant } from "@/features/admin/access-actions";
import { formatDate } from "@/lib/formatters";
import type { AccessGrantRow } from "@/server/queries/admin-ops";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Opt = { id: string; title: string };

export function AccessManager({
  grants,
  courses,
  videos,
}: {
  grants: AccessGrantRow[];
  courses: Opt[];
  videos: Opt[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [kind, setKind] = useState<"course" | "video">("course");
  const [itemId, setItemId] = useState("");
  const [granting, setGranting] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const options = kind === "course" ? courses : videos;

  const grant = async () => {
    if (!email || !itemId) {
      toast.error("Enter an email and choose an item.");
      return;
    }
    setGranting(true);
    const res = await manualGrantAccess({
      email,
      ...(kind === "course" ? { courseId: itemId } : { videoId: itemId }),
    });
    setGranting(false);
    if (!res.ok) {
      toast.error("Could not grant access", { description: res.error });
      return;
    }
    toast.success("Access granted");
    setEmail("");
    setItemId("");
    router.refresh();
  };

  const revoke = async (id: string) => {
    setBusy(id);
    const res = await revokeGrant(id);
    setBusy(null);
    if (!res.ok) toast.error("Could not revoke", { description: res.error });
    else {
      toast.success("Access revoked");
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Grant access</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-[1fr_140px_1fr_auto] sm:items-end">
          <div className="grid gap-1.5">
            <Label htmlFor="g-email">Customer email</Label>
            <Input
              id="g-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Type</Label>
            <Select
              value={kind}
              onValueChange={(v) => {
                setKind(v as "course" | "video");
                setItemId("");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="course">Course</SelectItem>
                <SelectItem value="video">Video</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>{kind === "course" ? "Course" : "Video"}</Label>
            <Select value={itemId} onValueChange={setItemId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose…" />
              </SelectTrigger>
              <SelectContent>
                {options.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={grant} loading={granting}>
            Grant
          </Button>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Granted</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No access grants yet.
                </TableCell>
              </TableRow>
            ) : (
              grants.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="text-muted-foreground">{g.userEmail}</TableCell>
                  <TableCell className="font-medium">{g.item}</TableCell>
                  <TableCell>{g.kind}</TableCell>
                  <TableCell>{g.manual ? "Manual" : "Purchase"}</TableCell>
                  <TableCell>
                    {g.revoked ? (
                      <Badge variant="destructive">Revoked</Badge>
                    ) : (
                      <Badge variant="success">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(g.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    {!g.revoked && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        loading={busy === g.id}
                        onClick={() => revoke(g.id)}
                      >
                        Revoke
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
