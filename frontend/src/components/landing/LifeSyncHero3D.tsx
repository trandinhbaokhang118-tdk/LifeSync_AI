import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export type HeroFeature = 'calendar' | 'ai' | 'focus' | 'fitness';

interface LifeSyncHero3DProps {
    activeFeature: HeroFeature;
}

const featurePositions: Record<HeroFeature, THREE.Vector3> = {
    calendar: new THREE.Vector3(-0.7, 1.75, -0.35),
    ai: new THREE.Vector3(1.35, 1.15, 0.45),
    focus: new THREE.Vector3(-1.25, -1.45, 0.35),
    fitness: new THREE.Vector3(2.2, -1.15, -0.1),
};

function addCalendar(group: THREE.Group, material: THREE.Material, accent: THREE.Material) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.55, 0.13), material);
    group.add(panel);
    for (let row = 0; row < 3; row += 1) {
        for (let column = 0; column < 4; column += 1) {
            const cell = new THREE.Mesh(
                new THREE.BoxGeometry(0.37, 0.25, 0.08),
                row === 1 && column === 2 ? accent : material,
            );
            cell.position.set(-0.67 + column * 0.45, 0.36 - row * 0.36, 0.12);
            group.add(cell);
        }
    }
    const header = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.09, 0.08), accent);
    header.position.set(-0.18, 0.62, 0.12);
    group.add(header);
}

function addAiCore(group: THREE.Group, accent: THREE.Material, glow: THREE.Material) {
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.64, 2), glow);
    core.name = 'ai-core';
    group.add(core);
    [0.92, 1.18].forEach((radius, index) => {
        const orbit = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.018, 8, 90), accent);
        orbit.rotation.set(index ? 1.15 : 0.55, index ? 0.2 : 1.1, index * 0.7);
        orbit.name = 'orbit';
        group.add(orbit);
    });
}

function addFocusTimer(group: THREE.Group, material: THREE.Material, accent: THREE.Material) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.16, 20, 100, Math.PI * 1.72), accent);
    ring.rotation.z = Math.PI * 0.14;
    group.add(ring);
    const face = new THREE.Mesh(new THREE.CylinderGeometry(0.69, 0.69, 0.11, 64), material);
    face.rotation.x = Math.PI / 2;
    group.add(face);
    for (let index = 0; index < 12; index += 1) {
        const tick = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.13, 0.04), accent);
        const angle = (index / 12) * Math.PI * 2;
        tick.position.set(Math.sin(angle) * 0.49, Math.cos(angle) * 0.49, 0.1);
        tick.rotation.z = -angle;
        group.add(tick);
    }
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.52, 0.05), accent);
    hand.position.set(0.13, 0.18, 0.12);
    hand.rotation.z = -0.55;
    hand.name = 'timer-hand';
    group.add(hand);
}

function addFitnessRoute(group: THREE.Group, material: THREE.Material, accent: THREE.Material) {
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.45, 0.1), material);
    group.add(base);
    const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.88, -0.38, 0.11),
        new THREE.Vector3(-0.42, 0.32, 0.17),
        new THREE.Vector3(0.08, -0.04, 0.2),
        new THREE.Vector3(0.42, 0.48, 0.16),
        new THREE.Vector3(0.92, 0.13, 0.12),
    ]);
    const route = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.04, 10, false), accent);
    group.add(route);
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 24), accent);
    pin.position.copy(curve.getPoint(1));
    pin.name = 'route-pin';
    group.add(pin);
}

