import { DiscountCodeForm } from "@/components/admin/discount-code-form";
import { ToggleDiscountCodeButton } from "@/components/admin/toggle-discount-code-button";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDiscountCodesPage() {
  const codes = await prisma.discountCode.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Хөнгөлөлтийн кодууд</h1>
      <p className="text-muted-foreground mt-1">
        Худалдан авалтын QPay төлбөр дээр хэрэгжих хувийн хөнгөлөлт
      </p>

      <div className="mt-8">
        <DiscountCodeForm />
      </div>

      <div className="mt-8 rounded-xl border border-border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Код</th>
                <th className="px-4 py-3 font-medium">Хөнгөлөлт</th>
                <th className="px-4 py-3 font-medium">Төлөв</th>
                <th className="px-4 py-3 font-medium">Үүссэн</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {codes.map((code) => (
                <tr key={code.id} className="border-t border-border">
                  <td className="px-4 py-3 font-mono font-medium">
                    {code.code}
                  </td>
                  <td className="px-4 py-3">{code.discountPercent}%</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        code.isActive ? "text-success" : "text-muted-foreground"
                      }
                    >
                      {code.isActive ? "Идэвхтэй" : "Идэвхгүй"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(code.createdAt).toLocaleString("mn-MN")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ToggleDiscountCodeButton
                      codeId={code.id}
                      isActive={code.isActive}
                    />
                  </td>
                </tr>
              ))}
              {codes.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Хөнгөлөлтийн код байхгүй байна
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

