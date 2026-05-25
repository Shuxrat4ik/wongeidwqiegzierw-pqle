'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const covers = [
  { title: 'NEON RAID', top: '#38bdf8', mid: '#0f172a', bottom: '#ef4444' },
  { title: 'VOIDLINE', top: '#a3e635', mid: '#111827', bottom: '#22c55e' },
  { title: 'STARFALL', top: '#f59e0b', mid: '#1f2937', bottom: '#06b6d4' },
  { title: 'ASH VAULT', top: '#fb7185', mid: '#111827', bottom: '#f97316' },
  { title: 'DRIFT OPS', top: '#60a5fa', mid: '#0f172a', bottom: '#14b8a6' },
  { title: 'IRON LOOP', top: '#facc15', mid: '#18181b', bottom: '#8b5cf6' },
  { title: 'SKYFORGE', top: '#2dd4bf', mid: '#0f172a', bottom: '#f43f5e' },
  { title: 'EMBER IX', top: '#e879f9', mid: '#111827', bottom: '#f59e0b' },
];

function makeCoverTexture(cover: (typeof covers)[number], index: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 512;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, cover.top);
  gradient.addColorStop(0.48, cover.mid);
  gradient.addColorStop(1, cover.bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  for (let y = -80; y < canvas.height; y += 74) {
    ctx.save();
    ctx.translate(canvas.width / 2, y);
    ctx.rotate(-0.34);
    ctx.fillRect(-260, -10, 520, 18);
    ctx.restore();
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 3;
  ctx.strokeRect(22, 22, canvas.width - 44, canvas.height - 44);

  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.fillRect(34, 350, canvas.width - 68, 98);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 36px Inter, Arial, sans-serif';
  ctx.fillText(cover.title, 48, 392);

  ctx.font = '700 17px Inter, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.fillText(`NEXUS DROP ${String(index + 1).padStart(2, '0')}`, 48, 424);

  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(48, 70, 70, 70);
  ctx.fillRect(134, 70, 164, 18);
  ctx.fillRect(134, 101, 118, 18);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export default function Store3DShowcase() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.85, 6.3);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.domElement.dataset.testid = 'store-3d-canvas';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const mainGroup = new THREE.Group();
    mainGroup.position.set(0.72, -0.1, 0);
    mainGroup.scale.setScalar(1.18);
    scene.add(mainGroup);

    scene.add(new THREE.AmbientLight(0x7dd3fc, 2.1));

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.4);
    keyLight.position.set(4, 5, 6);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xf59e0b, 4.8, 12);
    rimLight.position.set(-3.2, 0.6, 2.5);
    scene.add(rimLight);

    const accentLight = new THREE.PointLight(0x22c55e, 3.6, 10);
    accentLight.position.set(2.8, -1.7, 3.2);
    scene.add(accentLight);

    const sideMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.38,
      metalness: 0.55,
    });
    const backMaterial = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.5,
      metalness: 0.2,
    });
    const panelGeometry = new THREE.BoxGeometry(1.06, 1.48, 0.08);
    const panels: THREE.Mesh[] = [];
    const textures: THREE.Texture[] = [];
    const frontMaterials: THREE.MeshStandardMaterial[] = [];
    const layout = [
      { x: 1.05, y: 0.45, z: -0.25, ry: -0.34, rz: -0.03, s: 1.22 },
      { x: 2.25, y: 0.05, z: -0.55, ry: -0.18, rz: 0.04, s: 1.1 },
      { x: 3.22, y: 0.42, z: -1.02, ry: -0.48, rz: 0.02, s: 0.96 },
      { x: 1.7, y: -0.85, z: -0.45, ry: 0.18, rz: -0.05, s: 0.92 },
      { x: 2.82, y: -0.82, z: -0.86, ry: 0.3, rz: 0.04, s: 0.86 },
      { x: 0.22, y: -0.58, z: -0.78, ry: -0.1, rz: 0.06, s: 0.8 },
      { x: 3.72, y: -0.3, z: -1.2, ry: -0.65, rz: -0.04, s: 0.74 },
      { x: 0.62, y: 0.9, z: -0.95, ry: 0.24, rz: 0.03, s: 0.72 },
    ];

    covers.forEach((cover, index) => {
      const texture = makeCoverTexture(cover, index);
      if (texture) textures.push(texture);

      const frontMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: texture ?? undefined,
        emissive: new THREE.Color(cover.top),
        emissiveIntensity: 0.08,
        roughness: 0.32,
        metalness: 0.18,
      });
      frontMaterials.push(frontMaterial);
      const mesh = new THREE.Mesh(panelGeometry, [
        sideMaterial,
        sideMaterial,
        sideMaterial,
        sideMaterial,
        frontMaterial,
        backMaterial,
      ]);

      const slot = layout[index % layout.length];
      mesh.position.set(slot.x, slot.y, slot.z);
      mesh.rotation.set(-0.08, slot.ry, slot.rz);
      mesh.scale.setScalar(slot.s);
      mesh.userData.baseY = slot.y;
      panels.push(mesh);
      mainGroup.add(mesh);
    });

    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.26,
      roughness: 0.2,
      metalness: 0.7,
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.62, 0.018, 16, 160), ringMaterial);
    ring.rotation.x = Math.PI / 2.65;
    ring.position.x = 2.0;
    ring.position.y = -0.88;
    mainGroup.add(ring);

    const railMaterial = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xf97316,
      emissiveIntensity: 0.2,
      roughness: 0.35,
      metalness: 0.6,
    });
    const rails = new THREE.Group();
    for (let i = 0; i < 3; i += 1) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(3.9 - i * 0.55, 0.018, 0.018), railMaterial);
      rail.position.set(0, -1.22 - i * 0.13, -0.28 + i * 0.15);
      rail.rotation.z = (i - 1) * 0.08;
      rails.add(rail);
    }
    mainGroup.add(rails);

    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 80;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 7.5;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 3.3;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2.3;
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        color: 0x94a3b8,
        size: 0.018,
        transparent: true,
        opacity: 0.76,
      })
    );
    scene.add(particles);

    let pointerX = 0;
    let pointerY = 0;
    const onPointerMove = (event: PointerEvent) => {
      pointerX = (event.clientX / window.innerWidth - 0.5) * 0.45;
      pointerY = (event.clientY / window.innerHeight - 0.5) * 0.28;
    };
    window.addEventListener('pointermove', onPointerMove);

    const resize = () => {
      const width = Math.max(1, Math.floor(mount.clientWidth));
      const height = Math.max(1, Math.floor(mount.clientHeight));
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.render(scene, camera);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    let frame = 0;
    const animate = () => {
      frame += 1;
      const t = frame * 0.012;
      mainGroup.rotation.y += (pointerX + t * 0.1 - mainGroup.rotation.y) * 0.02;
      mainGroup.rotation.x += (-pointerY - mainGroup.rotation.x) * 0.025;
      ring.rotation.z = t * 0.38;
      rails.rotation.y = -t * 0.16;
      particles.rotation.y = t * 0.035;
      panels.forEach((panel, index) => {
        const baseY = typeof panel.userData.baseY === 'number' ? panel.userData.baseY : 0;
        panel.position.y += (baseY + Math.sin(t * 1.7 + index) * 0.08 - panel.position.y) * 0.035;
      });
      renderer.render(scene, camera);
      if (!reducedMotion) {
        animationFrame = window.requestAnimationFrame(animate);
      }
    };

    let animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('pointermove', onPointerMove);
      observer.disconnect();
      mount.removeChild(renderer.domElement);
      panelGeometry.dispose();
      ring.geometry.dispose();
      rails.children.forEach(child => {
        if (child instanceof THREE.Mesh) child.geometry.dispose();
      });
      particleGeometry.dispose();
      textures.forEach(texture => texture.dispose());
      frontMaterials.forEach(material => material.dispose());
      sideMaterial.dispose();
      backMaterial.dispose();
      ringMaterial.dispose();
      railMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />;
}
