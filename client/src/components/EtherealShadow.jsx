import { useEffect, useRef, useId } from 'react';

const MASK_URL = 'https://framerusercontent.com/images/ceBGguIpUU8luwByxuQz79t7To.png';
const NOISE_URL = 'https://framerusercontent.com/images/g0QcWrxr87K0ufOxIUFBakwYA8.png';

function mapRange(value, fromLow, fromHigh, toLow, toHigh) {
  if (fromLow === fromHigh) return toLow;
  return toLow + ((value - fromLow) / (fromHigh - fromLow)) * (toHigh - toLow);
}

export default function EtherealShadow({
  color = 'rgba(60, 130, 100, 1)',
  scale = 80,
  speed = 80,
  noiseOpacity = 0.35,
  noiseScale = 1.2,
}) {
  const rawId = useId();
  const id = `etheral-${rawId.replace(/:/g, '')}`;
  const feColorMatrixRef = useRef(null);

  const displacementScale = mapRange(scale, 1, 100, 20, 100);
  const animationDuration = mapRange(speed, 1, 100, 1000, 50);

  useEffect(() => {
    const node = feColorMatrixRef.current;
    if (!node) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return; // leave a static field

    let raf;
    const start = performance.now();
    const loopMs = (animationDuration / 25) * 1000; // one full hue rotation

    const tick = (now) => {
      const elapsed = (now - start) % loopMs;
      const value = (elapsed / loopMs) * 360;
      node.setAttribute('values', String(value));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animationDuration]);

  return (
    <div className="ethereal-shadow" aria-hidden="true">
      <div
        style={{
          position: 'absolute',
          inset: -displacementScale,
          filter: `url(#${id}) blur(4px)`,
        }}
      >
        <svg style={{ position: 'absolute' }}>
          <defs>
            <filter id={id}>
              <feTurbulence
                result="undulation"
                numOctaves="2"
                baseFrequency={`${mapRange(scale, 0, 100, 0.001, 0.0005)},${mapRange(scale, 0, 100, 0.004, 0.002)}`}
                seed="0"
                type="turbulence"
              />
              <feColorMatrix ref={feColorMatrixRef} in="undulation" type="hueRotate" values="180" />
              <feColorMatrix in="dist" result="circulation" type="matrix"
                values="4 0 0 0 1  4 0 0 0 1  4 0 0 0 1  1 0 0 0 0" />
              <feDisplacementMap in="SourceGraphic" in2="circulation" scale={displacementScale} result="dist" />
              <feDisplacementMap in="dist" in2="undulation" scale={displacementScale} result="output" />
            </filter>
          </defs>
        </svg>
        <div
          style={{
            backgroundColor: color,
            maskImage: `url('${MASK_URL}')`,
            WebkitMaskImage: `url('${MASK_URL}')`,
            maskSize: 'cover',
            WebkitMaskSize: 'cover',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskPosition: 'center',
            width: '100%',
            height: '100%',
          }}
        />
      </div>

      {noiseOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("${NOISE_URL}")`,
            backgroundSize: noiseScale * 200,
            backgroundRepeat: 'repeat',
            opacity: noiseOpacity / 2,
          }}
        />
      )}
    </div>
  );
}