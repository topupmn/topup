import Link from "next/link";
import { PricingSettingsForm } from "@/components/admin/pricing-settings-form";
import { prisma } from "@/lib/prisma";
import { formatMnt } from "@/lib/utils";
import {
  calculatePriceMnt,
  formatRatePerUsd,
  getPriceBreakdown,
} from "@/lib/pricing";
import { getPricingConfig } from "@/lib/site-settings";

export async function PricingOverview({ compact = false }: { compact?: boolean }) {
  const config = await getPricingConfig();
  const effectiveRate =
    config.mntUsdRate * (1 + config.markupPercent / 100);

  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ brand: "asc" }, { denominationUsd: "asc" }],
    take: compact ? 0 : undefined,
  });

  const examples = [5, 10, 25, 50].map((usd) => getPriceBreakdown(usd, config));

  return (
    <section className={compact ? "" : "mt-10"}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Ханш ба үнэ тооцоолол</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            MNT үнэ хэрхэн тооцогдож, дэлгүүрт хэрхэн харагдах
          </p>
        </div>
        {compact && (
          <Link href="/admin/pricing" className="text-sm underline shrink-0">
            Дэлгэрэнгүй
          </Link>
        )}
      </div>

      {!compact && (
        <PricingSettingsForm
          mntUsdRate={config.mntUsdRate}
          markupPercent={config.markupPercent}
        />
      )}

      <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${compact ? "" : "mt-6"}`}>
        <ConfigCard
          label="USD ханш (суурь)"
          value={formatRatePerUsd(config.mntUsdRate)}
          hint="1 USD = суурь ханш"
        />
        <ConfigCard
          label="Нэмэгдэл хувь"
          value={`${config.markupPercent}%`}
          hint="Ашгийн нэмэгдэл"
        />
        <ConfigCard
          label="Хэрэглэгчийн ханш"
          value={formatRatePerUsd(effectiveRate)}
          hint="Суурь + нэмэгдэл (₮500 дугуйлалт өмнө)"
        />
        <ConfigCard
          label="Дугуйлалт"
          value={`₮${config.roundToMnt.toLocaleString("mn-MN")}`}
          hint="Дээш тоймхойлно (жишээ нь 36,750 → 37,000)"
        />
      </div>

      <div className="mt-4 rounded-xl border border-border bg-white p-5">
        <h3 className="font-medium text-sm">Томъёо</h3>
        <p className="mt-2 text-sm text-muted-foreground font-mono">
          priceMnt = ceil( USD × {config.mntUsdRate} × (1 +{" "}
          {config.markupPercent / 100}) / {config.roundToMnt} ) ×{" "}
          {config.roundToMnt}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Дэлгүүрт хэрэглэгч{" "}
          <span className="text-foreground font-medium">$10 USD</span> гэж харж,{" "}
          <span className="text-foreground font-medium">
            {formatMnt(calculatePriceMnt(10, config))}
          </span>{" "}
          төлнө. Захиалга, QPay QR дээр мөн адил MNT дүн гарна.
        </p>
      </div>

      {!compact && (
        <>
          <div className="mt-6 rounded-xl border border-border bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30">
              <h3 className="font-medium text-sm">Жишээ тооцоолол</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">USD</th>
                    <th className="px-4 py-3 font-medium">Суурь MNT</th>
                    <th className="px-4 py-3 font-medium">
                      Нэмэгдэл ({config.markupPercent}%)
                    </th>
                    <th className="px-4 py-3 font-medium">Дугуйлалт</th>
                    <th className="px-4 py-3 font-medium">Эцсийн үнэ</th>
                    <th className="px-4 py-3 font-medium">Ханш / USD</th>
                  </tr>
                </thead>
                <tbody>
                  {examples.map((row) => (
                    <tr key={row.denominationUsd} className="border-t border-border">
                      <td className="px-4 py-3 font-medium">
                        ${row.denominationUsd}
                      </td>
                      <td className="px-4 py-3">{formatMnt(row.baseMnt)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        +{formatMnt(Math.round(row.markupMntBeforeRound))}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.roundingMnt > 0
                          ? `+${formatMnt(Math.ceil(row.roundingMnt))}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {formatMnt(row.priceMnt)}
                      </td>
                      <td className="px-4 py-3">
                        {formatRatePerUsd(row.effectiveRatePerUsd)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-medium text-sm">Идэвхтэй бүтээгдэхүүн (DB)</h3>
              <p className="text-xs text-muted-foreground">
                Reloadly-аас шинэ бүтээгдэхүүн татах:{" "}
                <code className="bg-muted px-1 py-0.5 rounded">
                  npm run reloadly:sync
                </code>
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Бүтээгдэхүүн</th>
                    <th className="px-4 py-3 font-medium">Дэлгүүрт (USD)</th>
                    <th className="px-4 py-3 font-medium">Тооцоолсон</th>
                    <th className="px-4 py-3 font-medium">DB үнэ</th>
                    <th className="px-4 py-3 font-medium">Зөрүү</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const expected = calculatePriceMnt(
                      product.denominationUsd,
                      config
                    );
                    const diff = product.priceMnt - expected;
                    return (
                      <tr key={product.id} className="border-t border-border">
                        <td className="px-4 py-3 font-medium">
                          {product.name}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          ${product.denominationUsd} →{" "}
                          <span className="text-foreground font-medium">
                            {formatMnt(product.priceMnt)}
                          </span>
                        </td>
                        <td className="px-4 py-3">{formatMnt(expected)}</td>
                        <td className="px-4 py-3">{formatMnt(product.priceMnt)}</td>
                        <td className="px-4 py-3">
                          {diff === 0 ? (
                            <span className="text-success">Таарна</span>
                          ) : (
                            <span className="text-amber-700">
                              {diff > 0 ? "+" : ""}
                              {formatMnt(diff)} (шинэчлэх)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function ConfigCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-xs text-muted-foreground mt-2">{hint}</p>
    </div>
  );
}
