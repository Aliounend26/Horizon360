export function formatCurrency(amount: number, currency = 'FCFA'): string {
  return `${Math.round(amount).toLocaleString('fr-FR')} ${currency}`;
}

export function formatDate(date?: string | Date): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR');
}

export function formatDateTime(date?: string | Date): string {
  if (!date) return '—';
  return new Date(date).toLocaleString('fr-FR');
}

export function toInputDate(date?: string | Date): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}
