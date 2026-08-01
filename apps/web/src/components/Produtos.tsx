"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { C, FF, R$, CATEGORIAS_EMOJI } from "@/lib/design";
import type { Produto } from "@/lib/tipos";
import { Aviso, Bloco, Btn, PrecoTag, useBip } from "./ui";

const FORM_VAZIO = { nome: "", emoji: "🍎", preco: "", estoque: "", catEmoji: "alimento" };

export function Produtos({
  produtos,
  onProdutosMudou,
  som,
}: {
  produtos: Produto[];
  onProdutosMudou: (produtos: Produto[]) => void;
  som: boolean;
}) {
  const bip = useBip(som);
  const [form, setForm] = useState(FORM_VAZIO);
  const [editId, setEditId] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    const nome = form.nome.trim().toUpperCase();
    const preco = Math.round(parseFloat(String(form.preco).replace(",", ".")) * 100);
    const est = parseInt(form.estoque, 10);
    if (!nome) return setAviso("ESCREVA O NOME DO PRODUTO.");
    if (!(preco > 0)) return setAviso("INFORME O PREÇO.");
    if (!(est >= 0)) return setAviso("INFORME O ESTOQUE.");
    setAviso("");
    setSalvando(true);
    try {
      if (editId) {
        const atualizado = await api.atualizarProduto(editId, {
          name: nome,
          emoji: form.emoji,
          priceCents: preco,
          stock: est,
        });
        onProdutosMudou(produtos.map((p) => (p.id === editId ? atualizado : p)));
        setEditId(null);
      } else {
        const novo = await api.criarProduto({ name: nome, emoji: form.emoji, priceCents: preco, stock: est });
        onProdutosMudou([...produtos, novo]);
      }
      setForm(FORM_VAZIO);
    } catch (e) {
      setAviso((e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  async function remover(id: string) {
    await api.removerProduto(id);
    onProdutosMudou(produtos.filter((p) => p.id !== id));
  }

  const catAtiva = CATEGORIAS_EMOJI.find((c) => c.id === (form.catEmoji || "alimento"));

  return (
    <div style={{ display: "grid", gap: 20, gridTemplateColumns: "320px 1fr" }}>
      <Bloco style={{ padding: 24, alignSelf: "start" }}>
        <div style={{ fontFamily: FF, fontSize: 18, color: C.tinta, letterSpacing: "0.06em", marginBottom: 20 }}>
          {editId ? "EDITAR PRODUTO" : "NOVO PRODUTO"}
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          <label style={{ display: "block", minWidth: 0 }}>
            <span style={{ fontFamily: FF, fontSize: 13, color: C.suave, letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
              NOME DO PRODUTO
            </span>
            <input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="MAÇÃ"
              style={{ display: "block", width: "100%", padding: "12px 14px", borderRadius: 10, border: `2px solid ${C.linha}`, fontFamily: FF, fontSize: 16, letterSpacing: "0.04em", color: C.tinta, outline: "none", boxSizing: "border-box" }}
            />
          </label>

          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <span style={{ fontFamily: FF, fontSize: 13, color: C.suave, letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
              DESENHO
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 4, marginBottom: 6 }}>
              {CATEGORIAS_EMOJI.map((cat) => {
                const ativa = (form.catEmoji || "alimento") === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setForm({ ...form, catEmoji: cat.id })}
                    style={{ padding: "6px 2px", borderRadius: 8, border: `2px solid ${ativa ? C.verde : C.linha}`, background: ativa ? "#D6F5E3" : "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}
                  >
                    <span style={{ fontSize: 18, lineHeight: 1 }}>{cat.icone}</span>
                    <span style={{ fontFamily: FF, fontSize: 9, letterSpacing: "0.04em", color: ativa ? C.verdeEsc : C.suave }}>
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(36px,1fr))", gap: 4, padding: 8, borderRadius: 10, border: `2px solid ${C.linha}`, background: C.bg, minWidth: 0 }}>
              {(catAtiva?.emojis ?? []).map((e) => (
                <button
                  key={e}
                  onClick={() => setForm({ ...form, emoji: e })}
                  style={{ aspectRatio: "1", borderRadius: 6, border: form.emoji === e ? `2px solid ${C.verde}` : "2px solid transparent", background: form.emoji === e ? C.amarelo : "transparent", fontSize: 20, cursor: "pointer", transition: "background .1s", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  {e}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 28, lineHeight: 1 }}>{form.emoji}</span>
              <span style={{ fontFamily: FF, fontSize: 12, color: C.suave, letterSpacing: "0.06em" }}>ÍCONE SELECIONADO</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, minWidth: 0 }}>
            {([["PREÇO (R$)", "preco", "decimal", "3,50"], ["ESTOQUE", "estoque", "numeric", "10"]] as const).map(
              ([l, k, m, ph]) => (
                <label key={k} style={{ display: "block", minWidth: 0 }}>
                  <span style={{ fontFamily: FF, fontSize: 13, color: C.suave, letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
                    {l}
                  </span>
                  <input
                    value={form[k]}
                    inputMode={m}
                    placeholder={ph}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                    style={{ display: "block", width: "100%", padding: "12px 14px", borderRadius: 10, border: `2px solid ${C.linha}`, fontFamily: FF, fontSize: 16, letterSpacing: "0.04em", color: C.tinta, outline: "none", boxSizing: "border-box" }}
                  />
                </label>
              ),
            )}
          </div>

          {aviso && <Aviso>{aviso}</Aviso>}

          <div style={{ display: "flex", gap: 10 }}>
            <Btn full onClick={salvar} disabled={salvando}>
              {salvando ? "SALVANDO..." : editId ? "SALVAR" : "COLOCAR NA PRATELEIRA"}
            </Btn>
            {editId && (
              <Btn bg="#888" onClick={() => { setEditId(null); setForm(FORM_VAZIO); }}>
                ✕
              </Btn>
            )}
          </div>
        </div>
      </Bloco>

      <div>
        <div style={{ fontFamily: FF, fontSize: 18, color: C.tinta, letterSpacing: "0.06em", marginBottom: 16 }}>
          PRATELEIRA ({produtos.length})
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {produtos.map((p) => (
            <Bloco key={p.id} style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 34, lineHeight: 1 }}>{p.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FF, fontSize: 16, color: C.tinta, letterSpacing: "0.04em" }}>{p.name}</div>
                <div style={{ fontFamily: "monospace", fontSize: 12, color: C.suave }}>{p.stock} UNIDADES</div>
              </div>
              <PrecoTag c={p.priceCents} />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => {
                    setEditId(p.id);
                    setForm({
                      nome: p.name,
                      emoji: p.emoji,
                      preco: (p.priceCents / 100).toFixed(2).replace(".", ","),
                      estoque: String(p.stock),
                      catEmoji: CATEGORIAS_EMOJI.find((c) => c.emojis.includes(p.emoji as never))?.id ?? "alimento",
                    });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  style={{ padding: "8px 14px", borderRadius: 8, border: `2px solid ${C.azul}`, background: "transparent", color: C.azul, fontFamily: FF, fontSize: 13, letterSpacing: "0.06em", cursor: "pointer" }}
                >
                  EDITAR
                </button>
                <button
                  onClick={() => remover(p.id)}
                  style={{ padding: "8px 14px", borderRadius: 8, border: `2px solid ${C.vermelho}`, background: "transparent", color: C.vermelho, fontFamily: FF, fontSize: 13, letterSpacing: "0.06em", cursor: "pointer" }}
                >
                  TIRAR
                </button>
              </div>
            </Bloco>
          ))}
        </div>
      </div>
    </div>
  );
}
