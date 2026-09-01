import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface AuthScene3DProps {
  celebrating?: boolean;
  mode?: 'login' | 'register';
}

const ENTERPRISE_SCENE = {
  porcelain: 0xdcebed,
  accent: 0x26c6d8,
  ink: 0x0a1820,
  secondary: 0x76939b,
  light: 0xa9f4f2,
} as const;

function createCalendar(material: THREE.Material, accent: THREE.Material) {
  const group = new THREE.Group();
  const panel = new THREE.Mesh(new THREE.BoxGeometry(1.55, 1.15, 0.16), material);
  group.add(panel);

  const header = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.1, 0.06), accent);
  header.position.set(0, 0.38, 0.12);
  group.add(header);

  for (let row = 0; row < 2; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      const cell = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.18, 0.05),
        row === 1 && column === 1 ? accent : material,
      );
      cell.position.set(-0.34 + column * 0.34, 0.08 - row * 0.28, 0.12);
      group.add(cell);
    }
  }

  return group;
}

export function AuthScene3D({ celebrating = false, mode = 'register' }: AuthScene3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const celebratingRef = useRef(celebrating);

  useEffect(() => {
    celebratingRef.current = celebrating;
  }, [celebrating]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const enterprise = mode === 'login';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.15, 8.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    mount.appendChild(renderer.domElement);

    const world = new THREE.Group();
    world.rotation.set(-0.08, -0.18, -0.08);
    scene.add(world);

    const porcelain = new THREE.MeshPhysicalMaterial({
      color: enterprise ? ENTERPRISE_SCENE.porcelain : 0xfff8ef,
      roughness: 0.18,
      metalness: 0.05,
      clearcoat: 0.8,
      clearcoatRoughness: 0.2,
    });
    const cobalt = new THREE.MeshStandardMaterial({
      color: enterprise ? ENTERPRISE_SCENE.accent : 0x2947c7,
      roughness: 0.24,
      metalness: 0.18,
    });
    const ink = new THREE.MeshStandardMaterial({
      color: enterprise ? ENTERPRISE_SCENE.ink : 0x151b36,
      roughness: 0.3,
      metalness: 0.25,
    });
    const gold = new THREE.MeshStandardMaterial({
      color: enterprise ? ENTERPRISE_SCENE.secondary : 0xffc857,
      emissive: enterprise ? ENTERPRISE_SCENE.ink : 0x8f4b12,
      emissiveIntensity: enterprise ? 0.1 : 0.3,
      roughness: 0.2,
      metalness: 0.4,
    });

    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.22, 3), porcelain);
    core.scale.set(1, 0.92, 1);
    world.add(core);

    const innerCore = new THREE.Mesh(new THREE.SphereGeometry(0.42, 48, 48), cobalt);
    const gazeOrb = new THREE.Group();
    let iris: THREE.Mesh | null = null;
    let pupil: THREE.Mesh | null = null;

    if (enterprise) {
      gazeOrb.position.set(0.18, 0.08, 1.03);
      gazeOrb.add(innerCore);

      iris = new THREE.Mesh(new THREE.SphereGeometry(0.24, 40, 40), porcelain);
      iris.position.z = 0.34;
      gazeOrb.add(iris);

      pupil = new THREE.Mesh(new THREE.SphereGeometry(0.105, 36, 36), ink);
      pupil.position.z = 0.53;
      gazeOrb.add(pupil);

      const catchLight = new THREE.Mesh(
        new THREE.SphereGeometry(0.032, 20, 20),
        new THREE.MeshBasicMaterial({ color: ENTERPRISE_SCENE.light }),
      );
      catchLight.position.set(-0.035, 0.045, 0.615);
      gazeOrb.add(catchLight);
      world.add(gazeOrb);
    } else {
      innerCore.position.set(0.18, 0.08, 1.03);
      world.add(innerCore);
    }

    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.12, 0.085, 18, 160), ink);
    ring.rotation.set(1.08, 0.18, -0.24);
    world.add(ring);

    const ringAccent = new THREE.Mesh(new THREE.TorusGeometry(1.63, 0.035, 12, 140), cobalt);
    ringAccent.rotation.set(0.72, 1.15, 0.2);
    world.add(ringAccent);

    const calendar = createCalendar(porcelain, cobalt);
    calendar.position.set(-2.05, 1.24, -0.22);
    calendar.rotation.set(-0.08, 0.5, -0.16);
    world.add(calendar);

    const timer = new THREE.Group();
    const timerFace = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.18, 56), porcelain);
    timerFace.rotation.x = Math.PI / 2;
    timer.add(timerFace);
    const timerRing = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.075, 16, 80), gold);
    timer.add(timerRing);
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.44, 0.05), ink);
    hand.position.set(0.1, 0.16, 0.15);
    hand.rotation.z = -0.48;
    timer.add(hand);
    timer.position.set(2.05, -1.15, 0.35);
    timer.rotation.set(0.08, -0.38, 0.18);
    world.add(timer);

    const satellites = [
      { position: new THREE.Vector3(2.35, 1.42, -0.45), radius: 0.28, material: gold },
      { position: new THREE.Vector3(-1.82, -1.42, 0.6), radius: 0.34, material: cobalt },
      { position: new THREE.Vector3(0.55, 2.05, -0.6), radius: 0.18, material: ink },
    ].map(({ position, radius, material }) => {
      const satellite = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32), material);
      satellite.position.copy(position);
      world.add(satellite);
      return satellite;
    });

    const dotsGeometry = new THREE.BufferGeometry();
    const dotPositions = new Float32Array(150);
    let dotSeed = 29;
    const nextDot = () => {
      dotSeed = (dotSeed * 9301 + 49297) % 233280;
      return dotSeed / 233280;
    };
    for (let index = 0; index < dotPositions.length; index += 3) {
      dotPositions[index] = (nextDot() - 0.5) * 7;
      dotPositions[index + 1] = (nextDot() - 0.5) * 6;
      dotPositions[index + 2] = (nextDot() - 0.5) * 3;
    }
    dotsGeometry.setAttribute('position', new THREE.BufferAttribute(dotPositions, 3));
    const dots = new THREE.Points(
      dotsGeometry,
      new THREE.PointsMaterial({
        color: enterprise ? ENTERPRISE_SCENE.porcelain : 0xfff8ef,
        size: 0.035,
        transparent: true,
        opacity: 0.55,
      }),
    );
    world.add(dots);

    scene.add(new THREE.HemisphereLight(
      enterprise ? ENTERPRISE_SCENE.porcelain : 0xfff4de,
      enterprise ? ENTERPRISE_SCENE.ink : 0x1f2450,
      2.4,
    ));
    const keyLight = new THREE.PointLight(enterprise ? 0xd8fbfa : 0xfff0dd, 42, 18);
    keyLight.position.set(-3, 4, 6);
    scene.add(keyLight);
    const cobaltLight = new THREE.PointLight(enterprise ? ENTERPRISE_SCENE.accent : 0x3557e0, 30, 14);
    cobaltLight.position.set(3.5, -2.5, 4);
    scene.add(cobaltLight);

    const pointer = new THREE.Vector2();
    const pointerTarget = new THREE.Vector2();
    const onPointerMove = (event: PointerEvent) => {
      const bounds = mount.getBoundingClientRect();
      pointerTarget.set(
        THREE.MathUtils.clamp(((event.clientX - bounds.left) / bounds.width - 0.5) * 2, -1.25, 1.25),
        THREE.MathUtils.clamp(-((event.clientY - bounds.top) / bounds.height - 0.5) * 2, -1.15, 1.15),
      );
    };
    const onPointerLeave = () => pointerTarget.set(0, 0);
    if (enterprise) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('blur', onPointerLeave);
    } else {
      mount.addEventListener('pointermove', onPointerMove, { passive: true });
      mount.addEventListener('pointerleave', onPointerLeave);
    }

    let width = 1;
    const resize = () => {
      width = Math.max(mount.clientWidth, 1);
      const height = Math.max(mount.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      world.scale.setScalar(width < 640 ? 0.67 : width < 1000 ? 0.84 : 1);
      world.position.y = width < 640 ? -0.25 : 0;
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    const startedAt = performance.now();
    let animationFrame = 0;
    const animate = (frameTime = performance.now()) => {
      const elapsed = (frameTime - startedAt) / 1000;
      const speed = celebratingRef.current ? 1.9 : 1;
      pointer.lerp(pointerTarget, 0.055);

      if (!reducedMotion) {
        world.rotation.y += (pointer.x * 0.18 - 0.18 - world.rotation.y) * 0.035;
        world.rotation.x += (-pointer.y * 0.1 - 0.08 - world.rotation.x) * 0.035;
        world.position.x += (pointer.x * 0.16 - world.position.x) * 0.04;
        ring.rotation.z = elapsed * 0.12 * speed;
        ringAccent.rotation.z = -elapsed * 0.18 * speed;
        core.rotation.y = elapsed * 0.08 * speed;
        innerCore.scale.setScalar(1 + Math.sin(elapsed * 2.2 * speed) * 0.08);
        if (enterprise && iris && pupil) {
          gazeOrb.position.x += (0.18 + pointer.x * 0.28 - gazeOrb.position.x) * 0.075;
          gazeOrb.position.y += (0.08 + pointer.y * 0.2 - gazeOrb.position.y) * 0.075;
          gazeOrb.rotation.y += (pointer.x * 0.28 - gazeOrb.rotation.y) * 0.08;
          gazeOrb.rotation.x += (-pointer.y * 0.2 - gazeOrb.rotation.x) * 0.08;
          iris.position.x += (pointer.x * 0.075 - iris.position.x) * 0.12;
          iris.position.y += (pointer.y * 0.055 - iris.position.y) * 0.12;
          pupil.position.x += (pointer.x * 0.13 - pupil.position.x) * 0.14;
          pupil.position.y += (pointer.y * 0.095 - pupil.position.y) * 0.14;
        }
        calendar.position.y = 1.24 + Math.sin(elapsed * 0.9) * 0.12;
        timer.position.y = -1.15 + Math.sin(elapsed * 0.8 + 1.2) * 0.1;
        hand.rotation.z = -0.48 - elapsed * 0.16 * speed;
        dots.rotation.y = elapsed * 0.025;
        satellites.forEach((satellite, index) => {
          satellite.position.y += Math.sin(elapsed * 1.1 + index) * 0.0018;
        });
      }

      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      if (enterprise) {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('blur', onPointerLeave);
      } else {
        mount.removeEventListener('pointermove', onPointerMove);
        mount.removeEventListener('pointerleave', onPointerLeave);
      }
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh || object instanceof THREE.Points)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [mode]);

  return <div ref={mountRef} className="auth-scene-canvas" aria-hidden="true" />;
}
