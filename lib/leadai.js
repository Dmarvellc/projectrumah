// ============================================================
//  Lead Intelligence — skor & tindak lanjut otomatis
//
//  Riset industri: merespons lead dalam 5 menit pertama menaikkan
//  konversi berlipat. Di sini AI menilai keseriusan tiap lead dan
//  menyusun urutan follow-up personal (WA) berbasis properti yang
//  ditanya — agar agen membalas cepat, tepat, dan konsisten.
// ============================================================

import { aiEnabled, ask, parseJson } from "@/lib/ai";
import { formatPrice } from "@/lib/utils";
import { getListing } from "@/lib/store";
import { SITE } from "@/data";

// Sinyal cepat tanpa AI: panjang & isi pesan, ada nomor, sebut budget/nego/KPR.
function quickSignals(lead) {
  const msg = String(lead.message || "").toLowerCase();
  let s = 40;
  if (lead.phone && lead.phone.replace(/\D/g, "").length >= 9) s += 15;
  if (msg.length > 60) s += 10;
  if (/(survei|survey|lihat|kunjung|datang|ketemu|nego|kpr|cash|dp|budget|serius|minat)/.test(msg)) s += 25;
  if (/(kapan|bisa|hari ini|besok|weekend|akhir pekan)/.test(msg)) s += 10;
  return Math.min(100, s);
}

export async function analyzeLead(lead) {
  const listing = lead.propertySlug ? getListing(lead.propertySlug) : null;
  const offline = fallbackLead(lead, listing);
  if (!aiEnabled()) return { ...offline, aiUsed: false };

  const ctx = listing
    ? `Properti yang ditanya: ${listing.title} — ${[listing.cluster, listing.location].filter(Boolean).join(", ")}, ${formatPrice(listing.price, listing.listing, listing.priceUnit)}, ${listing.bedrooms || "-"} KT.`
    : "Tidak terkait properti tertentu.";

  try {
    const text = await ask({
      tier: "fast",
      maxTokens: 1200,
      system:
        "Anda sales manager properti Indonesia yang melatih agen menutup deal. Nilai keseriusan lead dan " +
        "susun follow-up WhatsApp yang personal, sopan, tidak spammy, dan mengarah ke survei/closing. " +
        "Balas HANYA JSON valid.",
      content:
        `LEAD:\nNama: ${lead.name}\nPesan: "${lead.message || "(kosong)"}"\n${ctx}\n\n` +
        "Balas JSON persis:\n" +
        `{
  "score": 0,
  "temperature": "hot|warm|cold",
  "reasoning": "1-2 kalimat kenapa skor ini",
  "intent": "ringkas maksud lead",
  "nextAction": "aksi paling penting berikutnya untuk agen",
  "followUps": [
    { "when": "Sekarang (menit ke-5)", "channel": "WhatsApp", "message": "pesan balasan pertama, personal, sebut properti & ajak survei" },
    { "when": "H+1", "channel": "WhatsApp", "message": "follow-up bila belum dibalas, beri nilai tambah" },
    { "when": "H+3", "channel": "WhatsApp", "message": "follow-up terakhir yang sopan + opsi alternatif" }
  ]
}\n` +
        `Skor 0-100. Nama agen '${SITE.name}'. Jangan janjikan hal yang tidak pasti. ` +
        "Jangan gunakan tanda petik ganda di dalam nilai teks.",
    });
    const data = parseJson(text);
    if (!data || !Array.isArray(data.followUps)) return { ...offline, aiUsed: false };
    return {
      score: Number(data.score) || offline.score,
      temperature: ["hot", "warm", "cold"].includes(data.temperature) ? data.temperature : offline.temperature,
      reasoning: data.reasoning || offline.reasoning,
      intent: data.intent || "",
      nextAction: data.nextAction || offline.nextAction,
      followUps: data.followUps.slice(0, 3),
      aiUsed: true,
    };
  } catch (err) {
    console.error("analyzeLead error:", err?.message || err);
    return { ...offline, aiUsed: false };
  }
}

function fallbackLead(lead, listing) {
  const score = quickSignals(lead);
  const temperature = score >= 75 ? "hot" : score >= 55 ? "warm" : "cold";
  const ref = listing ? `"${listing.title}"` : "properti kami";
  return {
    score,
    temperature,
    reasoning: "Skor dari sinyal pesan & kelengkapan kontak (analisis dasar).",
    intent: "Menanyakan informasi properti.",
    nextAction: temperature === "hot" ? "Telepon/WA sekarang, tawarkan jadwal survei." : "Balas cepat via WA, gali kebutuhan & anggaran.",
    followUps: [
      { when: "Sekarang (menit ke-5)", channel: "WhatsApp", message: `Halo ${lead.name}, terima kasih sudah menghubungi soal ${ref}. Boleh saya bantu jadwalkan survei atau kirim detail lengkap? Kapan waktu yang pas untuk Anda?` },
      { when: "H+1", channel: "WhatsApp", message: `Halo ${lead.name}, menindaklanjuti ketertarikan Anda pada ${ref}. Unit ini cukup diminati — saya bisa siapkan slot survei akhir pekan ini bila berkenan.` },
      { when: "H+3", channel: "WhatsApp", message: `Halo ${lead.name}, bila ${ref} kurang cocok, saya punya beberapa opsi lain sesuai kebutuhan Anda. Mau saya kirimkan?` },
    ],
  };
}
