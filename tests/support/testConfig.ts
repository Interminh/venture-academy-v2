function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Copy .env.test.example to .env.test and fill it in.`);
  }
  return value;
}

export const ADMIN_EMAIL = required("VAT_QA_ADMIN_EMAIL");
export const ADMIN_PASSWORD = required("VAT_QA_ADMIN_PASSWORD");
