import { getBrandsWithImages } from "@/lib/brands";
import { BrandCard } from "@/components/products/brand-card";
import { ButtonLink } from "@/components/ui/button";

export default async function HomePage() {
  const brands = await getBrandsWithImages();

  return (
    <div>
      <section className="mx-auto max-w-5xl px-4 py-12 sm:py-20 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Тоглоомын карт
          <br />
          <span className="text-primary">хурдан, хялбар</span>
        </h1>
        <p className="mx-auto mt-4 sm:mt-6 max-w-xl text-base sm:text-lg text-muted-foreground px-2">
          Steam, Roblox, PUBG Mobile, PUBG New State, Minecraft, Nintendo,
          Xbox, PlayStation зэрэг тоглоомын платформын карт QPay-ээр төлж, шууд кодоо
          аваарай.
        </p>
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4 sm:px-0">
          <ButtonLink href="/products" className="px-8">
            Карт худалдан авах
          </ButtonLink>
          <ButtonLink href="/register" variant="secondary" className="px-8">
            Бүртгүүлэх
          </ButtonLink>
        </div>
      </section>

      <section className="border-t border-border bg-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
          <h2 className="text-xl sm:text-2xl font-semibold text-center mb-8 sm:mb-10">
            Дэмжигдсэн платформууд
          </h2>
          <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-3">
            {brands.map((brand) => (
              <BrandCard key={brand.id} brand={brand} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <h2 className="text-xl sm:text-2xl font-semibold text-center mb-8 sm:mb-10">
          Хэрхэн ажилладаг вэ?
        </h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Бүртгүүлэх",
              desc: "Бүртгэл үүсгээд нэвтэрнэ үү",
            },
            {
              step: "2",
              title: "QPay-ээр төлөх",
              desc: "QR кодыг банкны аппаар уншуулна",
            },
            {
              step: "3",
              title: "Код авах",
              desc: "Төлбөр баталгаажмагц код шууд ирнэ",
            },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold shadow-sm">
                {item.step}
              </div>
              <h3 className="mt-4 font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
