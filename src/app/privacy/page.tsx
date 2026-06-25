export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold">Нууцлалын бодлого</h1>
      <div className="mt-8 space-y-4 text-muted-foreground">
        <p>
          topup.mn таны хувийн мэдээллийг хамгаалахад анхаардаг.
        </p>
        <h2 className="text-lg font-semibold text-foreground">
          1. Цуглуулдаг мэдээлэл
        </h2>
        <p>
          Бүртгэл үүсгэхэд нэр, имэйл, утасны дугаар (заавал биш) цуглуулна.
          Захиалгын түүх, төлбөрийн мэдээллийг хадгална.
        </p>
        <h2 className="text-lg font-semibold text-foreground">
          2. Мэдээллийг ашиглах
        </h2>
        <p>
          Таны мэдээллийг зөвхөн захиалга боловсруулах, картын код хүргэх,
          дэмжлэг үзүүлэх зорилгоор ашиглана.
        </p>
        <h2 className="text-lg font-semibold text-foreground">
          3. Аюулгүй байдал
        </h2>
        <p>
          Нууц үгийг шифрлэн хадгална. Төлбөрийг QPay-ээр боловсруулна, бид
          таны банкны мэдээллийг хадгалдаггүй.
        </p>
      </div>
    </div>
  );
}
