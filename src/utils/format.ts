export const formatDate = (date: Date | null | undefined) => {
    if (!date) return "";
    return new Intl.DateTimeFormat('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
};

export const formatAmount = (amount: number) => {
    const isPositive = amount > 0;
    return {
        value: isPositive ? `+${amount}` : `${amount}`,
        color: isPositive ? "green" : "red",
        icon: isPositive ? "💰" : "💸",
    };
};

export function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}