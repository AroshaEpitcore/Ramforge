"use client";

import { ThemeToggle } from "@/components/shared/theme-toggle";
import { VideoCard } from "@/components/shared/video-card";
import { BundleCard } from "@/components/shared/bundle-card";
import { CategoryChip } from "@/components/shared/category-chip";
import { LibraryItem } from "@/components/shared/library-item";
import { CartItem } from "@/components/shared/cart-item";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { UploadDemo } from "@/features/admin/components/upload-demo";
import { OrdersTable } from "@/features/admin/components/orders-table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/combobox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Duration } from "@/components/ui/duration";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { PasswordInput } from "@/components/ui/password-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Price } from "@/components/ui/price";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Rating } from "@/components/ui/rating";
import { SearchInput } from "@/components/ui/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Spinner } from "@/components/ui/spinner";
import { StatCard } from "@/components/ui/stat-card";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { mockBundles, mockCartLines, mockCategories, mockLibrary, mockVideos } from "@/mocks";
import { Download, Info, Rocket, Sparkles, Star, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="scroll-mt-20 space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      <div className="rounded-xl border bg-card p-5">{children}</div>
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

export function UiShowcase() {
  const [rating, setRating] = useState(3);
  const [combo, setCombo] = useState("");

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/80 px-6 py-4 backdrop-blur">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">UI Showcase</h1>
          <p className="text-sm text-muted-foreground">Every component and variant · light &amp; dark</p>
        </div>
        <ThemeToggle />
      </header>

      <div className="mx-auto max-w-5xl space-y-10 p-6">
        <Section title="Button">
          <div className="space-y-4">
            <Row>
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="success">Success</Button>
            </Row>
            <Row>
              <Button size="xs">XS</Button>
              <Button size="sm">SM</Button>
              <Button size="md">MD</Button>
              <Button size="lg">LG</Button>
              <Button size="icon" aria-label="Star">
                <Star />
              </Button>
            </Row>
            <Row>
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
              <Button leftIcon={<Rocket />}>Left icon</Button>
              <Button rightIcon={<Download />}>Right icon</Button>
            </Row>
            <Button fullWidth>Full width</Button>
          </div>
        </Section>

        <Section title="Badge">
          <Row>
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="muted">Muted</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="sale">Sale</Badge>
            <Badge variant="new">New</Badge>
            <Badge variant="4k">4K</Badge>
            <Badge variant="hd">HD</Badge>
            <Badge variant="rented">Rented</Badge>
            <Badge variant="owned">Owned</Badge>
          </Row>
        </Section>

        <Section title="Inputs">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Text input</Label>
              <Input placeholder="Type here…" />
            </div>
            <div className="grid gap-2">
              <Label>Search</Label>
              <SearchInput placeholder="Search…" />
            </div>
            <div className="grid gap-2">
              <Label>Password</Label>
              <PasswordInput placeholder="••••••••" />
            </div>
            <div className="grid gap-2">
              <Label>Disabled</Label>
              <Input placeholder="Disabled" disabled />
            </div>
            <div className="grid gap-2">
              <Label>Invalid</Label>
              <Input placeholder="Invalid" aria-invalid />
            </div>
            <div className="grid gap-2">
              <Label>Select</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Pick one" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a">Option A</SelectItem>
                  <SelectItem value="b">Option B</SelectItem>
                  <SelectItem value="c">Option C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Combobox</Label>
              <Combobox
                value={combo}
                onChange={setCombo}
                options={mockCategories.map((c) => ({ value: c.slug, label: c.name }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>OTP</Label>
              <InputOTP maxLength={6}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>
        </Section>

        <Section title="Selection controls">
          <div className="flex flex-wrap items-start gap-8">
            <Label className="font-normal">
              <Checkbox defaultChecked /> Checkbox
            </Label>
            <RadioGroup defaultValue="1" className="gap-2">
              <Label className="font-normal">
                <RadioGroupItem value="1" /> Option one
              </Label>
              <Label className="font-normal">
                <RadioGroupItem value="2" /> Option two
              </Label>
            </RadioGroup>
            <Label className="font-normal">
              <Switch defaultChecked /> Switch
            </Label>
            <div className="w-48">
              <Slider defaultValue={[40]} />
            </div>
          </div>
        </Section>

        <Section title="Cards & stats">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Card title</CardTitle>
                <CardDescription>Card description text.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">Card body content.</CardContent>
            </Card>
            <StatCard label="Revenue" value="$48.2k" delta={12.4} icon={<TrendingUp />} />
            <StatCard label="Refunds" value="2.1%" delta={-0.4} icon={<Sparkles />} />
          </div>
        </Section>

        <Section title="Alerts">
          <div className="space-y-3">
            <Alert variant="info">
              <Info />
              <AlertTitle>Heads up</AlertTitle>
              <AlertDescription>This is an informational callout.</AlertDescription>
            </Alert>
            <Alert variant="success">
              <Info />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>Your changes were saved.</AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <Info />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Something needs your attention.</AlertDescription>
            </Alert>
          </div>
        </Section>

        <Section title="Overlays">
          <Row>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Tooltip</Button>
              </TooltipTrigger>
              <TooltipContent>Helpful hint</TooltipContent>
            </Tooltip>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">Popover</Button>
              </PopoverTrigger>
              <PopoverContent>Popover content with details.</PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Dropdown</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Menu</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Item one</DropdownMenuItem>
                <DropdownMenuItem>Item two</DropdownMenuItem>
                <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dialog title</DialogTitle>
                  <DialogDescription>A modal dialog built on Radix.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                  </DialogClose>
                  <Button>Confirm</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">Alert dialog</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Sheet</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Sheet</SheetTitle>
                  <SheetDescription>Slide-over panel.</SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>

            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline">Drawer</Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Drawer</DrawerTitle>
                  <DrawerDescription>Bottom drawer (vaul).</DrawerDescription>
                </DrawerHeader>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button variant="outline">Close</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>

            <Button variant="outline" onClick={() => toast.success("Toast fired!")}>
              Toast
            </Button>
          </Row>
        </Section>

        <Section title="Tabs & Accordion">
          <div className="grid gap-6 lg:grid-cols-2">
            <Tabs defaultValue="one">
              <TabsList>
                <TabsTrigger value="one">One</TabsTrigger>
                <TabsTrigger value="two">Two</TabsTrigger>
                <TabsTrigger value="three">Three</TabsTrigger>
              </TabsList>
              <TabsContent value="one" className="text-sm text-muted-foreground">
                First tab panel.
              </TabsContent>
              <TabsContent value="two" className="text-sm text-muted-foreground">
                Second tab panel.
              </TabsContent>
              <TabsContent value="three" className="text-sm text-muted-foreground">
                Third tab panel.
              </TabsContent>
            </Tabs>
            <Accordion type="single" collapsible className="rounded-lg border px-4">
              <AccordionItem value="a">
                <AccordionTrigger>Section one</AccordionTrigger>
                <AccordionContent>Content for section one.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="b">
                <AccordionTrigger>Section two</AccordionTrigger>
                <AccordionContent>Content for section two.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </Section>

        <Section title="Navigation">
          <div className="space-y-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="#">Shop</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Video</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">1</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>
                    2
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">3</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </Section>

        <Section title="Table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Video</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockVideos.slice(0, 3).map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.title}</TableCell>
                  <TableCell>{v.quality}</TableCell>
                  <TableCell className="text-right">
                    <Price price={v.price} salePrice={v.salePrice} size="sm" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>

        <Section title="Data table">
          <OrdersTable pageSize={5} />
        </Section>

        <Section title="Display">
          <div className="flex flex-wrap items-center gap-8">
            <Avatar>
              <AvatarFallback>RF</AvatarFallback>
            </Avatar>
            <div className="w-40 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="w-40">
              <Progress value={62} />
            </div>
            <Spinner className="size-5 text-primary" />
            <div className="flex flex-col items-start gap-1">
              <Rating value={rating} onChange={setRating} />
              <Rating value={4.5} readOnly size="sm" />
            </div>
            <Price price={4900} salePrice={3900} showDiscountBadge />
            <Duration seconds={3725} withIcon />
            <span className="flex items-center gap-1">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </span>
          </div>
        </Section>

        <Section title="Command">
          <Command className="rounded-lg border">
            <CommandInput placeholder="Type a command…" />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Suggestions">
                <CommandItem>Browse shop</CommandItem>
                <CommandItem>My library</CommandItem>
                <CommandItem>Settings</CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </Section>

        <Section title="Empty state">
          <EmptyState
            icon={<Sparkles />}
            title="Nothing here yet"
            description="This is how an empty list looks."
            action={<Button size="sm">Create one</Button>}
          />
        </Section>

        <Section title="Carousel">
          <Carousel className="mx-auto w-full max-w-sm" opts={{ loop: true }}>
            <CarouselContent>
              {[1, 2, 3, 4].map((n) => (
                <CarouselItem key={n} className="basis-1/2">
                  <div className="flex aspect-square items-center justify-center rounded-lg border bg-muted text-2xl font-semibold">
                    {n}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </Section>

        <Section title="File upload">
          <UploadDemo />
        </Section>

        <Section title="Domain components">
          <div className="space-y-6">
            <Row>
              {mockCategories.slice(0, 5).map((c, i) => (
                <CategoryChip key={c.id} category={c} active={i === 0} showCount />
              ))}
            </Row>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <VideoCard video={mockVideos[0]} />
              <BundleCard bundle={mockBundles[0]} />
              <div className="space-y-3">
                <CartItem line={mockCartLines[0]} onRemove={() => {}} />
              </div>
            </div>
            <LibraryItem entry={mockLibrary[0]} />
          </div>
        </Section>

        <Section title="Motion">
          <FadeIn>
            <p className="mb-3 text-sm text-muted-foreground">This block faded in on mount.</p>
          </FadeIn>
          <Stagger className="flex gap-3">
            {[1, 2, 3, 4].map((n) => (
              <StaggerItem key={n}>
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary/15 font-semibold text-primary">
                  {n}
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </Section>
      </div>
    </div>
  );
}
