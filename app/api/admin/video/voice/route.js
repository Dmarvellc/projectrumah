import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req) {
  try {
    const body = await req.json();
    const { text, voiceId = "21m00Tcm4TlvDq8ikWAM", customApiKey = "" } = body || {};

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Teks tidak boleh kosong" }, { status: 400 });
    }

    const apiKey = (customApiKey || process.env.ELEVENLABS_API_KEY || "").trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: "Kunci API ElevenLabs belum terkonfigurasi. Silakan masukkan kunci API di pengaturan atau file .env Anda." },
        { status: 401 }
      );
    }

    // Call ElevenLabs TTS with-timestamps
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      let errJson = null;
      try {
        errJson = JSON.parse(errText);
      } catch {}
      const errMsg = errJson?.detail?.message || errJson?.error?.message || errText || "Error dari ElevenLabs API";
      return NextResponse.json({ error: `ElevenLabs Error: ${errMsg}` }, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json({
      audio_base64: result.audio_base64,
      alignment: result.alignment || result.normalized_alignment || null,
    });
  } catch (err) {
    console.error("API /api/admin/video/voice error:", err);
    return NextResponse.json(
      { error: "Gagal memproses suara AI", message: String(err?.message || err) },
      { status: 500 }
    );
  }
}
