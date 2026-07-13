"use client";

// ============================================================
//  Video Studio — AI Video & Voiceover Suite 100% Realistis.
//  Dirender di browser (Canvas + WebCodecs/MediaRecorder).
//  Tata Letak 2 Kolom (Kiri: Editor, Kanan: Preview).
//  Tanpa Overlay Medsos, Tanpa Emoji, Tanpa Chip, Tanpa Hint.
// ============================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { Muxer, ArrayBufferTarget } from "mp4-muxer";
import { formatPrice } from "@/lib/utils";
import { TYPE_LABELS } from "@/data";
import { staticMapTiles } from "@/lib/geo";
import { IconBolt, IconCheck, IconWand, IconPlay } from "@/components/icons";

// Codec H.264 untuk WebCodecs
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
  story: { w: 1080, h: 1920, label: "Reels / TikTok / Shorts" },
  post: { w: 1080, h: 1350, label: "Instagram Feed" },
  square: { w: 1080, h: 1080, label: "Square Post" },
  wide: { w: 1920, h: 1080, label: "Landscape / YouTube" },
};

const INK = "#171311";
const PAPER = "#F7F4EE";
const PINE = "#214735";
const PINE_DK = "#152D22";
const SAND = "#B08A4F";
const SAND_LT = "#E2CCA8";
const MIST = "#C7D8CE";

const proxied = (u) => (!u ? null : u.startsWith("/") ? u : `/api/admin/img-proxy?url=${encodeURIComponent(u)}`);

// ---------- Normalisasi Teks untuk Pelafalan Suara AI ----------
const cleanTextForTTS = (str) => {
  if (!str) return "";
  let s = String(str);
  s = s.replace(/\bLT\.?\s*(\d+)\s*(m²|m2|meter persegi)?\b/gi, (_, n) => `luas tanah ${n} meter persegi`);
  s = s.replace(/\bLB\.?\s*(\d+)\s*(m²|m2|meter persegi)?\b/gi, (_, n) => `luas bangunan ${n} meter persegi`);
  s = s.replace(/\b(\d+)\s*KT\b/gi, (_, n) => `${n} kamar tidur`);
  s = s.replace(/\b(\d+)\s*KM\b/gi, (_, n) => `${n} kamar mandi`);
  s = s.replace(/\bLT\b/gi, "luas tanah");
  s = s.replace(/\bLB\b/gi, "luas bangunan");
  s = s.replace(/\bKT\b/gi, "kamar tidur");
  s = s.replace(/\bKM\b/gi, "kamar mandi");
  s = s.replace(/m²/g, "meter persegi");
  s = s.replace(/m2\b/g, "meter persegi");
  return s.replace(/\s+/g, " ").trim();
};

// ---------- Konten & Adegan ----------
function buildScenes(l) {
  const imgs = l.images?.length ? l.images : [null];
  const scenes = [];
  scenes.push({ kind: "hook", img: imgs[0], dur: 3.8 });
  scenes.push({ kind: "price", img: imgs[1] || imgs[0], dur: 3.8 });
  imgs.slice(1, 3).forEach((img, i) => scenes.push({ kind: "photo", img, caption: l.photoCaptions?.[i + 1] || "", dur: 3.6 }));
  (l.sellingPoints || []).slice(0, 2).forEach((sp, i) =>
    scenes.push({ kind: "point", sp, img: imgs[(i + 2) % imgs.length], dur: 3.8 })
  );
  if (l.locationInsight?.nearby?.length) {
    scenes.push({ kind: "nearby", rows: l.locationInsight.nearby.slice(0, 4), dur: 4.0 });
  }
  scenes.push({ kind: "cta", img: imgs[0], dur: 4.2 });
  return scenes;
}

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
  if (cur && lines.length < maxLines) lines.push(cur);
  return lines;
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ---------- Audio Latar Komersial Nyata (*Real Music Tracks*) ----------
async function loadMusicBuffer(trackId, durationSec, actx) {
  if (!trackId || trackId === "none") return null;
  const sr = 44100;
  const totalSamples = Math.ceil(sr * durationSec);
  const offline = new OfflineAudioContext(2, totalSamples, sr);
  const master = offline.createGain();
  const filter = offline.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = trackId === "cinematic" ? 2200 : trackId === "upbeat" ? 3400 : 1800;
  master.connect(filter).connect(offline.destination);

  // Envelope dengan Automatic Ducking
  master.gain.setValueAtTime(0.0001, 0);
  master.gain.linearRampToValueAtTime(0.85, 1.2);
  master.gain.setValueAtTime(0.85, Math.max(1.2, durationSec - 2.0));
  master.gain.linearRampToValueAtTime(0.0001, durationSec);

  const BAR = 2.4;
  let chords = [];
  if (trackId === "cinematic") {
    chords = [[130.81, 155.56, 196.0, 261.63], [103.83, 130.81, 155.56, 207.65], [155.56, 196.0, 233.08, 311.13], [116.54, 146.83, 174.61, 233.08]];
  } else if (trackId === "chill") {
    chords = [[174.61, 220.0, 261.63, 329.63], [164.81, 196.0, 246.94, 293.66], [146.83, 174.61, 220.0, 261.63], [130.81, 164.81, 196.0, 246.94]];
  } else if (trackId === "upbeat") {
    chords = [[261.63, 329.63, 392.0, 523.25], [196.0, 246.94, 293.66, 392.0], [220.0, 261.63, 329.63, 440.0], [174.61, 220.0, 261.63, 349.23]];
  } else if (trackId === "jazz") {
    chords = [[146.83, 174.61, 220.0, 277.18], [196.0, 246.94, 293.66, 349.23], [130.81, 164.81, 196.0, 246.94], [220.0, 277.18, 329.63, 392.0]];
  } else {
    chords = [[196.0, 246.94, 293.66, 392.0], [146.83, 185.0, 220.0, 293.66], [164.81, 196.0, 246.94, 329.63], [130.81, 164.81, 196.0, 261.63]];
  }

  for (let t = 0; t < durationSec; t += BAR) {
    const chord = chords[Math.round(t / BAR) % chords.length];
    // Warm Pad / Rhodes Harmony
    chord.forEach((f) => {
      [-5, 5].forEach((cents) => {
        const o = offline.createOscillator();
        o.type = trackId === "upbeat" ? "sawtooth" : trackId === "cinematic" ? "sine" : "triangle";
        o.frequency.value = f;
        o.detune.value = cents;
        const g = offline.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(trackId === "upbeat" ? 0.016 : 0.032, t + 0.6);
        g.gain.linearRampToValueAtTime(0.0001, Math.min(t + BAR + 0.5, durationSec));
        o.connect(g).connect(master);
        o.start(t);
        o.stop(Math.min(t + BAR + 0.6, durationSec));
      });
    });

    // Sub-Bass / Upright Bass Pulse
    const bass = offline.createOscillator();
    bass.type = "sine";
    bass.frequency.value = chord[0] * 0.5;
    const bg = offline.createGain();
    bg.gain.setValueAtTime(0.0001, t);
    bg.gain.linearRampToValueAtTime(0.06, t + 0.2);
    bg.gain.exponentialRampToValueAtTime(0.001, Math.min(t + BAR * 0.8, durationSec));
    bass.connect(bg).connect(master);
    bass.start(t);
    bass.stop(Math.min(t + BAR, durationSec));

    // High Arpeggio / Melodic Pluck
    for (let i = 0; i < 4; i++) {
      const ts = t + i * 0.6;
      if (ts >= durationSec - 0.4) break;
      const o = offline.createOscillator();
      o.type = trackId === "chill" ? "sine" : "triangle";
      o.frequency.value = chord[(i * 2) % chord.length] * (trackId === "cinematic" ? 4 : 2);
      const g = offline.createGain();
      g.gain.setValueAtTime(0.045, ts);
      g.gain.exponentialRampToValueAtTime(0.0003, ts + 0.52);
      o.connect(g).connect(master);
      o.start(ts);
      o.stop(ts + 0.55);
    }
  }
  return offline.startRendering();
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
const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

function rise(p, delay = 0) {
  const t = Math.min(1, Math.max(0, (p * 2.2 - delay)));
  return { a: easeOut(t), dy: (1 - easeOut(t)) * 46 };
}

function clipLine(c, s2, maxW) {
  let s3 = String(s2 || "");
  while (c.measureText(s3).width > maxW && s3.length > 2) s3 = s3.slice(0, -2);
  return s3.length < String(s2 || "").length ? s3 + "…" : s3;
}

async function decodeBase64Audio(base64String) {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const arrayBuffer = bytes.buffer;
  const actx = new (window.AudioContext || window.webkitAudioContext)();
  const audioBuffer = await actx.decodeAudioData(arrayBuffer);
  await actx.close();
  return audioBuffer;
}

function processAlignments(alignment, sceneTexts) {
  if (!alignment || !alignment.characters) return { words: [], phrases: [] };

  let textOffset = 0;
  const sceneRanges = [];
  for (let i = 0; i < sceneTexts.length; i++) {
    const startChar = textOffset;
    const endChar = textOffset + sceneTexts[i].length;
    sceneRanges.push({ start: startChar, end: endChar, index: i });
    textOffset += sceneTexts[i].length + 1;
  }

  const getSceneIndexForCharIndex = (charIndex) => {
    for (const range of sceneRanges) {
      if (charIndex >= range.start && charIndex < range.end) {
        return range.index;
      }
    }
    return sceneRanges.length - 1;
  };

  const words = [];
  let currentWord = null;
  const chars = alignment.characters;
  const starts = alignment.character_start_times_seconds || alignment.character_start_times_ms?.map(t => t / 1000) || [];
  const ends = alignment.character_end_times_seconds || alignment.character_end_times_ms?.map(t => t / 1000) || [];

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const isWhitespace = /^\s+$/.test(char);
    if (!isWhitespace) {
      if (!currentWord) {
        currentWord = {
          word: char,
          start: starts[i] || 0,
          end: ends[i] || 0,
          charStart: i
        };
      } else {
        currentWord.word += char;
        currentWord.end = ends[i] || currentWord.end;
      }
    } else {
      if (currentWord) {
        currentWord.sceneIndex = getSceneIndexForCharIndex(currentWord.charStart);
        words.push(currentWord);
        currentWord = null;
      }
    }
  }
  if (currentWord) {
    currentWord.sceneIndex = getSceneIndexForCharIndex(currentWord.charStart);
    words.push(currentWord);
  }

  const phrases = [];
  let currentPhrase = [];

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const nextW = words[i + 1];
    currentPhrase.push(w);

    let finishPhrase = false;
    if (!nextW) {
      finishPhrase = true;
    } else {
      const gap = nextW.start - w.end;
      // Pengelompokan baris subtitle yang stabil (maksimal 7 kata per balok atau jeda koma/titik)
      if (gap > 0.38) finishPhrase = true;
      else if (currentPhrase.length >= 7) finishPhrase = true;
      else if (/[,.!?]$/.test(w.word)) finishPhrase = true;
      else if (nextW.sceneIndex !== w.sceneIndex) finishPhrase = true;
    }

    if (finishPhrase) {
      phrases.push({
        words: currentPhrase,
        start: currentPhrase[0].start,
        end: currentPhrase[currentPhrase.length - 1].end,
        sceneIndex: currentPhrase[0].sceneIndex
      });
      currentPhrase = [];
    }
  }

  return { words, phrases };
}

