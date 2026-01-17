// hooks/useMicVolume.js
import { useState, useEffect, useRef } from "react";

export default function useMicVolume(listening) {
  const [volume, setVolume] = useState(0);
  const smoothVolume = useRef(0);

  useEffect(() => {
    if (!listening) return;

    let ctx, analyser, dataArray, source;

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      ctx = new AudioContext();
      analyser = ctx.createAnalyser();
      analyser.fftSize = 1024; // smaller fft = more responsive
      source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      dataArray = new Uint8Array(analyser.fftSize);

      const tick = () => {
        analyser.getByteTimeDomainData(dataArray);

        // compute average deviation from center (128)
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += Math.abs(dataArray[i] - 128);
        }
        let avg = sum / dataArray.length / 128; // 0–1

        // amplify voice response
        avg = Math.min(avg * 3, 1); // boost & clamp to 0–1

        // smooth with inertia
        smoothVolume.current =
          smoothVolume.current * 0.8 + avg * 0.2;

        setVolume(smoothVolume.current);

        requestAnimationFrame(tick);
      };

      tick();
    });

    return () => {
      if (source) source.disconnect();
      if (ctx) ctx.close();
    };
  }, [listening]);

  return volume;
}
