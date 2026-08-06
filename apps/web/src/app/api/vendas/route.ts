import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("Sale")
    .select("*, items:SaleItem(*)")
    .order("createdAt", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const items = Array.isArray(body.items) ? body.items : [];
  const paidCents = Number(body.paidCents);

  const itens = items.filter(
    (i: unknown): i is { productId: string; quantity: number } =>
      typeof i === "object" &&
      i !== null &&
      typeof (i as { productId?: unknown }).productId === "string" &&
      Number.isInteger((i as { quantity?: unknown }).quantity) &&
      (i as { quantity: number }).quantity >= 1,
  );

  if (itens.length === 0) {
    return NextResponse.json({ message: "O carrinho está vazio." }, { status: 400 });
  }
  if (!Number.isInteger(paidCents) || paidCents < 0) {
    return NextResponse.json({ message: "Valor pago inválido." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("finalizar_venda", {
    itens,
    paid_cents: paidCents,
  });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
  return NextResponse.json(data);
}
