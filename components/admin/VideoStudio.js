"use client";

// ============================================================
//  Video Studio — video slide otomatis dari data listing.
//  Dirender di browser (canvas + MediaRecorder): tanpa server
//  video, tanpa biaya. Konten mengikuti pola iklan properti:
//  hook → harga+spesifikasi → galeri → selling point → lokasi → CTA.
// ============================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { Muxer, ArrayBufferTarget } from "mp4-muxer";
import { formatPrice } from "@/lib/utils";
import { TYPE_LABELS } from "@/data";
import { IconBolt, IconCheck } from "@/components/icons";

// Codec H.264 dari level rendah→tinggi; dipilih yang didukung untuk resolusi target.
const AVC_CODECS = ["avc1.640034", "avc1.640033", "avc1.64002A", "avc1.640028", "avc1.4D0028", "avc1.420028", "avc1.42001f"];
async function pickAvcCodec(width, height, framerate, bitrate) {
  if (typeof VideoEncoder === "undefined") return null;
  for (const codec of AVC_CODECS) {
    try {
      const { supported } = await VideoEncoder.isConfigSupported({ codec, width, height, framerate, bitrate });
      if (supported) return codec;
    } catch {}
  }
  return null;
}

const FORMATS = {
  story: { w: 1080, h: 1920, label: "Story · Reels · TikTok", hint: "9:16 — IG/FB Story, Reels, TikTok, WA Status" },
  post: { w: 1080, h: 1350, label: "Post IG (4:5)", hint: "Feed Instagram portrait — jangkauan terbaik" },
  square: { w: 1080, h: 1080, label: "Square (1:1)", hint: "Feed Instagram & Facebook" },
  wide: { w: 1920, h: 1080, label: "Landscape (16:9)", hint: "YouTube, Facebook, website" },
};

const INK = "#171311";
const PAPER = "#F7F4EE";
const PINE = "#214735";
const PINE_DK = "#152D22";
const SAND = "#B08A4F";
const SAND_LT = "#E2CCA8";
const MIST = "#C7D8CE";

// Tanpa foto → adegan latar bermerek (hijau pinus), BUKAN foto rumah palsu.
const proxied = (u) => (!u ? null : u.startsWith("/") ? u : `/api/admin/img-proxy?url=${encodeURIComponent(u)}`);

// ---------- konten: susun adegan dari data listing ----------
function buildScenes(l) {
  const imgs = l.images?.length ? l.images : [null];
  const scenes = [];
  scenes.push({ kind: "hook", img: imgs[0], dur: 3.0 });
  scenes.push({ kind: "price", img: imgs[1] || imgs[0], dur: 3.0 });
  imgs.slice(1, 3).forEach((img, i) => scenes.push({ kind: "photo", img, caption: l.photoCaptions?.[i + 1] || "", dur: 2.6 }));
  (l.sellingPoints || []).slice(0, 2).forEach((sp, i) =>
    scenes.push({ kind: "point", sp, img: imgs[(i + 2) % imgs.length], dur: 3.0 })
  );
  if (l.locationInsight?.nearby?.length) {
    scenes.push({ kind: "nearby", rows: l.locationInsight.nearby.slice(0, 4), dur: 3.4 });
  }
  scenes.push({ kind: "cta", img: imgs[0], dur: 3.4 });
  return scenes;
}

// ---------- util gambar & teks ----------
function loadImage(src) {
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => resolve(null);
    im.src = src;
  });
}

function coverKenBurns(ctx, im, w, h, p, dir = 0) {
  if (!im) return;
  const scale = 1.08 + 0.12 * p;
  const base = Math.max(w / im.width, h / im.height) * scale;
  const dw = im.width * base;
  const dh = im.height * base;
  const panX = (dir % 2 === 0 ? 1 : -1) * (dw - w) * 0.18 * p;
  ctx.drawImage(im, (w - dw) / 2 + panX, (h - dh) / 2, dw, dh);
}

