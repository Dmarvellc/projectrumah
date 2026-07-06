// Formatting & helper utilities

export function formatPrice(value, listing, priceUnit) {
  if (value == null) return "-";
  let str;
  if (value >= 1_000_000_000) {
    str = "Rp " + trimNum(value / 1_000_000_000) + " M";
  } else if (value >= 1_000_000) {
    str = "Rp " + trimNum(value / 1_000_000) + " Jt";
  } else if (value >= 1_000) {
    str = "Rp " + trimNum(value / 1_000) + " Rb";
  } else {
    str = "Rp " + value.toLocaleString("id-ID");
  }
  if (listing === "sewa") str += " / " + (priceUnit || "bulan");
  return str;
}

function trimNum(n) {
  // up to 2 decimals, comma separator (id-ID), no trailing zeros
  return Number(n.toFixed(2)).toLocaleString("id-ID");
}

export function formatFullPrice(value) {
  if (value == null) return "-";
  return "Rp " + value.toLocaleString("id-ID");
}

export function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days <= 0) return "Hari ini";
  if (days === 1) return "Kemarin";
  if (days < 30) return `${days} hari lalu`;
  const months = Math.floor(days / 30);
  return `${months} bulan lalu`;
}

// Simple KPR monthly installment (annuity)
export function kprMonthly(principal, annualRatePct, years) {
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}
