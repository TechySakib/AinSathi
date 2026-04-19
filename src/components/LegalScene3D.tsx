'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function LegalScene3D() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return
    const mount = mountRef.current

    // ─── Renderer ─────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mount.appendChild(renderer.domElement)

    // ─── Scene & Camera ───────────────────────────────────
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 1000)
    camera.position.set(0, 2, 14)
    camera.lookAt(0, 0, 0)

    // ─── Lights ───────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0x0a1628, 2.5)
    scene.add(ambientLight)

    const goldLight = new THREE.PointLight(0xc9a84c, 3, 30)
    goldLight.position.set(0, 8, 4)
    goldLight.castShadow = true
    scene.add(goldLight)

    const blueLight = new THREE.PointLight(0x1a4a8a, 2, 25)
    blueLight.position.set(-8, 2, 2)
    scene.add(blueLight)

    const rimLight = new THREE.DirectionalLight(0x0d2b5e, 1)
    rimLight.position.set(5, 5, -5)
    scene.add(rimLight)

    // ─── Materials ────────────────────────────────────────
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xc9a84c,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x3a2800,
      emissiveIntensity: 0.3,
    })
    const darkBlueMat = new THREE.MeshStandardMaterial({
      color: 0x0d2b5e,
      metalness: 0.3,
      roughness: 0.6,
    })
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x0f1f3d,
      metalness: 0.1,
      roughness: 0.8,
    })
    const glowMat = new THREE.MeshStandardMaterial({
      color: 0xc9a84c,
      emissive: 0xc9a84c,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.85,
    })

    // ─── Scales of Justice ────────────────────────────────
    const scalesGroup = new THREE.Group()
    scalesGroup.position.set(0, 1, 0)

    // Stand pole
    const poleGeo = new THREE.CylinderGeometry(0.05, 0.08, 4.5, 12)
    const pole = new THREE.Mesh(poleGeo, goldMat)
    pole.position.y = -0.5
    scalesGroup.add(pole)

    // Base
    const baseGeo = new THREE.CylinderGeometry(0.6, 0.8, 0.15, 20)
    const base = new THREE.Mesh(baseGeo, goldMat)
    base.position.y = -2.7
    base.castShadow = true
    scalesGroup.add(base)

    // Top finial (small sphere)
    const finialGeo = new THREE.SphereGeometry(0.12, 16, 16)
    const finial = new THREE.Mesh(finialGeo, glowMat)
    finial.position.y = 1.8
    scalesGroup.add(finial)

    // Crossbar
    const barGeo = new THREE.CylinderGeometry(0.04, 0.04, 5, 8)
    const bar = new THREE.Mesh(barGeo, goldMat)
    bar.rotation.z = Math.PI / 2
    bar.position.y = 1.5
    scalesGroup.add(bar)

    // Create a scale pan (left/right)
    function makePan(side: number): THREE.Group {
      const g = new THREE.Group()
      // Chains (thin cylinders)
      for (let i = -1; i <= 1; i++) {
        const chainGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.5, 6)
        const chain = new THREE.Mesh(chainGeo, goldMat)
        chain.position.set(i * 0.2, -0.75, 0)
        g.add(chain)
      }
      // Pan dish
      const panGeo = new THREE.CylinderGeometry(0.55, 0.45, 0.08, 24)
      const pan = new THREE.Mesh(panGeo, goldMat)
      pan.position.y = -1.5
      pan.castShadow = true
      g.add(pan)
      g.position.set(side * 2.3, 1.5, 0)
      return g
    }

    const leftPan = makePan(-1)
    const rightPan = makePan(1)
    scalesGroup.add(leftPan, rightPan)
    scene.add(scalesGroup)

    // ─── Greek Court Pillars ──────────────────────────────
    function makePillar(x: number, z: number, scale = 1): THREE.Group {
      const g = new THREE.Group()
      // Shaft
      const shaftGeo = new THREE.CylinderGeometry(0.25 * scale, 0.28 * scale, 5 * scale, 16)
      const shaft = new THREE.Mesh(shaftGeo, stoneMat)
      shaft.castShadow = true
      g.add(shaft)
      // Capital
      const capGeo = new THREE.BoxGeometry(0.8 * scale, 0.2 * scale, 0.8 * scale)
      const cap = new THREE.Mesh(capGeo, darkBlueMat)
      cap.position.y = 2.6 * scale
      g.add(cap)
      // Base plinth
      const plinthGeo = new THREE.BoxGeometry(0.7 * scale, 0.2 * scale, 0.7 * scale)
      const plinth = new THREE.Mesh(plinthGeo, darkBlueMat)
      plinth.position.y = -2.6 * scale
      g.add(plinth)
      g.position.set(x, -1, z)
      return g
    }

    const pillars = [
      makePillar(-5.5, -2, 1),
      makePillar(-4, -3, 0.85),
      makePillar(5.5, -2, 1),
      makePillar(4, -3, 0.85),
      makePillar(-7, -1, 0.7),
      makePillar(7, -1, 0.7),
    ]
    pillars.forEach(p => scene.add(p))

    // ─── Ground Plane / Steps ─────────────────────────────
    const stepMat = new THREE.MeshStandardMaterial({ color: 0x0a1628, roughness: 0.9, metalness: 0.05 })
    for (let i = 0; i < 3; i++) {
      const stepGeo = new THREE.BoxGeometry(18 - i * 2, 0.3, 5 - i)
      const step = new THREE.Mesh(stepGeo, stepMat)
      step.position.set(0, -3.9 + i * 0.3, -1 + i * 0.3)
      step.receiveShadow = true
      scene.add(step)
    }

    // ─── Floating Legal Symbols (§) ────────────────────────
    const symbolGroup = new THREE.Group()
    const symbolPositions = [
      { x: -6, y: 3, z: -1 },
      { x: 6, y: 2.5, z: -2 },
      { x: -3.5, y: 4.5, z: -4 },
      { x: 3.5, y: 4, z: -3 },
      { x: 0, y: 5, z: -5 },
    ]

    symbolPositions.forEach((pos) => {
      const torusGeo = new THREE.TorusGeometry(0.22, 0.04, 12, 40)
      const torus = new THREE.Mesh(torusGeo, glowMat)
      torus.position.set(pos.x, pos.y, pos.z)
      torus.rotation.x = Math.PI / 4
      symbolGroup.add(torus)

      // Outer ring
      const outerGeo = new THREE.TorusGeometry(0.38, 0.02, 8, 40)
      const outer = new THREE.Mesh(outerGeo, new THREE.MeshStandardMaterial({
        color: 0xc9a84c, transparent: true, opacity: 0.25,
        emissive: 0xc9a84c, emissiveIntensity: 0.5,
      }))
      outer.position.set(pos.x, pos.y, pos.z)
      outer.rotation.x = Math.PI / 4
      symbolGroup.add(outer)
    })
    scene.add(symbolGroup)

    // ─── Particle Stars ───────────────────────────────────
    const particleCount = 300
    const particleGeo = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 40
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30 - 5
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const particleMat = new THREE.PointsMaterial({
      color: 0xc9a84c,
      size: 0.06,
      transparent: true,
      opacity: 0.5,
      sizeAttenuation: true,
    })
    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)

    // ─── Animation Loop ───────────────────────────────────
    let frameId: number
    let t = 0
    const clock = new THREE.Clock()

    function animate() {
      frameId = requestAnimationFrame(animate)
      const delta = clock.getDelta()
      t += delta

      // Scales sway gently
      scalesGroup.rotation.y = Math.sin(t * 0.3) * 0.08
      leftPan.position.y = 1.5 + Math.sin(t * 0.7) * 0.12
      rightPan.position.y = 1.5 - Math.sin(t * 0.7) * 0.12

      // Crossbar tilt
      const bar2 = scalesGroup.children.find(c => c.uuid === bar.uuid)
      if (bar2) bar2.rotation.z = Math.PI / 2 + Math.sin(t * 0.7) * 0.06

      // Floating symbols orbit + bob
      symbolGroup.rotation.y = t * 0.05
      symbolGroup.children.forEach((mesh, i) => {
        mesh.position.y += Math.sin(t * 0.8 + i) * 0.003
        mesh.rotation.z = t * 0.3 + i
      })

      // Particles slow drift
      particles.rotation.y = t * 0.008
      particles.rotation.x = t * 0.004

      // Gold light pulse
      goldLight.intensity = 2.5 + Math.sin(t * 1.2) * 0.5

      // Finial glow
      ;(finial.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.6 + Math.sin(t * 2) * 0.3

      renderer.render(scene, camera)
    }
    animate()

    // ─── Resize Handler ───────────────────────────────────
    function onResize() {
      if (!mountRef.current) return
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', onResize)

    // ─── Mouse parallax ───────────────────────────────────
    function onMouseMove(e: MouseEvent) {
      const nx = (e.clientX / window.innerWidth - 0.5) * 0.4
      const ny = (e.clientY / window.innerHeight - 0.5) * 0.2
      camera.position.x += (nx - camera.position.x) * 0.02
      camera.position.y += (-ny + 2 - camera.position.y) * 0.02
      camera.lookAt(0, 0, 0)
    }
    window.addEventListener('mousemove', onMouseMove)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMouseMove)
      mount.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
      }}
      aria-hidden="true"
    />
  )
}
