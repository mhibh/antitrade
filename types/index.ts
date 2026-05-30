export type Currency = "IDR" | "USD";
export type TradeType = "trade" | "withdrawal";

export type Trade = {
  id: string;
  user_id?: string;
  tanggal: string;
  saldo_awal: number;
  pnl: number;
  type?: TradeType;
  catatan: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Settings = {
  id?: string;
  user_id?: string;
  modal_awal: number;
  created_at?: string;
  updated_at?: string;
};

export type TradeFormValues = {
  tanggal: string;
  saldo_awal: number;
  pnl: number;
  type: TradeType;
  catatan: string;
};
