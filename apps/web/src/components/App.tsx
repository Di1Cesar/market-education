"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { C, FF, FN, FM, R$ } from "@/lib/design";
import type { Produto, Cupom } from "@/lib/tipos";
import { Bloco, Btn } from "./ui";
import { Caixa } from "./Caixa";
import { Produtos } from "./Produtos";

function Cupons({ cupons }: { cupons: Cupom[] }) {
  if (cupons.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🧾</div>
        <div style={{ fontFamily: FF, fontSize: 20, color: C.tinta, letterSpacing: "0.06em" }}>
          NENHUMA COMPRA AINDA
        </div>
        <div style={{ fontFamily: FN, fontSize: 14, color: C.suave, marginTop: 8 }}>
          OS CUPONS DO DIA APARECEM AQUI
        </div>
      </div>
    );
  }

  const totalDia = cupons.reduce((s, c) => s + c.totalCents, 0);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Bloco style={{ padding: 20 }}>
          <div style={{ fontFamily: FF, fontSize: 12, color: C.suave, letterSpacing: "0.1em", marginBottom: 4 }}>
            TOTAL DO DIA
          </div>
          <div style={{ fontFamily: FF, fontSize: 36, color: C.tinta }}>{R$(totalDia)}</div>
        </Bloco>
        <Bloco style={{ padding: 20 }}>
          <div style={{ fontFamily: FF, fontSize: 12, color: C.suave, letterSpacing: "0.1em", marginBottom: 4 }}>
            COMPRAS
          </div>
          <div style={{ fontFamily: FF, fontSize: 36, color: C.azul }}>{cupons.length}</div>
        </Bloco>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14 }}>
        {cupons.map((c) => (
          <div
            key={c.id}
            style={{ background: "#FFF", border: `2px solid ${C.linha}`, borderRadius: 4, padding: 18, fontFamily: FM, fontSize: 13, color: C.tinta, boxShadow: `3px 3px 0 ${C.linha}` }}
          >
            <div style={{ textAlign: "center", letterSpacing: 2, marginBottom: 4, fontWeight: 700 }}>
              MERCADINHO DA TURMA
            </div>
            <div style={{ textAlign: "center", fontSize: 11, color: C.suave, marginBottom: 10 }}>
              {new Date(c.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div style={{ borderTop: `1px dashed ${C.linha}`, marginBottom: 10 }} />
            {c.items.map((i) => (
              <div key={i.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span>{i.quantity}x {i.nameSnapshot}</span>
                <span>{R$(i.lineTotalCents)}</span>
              </div>
            ))}
            <div style={{ borderTop: `1px dashed ${C.linha}`, margin: "10px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
              <span>TOTAL</span><span>{R$(c.totalCents)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.suave }}>
              <span>PAGO</span><span>{R$(c.paidCents)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.suave }}>
              <span>TROCO</span><span>{R$(c.changeCents)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const ABAS = [
  { id: "caixa", label: "CAIXA", icon: "🛒" },
  { id: "produtos", label: "PRODUTOS", icon: "📦" },
  { id: "cupons", label: "CUPONS", icon: "🧾" },
] as const;

type AbaId = (typeof ABAS)[number]["id"];

export function App() {
  const [aba, setAba] = useState<AbaId>("caixa");
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [som, setSom] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const [ps, cs] = await Promise.all([api.listarProdutos(), api.listarCupons()]);
        if (vivo) { setProdutos(ps); setCupons(cs); }
      } catch (e) {
        if (vivo) setErro((e as Error).message);
      } finally {
        if (vivo) setCarregando(false);
      }
    })();
    return () => { vivo = false; };
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "20px 24px", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: FM, fontSize: 11, color: C.suave, letterSpacing: "0.2em", marginBottom: 2 }}>
              ABERTO TODOS OS DIAS
            </div>
            <div style={{ fontFamily: FF, fontSize: 38, color: C.tinta, lineHeight: 1, letterSpacing: "0.02em" }}>
              MERCADINHO
              <br />
              DA TURMA
            </div>
          </div>
          <button
            onClick={() => setSom((s) => !s)}
            style={{ padding: "10px 16px", borderRadius: 10, border: `2px solid ${C.linha}`, background: C.card, fontFamily: FF, fontSize: 13, color: C.tinta, cursor: "pointer", letterSpacing: "0.06em" }}
          >
            {som ? "🔊 SOM" : "🔇 SEM SOM"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 24 }}>
          {ABAS.map((a) => {
            const ativo = a.id === aba;
            return (
              <button
                key={a.id}
                onClick={() => setAba(a.id)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "14px 0", borderRadius: 12, border: `2px solid ${ativo ? C.tinta : C.linha}`, background: ativo ? C.tinta : C.card, cursor: "pointer", boxShadow: ativo ? `0 4px 0 ${C.suave}` : `0 4px 0 ${C.linha}`, transition: "all .1s" }}
              >
                <span style={{ fontSize: 22 }}>{a.icon}</span>
                <span style={{ fontFamily: FF, fontSize: 16, letterSpacing: "0.08em", color: ativo ? "#FFF" : C.tinta }}>
                  {a.label}
                </span>
              </button>
            );
          })}
        </div>

        {carregando ? (
          <div style={{ textAlign: "center", padding: "60px 0", fontFamily: FF, fontSize: 18, color: C.suave, letterSpacing: "0.06em" }}>
            ABRINDO O MERCADINHO...
          </div>
        ) : erro ? (
          <Bloco style={{ padding: 28, textAlign: "center" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🔌</div>
            <div style={{ fontFamily: FF, fontSize: 18, color: C.tinta, letterSpacing: "0.04em", marginBottom: 8 }}>
              NÃO CONSEGUI FALAR COM O SERVIDOR
            </div>
            <div style={{ fontFamily: FN, fontSize: 14, color: C.suave, marginBottom: 16 }}>
              Verifique se a API (NestJS) está rodando. Detalhe: {erro}
            </div>
            <Btn onClick={() => window.location.reload()}>TENTAR DE NOVO</Btn>
          </Bloco>
        ) : (
          <>
            {aba === "caixa" && (
              <Caixa
                produtos={produtos}
                onEstoqueMudou={setProdutos}
                onNovoCupom={(c) => setCupons((cs) => [c, ...cs])}
                som={som}
              />
            )}
            {aba === "produtos" && (
              <Produtos produtos={produtos} onProdutosMudou={setProdutos} som={som} />
            )}
            {aba === "cupons" && <Cupons cupons={cupons} />}
          </>
        )}

        <div style={{ marginTop: 32, textAlign: "center", fontFamily: FM, fontSize: 11, color: C.suave, letterSpacing: "0.1em" }}>
          O QUE A TURMA VENDE, A TURMA CALCULA
        </div>
      </div>
    </div>
  );
}
