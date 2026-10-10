export function formatCurrency(amount) {
  const val = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(val);
}

export function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString) {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
}

export function getExpiryStatus(expiryDate) {
  if (!expiryDate) return { label: 'NO EXPIRY', color: 'bg-slate-700 text-slate-300 border-slate-600', days: 999 };
  const now = new Date();
  const exp = new Date(expiryDate);
  const diffTime = exp.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return {
      label: 'EXPIRED',
      color: 'bg-rose-500/20 text-rose-400 border-rose-500/40 font-semibold animate-pulse',
      days: diffDays,
      isExpired: true
    };
  } else if (diffDays <= 60) {
    return {
      label: `EXP: ${diffDays}d`,
      color: 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-medium',
      days: diffDays,
      isNear: true
    };
  } else if (diffDays <= 120) {
    return {
      label: `EXP: ${diffDays}d`,
      color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
      days: diffDays,
      isWarning: true
    };
  } else {
    return {
      label: formatDate(expiryDate),
      color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      days: diffDays,
      isGood: true
    };
  }
}
