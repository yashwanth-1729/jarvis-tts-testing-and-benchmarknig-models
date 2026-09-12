"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, SpinnerGap } from "@phosphor-icons/react";

function formatTime(sec: number): string {
  if (!Number.isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayer({
  src,
  label,
}: {
  src: string;
  label?: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      setCurrent(audio.currentTime);
      setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
    };
    const onLoaded = () => setDuration(audio.duration);
    const onEnd = () => setPlaying(false);
    const onWaiting = () => setLoading(true);
    const onPlaying = () => setLoading(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlaying);
    };
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * duration;
  }

  return (
    <div className="flex items-center gap-3">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause" : `Play ${label ?? "sample"}`}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-green text-white transition active:scale-[0.96] hover:brightness-110"
      >
        {loading && playing ? (
          <SpinnerGap size={18} weight="bold" className="animate-spin" />
        ) : playing ? (
          <Pause size={18} weight="fill" />
        ) : (
          <Play size={18} weight="fill" className="ml-0.5" />
        )}
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div
          onClick={seek}
          className="h-1.5 w-full cursor-pointer rounded-full bg-surface-muted"
        >
          <div
            className="h-full rounded-full bg-accent-green"
            style={{ width: `${Math.min(progress * 100, 100)}%` }}
          />
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">
          {formatTime(current)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
