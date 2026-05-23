'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type StoreHero3DProps = {
  className?: string;
};

/**
 * Lightweight Three.js backdrop: floating crystal + particle drift + rim lights.
 * Renders only on the client; tears down cleanly on unmount.
 */
export default function StoreHero3D({ className }: StoreHero3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x03040a, 0.035);

    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 80);
    camera.position.set(0, 0.2, 5.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    el.appendChild(renderer.domElement);

    const coreGeo = new THREE.IcosahedronGeometry(1.15, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      metalness: 0.92,
      roughness: 0.18,
      emissive: 0x082f49,
      emissiveIntensity: 0.55,
      flatShading: true,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    const wireGeo = new THREE.IcosahedronGeometry(1.32, 1);
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9, wireframe: true, transparent: true, opacity: 0.22 });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    scene.add(wire);

    const ringGeo = new THREE.TorusGeometry(2.1, 0.02, 12, 120);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x7c3aed, transparent: true, opacity: 0.35 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.35;
    scene.add(ring);

    const particlesGeo = new THREE.BufferGeometry();
    const count = 900;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 4 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.045,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const stars = new THREE.Points(particlesGeo, particlesMat);
    scene.add(stars);

    const amb = new THREE.AmbientLight(0x1e293b, 0.45);
    const key = new THREE.PointLight(0x38bdf8, 42, 22, 2);
    key.position.set(2.4, 2.1, 3.2);
    const rim = new THREE.PointLight(0xa855f7, 28, 18, 2);
    rim.position.set(-3.2, -1.4, 2.6);
    scene.add(amb, key, rim);

    let frame = 0;
    const t0 = performance.now();

    const resize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const tick = (now: number) => {
      const t = (now - t0) / 1000;
      core.rotation.x = t * 0.31;
      core.rotation.y = t * 0.52;
      wire.rotation.copy(core.rotation);
      ring.rotation.z = t * 0.11;
      stars.rotation.y = t * 0.04;
      camera.position.x = Math.sin(t * 0.15) * 0.25;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      coreGeo.dispose();
      coreMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      particlesGeo.dispose();
      particlesMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === el) el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className={className} aria-hidden />;
}
