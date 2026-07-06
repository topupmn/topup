import { prisma } from "@/lib/prisma";
import { formatMnt } from "@/lib/utils";
import { ToggleProductButton } from "@/components/admin/toggle-product-button";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: [{ brand: "asc" }, { priceMnt: "asc" }],
  });

  const active = products.filter((p) => p.isActive).length;

  return (
    <div>
      <h1 className="text-2xl font-bold">Бүтээгдэхүүн</h1>
      <p className="text-muted-foreground mt-1">
        {active} идэвхтэй / {products.length} нийт · Sync:{" "}
        <code className="text-xs bg-muted px-1 py-0.5 rounded">
          npm run reloadly:sync
        </code>
      </p>

      <div className="mt-8 rounded-xl border border-border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Нэр</th>
                <th className="px-4 py-3 font-medium">Брэнд</th>
                <th className="px-4 py-3 font-medium">Reloadly ID</th>
                <th className="px-4 py-3 font-medium">USD</th>
                <th className="px-4 py-3 font-medium">Үнэ</th>
                <th className="px-4 py-3 font-medium">Төлөв</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{product.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {product.brand}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {product.reloadlyId}
                  </td>
                  <td className="px-4 py-3">${product.denominationUsd}</td>
                  <td className="px-4 py-3">{formatMnt(product.priceMnt)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        product.isActive ? "text-success" : "text-muted-foreground"
                      }
                    >
                      {product.isActive ? "Идэвхтэй" : "Идэвхгүй"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ToggleProductButton
                      productId={product.id}
                      isActive={product.isActive}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
