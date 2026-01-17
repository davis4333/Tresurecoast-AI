const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function getSalesBotPublicKey(): string | null {
  const key = process.env.NEXT_PUBLIC_TCA_SALES_BOT_PUBLIC_KEY;

  if (!key) {
    return null;
  }

  if (!UUID_REGEX.test(key)) {
    console.error(
      "[ENV] NEXT_PUBLIC_TCA_SALES_BOT_PUBLIC_KEY is not a valid UUID:",
      key
    );
    return null;
  }

  return key;
}
