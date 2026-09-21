import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import * as THREE from 'three';

const POINT_COUNT = 56;

function seededValue(index: number, salt: number) {
  const value = Math.sin(index * 9283.31 + salt * 77.17) * 43758.5453;
  return value - Math.floor(value);
}

export function AuthMotionBackdrop() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lowPowerDevice = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 2;

    if (reducedMotion || lowPowerDevice) {
      mount.dataset.fallback = 'static';
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 40);
    camera.position.z = 6.4;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' });
    } catch {
      mount.dataset.fallback = 'static';
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const positions = new Float32Array(POINT_COUNT * 3);
    for (let index = 0; index < POINT_COUNT; index += 1) {
      const radius = 1.6 + seededValue(index, 1) * 2.2;
      const angle = seededValue(index, 2) * Math.PI * 2;
      positions[index * 3] = Math.cos(angle) * radius;
      positions[index * 3 + 1] = (seededValue(index, 3) - 0.5) * 5.2;
      positions[index * 3 + 2] = (seededValue(index, 4) - 0.5) * 3.6;
    }

    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pointsMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(0.36, 0.88, 0.94),
      size: 0.035,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(pointsGeometry, pointsMaterial);
    group.add(points);

    const wireGeometry = new THREE.TorusGeometry(1.9, 0.008, 6, 100);
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0.72, 0.95, 0.98),
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });
    const wire = new THREE.Mesh(wireGeometry, wireMaterial);
    wire.position.set(0, 0.1, -0.8);
    wire.rotation.x = 1.1;
    group.add(wire);

    const resize = () => {
      const width = Math.max(mount.clientWidth, 1);
      const height = Math.max(mount.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    const rotateX = gsap.quickTo(group.rotation, 'x', { duration: 0.7, ease: 'power3.out' });
    const rotateY = gsap.quickTo(group.rotation, 'y', { duration: 0.7, ease: 'power3.out' });
    const pointerTarget = mount.closest<HTMLElement>('.auth-visual, .login-studio') ?? mount;
    const zoom = gsap.quickTo(camera.position, 'z', { duration: 1, ease: 'power3.out' });

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      const bounds = pointerTarget.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / Math.max(bounds.width, 1) - 0.5) * 2;
      const y = ((event.clientY - bounds.top) / Math.max(bounds.height, 1) - 0.5) * 2;
      rotateX(y * 0.08);
      rotateY(x * 0.12);
      zoom(5.9);
    };

    const resetPointer = () => {
      rotateX(0);
      rotateY(0);
      zoom(6.4);
    };

    pointerTarget.addEventListener('pointermove', onPointerMove, { passive: true });
    pointerTarget.addEventListener('pointerleave', resetPointer);

    const intro = gsap.fromTo(renderer.domElement, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'power3.out' });
    let frame = 0;
    const clock = new THREE.Clock();
    const render = () => {
      if (document.visibilityState !== 'visible') {
        frame = 0;
        return;
      }
      const elapsed = clock.getElapsedTime();
      points.rotation.y = elapsed * 0.025;
      points.rotation.z = elapsed * 0.012;
      wire.rotation.x = 1.1 + Math.sin(elapsed * 0.2) * 0.12;
      wire.rotation.y = Math.sin(elapsed * 0.15) * 0.25;
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(render);
    };
    frame = window.requestAnimationFrame(render);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && frame === 0) {
        frame = window.requestAnimationFrame(render);
      } else if (document.visibilityState !== 'visible') {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      intro.kill();
      gsap.killTweensOf(group.rotation);
      gsap.killTweensOf(camera.position);
      pointerTarget.removeEventListener('pointermove', onPointerMove);
      pointerTarget.removeEventListener('pointerleave', resetPointer);
      resizeObserver.disconnect();
      pointsGeometry.dispose();
      pointsMaterial.dispose();
      wireGeometry.dispose();
      wireMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={mountRef} className="auth-motion-backdrop" aria-hidden="true" />;
}
