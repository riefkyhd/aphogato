import { QUOTATION_PAGE_WIDTH_PX } from "@/lib/quotations/quotationPage";
import { cn } from "@/lib/utils";

export function QuotationPageFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("mx-auto w-full max-w-full shrink-0 shadow-sm", className)}
      style={{
        width: `${QUOTATION_PAGE_WIDTH_PX}px`,
        maxWidth: "100%",
      }}
    >
      {children}
    </div>
  );
}
