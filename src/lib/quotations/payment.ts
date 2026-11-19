export interface BankAccount {
  bank: string;
  name: string;
  number: string;
}

export const QUOTATION_BANK_ACCOUNTS: BankAccount[] = [
  {
    bank: "BCA",
    name: "Muhammad Riefky Hadid",
    number: "7151660138",
  },
  {
    bank: "Mandiri",
    name: "Muhammad Riefky Hadid",
    number: "1570005080263",
  },
];

/** Backwards-compatible alias for the primary bank account */
export const QUOTATION_BANK_ACCOUNT = QUOTATION_BANK_ACCOUNTS[0];

export const INTERNATIONAL_PAYMENT_METHODS = ["Wise", "PayPal"] as const;
