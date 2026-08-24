// Tokens do Mercadinho da Turma — design direto, caixa alta, blocos sólidos.

export const C = {
  bg: "#F5F2EB",
  card: "#FFFFFF",
  tinta: "#1A1A1A",
  suave: "#5A5A5A",
  linha: "#E0D9CC",
  verde: "#1C8A4A",
  verdeEsc: "#0F5E32",
  vermelho: "#D03030",
  amarelo: "#D4920A",
  azul: "#1A5FC8",
  azulClaro: "#EBF2FF",
} as const;

export const FF = "'Black Han Sans', 'Fredoka', system-ui, sans-serif";
export const FN = "'Nunito', system-ui, sans-serif";
export const FM = "'Courier Prime', 'Courier New', monospace";

export const R$ = (c: number) =>
  ((Number(c) || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const CATEGORIAS_EMOJI = [
  {
    id: "alimento", label: "ALIMENTO", icone: "🍎",
    emojis: ["🍎","🍌","🍇","🍊","🍓","🍉","🥕","🍅","🌽","🥦",
             "🥛","🧃","💧","🍞","🥐","🧀","🥚","🍪","🍫","🍿",
             "🍬","🧁","🥪","🍕","🥤","🍦","🎂","🍩","🥜","🧆",
             "🍚","🫘"],
  },
  {
    id: "higiene", label: "HIGIENE", icone: "🧼",
    emojis: ["🧼","🧴"],
  },
  {
    id: "brinquedo", label: "BRINQUEDO", icone: "🧸",
    emojis: ["🧸","🎮","🎲","🎯","🪀","🪁","🎪","🧩","🎠","🏆",
             "⚽","🏀","🎾","🏈","🎱","🪃","🛹","🎨","🖌️","🎭"],
  },
  {
    id: "roupa", label: "ROUPA", icone: "👕",
    emojis: ["👕","👗","👖","🩱","👚","🧥","🧤","🧦","👒","🎩",
             "👟","👠","🥾","🩴","👜","🎒","🌂","🕶️","⌚","💍"],
  },
  {
    id: "cinema", label: "CINEMA", icone: "🎬",
    emojis: ["🎬","🎥","🎦","📽️","🎞️","🍿","🎟️","🎭","🎪","🎠",
             "🎡","🎢","🎰","🃏","🎴","🀄","🎸","🎵","🎶","🎤"],
  },
  {
    id: "escola", label: "ESCOLA", icone: "✏️",
    emojis: ["✏️","📒","📏","🖍️","📐","📌","📎","🖊️","📚","🔬",
             "🔭","🖥️","📱","📷","🔦","🎓","🏫","📝","📋","🗒️"],
  },
] as const;

export const MISSOES = [
  "LEVE 3 PRODUTOS GASTANDO ATÉ R$ 12,00",
  "GASTE EXATAMENTE R$ 5,00",
  "LEVE 2 PRODUTOS E RECEBA TROCO",
  "GASTE ATÉ R$ 8,00 COM 2 PRODUTOS",
  "MONTE UM LANCHE COM ATÉ R$ 15,00",
];

export type Peca = { v: number; r: string; c: string };

export const CEDULAS: Peca[] = [
  { v: 20000, r: "200", c: "#C5942C" },
  { v: 10000, r: "100", c: "#3366B8" },
  { v: 5000, r: "50", c: "#C97822" },
  { v: 2000, r: "20", c: "#AA6A28" },
  { v: 1000, r: "10", c: "#C03030" },
  { v: 500, r: "5", c: "#6640A0" },
  { v: 200, r: "2", c: "#2878B8" },
];

export const MOEDAS: Peca[] = [
  { v: 100, r: "R$1", c: "#C5942C" },
  { v: 50, r: "50¢", c: "#A0A0A0" },
  { v: 25, r: "25¢", c: "#B87828" },
  { v: 10, r: "10¢", c: "#B87828" },
  { v: 5, r: "5¢", c: "#B87828" },
];

export function decompor(centavos: number): (Peca & { qtd: number })[] {
  const out: (Peca & { qtd: number })[] = [];
  let r = centavos;
  for (const p of [...CEDULAS, ...MOEDAS]) {
    const n = Math.floor(r / p.v);
    if (n > 0) { out.push({ ...p, qtd: n }); r -= n * p.v; }
  }
  return out;
}
