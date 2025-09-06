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

export const formatDateTime = (date: Date | string | null | undefined) => {
    if (!date) return "-";
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).format(dateObj);
};

export function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

// Export as a namespace object for backward compatibility
export const format = {
    formatDate,
    formatDateTime,
    formatAmount,
};