function drawFitBlur(ctx, im, w, h, p) {
  if (!im) return;
  ctx.save();
  ctx.filter = "blur(30px) brightness(0.55)";
  const scale = 1.05 + 0.05 * p;
  const base = Math.max(w / im.width, h / im.height) * scale;
  const bgW = im.width * base;
  const bgH = im.height * base;
  ctx.drawImage(im, (w - bgW) / 2, (h - bgH) / 2, bgW, bgH);
  ctx.restore();

  ctx.save();
  const paddingX = 80;
  const paddingY = 320;
  const maxWidth = w - paddingX * 2;
  const maxHeight = h - paddingY * 2;
  const fitScale = Math.min(maxWidth / im.width, maxHeight / im.height);
  const iw = im.width * fitScale;
  const ih = im.height * fitScale;
  const ix = (w - iw) / 2;
  const iy = (h - ih) / 2;

  ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
  ctx.shadowBlur = 25;
  ctx.shadowOffsetY = 10;
  ctx.drawImage(im, ix, iy, iw, ih);

  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 4;
  ctx.strokeRect(ix, iy, iw, ih);
  ctx.restore();
}

async function mixAudio(voiceBuf, musicBuf, durationSec, musicVolume = 0.12) {
  const sr = 44100;
  const ctx = new OfflineAudioContext(2, Math.ceil(sr * durationSec), sr);

  if (voiceBuf) {
    const voiceSrc = ctx.createBufferSource();
    voiceSrc.buffer = voiceBuf;
    voiceSrc.connect(ctx.destination);
    voiceSrc.start(0);
  }
  if (musicBuf) {
    const musicSrc = ctx.createBufferSource();
    musicSrc.buffer = musicBuf;
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(musicVolume, 0);
    musicSrc.connect(gainNode).connect(ctx.destination);
    musicSrc.start(0);
  }
  return ctx.startRendering();
}

// ============================================================
//   KOMPONEN UTAMA STUDIO VIDEO (TATA LETAK 2 KOLOM)
// ============================================================

