"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Game() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Scene — bright Chicago daytime
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x7ec8e3); // clear midwest sky
    scene.fog = new THREE.Fog(0x7ec8e3, 60, 180);

    // Camera - low, slightly angled third person
    const camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      300
    );
    camera.position.set(6, 4, 14);
    camera.lookAt(0, 1, -20);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    // Lighting — bright sunny day
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e0, 1.2);
    sunLight.position.set(15, 30, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 200;
    sunLight.shadow.camera.left = -60;
    sunLight.shadow.camera.right = 60;
    sunLight.shadow.camera.top = 60;
    sunLight.shadow.camera.bottom = -60;
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x98d1a0, 0.4);
    scene.add(hemiLight);

    // ---- Road ----
    const roadGeometry = new THREE.PlaneGeometry(14, 500);
    const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.z = -200;
    road.receiveShadow = true;
    scene.add(road);

    // Yellow center double line (Chicago style)
    for (let i = -10; i < 80; i++) {
      const lineGeom = new THREE.PlaneGeometry(0.1, 4);
      const lineMat = new THREE.MeshStandardMaterial({ color: 0xddcc00 });
      const lineL = new THREE.Mesh(lineGeom, lineMat);
      lineL.rotation.x = -Math.PI / 2;
      lineL.position.set(-0.2, 0.01, -i * 6);
      scene.add(lineL);
      const lineR = new THREE.Mesh(lineGeom, lineMat);
      lineR.rotation.x = -Math.PI / 2;
      lineR.position.set(0.2, 0.01, -i * 6);
      scene.add(lineR);
    }

    // White dashed lane markings
    for (let i = -10; i < 60; i++) {
      const markGeom = new THREE.PlaneGeometry(0.15, 2.5);
      const markMat = new THREE.MeshStandardMaterial({ color: 0xdddddd });
      for (const lx of [-3.5, 3.5]) {
        const mark = new THREE.Mesh(markGeom, markMat);
        mark.rotation.x = -Math.PI / 2;
        mark.position.set(lx, 0.01, -i * 8);
        scene.add(mark);
      }
    }

    // ---- Sidewalks ----
    const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0xc8c0b0 });
    for (const side of [-1, 1]) {
      const sidewalk = new THREE.Mesh(
        new THREE.BoxGeometry(4, 0.2, 500),
        sidewalkMat
      );
      sidewalk.position.set(side * 9, 0.1, -200);
      sidewalk.receiveShadow = true;
      scene.add(sidewalk);
    }

    // ---- Curbs ----
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    for (const side of [-7, 7]) {
      const curb = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.25, 500),
        curbMat
      );
      curb.position.set(side, 0.12, -200);
      scene.add(curb);
    }

    // ============================================================
    //  CHICAGO BUILDINGS — varied storefronts & tall buildings
    // ============================================================

    // Shared materials
    const brickColors = [0x8B4513, 0x9C6644, 0xA0522D, 0x7B3F00, 0x6B3A2A, 0xB5651D];
    const stoneColors = [0xBEB8A7, 0xC5BFA7, 0xD2C9B0, 0xAFA899];

    function addWindows(parent: THREE.Group, w: number, h: number, d: number, baseY: number, side: number) {
      const rows = Math.floor((h - 1) / 2.8);
      const cols = Math.floor(w / 1.6);
      if (cols <= 0 || rows <= 0) return;
      const winGeom = new THREE.PlaneGeometry(0.7, 1.1);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const winMat = new THREE.MeshStandardMaterial({
            color: Math.random() > 0.3 ? 0x88bbdd : 0xaaddee,
            transparent: true,
            opacity: 0.7,
          });
          const win = new THREE.Mesh(winGeom, winMat);
          const wx = -w / 2 + 0.8 + c * (w / cols);
          const wy = baseY + 1.5 + r * 2.8;
          // face toward road
          win.position.set(wx, wy, side > 0 ? -d / 2 - 0.01 : d / 2 + 0.01);
          if (side < 0) win.rotation.y = Math.PI;
          parent.add(win);
        }
      }
    }

    function createTallBuilding(x: number, z: number, side: number) {
      const group = new THREE.Group();
      const w = 5 + Math.random() * 4;
      const h = 15 + Math.random() * 30;
      const d = 6 + Math.random() * 5;
      const color = Math.random() > 0.5
        ? brickColors[Math.floor(Math.random() * brickColors.length)]
        : stoneColors[Math.floor(Math.random() * stoneColors.length)];

      const body = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color })
      );
      body.position.set(0, h / 2, 0);
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      addWindows(group, w, h, d, 0, side);

      // Cornice at top
      const cornice = new THREE.Mesh(
        new THREE.BoxGeometry(w + 0.4, 0.4, d + 0.4),
        new THREE.MeshStandardMaterial({ color: 0x777777 })
      );
      cornice.position.set(0, h, 0);
      group.add(cornice);

      // Water tower on some tall ones
      if (h > 30 && Math.random() > 0.5) {
        const tankMat = new THREE.MeshStandardMaterial({ color: 0x8B7355 });
        const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.5, 8), tankMat);
        tank.position.set(0, h + 2.5, 0);
        group.add(tank);
        // Legs
        for (const ox of [-0.5, 0.5]) {
          for (const oz of [-0.5, 0.5]) {
            const leg = new THREE.Mesh(
              new THREE.CylinderGeometry(0.06, 0.06, 2, 4),
              new THREE.MeshStandardMaterial({ color: 0x444444 })
            );
            leg.position.set(ox, h + 1, oz);
            group.add(leg);
          }
        }
      }

      group.position.set(x + side * (w / 2 + 0.5), 0, z);
      scene.add(group);
      return { w, d };
    }

    function createRestaurant(x: number, z: number, side: number) {
      const group = new THREE.Group();
      const w = 6;
      const h = 4;
      const d = 6;

      // Building
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color: 0x8B0000 }) // dark red brick
      );
      body.position.set(0, h / 2, 0);
      body.castShadow = true;
      group.add(body);

      // Big front window
      const frontWin = new THREE.Mesh(
        new THREE.PlaneGeometry(w - 1.5, 2.2),
        new THREE.MeshStandardMaterial({ color: 0x88ccdd, transparent: true, opacity: 0.5 })
      );
      frontWin.position.set(0, 2.2, side > 0 ? -d / 2 - 0.01 : d / 2 + 0.01);
      if (side < 0) frontWin.rotation.y = Math.PI;
      group.add(frontWin);

      // Awning — red & white striped
      const awningGeom = new THREE.BoxGeometry(w + 0.5, 0.15, 1.5);
      const awningMat = new THREE.MeshStandardMaterial({ color: 0xcc2222 });
      const awning = new THREE.Mesh(awningGeom, awningMat);
      awning.position.set(0, 3.5, side > 0 ? -d / 2 - 0.8 : d / 2 + 0.8);
      group.add(awning);

      // Sign above awning
      const signGeom = new THREE.BoxGeometry(3.5, 0.8, 0.15);
      const signMat = new THREE.MeshStandardMaterial({ color: 0xffcc00 });
      const sign = new THREE.Mesh(signGeom, signMat);
      sign.position.set(0, 4.2, side > 0 ? -d / 2 - 0.1 : d / 2 + 0.1);
      group.add(sign);

      // Second floor with windows
      const upper = new THREE.Mesh(
        new THREE.BoxGeometry(w, 4, d),
        new THREE.MeshStandardMaterial({ color: 0x9C6644 })
      );
      upper.position.set(0, h + 2, 0);
      upper.castShadow = true;
      group.add(upper);
      addWindows(group, w, 4, d, h, side);

      group.position.set(x + side * (w / 2 + 0.5), 0, z);
      scene.add(group);
      return { w, d };
    }

    function createItalianIceStand(x: number, z: number, side: number) {
      const group = new THREE.Group();
      const w = 4;
      const h = 3.2;
      const d = 4;

      // Stand body — light blue
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color: 0xE0F0FF })
      );
      body.position.set(0, h / 2, 0);
      body.castShadow = true;
      group.add(body);

      // Serving window
      const servWin = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 1.5),
        new THREE.MeshStandardMaterial({ color: 0x335566 })
      );
      servWin.position.set(0, 2.0, side > 0 ? -d / 2 - 0.01 : d / 2 + 0.01);
      if (side < 0) servWin.rotation.y = Math.PI;
      group.add(servWin);

      // Counter shelf
      const counter = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.1, 0.6),
        new THREE.MeshStandardMaterial({ color: 0xcccccc })
      );
      counter.position.set(0, 1.2, side > 0 ? -d / 2 - 0.3 : d / 2 + 0.3);
      group.add(counter);

      // Colorful striped awning
      const awning = new THREE.Mesh(
        new THREE.BoxGeometry(w + 1, 0.12, 1.8),
        new THREE.MeshStandardMaterial({ color: 0x22aa44 })
      );
      awning.position.set(0, h + 0.1, side > 0 ? -d / 2 - 0.9 : d / 2 + 0.9);
      group.add(awning);
      // White stripe
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(w + 1, 0.13, 0.5),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      stripe.position.set(0, h + 0.12, side > 0 ? -d / 2 - 0.9 : d / 2 + 0.9);
      group.add(stripe);

      // Big ice cream cone on top
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.5, 1.2, 8),
        new THREE.MeshStandardMaterial({ color: 0xd4a357 })
      );
      cone.position.set(0, h + 1.5, 0);
      cone.rotation.x = Math.PI; // inverted
      group.add(cone);
      const scoop1 = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xff6699 }) // strawberry
      );
      scoop1.position.set(0, h + 2.2, 0);
      group.add(scoop1);
      const scoop2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x66ddff }) // blue raspberry
      );
      scoop2.position.set(0, h + 2.9, 0);
      group.add(scoop2);

      // Sign
      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.6, 0.1),
        new THREE.MeshStandardMaterial({ color: 0xff4488 })
      );
      sign.position.set(0, h + 0.5, side > 0 ? -d / 2 - 0.06 : d / 2 + 0.06);
      group.add(sign);

      group.position.set(x + side * (w / 2 + 0.5), 0, z);
      scene.add(group);
      return { w, d };
    }

    function createBrownstone(x: number, z: number, side: number) {
      const group = new THREE.Group();
      const w = 5 + Math.random() * 2;
      const h = 9 + Math.random() * 4;
      const d = 7;

      const body = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({
          color: brickColors[Math.floor(Math.random() * brickColors.length)]
        })
      );
      body.position.set(0, h / 2, 0);
      body.castShadow = true;
      group.add(body);

      addWindows(group, w, h, d, 0, side);

      // Front steps
      for (let s = 0; s < 3; s++) {
        const step = new THREE.Mesh(
          new THREE.BoxGeometry(1.5, 0.2, 0.5),
          new THREE.MeshStandardMaterial({ color: 0x999999 })
        );
        step.position.set(0, 0.1 + s * 0.2, side > 0 ? -d / 2 - 0.3 - s * 0.5 : d / 2 + 0.3 + s * 0.5);
        group.add(step);
      }

      // Door
      const door = new THREE.Mesh(
        new THREE.PlaneGeometry(0.9, 2),
        new THREE.MeshStandardMaterial({ color: 0x2a1a0a })
      );
      door.position.set(0, 1.6, side > 0 ? -d / 2 - 0.02 : d / 2 + 0.02);
      if (side < 0) door.rotation.y = Math.PI;
      group.add(door);

      group.position.set(x + side * (w / 2 + 0.5), 0, z);
      scene.add(group);
      return { w, d };
    }

    function createShop(x: number, z: number, side: number) {
      const group = new THREE.Group();
      const w = 5;
      const h = 4.5;
      const d = 5;
      const shopColors = [0x2266aa, 0x22aa66, 0xaa6622, 0x8822aa, 0xaa2244];

      const body = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({
          color: stoneColors[Math.floor(Math.random() * stoneColors.length)]
        })
      );
      body.position.set(0, h / 2, 0);
      body.castShadow = true;
      group.add(body);

      // Storefront window
      const storeWin = new THREE.Mesh(
        new THREE.PlaneGeometry(w - 1, 2.5),
        new THREE.MeshStandardMaterial({ color: 0x99ccdd, transparent: true, opacity: 0.5 })
      );
      storeWin.position.set(0, 2, side > 0 ? -d / 2 - 0.01 : d / 2 + 0.01);
      if (side < 0) storeWin.rotation.y = Math.PI;
      group.add(storeWin);

      // Awning
      const awning = new THREE.Mesh(
        new THREE.BoxGeometry(w + 0.3, 0.12, 1.2),
        new THREE.MeshStandardMaterial({
          color: shopColors[Math.floor(Math.random() * shopColors.length)]
        })
      );
      awning.position.set(0, 3.8, side > 0 ? -d / 2 - 0.6 : d / 2 + 0.6);
      group.add(awning);

      // Upper floors
      const upperH = 4 + Math.random() * 6;
      const upper = new THREE.Mesh(
        new THREE.BoxGeometry(w, upperH, d),
        new THREE.MeshStandardMaterial({
          color: brickColors[Math.floor(Math.random() * brickColors.length)]
        })
      );
      upper.position.set(0, h + upperH / 2, 0);
      upper.castShadow = true;
      group.add(upper);
      addWindows(group, w, upperH, d, h, side);

      group.position.set(x + side * (w / 2 + 0.5), 0, z);
      scene.add(group);
      return { w, d };
    }

    // Generate the Chicago streetscape
    const buildingTypes = [createTallBuilding, createRestaurant, createItalianIceStand, createBrownstone, createShop];
    for (const side of [-1, 1]) {
      let z = 5;
      while (z > -250) {
        // Weight toward shops/brownstones with occasional special buildings
        const r = Math.random();
        let type: number;
        if (r < 0.25) type = 0; // tall building
        else if (r < 0.35) type = 1; // restaurant
        else if (r < 0.42) type = 2; // italian ice
        else if (r < 0.65) type = 3; // brownstone
        else type = 4; // shop

        const baseX = side > 0 ? 11 : -11;
        const result = buildingTypes[type](baseX, z, side);
        z -= result.d + 1 + Math.random() * 2;
      }
    }

    // ---- Streetlights (Chicago green style) ----
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x2a5a2a });
    for (let z = 5; z > -200; z -= 18) {
      for (const side of [-7.2, 7.2]) {
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.12, 5.5, 8),
          lampMat
        );
        pole.position.set(side, 2.75, z);
        pole.castShadow = true;
        scene.add(pole);

        // Ornamental top
        const top = new THREE.Mesh(
          new THREE.SphereGeometry(0.2, 8, 8),
          lampMat
        );
        top.position.set(side, 5.5, z);
        scene.add(top);

        // Double globe lamp
        for (const offset of [-0.4, 0.4]) {
          const arm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6),
            lampMat
          );
          arm.rotation.z = Math.PI / 2;
          arm.position.set(side + offset * 0.6, 5.3, z);
          scene.add(arm);

          const globe = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 8, 8),
            new THREE.MeshStandardMaterial({
              color: 0xfffff0,
              emissive: 0xfffff0,
              emissiveIntensity: 0.15,
            })
          );
          globe.position.set(side + offset, 5.3, z);
          scene.add(globe);
        }
      }
    }

    // ---- Fire hydrants ----
    const hydrantMat = new THREE.MeshStandardMaterial({ color: 0xcc2222 });
    for (let z = 0; z > -200; z -= 30 + Math.random() * 20) {
      const side = Math.random() > 0.5 ? -7.5 : 7.5;
      const hydrant = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.18, 0.7, 8),
        hydrantMat
      );
      hydrant.position.set(side, 0.55, z);
      scene.add(hydrant);
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 6, 6, 0, Math.PI * 2, 0, Math.PI / 2),
        hydrantMat
      );
      cap.position.set(side, 0.9, z);
      scene.add(cap);
    }

    // ---- Trash cans ----
    const trashMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    for (let z = -5; z > -200; z -= 25 + Math.random() * 15) {
      for (const side of [-8, 8]) {
        if (Math.random() > 0.5) continue;
        const can = new THREE.Mesh(
          new THREE.CylinderGeometry(0.25, 0.25, 0.8, 8),
          trashMat
        );
        can.position.set(side + (Math.random() - 0.5), 0.6, z);
        scene.add(can);
      }
    }

    // ============================================================
    //  PEDESTRIANS — simple block people walking on sidewalks
    // ============================================================
    const pedestrians: { mesh: THREE.Group; speed: number; dir: number; baseX: number; minZ: number; maxZ: number }[] = [];
    const skinColors = [0xffcc99, 0xd4a574, 0x8d5524, 0xf1c27d, 0xe0ac69, 0xc68642];
    const shirtColors = [0xcc2233, 0x2255cc, 0x22aa55, 0xeeee33, 0xff8833, 0xaa22aa, 0xffffff, 0x222222, 0x3399cc, 0xff6688];
    const pantsColors = [0x222244, 0x333333, 0x445566, 0x554433, 0x224422];

    function createPedestrian(x: number, z: number, dir: number): THREE.Group {
      const ped = new THREE.Group();

      const skin = skinColors[Math.floor(Math.random() * skinColors.length)];
      const shirt = shirtColors[Math.floor(Math.random() * shirtColors.length)];
      const pants = pantsColors[Math.floor(Math.random() * pantsColors.length)];

      // Legs
      for (const lx of [-0.1, 0.1]) {
        const leg = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 0.5, 0.15),
          new THREE.MeshStandardMaterial({ color: pants })
        );
        leg.position.set(lx, 0.25, 0);
        ped.add(leg);
      }

      // Torso
      const torso = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.45, 0.2),
        new THREE.MeshStandardMaterial({ color: shirt })
      );
      torso.position.set(0, 0.72, 0);
      ped.add(torso);

      // Head
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 6, 6),
        new THREE.MeshStandardMaterial({ color: skin })
      );
      head.position.set(0, 1.08, 0);
      ped.add(head);

      // Hair
      const hair = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 6, 6, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: Math.random() > 0.5 ? 0x222222 : 0x6B3A2A })
      );
      hair.position.set(0, 1.12, 0);
      ped.add(hair);

      ped.position.set(x, 0.2, z);
      ped.rotation.y = dir > 0 ? 0 : Math.PI;
      ped.castShadow = true;
      scene.add(ped);
      return ped;
    }

    // Spawn pedestrians on both sidewalks
    for (let i = 0; i < 40; i++) {
      const side = Math.random() > 0.5 ? 1 : -1;
      const baseX = side * (8 + Math.random() * 2);
      const z = 10 - Math.random() * 220;
      const dir = Math.random() > 0.5 ? 1 : -1;
      const speed = 0.01 + Math.random() * 0.025;
      const ped = createPedestrian(baseX, z, dir);
      pedestrians.push({ mesh: ped, speed, dir, baseX, minZ: z - 30, maxZ: z + 30 });
    }

    // ---- Trees (occasional street trees) ----
    for (let z = -2; z > -200; z -= 15 + Math.random() * 10) {
      for (const side of [-8.2, 8.2]) {
        if (Math.random() > 0.4) continue;
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.15, 2, 6),
          new THREE.MeshStandardMaterial({ color: 0x5a3a1a })
        );
        trunk.position.set(side, 1.2, z);
        trunk.castShadow = true;
        scene.add(trunk);

        const canopy = new THREE.Mesh(
          new THREE.SphereGeometry(1.2, 8, 6),
          new THREE.MeshStandardMaterial({ color: 0x2d6b2d + Math.floor(Math.random() * 0x113311) })
        );
        canopy.position.set(side, 3, z);
        canopy.castShadow = true;
        scene.add(canopy);
      }
    }

    // ---- Biker character (2D sprite in 3D world) ----
    const biker = new THREE.Group();
    const textureLoader = new THREE.TextureLoader();
    const bikerTexture = textureLoader.load("/sprites/timpixelpng.png");
    bikerTexture.magFilter = THREE.NearestFilter;
    bikerTexture.minFilter = THREE.NearestFilter;

    // Front face
    const spriteMat = new THREE.MeshStandardMaterial({
      map: bikerTexture,
      transparent: true,
      side: THREE.FrontSide,
      alphaTest: 0.5,
    });
    // Back face (same texture)
    const spriteMatBack = new THREE.MeshStandardMaterial({
      map: bikerTexture,
      transparent: true,
      side: THREE.BackSide,
      alphaTest: 0.5,
    });

    const spriteW = 3;
    const spriteH = 3;
    const spriteGeom = new THREE.PlaneGeometry(spriteW, spriteH);

    // Stack multiple planes to give thickness
    const numLayers = 50;
    const layerSpacing = 0.004;
    for (let i = 0; i < numLayers; i++) {
      const layer = new THREE.Mesh(spriteGeom, spriteMat);
      layer.castShadow = true;
      layer.rotation.y = Math.PI / 2;
      layer.position.x = (i - (numLayers - 1) / 2) * layerSpacing;
      biker.add(layer);
    }

    biker.position.set(0, 1.5, 0);
    scene.add(biker);

    // ---- Vehicles (buses & cars, two-way traffic) ----
    interface Vehicle {
      mesh: THREE.Group;
      speed: number; // positive = toward player, negative = away
      baseY: number;
    }
    const vehicles: Vehicle[] = [];
    // Left lanes: oncoming traffic (toward you). Right lanes: same direction (away).
    const oncomingLanes = [-4.5, -1.5]; // left side of road
    const sameDirLanes = [1.5, 4.5];    // right side of road
    const allLanes = [...oncomingLanes, ...sameDirLanes];
    // Keep old `buses` reference for collision check compatibility
    const buses: THREE.Group[] = [];
    const lanes = allLanes;

    const busTexture = textureLoader.load("/sprites/bus.png");
    busTexture.magFilter = THREE.NearestFilter;
    busTexture.minFilter = THREE.NearestFilter;
    const busMat = new THREE.MeshStandardMaterial({
      map: busTexture,
      transparent: true,
      side: THREE.DoubleSide,
      alphaTest: 0.5,
    });

    const carTexture = textureLoader.load("/sprites/car.png");
    carTexture.magFilter = THREE.NearestFilter;
    carTexture.minFilter = THREE.NearestFilter;
    const carMat = new THREE.MeshStandardMaterial({
      map: carTexture,
      transparent: true,
      side: THREE.DoubleSide,
      alphaTest: 0.5,
    });

    function createVehicle(type: "bus" | "car", direction: "oncoming" | "samedir"): Vehicle {
      const mesh = new THREE.Group();
      const isBus = type === "bus";
      const vW = isBus ? 6 : 5.5;
      const vH = isBus ? 3 : 2.5;
      const mat = isBus ? busMat : carMat;
      const geom = new THREE.PlaneGeometry(vW, vH);
      const numLayers = 240;
      const spacing = 0.004;

      for (let i = 0; i < numLayers; i++) {
        const layer = new THREE.Mesh(geom, mat);
        layer.castShadow = true;
        layer.rotation.y = Math.PI / 2;
        layer.position.x = (i - (numLayers - 1) / 2) * spacing;
        mesh.add(layer);
      }

      const lanesForDir = direction === "oncoming" ? oncomingLanes : sameDirLanes;
      const lane = lanesForDir[Math.floor(Math.random() * lanesForDir.length)];

      // Oncoming (left lanes) = toward camera (+z), same dir (right lanes) = away from camera (-z)
      const speed = direction === "oncoming"
        ? 0.7 + Math.random() * 0.3
        : -(0.4 + Math.random() * 0.2);

      // Oncoming faces toward camera, same-dir faces away — swap the flip
      if (direction === "samedir") {
        mesh.rotation.y = Math.PI;
      }

      const startZ = -40 - Math.random() * 100;

      mesh.position.set(lane, vH / 2, startZ);
      return { mesh, speed, baseY: vH / 2 };
    }

    // Spawn oncoming traffic (the dangerous stuff)
    for (let i = 0; i < 8; i++) {
      const type = Math.random() > 0.4 ? "car" : "bus";
      const v = createVehicle(type, "oncoming");
      v.mesh.position.z = -30 - i * 20;
      vehicles.push(v);
      buses.push(v.mesh);
      scene.add(v.mesh);
    }

    // Spawn same-direction traffic (slower, you pass them)
    for (let i = 0; i < 5; i++) {
      const type = Math.random() > 0.3 ? "car" : "bus";
      const v = createVehicle(type, "samedir");
      v.mesh.position.z = -20 - i * 30;
      vehicles.push(v);
      buses.push(v.mesh);
      scene.add(v.mesh);
    }

    // ---- Gold orbs ----
    interface Orb {
      mesh: THREE.Mesh;
      speed: number;
    }
    const orbs: Orb[] = [];
    const orbGeom = new THREE.SphereGeometry(0.4, 12, 12);
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffa500,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2,
    });
    const orbLanes = [-4.5, -1.5, 0, 1.5, 4.5];
    const orbSpeed = 0.5;

    function spawnOrb(): Orb {
      const mesh = new THREE.Mesh(orbGeom, orbMat);
      const lane = orbLanes[Math.floor(Math.random() * orbLanes.length)];
      mesh.position.set(lane, 1.2, -50 - Math.random() * 80);
      mesh.castShadow = true;
      scene.add(mesh);
      const orb = { mesh, speed: orbSpeed + Math.random() * 0.2 };
      orbs.push(orb);
      return orb;
    }

    // Spawn initial orbs
    for (let i = 0; i < 10; i++) {
      spawnOrb();
    }

    // ---- Controls ----
    let bikerX = 0;
    const bikerSpeed = 0.15;
    const keys: Record<string, boolean> = {};
    const onKeyDown = (e: KeyboardEvent) => { keys[e.key] = true; };
    const onKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // ---- Game state ----
    let score = 0;
    let gameOver = false;
    let frameId: number;

    const scoreDiv = document.createElement("div");
    scoreDiv.style.cssText =
      "position:absolute;top:20px;left:50%;transform:translateX(-50%);color:white;font-size:28px;font-family:monospace;font-weight:bold;text-shadow:2px 2px 4px rgba(0,0,0,0.7);z-index:10;";
    scoreDiv.textContent = "Score: 0";
    mount.appendChild(scoreDiv);

    const gameOverDiv = document.createElement("div");
    gameOverDiv.style.cssText =
      "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:white;font-size:48px;font-family:monospace;font-weight:bold;text-shadow:2px 2px 8px rgba(0,0,0,0.8);z-index:10;display:none;text-align:center;";
    mount.appendChild(gameOverDiv);

    function checkCollision(bikerPos: THREE.Vector3, bus: THREE.Group): boolean {
      const dx = Math.abs(bikerPos.x - bus.position.x);
      const dz = Math.abs(bikerPos.z - bus.position.z);
      return dx < 1.4 && dz < 3.0;
    }

    // ---- Explosion particles ----
    interface Particle {
      mesh: THREE.Mesh;
      vel: THREE.Vector3;
      life: number;
    }
    const particles: Particle[] = [];
    const particleColors = [0xff4444, 0xff8800, 0xffdd00, 0xffffff, 0xff6622, 0xffaa00];
    const particleGeom = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    let explosionTimer = 0;

    function explode(pos: THREE.Vector3) {
      for (let i = 0; i < 40; i++) {
        const color = particleColors[Math.floor(Math.random() * particleColors.length)];
        const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6 });
        const p = new THREE.Mesh(particleGeom, mat);
        p.position.copy(pos);
        p.scale.setScalar(0.5 + Math.random() * 1.5);
        const vel = new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          Math.random() * 0.4 + 0.1,
          (Math.random() - 0.5) * 0.5
        );
        scene.add(p);
        particles.push({ mesh: p, vel, life: 1.0 });
      }
      explosionTimer = 60; // frames before showing game over text
    }

    function updateParticles() {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.mesh.position.add(p.vel);
        p.vel.y -= 0.008; // gravity
        p.life -= 0.015;
        p.mesh.scale.multiplyScalar(0.97);
        p.mesh.rotation.x += 0.1;
        p.mesh.rotation.z += 0.08;
        if (p.life <= 0) {
          scene.remove(p.mesh);
          particles.splice(i, 1);
        }
      }
    }

    function clearParticles() {
      for (const p of particles) scene.remove(p.mesh);
      particles.length = 0;
    }

    function restart() {
      gameOver = false;
      score = 0;
      bikerX = 0;
      biker.position.set(0, 1.5, 0);
      biker.visible = true;
      clearParticles();
      explosionTimer = 0;
      gameOverDiv.style.display = "none";
      orbs.forEach((orb) => {
        const lane = orbLanes[Math.floor(Math.random() * orbLanes.length)];
        orb.mesh.position.set(lane, 1.2, -50 - Math.random() * 80);
        orb.mesh.visible = true;
      });
      vehicles.forEach((v, i) => {
        const isOncoming = v.speed > 0;
        const lanesForDir = isOncoming ? oncomingLanes : sameDirLanes;
        const lane = lanesForDir[Math.floor(Math.random() * lanesForDir.length)];
        const startZ = isOncoming ? -30 - i * 20 : -20 - i * 30;
        v.mesh.position.set(lane, v.baseY, startZ);
      });
    }

    // ---- Animate ----
    let pedTimer = 0;

    function animate() {
      frameId = requestAnimationFrame(animate);

      if (gameOver) {
        updateParticles();
        if (explosionTimer > 0) {
          explosionTimer--;
          if (explosionTimer === 0) {
            gameOverDiv.style.display = "block";
            gameOverDiv.innerHTML = `GAME OVER<br><span style="font-size:24px">Score: ${score}<br>Press SPACE to restart</span>`;
          }
        }
        if (keys[" "] || keys["Enter"]) restart();
        renderer.render(scene, camera);
        return;
      }

      // Move biker
      if (keys["ArrowLeft"] || keys["a"]) bikerX -= bikerSpeed;
      if (keys["ArrowRight"] || keys["d"]) bikerX += bikerSpeed;
      bikerX = Math.max(-6, Math.min(6, bikerX));
      biker.position.x = bikerX;

      // Move vehicles
      for (const v of vehicles) {
        v.mesh.position.z += v.speed;
        const isOncoming = v.speed > 0;

        if (isOncoming && v.mesh.position.z > 20) {
          // Oncoming passed behind player — recycle far ahead
          const lane = oncomingLanes[Math.floor(Math.random() * oncomingLanes.length)];
          v.mesh.position.set(lane, v.baseY, -100 - Math.random() * 60);
        } else if (!isOncoming && v.mesh.position.z < -150) {
          // Same-dir went too far away — recycle near player
          const lane = sameDirLanes[Math.floor(Math.random() * sameDirLanes.length)];
          v.mesh.position.set(lane, v.baseY, 10 + Math.random() * 20);
        }

        if (checkCollision(biker.position, v.mesh) && !gameOver) {
          gameOver = true;
          explode(biker.position.clone().setY(1.5));
          biker.visible = false;
        }
      }

      // Animate and collect orbs
      for (const orb of orbs) {
        orb.mesh.position.z += orb.speed;
        orb.mesh.rotation.y += 0.05;
        orb.mesh.position.y = 1.2 + Math.sin(Date.now() * 0.003 + orb.mesh.position.z) * 0.3;

        // Recycle if passed camera
        if (orb.mesh.position.z > 20) {
          const lane = orbLanes[Math.floor(Math.random() * orbLanes.length)];
          orb.mesh.position.set(lane, 1.2, -60 - Math.random() * 80);
          orb.mesh.visible = true;
        }

        // Check if biker collects orb
        const dx = Math.abs(biker.position.x - orb.mesh.position.x);
        const dz = Math.abs(biker.position.z - orb.mesh.position.z);
        if (dx < 1.2 && dz < 1.5 && orb.mesh.visible) {
          orb.mesh.visible = false;
          score++;
          scoreDiv.textContent = `Score: ${score}`;
        }
      }

      // Animate pedestrians
      pedTimer += 0.016;
      for (const p of pedestrians) {
        p.mesh.position.z += p.speed * p.dir;
        // Bob up and down slightly while walking
        p.mesh.position.y = 0.2 + Math.abs(Math.sin(pedTimer * 8 + p.baseX * 10)) * 0.04;
        // Reverse direction at bounds
        if (p.mesh.position.z > p.maxZ || p.mesh.position.z < p.minZ) {
          p.dir *= -1;
          p.mesh.rotation.y = p.dir > 0 ? 0 : Math.PI;
        }
      }

      // Camera follows biker
      camera.position.x = bikerX * 0.5 + 6;
      camera.position.y = 4;
      camera.position.z = 14;
      camera.lookAt(bikerX * 0.3, 1, -20);

      renderer.render(scene, camera);
    }

    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // ---- Mobile controls ----
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

    const btnStyle = `
      position:absolute;bottom:30px;width:90px;height:90px;
      border-radius:50%;border:3px solid rgba(255,255,255,0.6);
      background:rgba(255,255,255,0.15);backdrop-filter:blur(4px);
      color:white;font-size:36px;font-weight:bold;
      display:flex;align-items:center;justify-content:center;
      user-select:none;-webkit-user-select:none;touch-action:none;
      z-index:20;pointer-events:auto;
    `;

    const leftBtn = document.createElement("div");
    leftBtn.style.cssText = btnStyle + "left:30px;";
    leftBtn.innerHTML = "&#9664;";

    const rightBtn = document.createElement("div");
    rightBtn.style.cssText = btnStyle + "right:30px;";
    rightBtn.innerHTML = "&#9654;";

    if (isTouchDevice) {
      mount.appendChild(leftBtn);
      mount.appendChild(rightBtn);

      const handleLeft = (pressed: boolean) => { keys["ArrowLeft"] = pressed; };
      const handleRight = (pressed: boolean) => { keys["ArrowRight"] = pressed; };

      leftBtn.addEventListener("touchstart", (e) => { e.preventDefault(); handleLeft(true); }, { passive: false });
      leftBtn.addEventListener("touchend", (e) => { e.preventDefault(); handleLeft(false); }, { passive: false });
      leftBtn.addEventListener("touchcancel", () => handleLeft(false));

      rightBtn.addEventListener("touchstart", (e) => { e.preventDefault(); handleRight(true); }, { passive: false });
      rightBtn.addEventListener("touchend", (e) => { e.preventDefault(); handleRight(false); }, { passive: false });
      rightBtn.addEventListener("touchcancel", () => handleRight(false));

      // Tap anywhere on screen to restart on game over
      const onTapRestart = (e: TouchEvent) => {
        if (gameOver && explosionTimer === 0) {
          e.preventDefault();
          restart();
        }
      };
      renderer.domElement.addEventListener("touchstart", onTapRestart, { passive: false });
    }

    // Prevent default touch scrolling/zooming on the canvas
    renderer.domElement.style.touchAction = "none";

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", onResize);
      mount.removeChild(renderer.domElement);
      mount.removeChild(scoreDiv);
      mount.removeChild(gameOverDiv);
      if (isTouchDevice) {
        mount.removeChild(leftBtn);
        mount.removeChild(rightBtn);
      }
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100vw", height: "100vh" }} />;
}
