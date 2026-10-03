"use client";

import { MAX_NOTE_SECONDS } from "../types";

/** Reads duration and a bar waveform from an uploaded audio file. */
export async function analyseAudio(file: File, bars = 44): Promise<{ duration: number; waveform: number[] }> {
  const buf = await file.arrayBuffer();
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  try {
    const audio = await ctx.decodeAudioData(buf);
    const data = audio.getChannelData(0);
    const size = Math.floor(data.length / bars);
    const peaks: number[] = [];
    for (let i = 0; i < bars; i++) {
      let sum = 0;
      for (let j = 0; j < size; j++) {
        const v = data[i * size + j];
        sum += v * v;
      }
      peaks.push(Math.sqrt(sum / size));
    }
    const max = Math.max(...peaks, 0.0001);
    return { duration: audio.duration, waveform: peaks.map((p) => Math.max(0.08, p / max)) };
  } finally {
    ctx.close();
  }
}

export function validateDuration(seconds: number) {
  // A little tolerance for encoder padding.
  return seconds <= MAX_NOTE_SECONDS + 0.5;
}
