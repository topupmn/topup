import { PricingOverview } from "@/components/admin/pricing-overview";

export const dynamic = "force-dynamic";

export default function AdminPricingPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Ханш ба үнэ</h1>
      <p className="text-muted-foreground mt-1">
        USD ханш, нэмэгдэл хувь, MNT үнийн тооцоолол
      </p>
      <PricingOverview />
    </div>
  );
}
