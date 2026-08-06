import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("Product")
    .select("*")
    .eq("active", true)
    .order("createdAt", { ascending: true });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const emoji = typeof body.emoji === "string" ? body.emoji : "📦";
  const priceCents = Number(body.priceCents);
  const stock = Number(body.stock);

  if (!name) {
    return NextResponse.json({ message: "Escreva o nome do produto." }, { status: 400 });
  }
  if (!Number.isInteger(priceCents) || priceCents < 1) {
    return NextResponse.json(
      { message: "O preço deve ser um número inteiro em centavos." },
      { status: 400 },
    );
  }
  if (!Number.isInteger(stock) || stock < 0) {
    return NextResponse.json({ message: "Informe o estoque." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("Product")
    .insert({ name, emoji, priceCents, stock })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
