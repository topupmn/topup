"use client";

import { useIsMobile } from "@/hooks/use-is-mobile";
import { Button } from "@/components/ui/button";

export interface QPayBankLink {
  name: string;
  link: string;
  description?: string;
  logo?: string;
}

interface QPayPaymentProps {
  qrImage: string;
  bankUrls?: QPayBankLink[];
  amountMnt: number;
  checkingTransaction?: boolean;
  onCheckTransaction?: () => void;
}

export function QPayPayment({
  qrImage,
  bankUrls = [],
  amountMnt,
  checkingTransaction = false,
  onCheckTransaction,
}: QPayPaymentProps) {
  const isMobile = useIsMobile();

  return (
    <div className="mt-8 px-2">
      <div className="text-center">
        <p className={`font-medium ${isMobile ? "mb-1" : "mb-4"}`}>QPay-ээр төлөх</p>
        {isMobile && (
          <p className="text-sm text-muted-foreground mb-4">
            QR код уншуулах эсвэл банкаа сонгоно уу
          </p>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/png;base64,${qrImage}`}
          alt="QPay QR код"
          className="mx-auto w-full max-w-[280px] sm:max-w-xs aspect-square object-contain rounded-lg border border-border bg-white p-2"
        />
        {onCheckTransaction && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCheckTransaction}
            disabled={checkingTransaction}
            className="mt-4 w-full max-w-[280px] sm:max-w-xs"
          >
            {checkingTransaction ? "Шалгаж байна..." : "Төлбөр шалгах"}
          </Button>
        )}
      </div>

      {isMobile && bankUrls.length > 0 && (
        <div className="mt-8">
          <p className="text-sm font-medium text-center mb-3">
            Эсвэл банкаа сонгоод шууд төлөх
          </p>
          <div className="grid gap-2">
            {bankUrls.map((bank) => (
              <a
                key={bank.name}
                href={bank.link}
                referrerPolicy="no-referrer"
                className="flex min-h-12 items-center justify-center rounded-lg border border-border bg-white px-4 py-3 text-sm font-medium hover:bg-accent transition-colors active:scale-[0.98]"
              >
                {bank.description ?? bank.name}
              </a>
            ))}
          </div>
          <p className="mt-3 text-xs text-center text-muted-foreground">
            Төлбөр: ₮{amountMnt.toLocaleString("mn-MN")}
          </p>
        </div>
      )}
    </div>
  );
}