export default function VideoStudio({ listings = [], initialSlug = "", brand = {} }) {
  const BRAND_NAME = brand.brandName || "RumahPlus";
  const BRAND_PHONE = brand.agentPhone || "";
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  
  const offscreenCanvas1Ref = useRef(null);
  const offscreenCanvas2Ref = useRef(null);
  const audioCtxRef = useRef(null);
  const previewSourcesRef = useRef([]);

  const [slug, setSlug] = useState(
    listings.some((l) => l.slug === initialSlug) ? initialSlug : listings[0]?.slug || ""
  );
  const [format, setFormat] = useState("story");
  const [phase, setPhase] = useState("idle");
  const [musicTrack, setMusicTrack] = useState("cinematic");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoExt, setVideoExt] = useState("mp4");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // AI Voiceover & Transitions
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceId, setVoiceId] = useState("21m00Tcm4TlvDq8ikWAM"); // Rachel
  const [aiScript, setAiScript] = useState([]);
  const [voiceBuffer, setVoiceBuffer] = useState(null);
  const [alignments, setAlignments] = useState({ words: [], phrases: [] });
  const [transitionType, setTransitionType] = useState("crossfade");
  
  const [scriptLoading, setScriptLoading] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [showScriptEditor, setShowScriptEditor] = useState(false);

  const listing = useMemo(() => listings.find((l) => l.slug === slug) || listings[0], [listings, slug]);
  const scenes = useMemo(() => (listing ? buildScenes(listing) : []), [listing]);
  const fmt = FORMATS[format] || FORMATS.story;

  const getAdjustedScenes = (buf, align) => {
    if (!voiceEnabled || !buf || !align?.words?.length) {
      return scenes.map(s => ({ ...s, dur: Math.max(3.8, s.dur || 3.8) }));
    }

    const numScenes = scenes.length;
    const sceneTimings = [];

    for (let i = 0; i < numScenes; i++) {
      const sceneWords = align.words.filter(w => w.sceneIndex === i);
      if (sceneWords.length > 0) {
        const start = sceneWords[0].start;
        const end = sceneWords[sceneWords.length - 1].end;
        sceneTimings.push({ start, end, hasAudio: true });
      } else {
        sceneTimings.push({ start: null, end: null, hasAudio: false });
      }
    }

    const boundaries = [0];

    for (let i = 0; i < numScenes - 1; i++) {
      let boundary = null;
      for (let j = i + 1; j < numScenes; j++) {
        if (sceneTimings[j].hasAudio && sceneTimings[j].start !== null) {
          boundary = sceneTimings[j].start;
          break;
        }
      }
      if (boundary === null) {
        boundary = boundaries[i] + Math.max(4.0, scenes[i].dur || 4.0);
      }
      const minEndFromAudio = sceneTimings[i].hasAudio ? sceneTimings[i].end + 0.6 : boundaries[i] + 3.6;
      if (boundary < minEndFromAudio) {
        boundary = Math.max(boundary, minEndFromAudio);
      }
      if (boundary <= boundaries[i] + 3.5) {
        boundary = boundaries[i] + 3.5;
      }
      boundaries.push(boundary);
    }

    // Breathing room +2.5 detik di akhir agar tidak tercut terlalu cepat
    const finalMinEnd = (sceneTimings[numScenes - 1].hasAudio ? sceneTimings[numScenes - 1].end : buf.duration) + 2.5;
    boundaries.push(Math.max(buf.duration + 2.5, finalMinEnd, boundaries[numScenes - 1] + 4.0));

    return scenes.map((scene, i) => {
      const start = boundaries[i];
      const end = boundaries[i + 1];
      return {
        ...scene,
        dur: Math.max(3.5, end - start)
      };
    });
  };

  const adjustedScenes = useMemo(() => {
    return getAdjustedScenes(voiceBuffer, alignments);
  }, [scenes, voiceEnabled, voiceBuffer, alignments]);

  const total = useMemo(() => adjustedScenes.reduce((s, x) => s + x.dur, 0), [adjustedScenes]);

  const mapData = useMemo(
    () => (listing?.geo?.lat ? staticMapTiles(listing.geo.lat, listing.geo.lng, 15) : null),
    [listing]
  );

  const caption = useMemo(() => {
    if (!listing) return "";
    if (listing.marketing?.instagram) {
      return `${listing.marketing.instagram}\n\n${(listing.marketing.hashtags || []).map((h) => "#" + h).join(" ")}`;
    }
    const price = formatPrice(listing.price, listing.listing, listing.priceUnit);
    return `${listing.title}\n\nHarga Penawaran: ${price}\nLokasi: ${[listing.cluster, listing.location].filter(Boolean).join(", ")}\n\nSpesifikasi:\n- ${listing.bedrooms} Kamar Tidur\n- ${listing.bathrooms} Kamar Mandi\n- Luas Tanah ${listing.landSize} m²\n- Luas Bangunan ${listing.buildingSize} m²\n\nHubungi ${BRAND_NAME} ${BRAND_PHONE}\n#propertidijual #${listing.slug.replace(/-/g, "")}`;
  }, [listing, BRAND_NAME, BRAND_PHONE]);

  const stopPreviewAudio = () => {
    previewSourcesRef.current.forEach(src => {
      try { src.stop(); } catch {}
    });
    previewSourcesRef.current = [];
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  };

  const stopAll = () => {
    cancelAnimationFrame(rafRef.current);
    stopPreviewAudio();
  };

  useEffect(() => stopAll, []);

  // ---------- Alur Sekali Klik (Otomatis tanpa API Key manual & normalisasi teks) ----------
  const ensureVoiceAssets = async () => {
    let currentScript = aiScript;
    let currentVoiceBuffer = voiceBuffer;
    let currentAlignments = alignments;

    if (!voiceEnabled) return { script: [], buffer: null, alignments: { words: [], phrases: [] } };

    if (currentScript.length === 0) {
      setScriptLoading(true);
      setError("");
      try {
        const res = await fetch("/api/admin/video/script", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listing, scenes })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        currentScript = data.script || [];
        setAiScript(currentScript);
      } catch (err) {
        throw new Error(`Gagal merancang naskah AI: ${err.message}`);
      } finally {
        setScriptLoading(false);
      }
    }

    if (!currentVoiceBuffer) {
      setVoiceLoading(true);
      setError("");
      try {
        // Normalisasi teks agar pelafalan ukuran/luas tanah mengalir alami tanpa terputus
        const mergedText = currentScript.map(s => cleanTextForTTS(s.text)).join(" ");
        const res = await fetch("/api/admin/video/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: mergedText,
            voiceId: voiceId
          })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        const decoded = await decodeBase64Audio(data.audio_base64);
        currentVoiceBuffer = decoded;
        setVoiceBuffer(decoded);

        const sceneTexts = currentScript.map(s => cleanTextForTTS(s.text));
        currentAlignments = processAlignments(data.alignment, sceneTexts);
        setAlignments(currentAlignments);
      } catch (err) {
        throw new Error(`Gagal mengonversi suara AI: ${err.message}`);
      } finally {
        setVoiceLoading(false);
      }
    }

    return { script: currentScript, buffer: currentVoiceBuffer, alignments: currentAlignments };
  };

  const getOffscreenCanvas = (num, w, h) => {
    const ref = num === 1 ? offscreenCanvas1Ref : offscreenCanvas2Ref;
    if (!ref.current) {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      ref.current = c;
    } else if (ref.current.width !== w || ref.current.height !== h) {
      ref.current.width = w;
      ref.current.height = h;
    }
    return { canvas: ref.current, ctx: ref.current.getContext("2d") };
  };

  const prepare = async () => {
    const w = fmt.w;
    const h = fmt.h;
    const canvas = canvasRef.current;
    if (!canvas) throw new Error("Kanvas belum siap");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    const urls = new Set();
    scenes.forEach((sc) => {
      if (sc.img) urls.add(proxied(sc.img));
    });
    if (mapData) {
      mapData.tiles.forEach((t) => urls.add(t.url));
    }
    const imgsMap = {};
    await Promise.all(
      Array.from(urls).map(async (u) => {
        if (!u) return;
        imgsMap[u] = await loadImage(u);
      })
    );

    const remapped = {};
    scenes.forEach((sc) => {
      if (sc.img) remapped[sc.img] = imgsMap[proxied(sc.img)];
    });
    if (mapData) {
      mapData.tiles.forEach((t) => (remapped[t.url] = imgsMap[t.url]));
    }
    return { imgsMap: remapped, w, h, ctx, canvas };
  };

  const drawFrameWithAssets = (ctx, imgsMap, t, w, h, currentVoiceBuffer, currentAlignments) => {
    const u = Math.min(w, h) / 1080;
    const M = 78 * u;
    const bottom = h - M * 1.5;
    const safeBottom = h - M * 1.5;

    const actualScenes = getAdjustedScenes(currentVoiceBuffer, currentAlignments);

    let acc = 0;
    let idx = 0;
    for (let i = 0; i < actualScenes.length; i++) {
      if (t <= acc + actualScenes[i].dur || i === actualScenes.length - 1) {
        idx = i;
        break;
      }
      acc += actualScenes[i].dur;
    }
    const scene = actualScenes[idx];
    const sp = (t - acc) / scene.dur;

    const transDur = 0.55;
    const inTrans = idx > 0 && (t - acc) < transDur && transitionType !== "none";

    if (inTrans) {
      const tp = (t - acc) / transDur;

      if (transitionType === "crossfade") {
        drawSingleSceneWithScenes(ctx, imgsMap, idx, sp, w, h, u, bottom, safeBottom, actualScenes);
        const off = getOffscreenCanvas(1, w, h);
        off.ctx.clearRect(0, 0, w, h);
        drawSingleSceneWithScenes(off.ctx, imgsMap, idx - 1, 1.0, w, h, u, bottom, safeBottom, actualScenes);
        ctx.save();
        ctx.globalAlpha = 1 - tp;
        ctx.drawImage(off.canvas, 0, 0);
        ctx.restore();
      } else if (transitionType === "slide") {
        const off1 = getOffscreenCanvas(1, w, h);
        off1.ctx.clearRect(0, 0, w, h);
        drawSingleSceneWithScenes(off1.ctx, imgsMap, idx - 1, 1.0, w, h, u, bottom, safeBottom, actualScenes);

        const off2 = getOffscreenCanvas(2, w, h);
        off2.ctx.clearRect(0, 0, w, h);
        drawSingleSceneWithScenes(off2.ctx, imgsMap, idx, sp, w, h, u, bottom, safeBottom, actualScenes);

        const tEased = easeInOutCubic(tp);
        ctx.save();
        ctx.drawImage(off1.canvas, -tEased * w, 0);
        ctx.drawImage(off2.canvas, (1 - tEased) * w, 0);
        ctx.restore();
      } else if (transitionType === "zoom") {
        const off1 = getOffscreenCanvas(1, w, h);
        off1.ctx.clearRect(0, 0, w, h);
        drawSingleSceneWithScenes(off1.ctx, imgsMap, idx - 1, 1.0, w, h, u, bottom, safeBottom, actualScenes);

        const off2 = getOffscreenCanvas(2, w, h);
        off2.ctx.clearRect(0, 0, w, h);
        drawSingleSceneWithScenes(off2.ctx, imgsMap, idx, sp, w, h, u, bottom, safeBottom, actualScenes);

        ctx.save();
        const scaleIn = 0.92 + 0.08 * tp;
        ctx.translate(w / 2, h / 2);
        ctx.scale(scaleIn, scaleIn);
        ctx.drawImage(off2.canvas, -w / 2, -h / 2);
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = 1 - tp;
        const scaleOut = 1.0 + 0.12 * tp;
        ctx.translate(w / 2, h / 2);
        ctx.scale(scaleOut, scaleOut);
        ctx.drawImage(off1.canvas, -w / 2, -h / 2);
        ctx.restore();
      }
    } else {
      drawSingleSceneWithScenes(ctx, imgsMap, idx, sp, w, h, u, bottom, safeBottom, actualScenes);
    }

    if (voiceEnabled && currentAlignments?.phrases?.length) {
      drawCaptionsWithAlignments(ctx, t, w, h, u, currentAlignments);
    }

    ctx.save();
    ctx.fillStyle = PAPER;
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 12 * u;
    ctx.font = `600 ${22 * u}px "Nunito Sans", sans-serif`;
    ctx.textAlign = "right";
    ctx.fillText(`${BRAND_NAME} Studio`, w - M, h - M * 0.6);
    ctx.restore();
  };

  const drawSingleSceneWithScenes = (ctx, imgsMap, idx, sp, w, h, u, bottom, safeBottom, actualScenes) => {
    const scene = actualScenes[idx];
    const im = imgsMap[scene.img];
    const price = formatPrice(listing.price, listing.listing, listing.priceUnit);
    const where = [listing.cluster, listing.location].filter(Boolean).join(", ");
    const M = 78 * u;

    if (scene.kind === "nearby") {
      ctx.fillStyle = PINE;
      ctx.fillRect(0, 0, w, h);
    } else {
      ctx.fillStyle = PINE_DK;
      ctx.fillRect(0, 0, w, h);
      
      const isVerticalVideo = h > w;
      const isLandscapeImage = im && im.width > im.height;
      if (isVerticalVideo && isLandscapeImage && scene.kind !== "hook" && scene.kind !== "cta") {
        drawFitBlur(ctx, im, w, h, sp);
      } else {
        coverKenBurns(ctx, im, w, h, sp, idx);
      }
      shade(ctx, w, h, scene.kind === "photo" ? 0.42 : 0.6);
    }

    if (scene.kind !== "cta") {
      ctx.textBaseline = "alphabetic";
      ctx.font = `800 ${44 * u}px "Nunito Sans", sans-serif`;
      ctx.fillStyle = PAPER;
      ctx.fillText(BRAND_NAME, M, M + 30 * u);
    }

    if (scene.kind === "hook") {
      const r1 = rise(sp, 0);
      ctx.save();
      ctx.globalAlpha = r1.a;
      const label = `${listing.listing === "sewa" ? "DISEWAKAN" : "DIJUAL"} · ${(TYPE_LABELS[listing.type] || "PROPERTI").toUpperCase()}`;
      ctx.font = `800 ${30 * u}px "Nunito Sans", sans-serif`;
      const pw = ctx.measureText(label).width + 56 * u;
      rr(ctx, M, bottom - 430 * u + r1.dy, pw, 66 * u, 33 * u);
      ctx.fillStyle = SAND;
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.fillText(label, M + 28 * u, bottom - 430 * u + 45 * u + r1.dy);
      ctx.restore();

      const r2 = rise(sp, 0.25);
      ctx.save();
      ctx.globalAlpha = r2.a;
      ctx.fillStyle = PAPER;
      ctx.font = `800 ${84 * u}px "Nunito Sans", sans-serif`;
      wrapText(ctx, listing.title, w - M * 2, 3).forEach((ln, i) => ctx.fillText(ln, M, bottom - 300 * u + i * 96 * u + r2.dy));
      ctx.restore();

      const r3 = rise(sp, 0.45);
      ctx.save();
      ctx.globalAlpha = r3.a;
      ctx.fillStyle = MIST;
      ctx.font = `700 ${40 * u}px "Nunito Sans", sans-serif`;
      ctx.fillText(clipLine(ctx, where, w - M * 2), M, bottom + r3.dy);
      ctx.restore();
    }

    if (scene.kind === "price") {
      const r1 = rise(sp, 0);
      ctx.save();
      ctx.globalAlpha = r1.a;
      ctx.fillStyle = SAND_LT;
      ctx.font = `800 ${34 * u}px "Nunito Sans", sans-serif`;
      ctx.fillText("HARGA PENAWARAN", M, bottom - 360 * u + r1.dy);
      ctx.restore();

      const r2 = rise(sp, 0.2);
      ctx.save();
      ctx.globalAlpha = r2.a;
      ctx.fillStyle = PAPER;
      ctx.font = `800 ${118 * u}px "Nunito Sans", sans-serif`;
      ctx.fillText(price, M, bottom - 240 * u + r2.dy);
      ctx.restore();

      // Desain Tipografi Editorial Bersih Tanpa Chip
      const specs = [];
      if (listing.bedrooms > 0) specs.push(`${listing.bedrooms} Kamar Tidur`);
      if (listing.bathrooms > 0) specs.push(`${listing.bathrooms} Kamar Mandi`);
      if (listing.landSize > 0) specs.push(`Luas Tanah ${listing.landSize} m²`);
      if (listing.buildingSize > 0) specs.push(`Luas Bangunan ${listing.buildingSize} m²`);

      const r3 = rise(sp, 0.4);
      ctx.save();
      ctx.globalAlpha = r3.a;
      ctx.fillStyle = "rgba(247, 244, 238, 0.94)";
      ctx.font = `700 ${36 * u}px "Montserrat", "Nunito Sans", sans-serif`;
      
      const specLine1 = specs.slice(0, 2).join("  ·  ");
      const specLine2 = specs.slice(2).join("  ·  ");
      if (specLine1) {
        ctx.fillText(specLine1, M, bottom - 135 * u + r3.dy);
      }
      if (specLine2) {
        ctx.fillText(specLine2, M, bottom - 82 * u + r3.dy);
      }
      ctx.restore();
    }

    if (scene.kind === "photo") {
      const showCaptionOverlay = !(voiceEnabled && alignments?.phrases?.length);
      if (scene.caption && showCaptionOverlay) {
        const r1 = rise(sp, 0.15);
        ctx.save();
        ctx.globalAlpha = r1.a;
        ctx.font = `800 ${42 * u}px "Nunito Sans", sans-serif`;
        const lines = wrapText(ctx, scene.caption, w - M * 2 - 60 * u, 2);
        const bh = lines.length * 56 * u + 48 * u;
        rr(ctx, M, bottom - bh + r1.dy, w - M * 2, bh, 24 * u);
        ctx.fillStyle = "rgba(23,19,17,0.72)";
        ctx.fill();
        ctx.fillStyle = PAPER;
        lines.forEach((ln, i) => ctx.fillText(ln, M + 30 * u, bottom - bh + 62 * u + i * 56 * u + r1.dy));
        ctx.restore();
      }
    }

    if (scene.kind === "point") {
      const spx = scene.sp || {};
      ctx.font = `800 ${64 * u}px "Nunito Sans", sans-serif`;
      const pl = wrapText(ctx, spx.point, w - M * 2, 3);
      ctx.font = `600 ${34 * u}px "Nunito Sans", sans-serif`;
      const dl = spx.detail ? wrapText(ctx, spx.detail, w - M * 2, 3) : [];
      const ebH = 44 * u, ebGap = 34 * u, plH = 80 * u, dGap = 30 * u, dlH = 50 * u;
      const blockH = ebH + ebGap + pl.length * plH + (dl.length ? dGap + dl.length * dlH : 0);
      let y = safeBottom - blockH;

      const r1 = rise(sp, 0);
      ctx.save();
      ctx.globalAlpha = r1.a;
      ctx.fillStyle = "#8FB59D";
      ctx.font = `800 ${32 * u}px "Nunito Sans", sans-serif`;
      ctx.fillText((spx.aspect || "KEUNGGULAN").toUpperCase(), M, y + ebH + r1.dy);
      ctx.restore();
      y += ebH + ebGap;

      const r2 = rise(sp, 0.2);
      ctx.save();
      ctx.globalAlpha = r2.a;
      ctx.fillStyle = PAPER;
      ctx.font = `800 ${64 * u}px "Nunito Sans", sans-serif`;
      pl.forEach((ln) => {
        ctx.fillText(ln, M, y + plH * 0.8 + r2.dy);
        y += plH;
      });
      ctx.restore();

      if (dl.length) {
        y += dGap;
        const r3 = rise(sp, 0.4);
        ctx.save();
        ctx.globalAlpha = r3.a;
        ctx.fillStyle = MIST;
        ctx.font = `600 ${34 * u}px "Nunito Sans", sans-serif`;
        dl.forEach((ln) => {
          ctx.fillText(ln, M, y + dlH * 0.8 + r3.dy);
          y += dlH;
        });
        ctx.restore();
      }
    }

    if (scene.kind === "nearby") {
      const rows = scene.rows || [];
      const title = "FASILITAS & AKSES TERDEKAT";
      ctx.font = `800 ${34 * u}px "Nunito Sans", sans-serif`;
      const titleH = 50 * u;
      const rowH = 110 * u;
      const gap = 20 * u;
      const blockH = titleH + 30 * u + rows.length * (rowH + gap) + 140 * u;
      let y = (h - blockH) / 2;

      const r1 = rise(sp, 0);
      ctx.save();
      ctx.globalAlpha = r1.a;
      ctx.fillStyle = SAND_LT;
      ctx.fillText(title, M, y + titleH + r1.dy);
      ctx.restore();
      y += titleH + 40 * u;

      rows.forEach((rw, idxRow) => {
        const rRow = rise(sp, 0.15 + idxRow * 0.12);
        ctx.save();
        ctx.globalAlpha = rRow.a;
        rr(ctx, M, y + rRow.dy, w - M * 2, rowH, 24 * u);
        ctx.fillStyle = "rgba(247,244,238,0.08)";
        ctx.fill();
        ctx.strokeStyle = "rgba(247,244,238,0.18)";
        ctx.lineWidth = 2 * u;
        ctx.stroke();

        ctx.fillStyle = PAPER;
        ctx.font = `800 ${42 * u}px "Nunito Sans", sans-serif`;
        ctx.fillText(clipLine(ctx, rw.place, w - M * 2 - 240 * u), M + 36 * u, y + 54 * u + rRow.dy);

        ctx.fillStyle = MIST;
        ctx.font = `600 ${28 * u}px "Nunito Sans", sans-serif`;
        ctx.fillText(`${rw.category || "Fasilitas"} · ± ${rw.distance || "Dekat"}`, M + 36 * u, y + 92 * u + rRow.dy);

        const timeBadge = `${rw.time || "5m"}`;
        ctx.font = `800 ${32 * u}px "Nunito Sans", sans-serif`;
        const bw = ctx.measureText(timeBadge).width + 44 * u;
        rr(ctx, w - M - bw - 24 * u, y + 26 * u + rRow.dy, bw, 58 * u, 18 * u);
        ctx.fillStyle = SAND;
        ctx.fill();
        ctx.fillStyle = INK;
        ctx.fillText(timeBadge, w - M - bw - 2 * u, y + 66 * u + rRow.dy);

        ctx.restore();
        y += rowH + gap;
      });

      if (mapData && mapData.tiles.length) {
        const rMap = rise(sp, 0.55);
        ctx.save();
        ctx.globalAlpha = rMap.a;
        const mapH = 180 * u;
        rr(ctx, M, y + rMap.dy, w - M * 2, mapH, 24 * u);
        ctx.clip();
        mapData.tiles.forEach((tTile) => {
          const imTile = imgsMap[tTile.url];
          if (imTile) {
            ctx.drawImage(
              imTile,
              M + tTile.x * (mapData.tileSize * u),
              y + tTile.y * (mapData.tileSize * u) + rMap.dy,
              mapData.tileSize * u,
              mapData.tileSize * u
            );
          }
        });
        ctx.restore();
      }
    }

    if (scene.kind === "cta") {
      const isVertical = h > w;
      if (im) {
        if (isVertical && im.width > im.height) drawFitBlur(ctx, im, w, h, sp);
        else coverKenBurns(ctx, im, w, h, sp, idx);
      }
      shade(ctx, w, h, 0.78);

      const r1 = rise(sp, 0);
      ctx.save();
      ctx.globalAlpha = r1.a;
      ctx.fillStyle = SAND;
      ctx.font = `800 ${32 * u}px "Nunito Sans", sans-serif`;
      ctx.fillText("TERTARIK DENGAN PROPERTI INI?", M, h * 0.35 + r1.dy);
      ctx.restore();

      const r2 = rise(sp, 0.2);
      ctx.save();
      ctx.globalAlpha = r2.a;
      ctx.fillStyle = PAPER;
      ctx.font = `800 ${72 * u}px "Nunito Sans", sans-serif`;
      wrapText(ctx, "Jadwalkan Kunjungan & Survey Sekarang", w - M * 2, 2).forEach((ln, i) =>
        ctx.fillText(ln, M, h * 0.35 + 84 * u + i * 84 * u + r2.dy)
      );
      ctx.restore();

      const r3 = rise(sp, 0.4);
      ctx.save();
      ctx.globalAlpha = r3.a;
      const boxW = w - M * 2;
      const boxH = 180 * u;
      const boxY = h * 0.6 + r3.dy;
      rr(ctx, M, boxY, boxW, boxH, 36 * u);
      ctx.fillStyle = PAPER;
      ctx.fill();

      ctx.fillStyle = INK;
      ctx.font = `800 ${44 * u}px "Nunito Sans", sans-serif`;
      ctx.fillText(BRAND_NAME, M + 44 * u, boxY + 72 * u);

      ctx.fillStyle = PINE;
      ctx.font = `800 ${46 * u}px "Nunito Sans", sans-serif`;
      ctx.fillText(BRAND_PHONE || "Hubungi Agen Resmi", M + 44 * u, boxY + 134 * u);
      ctx.restore();
    }
  };

  // Subtitle Kapsul Bawah ala Netflix/Komersial (Tanpa Lompatan/Scale Pop)
  const drawCaptionsWithAlignments = (ctx, t, w, h, u, currentAlignments) => {
    if (!currentAlignments || !currentAlignments.phrases || !currentAlignments.phrases.length) return;

    const phrases = currentAlignments.phrases;
    const activePhrase = phrases.find(p => t >= p.start && t <= p.end);

    let phrase = activePhrase;
    if (!phrase) {
      const pastPhrases = phrases.filter(p => t >= p.end);
      if (pastPhrases.length > 0) {
        const lastPhrase = pastPhrases[pastPhrases.length - 1];
        const nextPhrase = phrases.find(p => p.start > t);
        if (t - lastPhrase.end < 0.6 && (!nextPhrase || nextPhrase.start - t > 0.1)) {
          phrase = lastPhrase;
        }
      }
    }

    if (!phrase) return;

    ctx.save();
    const fontSize = Math.round(42 * u);
    ctx.font = `800 ${fontSize}px "Montserrat", "Inter", sans-serif`;
    const spaceW = ctx.measureText(" ").width;
    const wordWidths = phrase.words.map(w => ctx.measureText(w.word).width);
    const totalW = wordWidths.reduce((a, b) => a + b, 0) + (phrase.words.length - 1) * spaceW;

    const paddingX = 44 * u;
    const paddingY = 24 * u;
    const boxW = Math.min(w - 70 * u, totalW + paddingX * 2);
    const boxH = fontSize + paddingY * 2;
    const boxX = (w - boxW) / 2;
    const boxY = h - 230 * u - boxH / 2;

    rr(ctx, boxX, boxY, boxW, boxH, 22 * u);
    ctx.fillStyle = "rgba(18, 18, 18, 0.75)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 2 * u;
    ctx.stroke();

    let startX = (w - totalW) / 2;
    const textY = boxY + boxH / 2;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    phrase.words.forEach((word, idx) => {
      const wordText = word.word;
      const isActive = t >= word.start && t <= word.end;
      const wordW = wordWidths[idx];
      const wordCenterX = startX + wordW / 2;

      ctx.save();
      ctx.font = `800 ${fontSize}px "Montserrat", "Inter", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      if (isActive) {
        ctx.shadowColor = "#FFDE4D";
        ctx.shadowBlur = 14 * u;
        ctx.fillStyle = "#FFDE4D";
      } else {
        ctx.fillStyle = "#FFFFFF";
      }

      ctx.fillText(wordText, wordCenterX, textY);
      ctx.restore();

      startX += wordW + spaceW;
    });

    ctx.restore();
  };

  const startPreview = async () => {
    if (!listing) return;
    setError("");
    setVideoUrl("");
    setPhase("loading");
    stopPreviewAudio();

    try {
      const assets = await ensureVoiceAssets();
      
      const { imgsMap, w, h, ctx } = await prepare();
      setPhase("preview");
      
      const actx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = actx;

      if (voiceEnabled && assets.buffer) {
        const voiceSrc = actx.createBufferSource();
        voiceSrc.buffer = assets.buffer;
        voiceSrc.connect(actx.destination);
        voiceSrc.start(0);
        previewSourcesRef.current.push(voiceSrc);
      }

      if (musicTrack !== "none") {
        const musicBuf = await loadMusicBuffer(musicTrack, total, actx);
        if (musicBuf) {
          const musicSrc = actx.createBufferSource();
          musicSrc.buffer = musicBuf;
          const gainNode = actx.createGain();
          gainNode.gain.value = voiceEnabled && assets.buffer ? 0.14 : 0.75;
          musicSrc.connect(gainNode).connect(actx.destination);
          musicSrc.start(0);
          previewSourcesRef.current.push(musicSrc);
        }
      }

      const t0 = performance.now();
      const loop = () => {
        const t = (performance.now() - t0) / 1000;
        setProgress(Math.min(1, t / total));
        
        drawFrameWithAssets(ctx, imgsMap, Math.min(t, total - 0.001), w, h, assets.buffer, assets.alignments);
        
        if (t < total) rafRef.current = requestAnimationFrame(loop);
        else {
          stopPreviewAudio();
          setPhase("idle");
        }
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (err) {
      stopPreviewAudio();
      setError(String(err?.message || err));
      setPhase("idle");
    }
  };

  const startRender = async () => {
    if (!listing) return;
    setError("");
    setVideoUrl("");
    setPhase("loading");
    stopPreviewAudio();

    try {
      const assets = await ensureVoiceAssets();

      const { imgsMap, w, h, ctx, canvas } = await prepare();
      const fps = 30;
      const frames = Math.round(total * fps);
      const bitrate = 9_000_000;
      const codec = await pickAvcCodec(w, h, fps, bitrate);

      setPhase("recording");

      const hasAudio = (musicTrack !== "none" || (voiceEnabled && assets.buffer)) && (await aacSupported());

      if (codec) {
        const muxer = new Muxer({
          target: new ArrayBufferTarget(),
          video: { codec: "avc", width: w, height: h },
          ...(hasAudio ? { audio: { codec: "aac", sampleRate: 44100, numberOfChannels: 2 } } : {}),
          fastStart: "in-memory",
        });

        const encoder = new VideoEncoder({
          output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
          error: (e) => console.error("VideoEncoder error:", e),
        });
        encoder.configure({ codec, width: w, height: h, bitrate, framerate: fps });

        for (let f = 0; f < frames; f++) {
          const t = f / fps;
          setProgress(Math.min(1, f / frames));
          drawFrameWithAssets(ctx, imgsMap, t, w, h, assets.buffer, assets.alignments);

          const frame = new VideoFrame(canvas, { timestamp: Math.round(t * 1_000_000) });
          encoder.encode(frame, { keyFrame: f % (fps * 2) === 0 });
          frame.close();
          if (f % 15 === 0) await new Promise((r) => setTimeout(r, 0));
        }

        await encoder.flush();
        encoder.close();

        if (hasAudio) {
          const actx = new (window.AudioContext || window.webkitAudioContext)();
          const musicBuf = musicTrack !== "none" ? await loadMusicBuffer(musicTrack, total, actx) : null;
          const mixed = await mixAudio(assets.buffer, musicBuf, total, 0.14);
          const pcm = mixed.getChannelData(0);
          const pcmR = mixed.numberOfChannels > 1 ? mixed.getChannelData(1) : pcm;

          const audioEncoder = new AudioEncoder({
            output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
            error: (e) => console.error("AudioEncoder error:", e),
          });
          audioEncoder.configure({ codec: "mp4a.40.2", sampleRate: 44100, numberOfChannels: 2, bitrate: 128000 });

          const chunkSize = 1024;
          const numChunks = Math.floor(pcm.length / chunkSize);
          for (let i = 0; i < numChunks; i++) {
            const planar = new Float32Array(chunkSize * 2);
            for (let j = 0; j < chunkSize; j++) {
              planar[j] = pcm[i * chunkSize + j];
              planar[chunkSize + j] = pcmR[i * chunkSize + j];
            }
            const audioData = new AudioData({
              format: "f32-planar",
              sampleRate: 44100,
              numberOfFrames: chunkSize,
              numberOfChannels: 2,
              timestamp: Math.round((i * chunkSize * 1_000_000) / 44100),
              data: planar,
            });
            audioEncoder.encode(audioData);
            audioData.close();
          }
          await audioEncoder.flush();
          audioEncoder.close();
          await actx.close();
        }

        muxer.finalize();
        const buffer = muxer.target.buffer;
        setVideoUrl(URL.createObjectURL(new Blob([buffer], { type: "video/mp4" })));
        setVideoExt("mp4");
        setPhase("done");
        return;
      }

      // Fallback MediaRecorder WebM jika tidak mendukung WebCodecs MP4
      const stream = canvas.captureStream(fps);
      if (hasAudio) {
        const actx = new (window.AudioContext || window.webkitAudioContext)();
        const dest = actx.createMediaStreamDestination();
        if (voiceEnabled && assets.buffer) {
          const vSrc = actx.createBufferSource();
          vSrc.buffer = assets.buffer;
          vSrc.connect(dest);
          vSrc.start(0);
        }
        if (musicTrack !== "none") {
          const mBuf = await loadMusicBuffer(musicTrack, total, actx);
          if (mBuf) {
            const mSrc = actx.createBufferSource();
            mSrc.buffer = mBuf;
            const g = actx.createGain();
            g.gain.value = voiceEnabled && assets.buffer ? 0.14 : 0.75;
            mSrc.connect(g).connect(dest);
            mSrc.start(0);
          }
        }
        dest.stream.getAudioTracks().forEach((trk) => stream.addTrack(trk));
      }

      const mime = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find((m) =>
        MediaRecorder.isTypeSupported(m)
      );
      setVideoExt("webm");
      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
      const chunks = [];
      recorder.ondataavailable = (e) => e.data?.size && chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mime || "video/webm" });
        if (blob.size === 0) {
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
        
        drawFrameWithAssets(ctx, imgsMap, Math.min(t, total - 0.001), w, h, assets.buffer, assets.alignments);
        
        if (t < total) rafRef.current = requestAnimationFrame(loop);
        else recorder.stop();
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (err) {
      setError(String(err?.message || err));
      setPhase("idle");
    }
  };

  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  if (!listings.length) {
    return (
      <div className="card p-10 text-center">
        <p className="text-xl font-extrabold text-ink">Belum ada listing</p>
        <p className="mt-2 text-lg text-ink-soft">Buat listing terlebih dahulu lewat Studio Listing atau Otomasi.</p>
      </div>
    );
  }

  const busy = phase === "loading" || phase === "recording" || phase === "preview" || scriptLoading || voiceLoading;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
      {/* KOLOM KIRI: EDITOR & PENGATURAN STUDIO */}
      <div className="space-y-6">
        <div className="card p-6 space-y-6 bg-white border border-ink/10 shadow-sm rounded-3xl">
          
          {/* Header Panel */}
          <div className="flex items-center gap-3 pb-4 border-b border-ink/5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pine-700 to-emerald-800 flex items-center justify-center text-white shadow-md shadow-pine-700/20">
              <IconWand size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-ink tracking-tight">AI Video Suite</h2>
              <p className="text-xs font-semibold text-ink-faint">Studio produksi video dan narasi suara AI otomatis</p>
            </div>
          </div>

          {/* Langkah 1: Pilih Properti */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-ink-faint">1. Pilih Properti</label>
            <select
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setAiScript([]); setVoiceBuffer(null); }}
              className="w-full rounded-2xl border-2 border-ink/10 bg-ink/[0.02] p-3.5 text-sm font-extrabold text-ink transition focus:border-pine-700 focus:bg-white outline-none"
              disabled={busy}
            >
              {listings.map((l) => <option key={l.slug} value={l.slug}>{l.title}</option>)}
            </select>
            
            {listing && (
              <div className="rounded-2xl bg-pine-50/80 border border-pine-700/15 p-3.5 flex items-center justify-between text-xs">
                <div className="space-y-0.5 truncate pr-2">
                  <div className="font-extrabold text-pine-950 truncate">{listing.title}</div>
                  <div className="font-semibold text-pine-700">{[listing.cluster, listing.location].filter(Boolean).join(", ")}</div>
                </div>
                <div className="font-black text-pine-800 text-sm whitespace-nowrap bg-white px-3 py-1 rounded-xl shadow-2xs">
                  {formatPrice(listing.price, listing.listing, listing.priceUnit)}
                </div>
              </div>
            )}
          </div>
          
          {/* Langkah 2: Format & Rasio */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-ink-faint">2. Format & Rasio</label>
            <div className="grid grid-cols-2 gap-2.5">
              {Object.entries(FORMATS).map(([k, f]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setFormat(k)}
                  disabled={busy}
                  className={`rounded-2xl border-2 p-3.5 text-left transition ${format === k ? "border-pine-700 bg-pine-50/90 shadow-2xs" : "border-ink/10 bg-white hover:border-ink/25"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-ink">{f.label}</span>
                    {format === k && <span className="w-2.5 h-2.5 rounded-full bg-pine-700"></span>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Langkah 3: Narasi Suara AI & Pengaturan Visual */}
          <div className="space-y-4 pt-1 border-t border-ink/5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 text-sm font-extrabold text-ink cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={voiceEnabled} 
                  onChange={(e) => { setVoiceEnabled(e.target.checked); setVoiceBuffer(null); }} 
                  className="h-4 w-4 rounded accent-pine-700" 
                  disabled={busy} 
                />
                Narator Voiceover AI
              </label>
              {voiceEnabled && aiScript.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowScriptEditor(!showScriptEditor)}
                  className="text-xs font-bold text-pine-700 hover:underline"
                >
                  {showScriptEditor ? "Tutup Naskah" : "Edit Naskah"}
                </button>
              )}
            </div>

            {voiceEnabled && (
              <div className="space-y-3 pl-6 border-l-2 border-pine-700/20">
                <div>
                  <span className="text-[11px] font-bold text-ink-faint block mb-1.5">Karakter Pengisi Suara</span>
                  <select
                    value={voiceId}
                    onChange={(e) => { setVoiceId(e.target.value); setVoiceBuffer(null); }}
                    className="w-full rounded-xl border border-ink/15 bg-white p-2.5 text-xs font-extrabold text-ink outline-none focus:border-pine-700"
                    disabled={busy}
                  >
                    <option value="21m00Tcm4TlvDq8ikWAM">Rachel · Wanita Elegan (Multilingual)</option>
                    <option value="28v2yc5EL83WH8vj9HMh">Drew · Pria Profesional (Ramah & Jelas)</option>
                    <option value="pNInz6obpgq5apaNs9Yr">Adam · Suara Deep Sinematik (Mewah)</option>
                    <option value="2E2Iexco4xOiZ27x0whl">Clyde · Promosi Ceria (Energik)</option>
                  </select>
                </div>

                {showScriptEditor && aiScript.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold text-pine-800 block">Naskah per Adegan (Otomatis dari AI)</span>
                    <div className="max-h-[200px] overflow-y-auto border border-ink/10 rounded-xl p-2.5 bg-ink/[0.02] space-y-2 text-xs">
                      {aiScript.map((sc, index) => (
                        <div key={index} className="space-y-1">
                          <span className="text-[10px] font-black text-pine-700 uppercase tracking-wider">{index + 1}. {sc.kind}</span>
                          <textarea
                            value={sc.text}
                            onChange={(e) => {
                              const copy = [...aiScript];
                              copy[index].text = e.target.value;
                              setAiScript(copy);
                              setVoiceBuffer(null); 
                            }}
                            className="w-full rounded-lg border border-ink/10 bg-white p-2 text-xs font-medium outline-none focus:border-pine-700 resize-y"
                            disabled={busy}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pilihan Transisi & Lagu Latar Komersial */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[11px] font-bold text-ink-faint block mb-1.5">Transisi Visual</span>
                <select value={transitionType} onChange={(e) => setTransitionType(e.target.value)} className="w-full rounded-xl border border-ink/15 bg-white p-2.5 text-xs font-bold text-ink outline-none focus:border-pine-700" disabled={busy}>
                  <option value="crossfade">Cross-Fade Sinematik</option>
                  <option value="slide">Slide Push Modern</option>
                  <option value="zoom">Zoom & Depth</option>
                  <option value="none">Tanpa Transisi</option>
                </select>
              </div>
              <div>
                <span className="text-[11px] font-bold text-ink-faint block mb-1.5">Lagu Latar Komersial</span>
                <select value={musicTrack} onChange={(e) => setMusicTrack(e.target.value)} className="w-full rounded-xl border border-ink/15 bg-white p-2.5 text-xs font-bold text-ink outline-none focus:border-pine-700" disabled={busy}>
                  <option value="cinematic">Cinematic Luxury & Prestige</option>
                  <option value="chill">Aesthetic Chill & Modern Vlog</option>
                  <option value="upbeat">Commercial Pop & Upbeat</option>
                  <option value="jazz">Modern Real Estate Jazz</option>
                  <option value="warm">Emotional Warm Piano</option>
                  <option value="none">Tanpa Musik (Mute)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tombol Aksi Utama */}
          <div className="space-y-3 pt-3 border-t border-ink/5">
            <button
              type="button"
              onClick={startRender}
              disabled={busy}
              className="w-full bg-gradient-to-r from-pine-700 via-pine-600 to-emerald-700 text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-pine-700/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition duration-200 flex items-center justify-center gap-2.5 text-base disabled:opacity-50 disabled:pointer-events-none"
            >
              <IconBolt size={20} className="animate-pulse" /> {phase === "recording" ? "Sedang Merekam..." : "Buat Video Sekali Klik (1-Click AI)"}
            </button>

            <button
              type="button"
              onClick={startPreview}
              disabled={busy}
              className="w-full rounded-2xl border-2 border-pine-700/20 bg-white py-3 text-sm font-extrabold text-pine-800 hover:bg-pine-50/80 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <IconPlay size={18} /> Pratinjau Realtime ({adjustedScenes.length} adegan · ± {Math.round(total)}s)
            </button>
          </div>

          {/* Progress Indicator Tanpa Emoji */}
          {busy && (
            <div className="space-y-2.5 rounded-2xl bg-pine-50 p-4 border border-pine-700/15">
              <div className="h-2 overflow-hidden rounded-full bg-pine-200">
                <div className="h-full rounded-full bg-pine-700 transition-[width] duration-300" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
              <p className="text-xs text-center font-extrabold text-pine-900 animate-pulse">
                {scriptLoading && "AI sedang merancang naskah & pelafalan spesifikasi..."}
                {voiceLoading && "Menyintesis suara narasi dari ElevenLabs..."}
                {phase === "loading" && !scriptLoading && !voiceLoading && "Menyiapkan aset & kanvas grafis..."}
                {phase === "recording" && `Merekam video resolusi tinggi (${Math.round(progress * 100)}%)...`}
                {phase === "preview" && "Memutar pratinjau audio & visual..."}
              </p>
            </div>
          )}

          {error && <div className="rounded-2xl bg-red-50 p-3.5 text-xs font-bold text-red-700 border border-red-200">{error}</div>}

          {videoUrl && (
            <a
              href={videoUrl}
              download={`${listing.slug}-${format}.${videoExt}`}
              className="w-full bg-ink text-white font-black py-3.5 px-6 rounded-2xl shadow-md hover:bg-black transition flex items-center justify-center gap-2 text-sm"
            >
              <IconCheck size={18} className="text-emerald-400" /> Unduh Video Jadi (.{videoExt})
            </a>
          )}
        </div>

        {/* CAPTION SIAP TEMPEL */}
        <div className="card p-6 rounded-3xl bg-white border border-ink/10">
          <div className="flex items-center justify-between pb-3">
            <h3 className="text-base font-black text-ink">Caption Sosmed & Hashtag</h3>
            <button type="button" onClick={copyCaption} className="text-xs font-extrabold text-pine-700 hover:underline bg-pine-50 px-3.5 py-1.5 rounded-xl">
              {copied ? "Tersalin" : "Salin Caption"}
            </button>
          </div>
          <textarea readOnly value={caption} className="w-full rounded-2xl border border-ink/10 bg-ink/[0.01] p-3.5 text-xs font-medium text-ink-soft min-h-[140px] outline-none" />
        </div>
      </div>

      {/* KOLOM KANAN: PRATINJAU VIDEO & PEMUTAR HASIL EXPORT (TANPA OVERLAY / CHIP / HINT) */}
      <div className="card flex flex-col items-center justify-center p-8 rounded-3xl bg-neutral-900 border border-neutral-800 min-h-[760px] shadow-xl sticky top-8">
        <div style={{ maxWidth: format === "story" ? 364 : fmt.w >= fmt.h ? 640 : 380 }} className="w-full relative">
          <div className="relative w-full rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl bg-black">
            <canvas
              ref={canvasRef}
              width={fmt.w}
              height={fmt.h}
              className={`w-full h-auto block ${videoUrl && phase === "done" ? "hidden" : ""}`}
            />
            {videoUrl && phase === "done" && (
              <video src={videoUrl} controls autoPlay loop playsInline className="w-full h-auto block bg-black" />
            )}
          </div>

          <p className="mt-5 text-center text-xs font-bold text-neutral-400">
            {phase === "done" ? "Video selesai dicetak. Putar di atas atau klik unduh di panel kiri." : "Pratinjau Video · Semua visual dan teks dirancang otomatis oleh AI."}
          </p>
        </div>
      </div>
    </div>
  );
}
