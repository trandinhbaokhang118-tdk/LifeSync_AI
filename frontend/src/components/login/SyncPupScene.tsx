import { useEffect, useRef } from 'react';

const POINTER_LIMIT = 1;

export function SyncPupScene() {
  const frameRef = useRef<HTMLDivElement>(null);
  const loadedAssetsRef = useRef(new Set<string>());

  const markAssetReady = (asset: string) => {
    loadedAssetsRef.current.add(asset);
    if (loadedAssetsRef.current.size === 3) {
      frameRef.current?.setAttribute('data-assets-ready', 'true');
    }
  };

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const interactionSurface = frame.closest<HTMLElement>('.auth-visual') ?? frame;
    const pageSurface = interactionSurface.parentElement ?? interactionSurface;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let animationFrame = 0;

    const leaveFrame = () => {
      delete frame.dataset.interactive;
      targetX = 0;
      targetY = 0;
    };

    const trackPointer = (event: PointerEvent) => {
      if (reducedMotion || event.pointerType === 'touch') return;

      const bounds = interactionSurface.getBoundingClientRect();
      const isInside = event.clientX >= bounds.left
        && event.clientX <= bounds.right
        && event.clientY >= bounds.top
        && event.clientY <= bounds.bottom;

      if (!isInside) {
        leaveFrame();
        return;
      }

      frame.dataset.interactive = 'true';
      targetX = Math.max(-POINTER_LIMIT, Math.min(POINTER_LIMIT,
        ((event.clientX - bounds.left) / Math.max(bounds.width, 1) - 0.5) * 2));
      targetY = Math.max(-POINTER_LIMIT, Math.min(POINTER_LIMIT,
        ((event.clientY - bounds.top) / Math.max(bounds.height, 1) - 0.5) * 2));
    };

    const renderFrame = () => {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;

      frame.style.setProperty('--fox-look-x', `${currentX * 13}px`);
      frame.style.setProperty('--fox-look-y', `${currentY * 7}px`);
      frame.style.setProperty('--fox-look-tilt', `${currentX * 1.8}deg`);
      frame.style.setProperty('--fox-glint-x', `${currentX * 4}px`);
      frame.style.setProperty('--fox-glint-y', `${currentY * 3}px`);

      animationFrame = requestAnimationFrame(renderFrame);
    };

    pageSurface.addEventListener('pointermove', trackPointer, { passive: true });
    pageSurface.addEventListener('pointerleave', leaveFrame);
    window.addEventListener('blur', leaveFrame);
    animationFrame = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(animationFrame);
      pageSurface.removeEventListener('pointermove', trackPointer);
      pageSurface.removeEventListener('pointerleave', leaveFrame);
      window.removeEventListener('blur', leaveFrame);
    };
  }, []);

  return (
    <div
      ref={frameRef}
      className="syncfox-frame"
      role="img"
      aria-label="Sync, linh vật cáo xanh của LifeSync AI, đang chơi với một chiếc đồng hồ báo thức"
    >
      <div className="syncfox-stage" aria-hidden="true">
        <span className="syncfox-orbit syncfox-orbit--outer" />
        <span className="syncfox-orbit syncfox-orbit--inner" />
        <span className="syncfox-spark syncfox-spark--one" />
        <span className="syncfox-spark syncfox-spark--two" />

        <div className="syncfox-character-track">
          <div className="syncfox-character-action">
            <img
              className="syncfox-character-image syncfox-character-image--idle"
              src="/login/lifesync-fox-mascot-v2.png"
              alt=""
              width={768}
              height={1152}
              draggable={false}
              decoding="sync"
              fetchPriority="high"
              onLoad={() => markAssetReady('idle')}
              onError={() => markAssetReady('idle')}
            />
            <img
              className="syncfox-character-image syncfox-character-image--startled"
              src="/login/lifesync-fox-startled-v2.png"
              alt=""
              width={768}
              height={1152}
              draggable={false}
              decoding="sync"
              fetchPriority="high"
              onLoad={() => markAssetReady('startled')}
              onError={() => markAssetReady('startled')}
            />
            <img
              className="syncfox-character-image syncfox-character-image--pickup"
              src="/login/lifesync-fox-pickup-v2.png"
              alt=""
              width={768}
              height={1152}
              draggable={false}
              decoding="sync"
              fetchPriority="high"
              onLoad={() => markAssetReady('pickup')}
              onError={() => markAssetReady('pickup')}
            />
            <span className="syncfox-eye-glint syncfox-eye-glint--left" />
            <span className="syncfox-eye-glint syncfox-eye-glint--right" />
          </div>
        </div>

        <div className="syncfox-clock-flight">
          <div className="syncfox-clock">
            <span className="syncfox-clock-bell syncfox-clock-bell--left" />
            <span className="syncfox-clock-bell syncfox-clock-bell--right" />
            <span className="syncfox-clock-button" />
            <span className="syncfox-clock-face">
              <span className="syncfox-clock-hand syncfox-clock-hand--hour" />
              <span className="syncfox-clock-hand syncfox-clock-hand--minute" />
              <span className="syncfox-clock-pin" />
            </span>
          </div>
        </div>

        <span className="syncfox-ring syncfox-ring--left" />
        <span className="syncfox-ring syncfox-ring--right" />
        <span className="syncfox-impact syncfox-impact--one">✦</span>
        <span className="syncfox-impact syncfox-impact--two">✦</span>
        <span className="syncfox-ground-shadow" />
      </div>
    </div>
  );
}
