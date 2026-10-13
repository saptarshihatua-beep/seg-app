import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Shield, Lock, MapPin, ChevronDown, Sparkles, Activity, Key, Globe, Eye } from 'lucide-react';

export default function Cinematic3DHero({ onLaunchApp, onExploreDemo, onExploreSecurity }) {
  const mountRef = useRef(null);
  const [webGlSupported, setWebGlSupported] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [activeGeoZone, setActiveGeoZone] = useState('UCCS Campus (38.89°N, 104.80°W)');

  useEffect(() => {
    // Detect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setWebGlSupported(false);
      return;
    }

    const container = mountRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGlSupported(false);
        return;
      }
    } catch (e) {
      setWebGlSupported(false);
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 650;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060a12, 0.0018);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 15, 65);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Group for entire rotating globe assembly
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // 1. Core Sphere (Dark oceanic base)
    const sphereGeo = new THREE.SphereGeometry(18, 48, 48);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x071120,
      transparent: true,
      opacity: 0.85,
      wireframe: false
    });
    const coreSphere = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(coreSphere);

    // 2. Holographic Latitude/Longitude Grid Wireframe
    const wireGeo = new THREE.WireframeGeometry(new THREE.SphereGeometry(18.08, 24, 24));
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending
    });
    const wireMesh = new THREE.LineSegments(wireGeo, wireMat);
    globeGroup.add(wireMesh);

    // 3. Geodesic Security Perimeter Points Cloud
    const particleCount = 700;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / particleCount);
      const theta = Math.sqrt(particleCount * Math.PI) * phi;
      const r = 18.2 + Math.random() * 0.4;
      particlePositions[i * 3] = r * Math.cos(theta) * Math.sin(phi);
      particlePositions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
      particlePositions[i * 3 + 2] = r * Math.cos(phi);
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.4,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    const particleMesh = new THREE.Points(particleGeo, particleMat);
    globeGroup.add(particleMesh);

    // 4. Geofence Boundary Polygon Ring (Simulating Colorado Springs / UCCS boundary)
    const ringGeo = new THREE.RingGeometry(3.2, 3.4, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const geofenceRing = new THREE.Mesh(ringGeo, ringMat);
    geofenceRing.position.set(11, 8.5, 12);
    geofenceRing.lookAt(11 * 2, 8.5 * 2, 12 * 2);
    globeGroup.add(geofenceRing);

    // Pulsing inner geofence disc
    const discGeo = new THREE.CircleGeometry(3.1, 32);
    const discMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const geofenceDisc = new THREE.Mesh(discGeo, discMat);
    geofenceDisc.position.copy(geofenceRing.position);
    geofenceDisc.quaternion.copy(geofenceRing.quaternion);
    globeGroup.add(geofenceDisc);

    // 5. Vertical Geofence Laser Beacon
    const beaconGeo = new THREE.CylinderGeometry(0.08, 0.5, 14, 16);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(11 * 1.35, 8.5 * 1.35, 12 * 1.35);
    beacon.quaternion.copy(geofenceRing.quaternion);
    beacon.rotateX(Math.PI / 2);
    globeGroup.add(beacon);

    // 6. Orbital Satellite Security Rings
    const orbitRadius = 26;
    const orbitCurve = new THREE.EllipseCurve(0, 0, orbitRadius, orbitRadius * 0.7, 0, 2 * Math.PI, false, 0);
    const orbitPoints = orbitCurve.getPoints(64);
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints.map(p => new THREE.Vector3(p.x, p.y, 0)));
    const orbitMat = new THREE.LineBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.35 });
    
    const orbit1 = new THREE.Line(orbitGeo, orbitMat);
    orbit1.rotation.x = Math.PI / 3;
    orbit1.rotation.y = Math.PI / 6;
    scene.add(orbit1);

    // Satellite Token Node
    const satGeo = new THREE.SphereGeometry(0.5, 12, 12);
    const satMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const satellite = new THREE.Mesh(satGeo, satMat);
    scene.add(satellite);

    // Background Stars Field
    const starsCount = 400;
    const starsPositions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount; i++) {
      starsPositions[i * 3] = (Math.random() - 0.5) * 200;
      starsPositions[i * 3 + 1] = (Math.random() - 0.5) * 200;
      starsPositions[i * 3 + 2] = -30 - Math.random() * 80;
    }
    const starsGeo = new THREE.BufferGeometry();
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
    const starsMat = new THREE.PointsMaterial({ color: 0x64748b, size: 0.6, transparent: true, opacity: 0.4 });
    const stars = new THREE.Points(starsGeo, starsMat);
    scene.add(stars);

    // Mouse / Touch Interactivity
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onPointerMove = (e) => {
      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

      if (isDragging) {
        const deltaX = clientX - previousMousePosition.x;
        const deltaY = clientY - previousMousePosition.y;
        targetRotationY += deltaX * 0.005;
        targetRotationX += deltaY * 0.005;
        previousMousePosition = { x: clientX, y: clientY };
      } else {
        mouseX = (clientX / window.innerWidth) * 2 - 1;
        mouseY = -(clientY / window.innerHeight) * 2 + 1;
      }
    };

    const onPointerDown = (e) => {
      isDragging = true;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
      previousMousePosition = { x: clientX, y: clientY };
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);

    // Responsive Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight || 650;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Constant auto-rotation with user drag modulation
      globeGroup.rotation.y += 0.003;
      globeGroup.rotation.y += (targetRotationY - globeGroup.rotation.y) * 0.05;
      globeGroup.rotation.x += (targetRotationX - globeGroup.rotation.x) * 0.05;

      // Parallax camera sway
      camera.position.x += (mouseX * 5 - camera.position.x) * 0.03;
      camera.position.y += (15 + mouseY * 4 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      // Pulse geofence disc
      const pulse = 1 + Math.sin(elapsedTime * 3) * 0.15;
      geofenceDisc.scale.set(pulse, pulse, 1);
      discMat.opacity = 0.12 + Math.sin(elapsedTime * 3) * 0.08;

      // Orbiting Satellite Node
      const orbitAngle = elapsedTime * 0.6;
      satellite.position.x = Math.cos(orbitAngle) * orbitRadius;
      satellite.position.y = Math.sin(orbitAngle) * (orbitRadius * 0.7) * Math.cos(Math.PI / 3);
      satellite.position.z = Math.sin(orbitAngle) * (orbitRadius * 0.7) * Math.sin(Math.PI / 3);

      renderer.render(scene, camera);
    };

    animate();

    // Clean up WebGL resources on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', handleResize);

      // Dispose Three.js objects
      sphereGeo.dispose();
      sphereMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      discGeo.dispose();
      discMat.dispose();
      beaconGeo.dispose();
      beaconMat.dispose();
      orbitGeo.dispose();
      orbitMat.dispose();
      satGeo.dispose();
      satMat.dispose();
      starsGeo.dispose();
      starsMat.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full min-h-[640px] lg:min-h-[720px] flex items-center justify-center overflow-hidden bg-[#060a12] border-b border-cyan-950/60">
      
      {/* 3D WebGL Canvas Mount */}
      {webGlSupported ? (
        <div
          ref={mountRef}
          className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing opacity-90 transition-opacity duration-1000"
          title="Interactive 3D Geospatial Orbit — Click & Drag to Rotate"
        />
      ) : (
        /* Reduced Motion / WebGL Fallback */
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-40 pointer-events-none">
          <div className="relative w-96 h-96 rounded-full border border-cyan-500/30 animate-pulse">
            <div className="absolute inset-4 rounded-full border border-cyan-500/20" />
            <div className="absolute inset-12 rounded-full border border-cyan-500/10" />
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-cyan-500/30" />
            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-cyan-500/30" />
            <div className="absolute top-1/4 left-1/3 w-8 h-8 rounded-full border-2 border-cyan-400 bg-cyan-500/20" />
          </div>
        </div>
      )}

      {/* Ambient Gradient Highlights */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#060a12] to-transparent pointer-events-none z-10" />

      {/* Foreground Hero Content (Strictly Readable with High Contrast) */}
      <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center flex flex-col items-center">
        
        {/* Academic / Research Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/40 backdrop-blur-md shadow-lg shadow-cyan-950/50 mb-6">
          <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-[11px] font-mono tracking-wider font-semibold text-cyan-300 uppercase">
            Zero-Trust GeoEncryption • UCCS CS6910 Research Reference
          </span>
        </div>

        {/* Main Title (High Readability Against 3D Scene) */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08] mb-6 drop-shadow-2xl">
          Secure Enhanced <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500">
            Geolocking (SEG)
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl text-slate-300 text-sm sm:text-base lg:text-lg font-normal leading-relaxed mb-8 backdrop-blur-sm bg-slate-950/40 p-3 rounded-2xl border border-slate-800/40">
          Zero-trust document distribution governed strictly by mathematical physical location. Encrypt documents with client-side AES-256 and restrict cryptographic key release to verified geographic polygon coordinates.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 mb-12">
          <button
            onClick={onLaunchApp}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider font-mono shadow-xl shadow-cyan-500/25 hover:shadow-cyan-400/40 hover:scale-[1.02] active:scale-[0.98] transition"
          >
            Authenticate & Open App
          </button>

          <button
            onClick={onExploreDemo}
            className="px-5 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/80 text-white font-medium text-xs font-mono backdrop-blur-md hover:border-cyan-500/50 transition flex items-center gap-2"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interactive Location Sandbox</span>
          </button>

          <button
            onClick={onExploreSecurity}
            className="px-5 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/80 text-slate-300 hover:text-white font-medium text-xs font-mono backdrop-blur-md hover:border-cyan-500/50 transition flex items-center gap-2"
          >
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Security Architecture</span>
          </button>
        </div>

        {/* 3D Scene Interactive Telemetry Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-cyan-900/50 text-[11px] font-mono text-slate-400 backdrop-blur-md">
          <Globe className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span>Active 3D Geofence Target:</span>
          <span className="text-cyan-300 font-semibold">{activeGeoZone}</span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-slate-500">Drag scene to inspect orbital plane</span>
        </div>

      </div>

      {/* Bottom Scroll Indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 text-[10px] font-mono text-slate-500 pointer-events-none">
        <span>Scroll to Explore Architecture</span>
        <ChevronDown className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
      </div>

    </div>
  );
}
