import { cartCount } from "@/lib/cart";

export async function CartCount() {
  const n = await cartCount();
  return <span>{n}</span>;
}
