"use client";

import { useCallback, useRef } from "react";
import { C, FF, FN, R$, type Peca as TPeca } from "@/lib/design";

export function Bloco({
  children,
  style = {},
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: C.card,
        border: `2px solid ${C.linha}`,
        borderRadius: 16,
        boxShadow: `4px 4px 0 ${C.linha}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Btn({
  children,
  onClick,
  bg = C.verde,
  disabled,
  full,
  sm,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  bg?: string;
  disabled?: boolean;
  full?: boolean;
  sm?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        width: full ? "100%" : "auto",
        padding: sm ? "10px 18px" : "14px 24px",
        background: disabled ? "#CCC" : bg,
        color: "#FFF",
        border: "none",
        borderRadius: 12,
        fontFamily: FF,
        fontSize: sm ? 15 : 17,
        letterSpacing: "0.06em",
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: disabled ? "none" : `0 4px 0 ${bg}BB`,
        transition: "transform .08s, box-shadow .08s",
      }}
      onMouseDown={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = "translateY(2px)";
        e.currentTarget.style.boxShadow = "none";
      }}
      onMouseUp={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = `0 4px 0 ${bg}BB`;
      }}
    >
      {children}
    </button>
  );
}

export function PrecoTag({ c }: { c: number }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: C.vermelho,
        color: "#FFF",
        padding: "6px 14px 6px 22px",
        borderRadius: "6px 12px 12px 6px",
        fontFamily: FF,
        fontSize: 16,
        letterSpacing: "0.04em",
        position: "relative",
      }}
    >
      <span
        style={{
          position: "absolute",
          left: 8,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: C.bg,
        }}
      />
      {R$(c)}
    </div>
  );
}

export function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "12px 16px",
        background: "#FDE8E8",
        border: `2px solid ${C.vermelho}`,
        borderRadius: 10,
        fontFamily: FN,
        fontWeight: 700,
        fontSize: 14,
        color: C.vermelho,
      }}
    >
      {children}
    </div>
  );
}

/** Nota ou moeda de brinquedo, clicável */
export function Peca({
  p,
  qtd = 0,
  onClick,
}: {
  p: TPeca;
  qtd?: number;
  onClick?: () => void;
}) {
  const moeda = p.v < 200;
  return (
    <button
      onClick={onClick}
      aria-label={`Entregar ${p.r}`}
      style={{
        position: "relative",
        width: moeda ? 64 : 92,
        height: moeda ? 64 : 52,
        borderRadius: moeda ? "50%" : 10,
        background: p.c,
        border: "3px solid rgba(0,0,0,.2)",
        color: "#FFF",
        fontFamily: FF,
        fontSize: moeda ? 14 : 18,
        letterSpacing: "0.04em",
        cursor: "pointer",
        boxShadow: "0 4px 0 rgba(0,0,0,.22)",
        transition: "transform .08s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        lineHeight: 1.1,
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "translateY(3px)";
        e.currentTarget.style.boxShadow = "none";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "0 4px 0 rgba(0,0,0,.22)";
      }}
    >
      {!moeda && <span style={{ fontSize: 10, opacity: 0.85 }}>R$</span>}
      {p.r}
      {qtd > 0 && (
        <span
          style={{
            position: "absolute",
            top: -8,
            right: -8,
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: C.tinta,
            color: "#FFF",
            fontFamily: "monospace",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `2px solid ${C.bg}`,
          }}
        >
          {qtd}
        </span>
      )}
    </button>
  );
}

/** Bipe curto de feedback. Silencioso se o navegador bloquear áudio. */
export function useBip(ligado: boolean) {
  const ref = useRef<AudioContext | null>(null);
  return useCallback(
    (freq = 880) => {
      if (!ligado) return;
      try {
        if (!ref.current) ref.current = new AudioContext();
        const ctx = ref.current;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "triangle";
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
        o.connect(g).connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.2);
      } catch {
        /* som é opcional */
      }
    },
    [ligado],
  );
}
