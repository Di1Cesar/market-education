import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

async function existeProduto(id: string) {
  const { data } = await supabase.from("Product").select("id").eq("id", id).maybeSingle();
  return Boolean(data);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!(await existeProduto(id))) {
    return NextResponse.json({ message: "Produto não encontrado." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const dados: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ message: "Escreva o nome do produto." }, { status: 400 });
    }
    dados.name = name;
  }
  if (body.emoji !== undefined) {
    dados.emoji = String(body.emoji);
  }
  if (body.priceCents !== undefined) {
    const priceCents = Number(body.priceCents);
    if (!Number.isInteger(priceCents) || priceCents < 1) {
      return NextResponse.json(
        { message: "O preço deve ser um número inteiro em centavos." },
        { status: 400 },
      );
    }
    dados.priceCents = priceCents;
  }
  if (body.stock !== undefined) {
    const stock = Number(body.stock);
    if (!Number.isInteger(stock) || stock < 0) {
      return NextResponse.json({ message: "Informe o estoque." }, { status: 400 });
    }
    dados.stock = stock;
  }
  if (body.active !== undefined) {
    dados.active = Boolean(body.active);
  }

  const { data, error } = await supabase
    .from("Product")
    .update(dados)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!(await existeProduto(id))) {
    return NextResponse.json({ message: "Produto não encontrado." }, { status: 404 });
  }

  const { error } = await supabase.from("Product").update({ active: false }).eq("id", id);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
