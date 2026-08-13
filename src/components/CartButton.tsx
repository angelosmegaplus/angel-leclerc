import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { useCartUi } from "@/components/CartDrawer";

export function CartButton({ className = "" }: { className?: string }) {
  const items = useCartStore((s) => s.items);
  const setOpen = useCartUi((s) => s.setOpen);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <button
      onClick={() => setOpen(true)}
      aria-label={`Ouvrir le panier (${count} article${count > 1 ? "s" : ""})`}
      className={`relative text-muted-foreground transition-colors hover:text-foreground ${className}`}
    >
      <ShoppingBag size={20} />
      {count > 0 && (
        <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {count}
        </span>
      )}
    </button>
  );
}