export function LifeSyncHero3D({ activeFeature }: LifeSyncHero3DProps) {
    const mountRef = useRef<HTMLDivElement>(null);
    const activeFeatureRef = useRef(activeFeature);

    useEffect(() => {
        activeFeatureRef.current = activeFeature;
    }, [activeFeature]);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0xeaf8f3, 0.045);
        const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
        camera.position.set(0.4, 0.15, 8.8);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        mount.appendChild(renderer.domElement);

        const world = new THREE.Group();
        scene.add(world);
        const panelMaterial = new THREE.MeshPhysicalMaterial({ color: 0xf4fffb, metalness: 0.12, roughness: 0.2, transparent: true, opacity: 0.9, transmission: 0.18 });
        const accentMaterial = new THREE.MeshStandardMaterial({ color: 0x2bb99a, emissive: 0x98ead6, emissiveIntensity: 0.7, metalness: 0.08, roughness: 0.24 });
        const glowMaterial = new THREE.MeshPhysicalMaterial({ color: 0x62c8f2, emissive: 0xb9ebff, emissiveIntensity: 1.1, transmission: 0.38, roughness: 0.08, metalness: 0.05 });

        const featureGroups = {} as Record<HeroFeature, THREE.Group>;
        (Object.keys(featurePositions) as HeroFeature[]).forEach((feature) => {
            const group = new THREE.Group();
            group.position.copy(featurePositions[feature]);
            group.userData.baseY = group.position.y;
            group.userData.phase = Math.random() * Math.PI * 2;
            featureGroups[feature] = group;
            world.add(group);
        });
        addCalendar(featureGroups.calendar, panelMaterial, accentMaterial);
        addAiCore(featureGroups.ai, accentMaterial, glowMaterial);
        addFocusTimer(featureGroups.focus, panelMaterial, accentMaterial);
        addFitnessRoute(featureGroups.fitness, panelMaterial, accentMaterial);

        const mainOrbit = new THREE.Mesh(new THREE.TorusGeometry(3.35, 0.018, 8, 180), accentMaterial);
        mainOrbit.rotation.set(1.13, 0.18, -0.2);
        mainOrbit.material = accentMaterial.clone();
        (mainOrbit.material as THREE.MeshStandardMaterial).opacity = 0.34;
        (mainOrbit.material as THREE.MeshStandardMaterial).transparent = true;
        world.add(mainOrbit);

        const particlesGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(270);
        for (let index = 0; index < particlePositions.length; index += 3) {
            particlePositions[index] = (Math.random() - 0.5) * 11;
            particlePositions[index + 1] = (Math.random() - 0.5) * 7;
            particlePositions[index + 2] = (Math.random() - 0.5) * 5;
        }
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        const particles = new THREE.Points(particlesGeometry, new THREE.PointsMaterial({ color: 0x238f79, size: 0.025, transparent: true, opacity: 0.34 }));
        world.add(particles);

        scene.add(new THREE.HemisphereLight(0xffffff, 0x9bcdbf, 2.4));
        const keyLight = new THREE.PointLight(0x7be0c6, 22, 18);
        keyLight.position.set(2.8, 2.4, 5);
        scene.add(keyLight);
        const blueLight = new THREE.PointLight(0x74cfff, 18, 15);
        blueLight.position.set(-3.5, -1.5, 3.5);
        scene.add(blueLight);

        const pointer = new THREE.Vector2();
        const targetPointer = new THREE.Vector2();
        const onPointerMove = (event: PointerEvent) => {
            const bounds = mount.getBoundingClientRect();
            targetPointer.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
            targetPointer.y = -((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
        };
        mount.addEventListener('pointermove', onPointerMove);

        let viewportWidth = 1;
        const resize = () => {
            const width = Math.max(mount.clientWidth, 1);
            const height = Math.max(mount.clientHeight, 1);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height, false);
            viewportWidth = width;
            world.position.x = 0;
            world.scale.setScalar(width < 800 ? 0.68 : 1);
        };
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(mount);
        resize();

        const clock = new THREE.Clock();
        let animationFrame = 0;
        const cameraLookAt = new THREE.Vector3();
        const animate = () => {
            const elapsed = clock.getElapsedTime();
            pointer.lerp(targetPointer, 0.04);
            const selected = featureGroups[activeFeatureRef.current];
            const selectedPosition = new THREE.Vector3();
            selected.getWorldPosition(selectedPosition);
            const isMobile = viewportWidth < 800;
            const targetCamera = selectedPosition.clone().add(new THREE.Vector3(pointer.x * 0.22, pointer.y * 0.12, isMobile ? 8.3 : 7.4));
            camera.position.lerp(targetCamera, reducedMotion ? 0.12 : 0.035);
            const framingOffset = isMobile
                ? new THREE.Vector3(-0.45, 0.72, 0)
                : new THREE.Vector3(-2.15, 0.05, 0);
            cameraLookAt.lerp(selectedPosition.clone().add(framingOffset), 0.045);
            camera.lookAt(cameraLookAt);

            world.rotation.y += reducedMotion ? 0 : (pointer.x * 0.05 - world.rotation.y) * 0.018;
            world.rotation.x += reducedMotion ? 0 : (-pointer.y * 0.025 - world.rotation.x) * 0.018;
            mainOrbit.rotation.z = elapsed * 0.035;
            particles.rotation.y = elapsed * 0.018;

            (Object.keys(featureGroups) as HeroFeature[]).forEach((feature, index) => {
                const group = featureGroups[feature];
                const isSelected = feature === activeFeatureRef.current;
                const targetScale = isSelected ? 1.12 : 0.92;
                group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.06);
                if (!reducedMotion) {
                    group.position.y = group.userData.baseY + Math.sin(elapsed * 0.72 + group.userData.phase) * 0.12;
                    group.rotation.y = Math.sin(elapsed * 0.3 + index) * 0.08;
                }
            });

            const core = featureGroups.ai.getObjectByName('ai-core');
            if (core && !reducedMotion) core.rotation.y = elapsed * 0.38;
            featureGroups.ai.children.filter((child) => child.name === 'orbit').forEach((orbit, index) => {
                if (!reducedMotion) orbit.rotation.z = elapsed * (index ? -0.24 : 0.3);
            });
            const hand = featureGroups.focus.getObjectByName('timer-hand');
            if (hand && !reducedMotion) hand.rotation.z = -0.55 - elapsed * 0.15;
            const pin = featureGroups.fitness.getObjectByName('route-pin');
            if (pin && !reducedMotion) pin.scale.setScalar(1 + Math.sin(elapsed * 3) * 0.16);

            renderer.render(scene, camera);
            animationFrame = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            cancelAnimationFrame(animationFrame);
            resizeObserver.disconnect();
            mount.removeEventListener('pointermove', onPointerMove);
            scene.traverse((object) => {
                if (!(object instanceof THREE.Mesh || object instanceof THREE.Points)) return;
                object.geometry.dispose();
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                materials.forEach((material) => material.dispose());
            });
            renderer.dispose();
            renderer.domElement.remove();
        };
    }, []);

    return <div ref={mountRef} className="landing-3d-canvas" aria-hidden="true" />;
}