function shade(ctx, w, h, strength = 0.62) {
  const g = ctx.createLinearGradient(0, h * 0.25, 0, h);
  g.addColorStop(0, "rgba(21,45,34,0.06)");
  g.addColorStop(1, `rgba(16,26,21,${strength + 0.3})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function wrapText(ctx, text, maxWidth, maxLines = 3) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let cur = "";
  for (const wd of words) {
    const test = (cur + " " + wd).trim();
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = wd;
      if (lines.length === maxLines) break;
    } else cur = test;
  }
  if (lines.length < maxLines && cur) lines.push(cur);
  else if (lines.length === maxLines && cur) lines[maxLines - 1] = lines[maxLines - 1].replace(/\s+\S*$/, "") + "…";
  return lines;
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// ---------- musik latar: disintesis sendiri (bebas royalti) ----------
// Pad akor hangat (Cmaj7→Am7→Fmaj7→G6) + arpeggio lembut, fade in/out.
async function synthMusic(durationSec) {
  const sr = 44100;
  const ctx = new OfflineAudioContext(2, Math.ceil(sr * durationSec), sr);
  const master = ctx.createGain();
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 2000;
  master.connect(lp).connect(ctx.destination);
  master.gain.setValueAtTime(0.0001, 0);
  master.gain.linearRampToValueAtTime(0.9, 1.2);
  master.gain.setValueAtTime(0.9, Math.max(1.2, durationSec - 1.6));
  master.gain.linearRampToValueAtTime(0.0001, durationSec);

  const CHORDS = [
    [261.63, 329.63, 392.0, 493.88], // Cmaj7
    [220.0, 261.63, 329.63, 392.0], // Am7
    [174.61, 220.0, 261.63, 329.63], // Fmaj7
    [196.0, 246.94, 293.66, 369.99], // G6(add F#)
  ];
  const BAR = 2.4; // detik per akor

  for (let t = 0; t < durationSec; t += BAR) {
    const chord = CHORDS[Math.round(t / BAR) % CHORDS.length];
    // pad: 2 osilator detune per nada
    chord.forEach((f) => {
      [-4, 4].forEach((cents) => {
        const o = ctx.createOscillator();
        o.type = "triangle";
        o.frequency.value = f;
        o.detune.value = cents;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.028, t + 0.7);
        g.gain.linearRampToValueAtTime(0.0001, Math.min(t + BAR + 0.5, durationSec));
        o.connect(g).connect(master);
        o.start(t);
        o.stop(Math.min(t + BAR + 0.6, durationSec));
      });
    });
    // arpeggio: nada akor satu oktaf di atas, tiap 0.6s
    for (let i = 0; i < 4; i++) {
      const ts = t + i * 0.6;
      if (ts >= durationSec - 0.4) break;
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = chord[(i * 2) % chord.length] * 2;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.05, ts);
      g.gain.exponentialRampToValueAtTime(0.0004, ts + 0.55);
      o.connect(g).connect(master);
      o.start(ts);
      o.stop(ts + 0.6);
    }
  }
  return ctx.startRendering();
}

async function aacSupported() {
  if (typeof AudioEncoder === "undefined") return false;
  try {
    const { supported } = await AudioEncoder.isConfigSupported({ codec: "mp4a.40.2", sampleRate: 44100, numberOfChannels: 2, bitrate: 128000 });
    return supported;
  } catch {
    return false;
  }
}

const easeOut = (t) => 1 - Math.pow(1 - t, 3);
// masuk-lembut untuk blok teks: fade + naik
function rise(p, delay = 0) {
  const t = Math.min(1, Math.max(0, (p * 2.2 - delay)));
  return { a: easeOut(t), dy: (1 - easeOut(t)) * 46 };
}

export default function VideoStudio({ listings = [], initialSlug = "", brand = {} }) {
  const BRAND_NAME = brand.brandName || "RumahPlus";
  const BRAND_PHONE = brand.agentPhone || "";
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const [slug, setSlug] = useState(
    listings.some((l) => l.slug === initialSlug) ? initialSlug : listings[0]?.slug || ""
  );
  const [format, setFormat] = useState("story");
  const [phase, setPhase] = useState("idle"); // idle | loading | preview | recording | done
  const [music, setMusic] = useState(true);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoExt, setVideoExt] = useState("mp4");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const listing = useMemo(() => listings.find((l) => l.slug === slug) || listings[0], [listings, slug]);
  const scenes = useMemo(() => (listing ? buildScenes(listing) : []), [listing]);
  const total = useMemo(() => scenes.reduce((s, x) => s + x.dur, 0), [scenes]);

  const caption = useMemo(() => {
    if (!listing) return "";
    if (listing.marketing?.instagram) {
      return `${listing.marketing.instagram}\n\n${(listing.marketing.hashtags || []).map((h) => "#" + h).join(" ")}`;
    }
    const price = formatPrice(listing.price, listing.listing, listing.priceUnit);
    const phone = listing.agent?.phone || BRAND_PHONE;
    return `${listing.listing === "sewa" ? "DISEWAKAN" : "DIJUAL"} — ${listing.title}\n📍 ${[listing.cluster, listing.location].filter(Boolean).join(", ")}\n💰 ${price}${phone ? `\n\nInfo & survei: ${phone}` : ""}\n\n#properti #rumahdijual #${(listing.city || "indonesia").toLowerCase().replace(/\s+/g, "")}`;
  }, [listing, BRAND_PHONE]);

  useEffect(() => stopAll, []); // bersihkan saat unmount
  function stopAll() {
    cancelAnimationFrame(rafRef.current);
  }

  // ---------- gambar satu frame pada waktu t ----------
  function drawFrame(ctx, imgsMap, t, w, h) {
    const u = Math.min(w, h) / 1080; // unit skala lintas format
    let acc = 0;
    let scene = scenes[scenes.length - 1];
    let sp = 1;
    let idx = scenes.length - 1;
    for (let i = 0; i < scenes.length; i++) {
      if (t < acc + scenes[i].dur) {
        scene = scenes[i];
        sp = (t - acc) / scenes[i].dur;
        idx = i;
        break;
      }
      acc += scenes[i].dur;
    }

    ctx.clearRect(0, 0, w, h);
    const im = imgsMap[scene.img];
    const price = formatPrice(listing.price, listing.listing, listing.priceUnit);
    const where = [listing.cluster, listing.location].filter(Boolean).join(", ");
    const M = 72 * u; // margin

    // latar
    if (scene.kind === "nearby") {
      ctx.fillStyle = PINE;
      ctx.fillRect(0, 0, w, h);
    } else {
      ctx.fillStyle = PINE_DK;
      ctx.fillRect(0, 0, w, h);
      coverKenBurns(ctx, im, w, h, sp, idx);
      shade(ctx, w, h, scene.kind === "photo" ? 0.42 : 0.6);
    }

    // brand atas
    ctx.textBaseline = "alphabetic";
    ctx.font = `800 ${44 * u}px "Nunito Sans", sans-serif`;
    ctx.fillStyle = PAPER;
    ctx.fillText(BRAND_NAME, M, M + 30 * u);

    const bottom = h - M;

    if (scene.kind === "hook") {
      const r1 = rise(sp, 0);
      ctx.globalAlpha = r1.a;
      // pill status
      const label = `${listing.listing === "sewa" ? "DISEWAKAN" : "DIJUAL"} · ${(TYPE_LABELS[listing.type] || "PROPERTI").toUpperCase()}`;
      ctx.font = `800 ${30 * u}px "Nunito Sans", sans-serif`;
      const pw = ctx.measureText(label).width + 56 * u;
      rr(ctx, M, bottom - 430 * u + r1.dy, pw, 66 * u, 33 * u);
      ctx.fillStyle = SAND;
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.fillText(label, M + 28 * u, bottom - 430 * u + 45 * u + r1.dy);
      // judul
      const r2 = rise(sp, 0.25);
      ctx.globalAlpha = r2.a;
      ctx.fillStyle = PAPER;
      ctx.font = `800 ${84 * u}px "Nunito Sans", sans-serif`;
      wrapText(ctx, listing.title, w - M * 2, 3).forEach((ln, i) => ctx.fillText(ln, M, bottom - 300 * u + i * 96 * u + r2.dy));
      // lokasi
      const r3 = rise(sp, 0.45);
      ctx.globalAlpha = r3.a;
      ctx.fillStyle = MIST;
      ctx.font = `700 ${40 * u}px "Nunito Sans", sans-serif`;
      ctx.fillText(clipLine(ctx, where, w - M * 2), M, bottom + r3.dy);
      ctx.globalAlpha = 1;
    }

    if (scene.kind === "price") {
      const r1 = rise(sp, 0);
      ctx.globalAlpha = r1.a;
      ctx.fillStyle = SAND_LT;
      ctx.font = `800 ${34 * u}px "Nunito Sans", sans-serif`;
      ctx.fillText("HARGA PENAWARAN", M, bottom - 360 * u + r1.dy);
      const r2 = rise(sp, 0.2);
      ctx.globalAlpha = r2.a;
      ctx.fillStyle = PAPER;
      ctx.font = `800 ${118 * u}px "Nunito Sans", sans-serif`;
      ctx.fillText(price, M, bottom - 240 * u + r2.dy);
      // chips spesifikasi
      const chips = [];
      if (listing.bedrooms > 0) chips.push(`${listing.bedrooms} KT`);
      if (listing.bathrooms > 0) chips.push(`${listing.bathrooms} KM`);
      if (listing.landSize > 0) chips.push(`LT ${listing.landSize}`);
      if (listing.buildingSize > 0) chips.push(`LB ${listing.buildingSize}`);
      if (listing.certificate) chips.push(listing.certificate);
      const r3 = rise(sp, 0.4);
      ctx.globalAlpha = r3.a;
      ctx.font = `800 ${34 * u}px "Nunito Sans", sans-serif`;
      let cx = M;
      let cy = bottom - 150 * u + r3.dy;
      chips.forEach((c) => {
        const cw2 = ctx.measureText(c).width + 52 * u;
        if (cx + cw2 > w - M) { cx = M; cy += 84 * u; }
        rr(ctx, cx, cy, cw2, 68 * u, 20 * u);
        ctx.fillStyle = "rgba(247,244,238,0.14)";
        ctx.fill();
        ctx.strokeStyle = "rgba(247,244,238,0.35)";
        ctx.lineWidth = 2 * u;
        ctx.stroke();
        ctx.fillStyle = PAPER;
        ctx.fillText(c, cx + 26 * u, cy + 47 * u);
        cx += cw2 + 20 * u;
      });
      ctx.globalAlpha = 1;
    }

    if (scene.kind === "photo") {
      if (scene.caption) {
        const r1 = rise(sp, 0.15);
        ctx.globalAlpha = r1.a;
        ctx.font = `800 ${42 * u}px "Nunito Sans", sans-serif`;
        const lines = wrapText(ctx, scene.caption, w - M * 2 - 60 * u, 2);
        const bh = lines.length * 56 * u + 48 * u;
        rr(ctx, M, bottom - bh + r1.dy, w - M * 2, bh, 24 * u);
        ctx.fillStyle = "rgba(23,19,17,0.72)";
        ctx.fill();
        ctx.fillStyle = PAPER;
        lines.forEach((ln, i) => ctx.fillText(ln, M + 30 * u, bottom - bh + 62 * u + i * 56 * u + r1.dy));
        ctx.globalAlpha = 1;
      }
    }

    if (scene.kind === "point") {
      const spx = scene.sp || {};
      const r1 = rise(sp, 0);
      ctx.globalAlpha = r1.a;
      ctx.fillStyle = "#8FB59D";
      ctx.font = `800 ${32 * u}px "Nunito Sans", sans-serif`;
      ctx.fillText((spx.aspect || "KEUNGGULAN").toUpperCase(), M, bottom - 330 * u + r1.dy);
      const r2 = rise(sp, 0.2);
      ctx.globalAlpha = r2.a;
      ctx.fillStyle = PAPER;
      ctx.font = `800 ${66 * u}px "Nunito Sans", sans-serif`;
      wrapText(ctx, spx.point, w - M * 2, 3).forEach((ln, i) => ctx.fillText(ln, M, bottom - 240 * u + i * 78 * u + r2.dy));
      if (spx.detail) {
        const r3 = rise(sp, 0.4);
        ctx.globalAlpha = r3.a;
        ctx.fillStyle = MIST;
        ctx.font = `600 ${34 * u}px "Nunito Sans", sans-serif`;
        wrapText(ctx, spx.detail, w - M * 2, 2).forEach((ln, i) => ctx.fillText(ln, M, bottom - 10 * u + i * 46 * u + r3.dy - 40 * u));
      }
      ctx.globalAlpha = 1;
    }

    if (scene.kind === "nearby") {
      const r1 = rise(sp, 0);
      ctx.globalAlpha = r1.a;
      ctx.fillStyle = SAND_LT;
      ctx.font = `800 ${34 * u}px "Nunito Sans", sans-serif`;
      ctx.fillText("LOKASI STRATEGIS", M, M + 150 * u + r1.dy);
      ctx.fillStyle = PAPER;
      ctx.font = `800 ${62 * u}px "Nunito Sans", sans-serif`;
      wrapText(ctx, where, w - M * 2, 2).forEach((ln, i) => ctx.fillText(ln, M, M + 240 * u + i * 74 * u + r1.dy));
      // baris tempat terdekat
      scene.rows.forEach((n, i) => {
        const rr2 = rise(sp, 0.25 + i * 0.12);
        ctx.globalAlpha = rr2.a;
        const y = M + 420 * u + i * 120 * u + rr2.dy;
        rr(ctx, M, y, w - M * 2, 96 * u, 22 * u);
        ctx.fillStyle = "rgba(247,244,238,0.1)";
        ctx.fill();
        ctx.fillStyle = PAPER;
        ctx.font = `800 ${36 * u}px "Nunito Sans", sans-serif`;
        ctx.fillText(clipLine(ctx, n.name, w - M * 2 - 260 * u), M + 30 * u, y + 62 * u);
        if (n.minutes) {
          ctx.fillStyle = SAND_LT;
          ctx.textAlign = "right";
          ctx.fillText(`${n.minutes} mnt`, w - M - 30 * u, y + 62 * u);
          ctx.textAlign = "left";
        }
      });
      ctx.globalAlpha = 1;
    }

    if (scene.kind === "cta") {
      const ag = listing.agent || {};
      const r1 = rise(sp, 0);
      ctx.globalAlpha = r1.a;
      ctx.fillStyle = SAND;
      ctx.fillRect(M, bottom - 420 * u + r1.dy, 130 * u, 10 * u);
      ctx.fillStyle = PAPER;
      ctx.font = `800 ${76 * u}px "Nunito Sans", sans-serif`;
      wrapText(ctx, "Jadwalkan survei sekarang", w - M * 2, 2).forEach((ln, i) => ctx.fillText(ln, M, bottom - 330 * u + i * 88 * u + r1.dy));
      const r2 = rise(sp, 0.3);
      ctx.globalAlpha = r2.a;
      ctx.fillStyle = SAND_LT;
      ctx.font = `800 ${52 * u}px "Nunito Sans", sans-serif`;
      const ctaPhone = ag.phone || BRAND_PHONE;
      if (ctaPhone) ctx.fillText(ctaPhone, M, bottom - 120 * u + r2.dy);
      ctx.fillStyle = MIST;
      ctx.font = `700 ${34 * u}px "Nunito Sans", sans-serif`;
      ctx.fillText(clipLine(ctx, ag.company || BRAND_NAME, w - M * 2), M, bottom - 40 * u + r2.dy);
      ctx.globalAlpha = 1;
    }

    // fade global antar-adegan
    const fadeT = 0.35;
    const tin = sp * scene.dur;
    const tout = (1 - sp) * scene.dur;
    let a = 0;
    if (tin < fadeT && idx > 0) a = 1 - tin / fadeT;
    if (tout < fadeT && idx < scenes.length - 1) a = Math.max(a, 1 - tout / fadeT);
    if (a > 0) {
      ctx.fillStyle = `rgba(21,45,34,${a})`;
      ctx.fillRect(0, 0, w, h);
    }

    function clipLine(c, s2, maxW) {
      let s3 = String(s2 || "");
      while (c.measureText(s3).width > maxW && s3.length > 2) s3 = s3.slice(0, -2);
      return s3.length < String(s2 || "").length ? s3 + "…" : s3;
    }
  }

  // ---------- muat foto & siapkan kanvas ----------
  async function prepare() {
    await document.fonts.ready;
    const urls = [...new Set(scenes.map((s) => s.img).filter(Boolean))];
    const loaded = await Promise.all(urls.map((u2) => (proxied(u2) ? loadImage(proxied(u2)) : Promise.resolve(null))));
    const imgsMap = {};
    urls.forEach((u2, i) => (imgsMap[u2] = loaded[i]));
    const { w, h } = FORMATS[format];
    const canvas = canvasRef.current;
    canvas.width = w;
    canvas.height = h;
    return { imgsMap, w, h, ctx: canvas.getContext("2d"), canvas };
  }

  // ---------- pratinjau realtime ----------
  async function startPreview() {
    if (!listing) return;
    setError("");
    setVideoUrl("");
    setPhase("loading");
    try {
      const { imgsMap, w, h, ctx } = await prepare();
      setPhase("preview");
      const t0 = performance.now();
      const loop = () => {
        const t = (performance.now() - t0) / 1000;
        setProgress(Math.min(1, t / total));
        drawFrame(ctx, imgsMap, Math.min(t, total - 0.001), w, h);
        if (t < total) rafRef.current = requestAnimationFrame(loop);
        else setPhase("idle");
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (err) {
      setError(String(err?.message || err));
      setPhase("idle");
    }
  }

  // ---------- render video: WebCodecs (MP4, frame-perfect) → fallback MediaRecorder ----------
  async function startRender() {
    if (!listing) return;
    setError("");
    setVideoUrl("");
    setPhase("loading");
    try {
      const { imgsMap, w, h, ctx, canvas } = await prepare();
      const fps = 30;
      const frames = Math.round(total * fps);
      const bitrate = 9_000_000;
      const codec = await pickAvcCodec(w, h, fps, bitrate);

      setPhase("recording");

      if (codec) {
        // Jalur utama: encode frame-per-frame (deterministik, hasil MP4 asli).
        const withMusic = music && (await aacSupported());
        const muxer = new Muxer({
          target: new ArrayBufferTarget(),
          video: { codec: "avc", width: w, height: h },
          ...(withMusic ? { audio: { codec: "aac", sampleRate: 44100, numberOfChannels: 2 } } : {}),
          fastStart: "in-memory",
          firstTimestampBehavior: "offset",
        });
        let encErr = null;
        const encoder = new VideoEncoder({
          output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
          error: (e) => (encErr = e),
        });
        encoder.configure({ codec, width: w, height: h, bitrate, framerate: fps });

        // Yield lewat MessageChannel: tidak di-throttle browser (aman
        // walau tab di belakang) — beda dengan rAF/setTimeout.
        const tick = () =>
          new Promise((r) => {
            const ch = new MessageChannel();
            ch.port1.onmessage = () => r();
            ch.port2.postMessage(0);
          });

        for (let i = 0; i < frames; i++) {
          if (encErr) throw encErr;
          drawFrame(ctx, imgsMap, i / fps, w, h);
          const frame = new VideoFrame(canvas, { timestamp: Math.round((i * 1e6) / fps), duration: Math.round(1e6 / fps) });
          encoder.encode(frame, { keyFrame: i % (fps * 2) === 0 });
          frame.close();
          if (i % 5 === 0) {
            setProgress(i / frames);
            await tick();
            // jangan banjiri antrean encoder software
            while (encoder.encodeQueueSize > 12) await tick();
          }
        }
        await encoder.flush();

        // Musik latar → AAC (setelah video; muxer menata interleaving-nya)
        if (withMusic) {
          const audioBuf = await synthMusic(total);
          let aErr = null;
          const aEnc = new AudioEncoder({
            output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
            error: (e) => (aErr = e),
          });
          aEnc.configure({ codec: "mp4a.40.2", sampleRate: 44100, numberOfChannels: 2, bitrate: 128000 });
          const CH = 1024;
          const L = audioBuf.getChannelData(0);
          const R = audioBuf.getChannelData(1);
          for (let off = 0; off < audioBuf.length; off += CH) {
            if (aErr) throw aErr;
            const n = Math.min(CH, audioBuf.length - off);
            const data = new Float32Array(n * 2);
            data.set(L.subarray(off, off + n), 0);
            data.set(R.subarray(off, off + n), n);
            const ad = new AudioData({
              format: "f32-planar",
              sampleRate: 44100,
              numberOfFrames: n,
              numberOfChannels: 2,
              timestamp: Math.round((off / 44100) * 1e6),
              data,
            });
            aEnc.encode(ad);
            ad.close();
          }
          await aEnc.flush();
        }

        muxer.finalize();
        const blob = new Blob([muxer.target.buffer], { type: "video/mp4" });
        if (!blob.size) throw new Error("Render menghasilkan file kosong — coba lagi.");
        setVideoExt("mp4");
        setVideoUrl(URL.createObjectURL(blob));
        setProgress(1);
        setPhase("done");
        return;
      }

      // Fallback: MediaRecorder realtime (browser lama).
      const stream = canvas.captureStream(fps);
      const mime = ["video/webm;codecs=vp9", "video/webm", "video/mp4"].find(
        (m) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)
      );
      if (!mime) throw new Error("Browser tidak mendukung pembuatan video. Pakai Chrome/Edge terbaru.");
      setVideoExt(mime.startsWith("video/mp4") ? "mp4" : "webm");
      const chunks = [];
      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: bitrate });
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType });
        if (!blob.size) {
          setError("Perekaman gagal di browser ini. Pakai Chrome/Edge terbaru.");
          setPhase("idle");
          return;
        }
        setVideoUrl(URL.createObjectURL(blob));
        setPhase("done");
      };
      recorder.start(250);
      const t0 = performance.now();
      const loop = () => {
        const t = (performance.now() - t0) / 1000;
        setProgress(Math.min(1, t / total));
        drawFrame(ctx, imgsMap, Math.min(t, total - 0.001), w, h);
        if (t < total) rafRef.current = requestAnimationFrame(loop);
        else recorder.stop();
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (err) {
      setError(String(err?.message || err));
      setPhase("idle");
    }
  }

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }

  if (!listings.length) {
    return (
      <div className="card p-10 text-center">
        <p className="text-xl font-extrabold text-ink">Belum ada listing</p>
        <p className="mt-2 text-lg text-ink-soft">Buat listing dulu lewat Studio Listing atau Otomasi.</p>
      </div>
    );
  }

  const fmt = FORMATS[format];
  const busy = phase === "loading" || phase === "recording" || phase === "preview";

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,460px)_1fr]">
      {/* KONTROL */}
      <div className="space-y-6">
        <div className="card space-y-5 p-7">
          <div>
            <span className="label">Properti</span>
            <select value={slug} onChange={(e) => setSlug(e.target.value)} className="field" disabled={busy}>
              {listings.map((l) => <option key={l.slug} value={l.slug}>{l.title}</option>)}
            </select>
          </div>
          <div>
            <span className="label">Ukuran</span>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(FORMATS).map(([k, f]) => (
                <button
                  key={k}
                  onClick={() => setFormat(k)}
                  disabled={busy}
                  className={`rounded-2xl border-2 p-4 text-left transition ${format === k ? "border-pine-700 bg-pine-50" : "border-ink/10 bg-white hover:border-ink/30"}`}
                >
                  <div className="text-base font-extrabold text-ink">{f.label}</div>
                  <div className="text-sm font-semibold text-ink-faint">{f.hint}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-pine-50 p-4 text-base font-bold text-ink-soft">
            {scenes.length} adegan · ± {Math.round(total)} detik · {fmt.w}×{fmt.h}
          </div>
          <label className="flex items-center gap-3 text-lg font-bold text-ink">
            <input type="checkbox" checked={music} onChange={(e) => setMusic(e.target.checked)} className="h-5 w-5 accent-pine-700" disabled={busy} />
            Musik latar (original — bebas royalti, aman dari klaim hak cipta)
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button onClick={startPreview} disabled={busy} className="btn-outline flex-1 disabled:opacity-50">
              Pratinjau
            </button>
            <button onClick={startRender} disabled={busy} className="btn-primary flex-1 disabled:opacity-50">
              <IconBolt size={20} /> {phase === "recording" ? "Merekam…" : "Buat video"}
            </button>
          </div>
          {busy && (
            <div className="h-3 overflow-hidden rounded-full bg-ink/10">
              <div className="h-full rounded-full bg-pine-700 transition-[width]" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
          )}
          {error && <p className="text-base font-bold text-red-700">{error}</p>}
          {videoUrl && (
            <a href={videoUrl} download={`${listing.slug}-${format}.${videoExt}`} className="btn-primary w-full">
              <IconCheck size={20} /> Unduh video (.{videoExt})
            </a>
          )}
        </div>

        {/* CAPTION SIAP TEMPEL */}
        <div className="card p-7">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-ink">Caption siap tempel</h2>
            <button onClick={copyCaption} className="text-base font-extrabold text-pine-700 hover:underline">
              {copied ? "Tersalin ✓" : "Salin"}
            </button>
          </div>
          <textarea readOnly value={caption} className="field mt-3 min-h-[180px] text-base" />
        </div>
      </div>

      {/* KANVAS / HASIL */}
      <div className="card flex items-start justify-center p-7">
        <div style={{ maxWidth: fmt.w >= fmt.h ? 640 : 340 }} className="w-full">
          <canvas
            ref={canvasRef}
            width={fmt.w}
            height={fmt.h}
            className={`w-full rounded-3xl border border-ink/10 bg-pine-900 ${videoUrl && phase === "done" ? "hidden" : ""}`}
          />
          {videoUrl && phase === "done" && (
            <video src={videoUrl} controls autoPlay loop playsInline className="w-full rounded-3xl border border-ink/10 bg-ink" />
          )}
          <p className="mt-3 text-center text-base font-semibold text-ink-faint">
            {phase === "done" ? "Video jadi — putar untuk cek, lalu unduh." : `${fmt.label} · konten otomatis dari data listing`}
          </p>
        </div>
      </div>
    </div>
  );
}
