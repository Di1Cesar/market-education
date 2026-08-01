export type Produto = {
  id: string;
  name: string;
  emoji: string;
  priceCents: number;
  stock: number;
  active: boolean;
};

export type ItemCupom = {
  id: string;
  nameSnapshot: string;
  emojiSnapshot: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
};

export type Cupom = {
  id: string;
  totalCents: number;
  paidCents: number;
  changeCents: number;
  createdAt: string;
  items: ItemCupom[];
};
