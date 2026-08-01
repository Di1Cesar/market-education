import type { Produto, Cupom } from "./tipos";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function json<T>(res: Response): Promise<T> {
  const dados = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (dados as { message?: string | string[] }).message;
    throw new Error(Array.isArray(msg) ? msg[0] : msg ?? "Algo deu errado.");
  }
  return dados as T;
}

export const api = {
  listarProdutos: () =>
    fetch(`${BASE}/produtos`, { cache: "no-store" }).then((r) => json<Produto[]>(r)),

  criarProduto: (dados: { name: string; emoji: string; priceCents: number; stock: number }) =>
    fetch(`${BASE}/produtos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    }).then((r) => json<Produto>(r)),

  atualizarProduto: (
    id: string,
    dados: Partial<{ name: string; emoji: string; priceCents: number; stock: number }>,
  ) =>
    fetch(`${BASE}/produtos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    }).then((r) => json<Produto>(r)),

  removerProduto: (id: string) =>
    fetch(`${BASE}/produtos/${id}`, { method: "DELETE" }).then((r) => json<{ ok: boolean }>(r)),

  listarCupons: () =>
    fetch(`${BASE}/vendas`, { cache: "no-store" }).then((r) => json<Cupom[]>(r)),

  finalizarVenda: (dados: {
    items: { productId: string; quantity: number }[];
    paidCents: number;
  }) =>
    fetch(`${BASE}/vendas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    }).then((r) => json<Cupom>(r)),
};
