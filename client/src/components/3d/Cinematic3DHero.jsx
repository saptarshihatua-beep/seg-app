import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Shield, Lock, MapPin, ChevronDown, Sparkles, Activity, 
  Key, Globe, Eye, Compass, Cpu, Layers, RefreshCw 
} from 'lucide-react';

export default function Cinematic3DHero({ onLaunchApp, onExploreDemo, onExploreSecurity }) {
  const mountRef = useRef(null);
  const [webGlSupported, setWebGlSupported] = useState(true);
  const [chromeMode, setChromeMode] = useState('liquid'); // 'liquid' | 'geodesic' | 'orbital'
  const [activeCoords, setActiveCoords] = useState({ lat: '38.8941° N', lng: '104.8008° W', zone: 'UCCS Engineering Wing' });

  // References to pass state into Three.js render loop without recreating scene
  const modeRef = useRef('liquid');
  useEffect(() => {
    modeRef.current = chromeMode;
  }, [chromeMode]);

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
    } catch {
      setWebGlSupported(false);
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 700;

    // 1. Scene & Atmospheric Fog
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x040812, 0.0022);

    // 2. Camera Configuration
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(0, 8, 62);

    // 3. High-Performance ACES Filmic Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true, 
      powerPreference: 'high-performance' 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 4. Procedural Studio Environment Reflection Map (Liquid Chrome Horizon)
    const envCanvas = document.createElement('canvas');
    envCanvas.width = 512;
    envCanvas.height = 256;
    const ctx = envCanvas.getContext('2d');
    if (ctx) {
      // Dark deep space background
      const grad = ctx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, '#020611');
      grad.addColorStop(0.45, '#0b192e');
      grad.addColorStop(0.5, '#00f2fe'); // Radiant glowing horizon streak
      grad.addColorStop(0.55, '#7928ca'); // Electric violet rim accent
      grad.addColorStop(0.7, '#07101e');
      grad.addColorStop(1, '#020409');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 256);

      // Studio vertical light boxes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(80, 20, 40, 160);
      ctx.fillRect(360, 20, 50, 160);
      ctx.fillStyle = '#00f2fe';
      ctx.fillRect(220, 50, 30, 120);
    }
    const envTexture = new THREE.CanvasTexture(envCanvas);
    envTexture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = envTexture;

    // 5. Dramatic Studio Lighting Setup
    // Key Light: Intense Cyan Specular Spotlight
    const keySpot = new THREE.SpotLight(0x00f2fe, 6.0, 140, Math.PI / 4, 0.35, 1.2);
    keySpot.position.set(28, 35, 45);
    scene.add(keySpot);

    // Rim Light: Electric Violet Contour Light
    const rimLight = new THREE.DirectionalLight(0x9d4edd, 5.0);
    rimLight.position.set(-35, 20, -25);
    scene.add(rimLight);

    // Uplight: Radiant Amber Accent for Sculptural Warmth
    const warmUnderLight = new THREE.PointLight(0xffbe0b, 3.2, 90);
    warmUnderLight.position.set(0, -25, 20);
    scene.add(warmUnderLight);

    // Deep Atmospheric Ambient Fill
    const ambientLight = new THREE.AmbientLight(0x0a1628, 1.4);
    scene.add(ambientLight);

    // 6. Sculptural Chrome Artifact Assembly Group
    const masterArtifactGroup = new THREE.Group();
    scene.add(masterArtifactGroup);

    // Sculptural Chrome Material Specification
    const chromeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.98,
      roughness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      reflectivity: 1.0,
      ior: 2.4,
      envMap: envTexture,
      envMapIntensity: 2.8
    });

    // Dark Obsidian Core Material
    const obsidianMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x050c18,
      metalness: 0.85,
      roughness: 0.22,
      clearcoat: 0.8,
      envMap: envTexture,
      envMapIntensity: 1.4
    });

    // Wireframe Hologram Material
    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });

    // A. Liquid Chrome Undulating Torus Core
    const liquidGeo = new THREE.TorusKnotGeometry(9.5, 3.2, 180, 36, 2, 3);
    const originalPositions = liquidGeo.attributes.position.clone();
    const liquidMesh = new THREE.Mesh(liquidGeo, chromeMaterial);
    liquidMesh.scale.set(1.1, 1.1, 1.1);
    masterArtifactGroup.add(liquidMesh);

    // B. Inner Obsidian Geodesic Core
    const coreGeo = new THREE.IcosahedronGeometry(7.2, 3);
    const coreMesh = new THREE.Mesh(coreGeo, obsidianMaterial);
    masterArtifactGroup.add(coreMesh);

    // C. Outer Holographic Geodesic Cage
    const cageGeo = new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(14.5, 2));
    const cageMesh = new THREE.LineSegments(cageGeo, wireframeMaterial);
    masterArtifactGroup.add(cageMesh);

    // D. Concentric Sculptural Chrome Rings (Multi-Axis Gimbal System)
    const ringGroup = new THREE.Group();
    scene.add(ringGroup);

    const createChromeGimbalRing = (radius, tube, rotX, rotY) => {
      const geo = new THREE.TorusGeometry(radius, tube, 24, 100);
      const mesh = new THREE.Mesh(geo, chromeMaterial);
      mesh.rotation.x = rotX;
      mesh.rotation.y = rotY;
      ringGroup.add(mesh);
      return mesh;
    };

    const gimbalRing1 = createChromeGimbalRing(19, 0.35, Math.PI / 4, 0);
    const gimbalRing2 = createChromeGimbalRing(23, 0.28, -Math.PI / 3, Math.PI / 5);
    const gimbalRing3 = createChromeGimbalRing(27, 0.22, Math.PI / 6, -Math.PI / 4);

    // E. Precision Geographic Geofence Pin & Holographic Laser Perimeter
    const geofenceBeaconGroup = new THREE.Group();
    masterArtifactGroup.add(geofenceBeaconGroup);

    // Holographic Pulsing Target Disc (UCCS Pin Location)
    const targetDiscGeo = new THREE.RingGeometry(2.4, 2.7, 48);
    const targetDiscMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    const targetDisc = new THREE.Mesh(targetDiscGeo, targetDiscMat);
    targetDisc.position.set(12.5, 8.2, 11);
    targetDisc.lookAt(12.5 * 2, 8.2 * 2, 11 * 2);
    geofenceBeaconGroup.add(targetDisc);

    // Inner Radiant Pulse
    const pulseCircleGeo = new THREE.CircleGeometry(2.3, 36);
    const pulseCircleMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending
    });
    const pulseCircle = new THREE.Mesh(pulseCircleGeo, pulseCircleMat);
    pulseCircle.position.copy(targetDisc.position);
    pulseCircle.quaternion.copy(targetDisc.quaternion);
    geofenceBeaconGroup.add(pulseCircle);

    // Laser Ray-Casting Pillar
    const laserGeo = new THREE.CylinderGeometry(0.08, 0.45, 18, 16);
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    const laserPillar = new THREE.Mesh(laserGeo, laserMat);
    laserPillar.position.set(12.5 * 1.35, 8.2 * 1.35, 11 * 1.35);
    laserPillar.quaternion.copy(targetDisc.quaternion);
    laserPillar.rotateX(Math.PI / 2);
    geofenceBeaconGroup.add(laserPillar);

    // F. Floating Cryptographic Coordinate Particles
    const particleCount = 450;
    const particleCoords = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const radius = 22 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      particleCoords[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particleCoords[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particleCoords[i * 3 + 2] = radius * Math.cos(phi);
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particleCoords, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.45,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    const spatialParticles = new THREE.Points(particleGeo, particleMat);
    scene.add(spatialParticles);

    // 7. Mouse / Touch Gestures & Damping
    let mouseX = 0;
    let mouseY = 0;
    let targetRotX = 0;
    let targetRotY = 0;
    let isDragging = false;
    let previousPointerPos = { x: 0, y: 0 };

    const onPointerMove = (e) => {
      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

      if (isDragging) {
        const deltaX = clientX - previousPointerPos.x;
        const deltaY = clientY - previousPointerPos.y;
        targetRotY += deltaX * 0.005;
        targetRotX += deltaY * 0.005;
        previousPointerPos = { x: clientX, y: clientY };
      } else {
        mouseX = (clientX / window.innerWidth) * 2 - 1;
        mouseY = -(clientY / window.innerHeight) * 2 + 1;
      }
    };

    const onPointerDown = (e) => {
      isDragging = true;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
      previousPointerPos = { x: clientX, y: clientY };
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);

    // Responsive Window Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight || 700;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    // 8. 60FPS Kinematic Animation Loop with Liquid Surface Displacement
    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const currentMode = modeRef.current;

      // Harmonic auto-rotation + interactive drag damping
      masterArtifactGroup.rotation.y += 0.004;
      masterArtifactGroup.rotation.y += (targetRotY - masterArtifactGroup.rotation.y) * 0.05;
      masterArtifactGroup.rotation.x += (targetRotX - masterArtifactGroup.rotation.x) * 0.05;

      // Parallax camera sway based on mouse pointer
      camera.position.x += (mouseX * 7 - camera.position.x) * 0.025;
      camera.position.y += (8 + mouseY * 5 - camera.position.y) * 0.025;
      camera.lookAt(0, 0, 0);

      // Gimbal orbital rings counter-rotations
      gimbalRing1.rotation.z += 0.006;
      gimbalRing2.rotation.y -= 0.005;
      gimbalRing3.rotation.x += 0.004;

      // Dynamic Liquid Chrome Wave Displacement (harmonic wave physics)
      if (currentMode === 'liquid') {
        const positions = liquidGeo.attributes.position;
        const orig = originalPositions.array;
        const count = positions.count;
        for (let i = 0; i < count; i++) {
          const u = i * 3;
          const ox = orig[u];
          const oy = orig[u + 1];
          const oz = orig[u + 2];
          const wave = Math.sin(ox * 0.35 + elapsedTime * 2.2) *
                       Math.cos(oy * 0.35 + elapsedTime * 1.8) *
                       Math.sin(oz * 0.25 + elapsedTime * 1.4);
          const factor = 1 + wave * 0.06;
          positions.setXYZ(i, ox * factor, oy * factor, oz * factor);
        }
        positions.needsUpdate = true;
        liquidGeo.computeVertexNormals();
        liquidMesh.visible = true;
        cageMesh.visible = true;
      } else if (currentMode === 'geodesic') {
        liquidMesh.visible = false;
        coreMesh.scale.set(1.6, 1.6, 1.6);
        cageMesh.scale.set(1.2, 1.2, 1.2);
        coreMesh.rotation.y += 0.008;
      } else {
        liquidMesh.visible = true;
        coreMesh.scale.set(1.0, 1.0, 1.0);
        cageMesh.scale.set(1.0, 1.0, 1.0);
        gimbalRing1.rotation.z += 0.015;
        gimbalRing2.rotation.y -= 0.015;
      }

      // Pulsing Geofence Target Disc
      const pulseScale = 1 + Math.sin(elapsedTime * 3.5) * 0.16;
      targetDisc.scale.set(pulseScale, pulseScale, 1);
      pulseCircleMat.opacity = 0.18 + Math.sin(elapsedTime * 3.5) * 0.12;

      // Subtle Key Light Orbit for shimmering chrome specular highlights
      keySpot.position.x = 28 + Math.sin(elapsedTime * 0.8) * 12;
      keySpot.position.z = 45 + Math.cos(elapsedTime * 0.8) * 12;

      // Particle Field Slow Drift
      spatialParticles.rotation.y += 0.0008;

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resource Cleanup on Component Unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', handleResize);

      liquidGeo.dispose();
      originalPositions.dispose();
      coreGeo.dispose();
      cageGeo.dispose();
      particleGeo.dispose();
      targetDiscGeo.dispose();
      pulseCircleGeo.dispose();
      laserGeo.dispose();
      gimbalRing1.geometry.dispose();
      gimbalRing2.geometry.dispose();
      gimbalRing3.geometry.dispose();

      chromeMaterial.dispose();
      obsidianMaterial.dispose();
      wireframeMaterial.dispose();
      targetDiscMat.dispose();
      pulseCircleMat.dispose();
      laserMat.dispose();
      particleMat.dispose();
      envTexture.dispose();

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full min-h-[660px] lg:min-h-[760px] flex items-center justify-center overflow-hidden bg-[#040812] border-b border-cyan-950/70 select-none">
      
      {/* 3D WebGL Canvas Mount */}
      {webGlSupported ? (
        <div
          ref={mountRef}
          className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing opacity-95 transition-opacity duration-1000"
          title="Interactive Liquid Chrome Geofence Artifact — Click & Drag to Orbit"
        />
      ) : (
        /* Reduced Motion / WebGL Fallback */
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-30 pointer-events-none">
          <div className="relative w-96 h-96 rounded-full border border-cyan-400/40 animate-pulse">
            <div className="absolute inset-4 rounded-full border border-purple-500/30" />
            <div className="absolute inset-12 rounded-full border border-cyan-500/20" />
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-cyan-400/40" />
            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-cyan-400/40" />
          </div>
        </div>
      )}

      {/* Atmospheric High-Depth Radial Scrim (Guarantees Total Typography Contrast) */}
      <div 
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 48%, rgba(4, 8, 18, 0.42) 0%, rgba(4, 8, 18, 0.78) 60%, rgba(4, 8, 18, 0.96) 100%)'
        }}
      />

      {/* Top Ambient Light Glows */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/15 rounded-full blur-[140px] pointer-events-none z-10" />
      <div className="absolute -bottom-20 left-1/4 w-[400px] h-[300px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none z-10" />

      {/* Top Floating Telemetry HUD Badges */}
      <div className="absolute top-6 inset-x-0 z-20 max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between pointer-events-none">
        
        {/* Academic Benchmark Origin */}
        <div className="pointer-events-auto hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/80 border border-cyan-500/30 backdrop-blur-md shadow-lg shadow-cyan-950/40 text-[11px] font-mono text-cyan-300">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>UCCS CS6910 Master Research Protocol</span>
        </div>

        {/* Real-time Sculptural State Switcher */}
        <div className="pointer-events-auto flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 backdrop-blur-md text-[11px] font-mono shadow-xl">
          <span className="text-slate-500 px-2 hidden md:inline">Artifact Model:</span>
          <button
            onClick={() => setChromeMode('liquid')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              chromeMode === 'liquid'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Liquid Chrome
          </button>
          <button
            onClick={() => setChromeMode('geodesic')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              chromeMode === 'geodesic'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Obsidian Core
          </button>
          <button
            onClick={() => setChromeMode('orbital')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              chromeMode === 'orbital'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Orbital Rings
          </button>
        </div>
      </div>

      {/* Foreground Hero Content (Sharp High-Contrast Typography) */}
      <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center flex flex-col items-center">
        
        {/* Security Classification Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-400/40 backdrop-blur-md shadow-xl shadow-cyan-950/60 mb-6">
          <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-[11px] font-mono tracking-widest font-semibold text-cyan-300 uppercase">
            Sculptural Hardware-Grade Cryptographic Geolocking
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.06] mb-6 drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)]">
          Decentralized Trust. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-300">
            Enforced by Geography.
          </span>
        </h1>

        {/* Narrative Description with Frosted Readability Plaque */}
        <p className="max-w-2xl text-slate-200 text-sm sm:text-base lg:text-lg font-normal leading-relaxed mb-8 backdrop-blur-md bg-slate-950/60 p-4 rounded-2xl border border-slate-700/50 shadow-2xl">
          Secure Enhanced Geolocking binds confidential documents to mathematical geographic coordinates. Encrypted with client-side AES-256-CBC, cryptographic keys are released exclusively upon verified physical presence inside authorized geofence polygons.
        </p>

        {/* Primary Interactive CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 mb-10">
          <button
            onClick={onLaunchApp}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs uppercase tracking-wider font-mono shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-400/50 hover:scale-[1.02] active:scale-[0.98] transition"
          >
            Sign In & Launch Platform
          </button>

          <button
            onClick={onExploreDemo}
            className="px-5 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-white font-medium text-xs font-mono backdrop-blur-md hover:border-cyan-400/60 transition flex items-center gap-2 shadow-lg"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Simulate Geofence Verification</span>
          </button>

          <button
            onClick={onExploreSecurity}
            className="px-5 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-medium text-xs font-mono backdrop-blur-md hover:border-cyan-400/60 transition flex items-center gap-2 shadow-lg"
          >
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Security Architecture</span>
          </button>
        </div>

        {/* Interactive Telemetry HUD Pill */}
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-950/80 border border-cyan-800/60 text-xs font-mono text-slate-300 backdrop-blur-md shadow-xl">
          <Globe className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '9s' }} />
          <span className="text-slate-400">Target Geofence:</span>
          <span className="text-cyan-300 font-bold">{activeCoords.zone}</span>
          <span className="text-slate-600">({activeCoords.lat}, {activeCoords.lng})</span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-cyan-400/80 text-[11px]">Orbit active — Drag artifact to tilt</span>
        </div>

      </div>

      {/* Bottom Scroll Prompt */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 text-[10px] font-mono text-slate-500 pointer-events-none">
        <span>Explore Workflow & Architecture</span>
        <ChevronDown className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
      </div>

    </div>
  );
}
