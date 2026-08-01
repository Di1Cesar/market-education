"use client";

import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { C, FF, FN, FM, R$, CEDULAS, MOEDAS, MISSOES, decompor } from "@/lib/design";
import type { Produto, Cupom } from "@/lib/tipos";
import { Aviso, Bloco, Btn, Peca, PrecoTag, useBip } from "./ui";

type Fase = "comprando" | "pagando" | "conferindo" | "pronto";

export function Caixa({
  produtos,
  onEstoqueMudou,
  onNovoCupom,
  som,
}: {
  produtos: Produto[];
  onEstoqueMudou: (produtos: Produto[]) => void;
  onNovoCupom: (cupom: Cupom) => void;
  som: boolean;
}) {
  const bip = useBip(som);
  const [carrinho, setCarrinho] = useState<Record<string, number>>({});
  const [missao] = useState(() => MISSOES[Math.floor(Math.random() * MISSOES.length)]);
  const [aviso, setAviso] = useState("");
  const [fase, setFase] = useState<Fase>("comprando");
  const [entregue, setEntregue] = useState<Record<number, number>>({});
  const [resposta, setResposta] = useState<Record<number, number>>({});
  const [acerto, setAcerto] = useState<boolean | null>(null);
  const [ultimo, setUltimo] = useState<Cupom | null>(null);
  const [enviando, setEnviando] = useState(false);

  const itens = useMemo(
    () =>
      Object.entries(carrinho)
        .map(([id, qtd]) => ({ p: produtos.find((x) => x.id === id), qtd }))
        .filter((i): i is { p: Produto; qtd: number } => Boolean(i.p)),
    [carrinho, produtos],
  );
  const total = itens.reduce((s, i) => s + i.p.priceCents * i.qtd, 0);
  const soma = (o: Record<number, number>) =>
    Object.entries(o).reduce((s, [v, q]) => s + Number(v) * q, 0);
  const pago = soma(entregue);
  const troco = pago - total;
  const respSoma = soma(resposta);

  function mudar(p: Produto, d: number) {
    const n = (carrinho[p.id] || 0) + d;
    if (n < 0) return;
    if (n > p.stock) {
      setAviso(`SÓ TEM ${p.stock} DE ${p.name}`);
      bip(220);
      return;
    }
    setAviso("");
    bip(d > 0 ? 880 : 520);
    setCarrinho((c) => {
      const m = { ...c };
      if (n === 0) delete m[p.id];
      else m[p.id] = n;
      return m;
    });
  }

  function entregar(v: number) {
    setEntregue((e) => ({ ...e, [v]: (e[v] || 0) + 1 }));
    bip(700);
  }

  function conferir() {
    const ok = respSoma === troco;
    setAcerto(ok);
    bip(ok ? 1318 : 200);
    if (ok) setTimeout(() => setFase("pronto"), 600);
  }

  async function finalizar() {
    setEnviando(true);
    setAviso("");
    try {
      const cupom = await api.finalizarVenda({
        items: itens.map((i) => ({ productId: i.p.id, quantity: i.qtd })),
        paidCents: pago,
      });
      onEstoqueMudou(
        produtos.map((p) => (carrinho[p.id] ? { ...p, stock: p.stock - carrinho[p.id] } : p)),
      );
      onNovoCupom(cupom);
      setUltimo(cupom);
      setCarrinho({});
      setEntregue({});
      setResposta({});
      setAcerto(null);
      setFase("comprando");
      bip(1318);
    } catch (e) {
      setAviso((e as Error).message);
      setFase("comprando");
    } finally {
      setEnviando(false);
    }
  }

  /* ── pagamento ── */
  if (fase !== "comprando") {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", display: "grid", gap: 16 }}>
        <div style={{ background: C.tinta, borderRadius: 16, padding: "24px 28px", textAlign: "center" }}>
          <div style={{ fontFamily: FN, fontSize: 13, letterSpacing: "0.12em", color: "#AAA", marginBottom: 4 }}>
            TOTAL DA COMPRA
          </div>
          <div style={{ fontFamily: FF, fontSize: 52, color: C.amarelo, lineHeight: 1 }}>{R$(total)}</div>
        </div>

        {fase === "pagando" && (
          <Bloco style={{ padding: 24 }}>
            <div style={{ fontFamily: FF, fontSize: 20, color: C.tinta, marginBottom: 16, letterSpacing: "0.06em" }}>
              ENTREGUE O DINHEIRO
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
              {CEDULAS.map((c) => (
                <Peca key={c.v} p={c} qtd={entregue[c.v] || 0} onClick={() => entregar(c.v)} />
              ))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
              {MOEDAS.map((m) => (
                <Peca key={m.v} p={m} qtd={entregue[m.v] || 0} onClick={() => entregar(m.v)} />
              ))}
            </div>

            <div style={{ background: C.bg, borderRadius: 12, padding: "14px 18px", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: FF, fontSize: 15, letterSpacing: "0.06em", color: C.suave }}>
                  VOCÊ ENTREGOU
                </span>
                <span style={{ fontFamily: FF, fontSize: 28, color: C.tinta }}>{R$(pago)}</span>
              </div>
              {Object.keys(entregue).length > 0 && (
                <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {Object.entries(entregue).map(([v, q]) => (
                    <button
                      key={v}
                      onClick={() =>
                        setEntregue((e) => {
                          const n = { ...e };
                          n[Number(v)] -= 1;
                          if (!n[Number(v)]) delete n[Number(v)];
                          return n;
                        })
                      }
                      style={{
                        padding: "3px 10px",
                        background: "#E0D9CC",
                        border: "none",
                        borderRadius: 6,
                        fontFamily: FM,
                        fontSize: 12,
                        cursor: "pointer",
                        color: C.tinta,
                      }}
                    >
                      {q}× {R$(Number(v))} ✕
                    </button>
                  ))}
                </div>
              )}
              {pago < total && (
                <div style={{ marginTop: 8, fontFamily: FF, fontSize: 14, color: C.vermelho, letterSpacing: "0.04em" }}>
                  FALTA {R$(total - pago)}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <Btn bg="#888" onClick={() => { setFase("comprando"); setEntregue({}); }}>
                VOLTAR
              </Btn>
              <Btn full disabled={pago < total} onClick={() => setFase(pago === total ? "pronto" : "conferindo")}>
                {pago === total ? "VALOR EXATO! FINALIZAR" : "CALCULAR O TROCO"}
              </Btn>
            </div>
          </Bloco>
        )}

        {fase === "conferindo" && (
          <Bloco style={{ padding: 24 }}>
            <div style={{ fontFamily: FF, fontSize: 20, color: C.tinta, marginBottom: 8, letterSpacing: "0.06em" }}>
              QUANTO É O TROCO?
            </div>
            <div style={{ fontFamily: FN, fontSize: 14, color: C.suave, marginBottom: 16 }}>
              ENTREGOU {R$(pago)} NUMA COMPRA DE {R$(total)}. MONTE O TROCO.
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
              {CEDULAS.map((c) => (
                <Peca
                  key={c.v}
                  p={c}
                  qtd={resposta[c.v] || 0}
                  onClick={() => { setResposta((r) => ({ ...r, [c.v]: (r[c.v] || 0) + 1 })); setAcerto(null); bip(700); }}
                />
              ))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
              {MOEDAS.map((m) => (
                <Peca
                  key={m.v}
                  p={m}
                  qtd={resposta[m.v] || 0}
                  onClick={() => { setResposta((r) => ({ ...r, [m.v]: (r[m.v] || 0) + 1 })); setAcerto(null); bip(700); }}
                />
              ))}
            </div>

            <div style={{ textAlign: "center", background: C.bg, borderRadius: 12, padding: "14px 0", marginBottom: 16, fontFamily: FF, fontSize: 36, color: C.tinta }}>
              {R$(respSoma)}
            </div>

            {acerto === false && (
              <div style={{ marginBottom: 12 }}>
                <Aviso>{respSoma > troco ? "PASSOU UM POUCO. TIRE UMA MOEDA." : "AINDA FALTA UM POUCO."}</Aviso>
              </div>
            )}
            {acerto === true && (
              <div style={{ marginBottom: 12, padding: "12px 16px", background: "#D6F5E3", border: `2px solid ${C.verde}`, borderRadius: 10, fontFamily: FF, fontSize: 16, color: C.verdeEsc, letterSpacing: "0.04em" }}>
                ISSO MESMO! TROCO CORRETO!
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <Btn sm bg="#888" onClick={() => setResposta({})}>LIMPAR</Btn>
              <Btn sm bg={C.azul} onClick={conferir}>CONFERIR</Btn>
              <Btn sm bg="#888" onClick={() => setFase("pronto")}>PULAR</Btn>
            </div>
          </Bloco>
        )}

        {fase === "pronto" && (
          <Bloco style={{ padding: 28, textAlign: "center" }}>
            <div style={{ fontFamily: FN, fontSize: 14, letterSpacing: "0.12em", color: C.suave, marginBottom: 4 }}>
              TROCO
            </div>
            <div style={{ fontFamily: FF, fontSize: 52, color: C.verde, lineHeight: 1, marginBottom: 20 }}>
              {R$(troco)}
            </div>
            {troco > 0 && (
              <>
                <div style={{ fontFamily: FF, fontSize: 14, color: C.suave, letterSpacing: "0.08em", marginBottom: 10 }}>
                  DEVOLVA ASSIM:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10, marginBottom: 24 }}>
                  {decompor(troco).map((p) => (
                    <Peca key={p.v} p={p} qtd={p.qtd} />
                  ))}
                </div>
              </>
            )}
            {aviso && <div style={{ marginBottom: 12 }}><Aviso>{aviso}</Aviso></div>}
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <Btn bg="#888" onClick={() => setFase("pagando")}>VOLTAR</Btn>
              <Btn onClick={finalizar} disabled={enviando}>
                {enviando ? "REGISTRANDO..." : "IMPRIMIR CUPOM"}
              </Btn>
            </div>
          </Bloco>
        )}
      </div>
    );
  }

  /* ── grade de produtos ── */
  return (
    <div style={{ display: "grid", gap: 20, gridTemplateColumns: "1fr 280px" }}>
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ background: C.amarelo, borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 4px 0 #B07808" }}>
          <span style={{ fontSize: 32, lineHeight: 1 }}>🎯</span>
          <div>
            <div style={{ fontFamily: FM, fontSize: 11, letterSpacing: "0.15em", color: "#7A5B00", marginBottom: 2 }}>
              MISSÃO DO DIA
            </div>
            <div style={{ fontFamily: FF, fontSize: 15, color: C.tinta, letterSpacing: "0.04em" }}>{missao}</div>
          </div>
        </div>

        {ultimo && (
          <div style={{ background: C.azulClaro, borderRadius: 12, padding: "12px 16px", fontFamily: FF, fontSize: 14, color: C.azul, letterSpacing: "0.04em", border: `2px solid ${C.azul}22` }}>
            ÚLTIMA COMPRA: {R$(ultimo.totalCents)} — TROCO: {R$(ultimo.changeCents)}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 12 }}>
          {produtos.map((p) => {
            const qtd = carrinho[p.id] || 0;
            const esgotado = p.stock === 0;
            return (
              <Bloco key={p.id} style={{ padding: 16, textAlign: "center", opacity: esgotado ? 0.4 : 1 }}>
                <button
                  onClick={() => !esgotado && mudar(p, 1)}
                  disabled={esgotado}
                  style={{ background: "none", border: "none", cursor: esgotado ? "not-allowed" : "pointer", display: "block", width: "100%", marginBottom: 8 }}
                >
                  <div style={{ fontSize: 44, lineHeight: 1, marginBottom: 4 }}>{p.emoji}</div>
                  <div style={{ fontFamily: FF, fontSize: 14, color: C.tinta, letterSpacing: "0.04em", marginBottom: 6, minHeight: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {p.name}
                  </div>
                </button>
                <div style={{ marginBottom: 8, display: "flex", justifyContent: "center" }}>
                  <PrecoTag c={p.priceCents} />
                </div>
                <div style={{ fontFamily: FM, fontSize: 11, color: C.suave, marginBottom: 10 }}>
                  {esgotado ? "ESGOTADO" : `${p.stock} RESTAM`}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <button
                    onClick={() => mudar(p, -1)}
                    disabled={qtd === 0}
                    style={{ width: 36, height: 36, borderRadius: 8, border: `2px solid ${C.linha}`, background: C.bg, fontFamily: FF, fontSize: 20, color: C.tinta, cursor: "pointer", opacity: qtd === 0 ? 0.3 : 1 }}
                  >
                    −
                  </button>
                  <span style={{ fontFamily: FF, fontSize: 20, color: C.tinta, minWidth: 24 }}>{qtd}</span>
                  <button
                    onClick={() => mudar(p, 1)}
                    disabled={esgotado}
                    style={{ width: 36, height: 36, borderRadius: 8, border: "none", background: C.verde, color: "#FFF", fontFamily: FF, fontSize: 20, cursor: "pointer", opacity: esgotado ? 0.3 : 1, boxShadow: `0 3px 0 ${C.verdeEsc}` }}
                  >
                    +
                  </button>
                </div>
              </Bloco>
            );
          })}
        </div>

        {aviso && <Aviso>{aviso}</Aviso>}
      </div>

      <Bloco style={{ padding: 20, position: "sticky", top: 8, alignSelf: "start" }}>
        <div style={{ fontFamily: FF, fontSize: 18, color: C.tinta, letterSpacing: "0.06em", marginBottom: 16 }}>
          CARRINHO
        </div>

        {itens.length === 0 ? (
          <div style={{ fontFamily: FN, fontSize: 14, color: C.suave, textAlign: "center", padding: "24px 0" }}>
            TOQUE NUM PRODUTO PARA COMEÇAR
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
            {itens.map(({ p, qtd }) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>{p.emoji}</span>
                <span style={{ flex: 1, fontFamily: FF, fontSize: 13, color: C.tinta, letterSpacing: "0.04em" }}>
                  {qtd}× {p.name}
                </span>
                <span style={{ fontFamily: FM, color: C.tinta, fontSize: 13 }}>{R$(p.priceCents * qtd)}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ borderTop: `2px dashed ${C.linha}`, paddingTop: 14, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <span style={{ fontFamily: FF, fontSize: 14, color: C.suave, letterSpacing: "0.06em" }}>TOTAL</span>
            <span style={{ fontFamily: FF, fontSize: 32, color: C.tinta, lineHeight: 1 }}>{R$(total)}</span>
          </div>
        </div>

        <Btn full disabled={itens.length === 0} onClick={() => setFase("pagando")}>
          PAGAR
        </Btn>
      </Bloco>
    </div>
  );
}
