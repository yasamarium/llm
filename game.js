/**
 * Square Era • 3D Voxel Sandbox Game Engine
 * Built with Three.js WebGL, Hidden Face Culling, Procedural Textures & Audio
 * Strictly Zero Unicode Emojis
 */

(function () {
  'use strict';

  // =========================================================================
  // Game Configuration & Constants
  // =========================================================================
  const CHUNK_SIZE = 16;
  const CHUNK_HEIGHT = 48;
  const WATER_LEVEL = 18;

  // Block IDs
  const BLOCKS = {
    AIR: 0,
    GRASS: 1,
    DIRT: 2,
    STONE: 3,
    COBBLESTONE: 4,
    WOOD: 5,
    LEAVES: 6,
    PLANKS: 7,
    SAND: 8,
    GLASS: 9,
    WATER: 10,
    COAL_ORE: 11,
    IRON_ORE: 12,
    GOLD_ORE: 13,
    DIAMOND_ORE: 14,
    BEDROCK: 15,
    SNOW: 16,
    BRICKS: 17,
    BOOKSHELF: 18,
    TNT: 19
  };

  const BLOCK_NAMES = {
    [BLOCKS.AIR]: 'Air',
    [BLOCKS.GRASS]: 'Grass Block',
    [BLOCKS.DIRT]: 'Dirt',
    [BLOCKS.STONE]: 'Stone',
    [BLOCKS.COBBLESTONE]: 'Cobblestone',
    [BLOCKS.WOOD]: 'Oak Log',
    [BLOCKS.LEAVES]: 'Oak Leaves',
    [BLOCKS.PLANKS]: 'Oak Planks',
    [BLOCKS.SAND]: 'Sand',
    [BLOCKS.GLASS]: 'Glass',
    [BLOCKS.WATER]: 'Water',
    [BLOCKS.COAL_ORE]: 'Coal Ore',
    [BLOCKS.IRON_ORE]: 'Iron Ore',
    [BLOCKS.GOLD_ORE]: 'Gold Ore',
    [BLOCKS.DIAMOND_ORE]: 'Diamond Ore',
    [BLOCKS.BEDROCK]: 'Bedrock',
    [BLOCKS.SNOW]: 'Snow Block',
    [BLOCKS.BRICKS]: 'Bricks',
    [BLOCKS.BOOKSHELF]: 'Bookshelf',
    [BLOCKS.TNT]: 'TNT'
  };

  const BLOCK_TRANSPARENT = {
    [BLOCKS.AIR]: true,
    [BLOCKS.LEAVES]: true,
    [BLOCKS.GLASS]: true,
    [BLOCKS.WATER]: true
  };

  // User Settings State
  const settings = {
    renderDistance: 4,
    mouseSensitivity: 0.0025,
    fov: 75,
    soundVolume: 0.7,
    soundMuted: false,
    dayCycleSpeed: 1, // 0: off, 1: normal, 2: fast, 3: ultra
    fogEnabled: true,
    smoothLighting: true,
    gameMode: 'creative' // 'creative' or 'survival'
  };

  // Player State
  const player = {
    x: 8.5,
    y: 35.0,
    z: 8.5,
    vx: 0,
    vy: 0,
    vz: 0,
    pitch: 0,
    yaw: 0,
    width: 0.6,
    height: 1.8,
    eyeHeight: 1.62,
    onGround: false,
    inWater: false,
    isFlying: false,
    isSprinting: false,
    health: 20,
    hunger: 20,
    activeSlot: 0,
    hotbar: [
      BLOCKS.GRASS,
      BLOCKS.DIRT,
      BLOCKS.STONE,
      BLOCKS.COBBLESTONE,
      BLOCKS.WOOD,
      BLOCKS.PLANKS,
      BLOCKS.LEAVES,
      BLOCKS.GLASS,
      BLOCKS.BRICKS
    ]
  };

  // Saved world modifications: Map<"x,y,z", blockId>
  const worldModifications = new Map();

  // Three.js Core Globals
  let scene, camera, renderer;
  let sunLight, ambientLight, moonLight;
  let skyMesh;
  let wireframeTargetBox;
  let chunks = new Map(); // "cx,cz" => Chunk
  let particles = [];
  let isPointerLocked = false;
  let lastFrameTime = performance.now();
  let dayTime = 0.25; // 0: dawn, 0.25: noon, 0.5: sunset, 0.75: midnight
  let isPaused = true;
  let isInventoryOpen = false;

  // Key States
  const keys = {};

  // Audio Context (Procedural Synthesizer)
  let audioCtx = null;

  // Texture Atlas & Material Cache
  const blockMaterials = {};
  const blockIcons = {};

  // =========================================================================
  // Procedural 16x16 Pixel Texture Generator
  // =========================================================================
  function createPixelCanvas(drawFn) {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    drawFn(ctx);
    return canvas;
  }

  function seededNoise(x, y, seed = 42) {
    const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
    return n - Math.floor(n);
  }

  function generateAllTextures() {
    const texCanvases = {};

    // 1. Dirt Texture
    texCanvases.dirt = createPixelCanvas(ctx => {
      ctx.fillStyle = '#866043';
      ctx.fillRect(0, 0, 16, 16);
      for (let x = 0; x < 16; x++) {
        for (let y = 0; y < 16; y++) {
          const r = seededNoise(x, y, 1);
          if (r > 0.7) {
            ctx.fillStyle = '#6d4c33';
            ctx.fillRect(x, y, 1, 1);
          } else if (r < 0.2) {
            ctx.fillStyle = '#9b7252';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });

    // 2. Grass Top
    texCanvases.grass_top = createPixelCanvas(ctx => {
      ctx.fillStyle = '#4c9b38';
      ctx.fillRect(0, 0, 16, 16);
      for (let x = 0; x < 16; x++) {
        for (let y = 0; y < 16; y++) {
          const r = seededNoise(x, y, 2);
          if (r > 0.65) {
            ctx.fillStyle = '#3d822b';
            ctx.fillRect(x, y, 1, 1);
          } else if (r < 0.25) {
            ctx.fillStyle = '#5fb346';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });

    // 3. Grass Side (Dirt with grass overhang)
    texCanvases.grass_side = createPixelCanvas(ctx => {
      ctx.drawImage(texCanvases.dirt, 0, 0);
      ctx.fillStyle = '#4c9b38';
      for (let x = 0; x < 16; x++) {
        const hang = Math.floor(seededNoise(x, 0, 3) * 3) + 2;
        ctx.fillRect(x, 0, 1, hang);
      }
    });

    // 4. Stone Texture
    texCanvases.stone = createPixelCanvas(ctx => {
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 16, 16);
      for (let x = 0; x < 16; x++) {
        for (let y = 0; y < 16; y++) {
          const r = seededNoise(x, y, 4);
          if (r > 0.7) {
            ctx.fillStyle = '#696969';
            ctx.fillRect(x, y, 1, 1);
          } else if (r < 0.25) {
            ctx.fillStyle = '#999999';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });

    // 5. Cobblestone Texture
    texCanvases.cobblestone = createPixelCanvas(ctx => {
      ctx.fillStyle = '#6b6b6b';
      ctx.fillRect(0, 0, 16, 16);
      for (let x = 0; x < 16; x++) {
        for (let y = 0; y < 16; y++) {
          const r = seededNoise(x, y, 5);
          if ((x % 4 === 0) || (y % 4 === 0)) {
            ctx.fillStyle = '#484848';
          } else if (r > 0.6) {
            ctx.fillStyle = '#8a8a8a';
          } else {
            ctx.fillStyle = '#737373';
          }
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 6. Sand Texture
    texCanvases.sand = createPixelCanvas(ctx => {
      ctx.fillStyle = '#d6c589';
      ctx.fillRect(0, 0, 16, 16);
      for (let x = 0; x < 16; x++) {
        for (let y = 0; y < 16; y++) {
          const r = seededNoise(x, y, 6);
          if (r > 0.75) {
            ctx.fillStyle = '#c7b270';
            ctx.fillRect(x, y, 1, 1);
          } else if (r < 0.2) {
            ctx.fillStyle = '#e8d89e';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });

    // 7. Wood Log Side
    texCanvases.wood_side = createPixelCanvas(ctx => {
      ctx.fillStyle = '#685032';
      ctx.fillRect(0, 0, 16, 16);
      for (let x = 0; x < 16; x++) {
        const lineDark = seededNoise(x, 0, 7) > 0.5;
        ctx.fillStyle = lineDark ? '#533e24' : '#775c3a';
        ctx.fillRect(x, 0, 1, 16);
      }
    });

    // 8. Wood Log Top
    texCanvases.wood_top = createPixelCanvas(ctx => {
      ctx.fillStyle = '#b08b59';
      ctx.fillRect(0, 0, 16, 16);
      ctx.strokeStyle = '#533e24';
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, 15, 15);
      ctx.strokeRect(2.5, 2.5, 11, 11);
      ctx.strokeRect(4.5, 4.5, 7, 7);
      ctx.fillStyle = '#533e24';
      ctx.fillRect(7, 7, 2, 2);
    });

    // 9. Wood Planks
    texCanvases.planks = createPixelCanvas(ctx => {
      ctx.fillStyle = '#9c7a4a';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#614926';
      ctx.fillRect(0, 3, 16, 1);
      ctx.fillRect(0, 7, 16, 1);
      ctx.fillRect(0, 11, 16, 1);
      ctx.fillRect(0, 15, 16, 1);
      ctx.fillRect(7, 0, 1, 3);
      ctx.fillRect(11, 4, 1, 3);
      ctx.fillRect(4, 8, 1, 3);
      ctx.fillRect(13, 12, 1, 3);
    });

    // 10. Leaves Texture
    texCanvases.leaves = createPixelCanvas(ctx => {
      ctx.fillStyle = '#2d6a22';
      ctx.fillRect(0, 0, 16, 16);
      for (let x = 0; x < 16; x++) {
        for (let y = 0; y < 16; y++) {
          const r = seededNoise(x, y, 10);
          if (r > 0.75) {
            ctx.fillStyle = '#3f8c32';
            ctx.fillRect(x, y, 1, 1);
          } else if (r < 0.25) {
            ctx.fillStyle = '#1e4c16';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });

    // 11. Glass Texture
    texCanvases.glass = createPixelCanvas(ctx => {
      ctx.clearRect(0, 0, 16, 16);
      ctx.fillStyle = 'rgba(215, 240, 255, 0.25)';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      // Border
      ctx.fillRect(0, 0, 16, 1);
      ctx.fillRect(0, 15, 16, 1);
      ctx.fillRect(0, 0, 1, 16);
      ctx.fillRect(15, 0, 1, 16);
      // Glare lines
      ctx.fillRect(2, 2, 2, 1);
      ctx.fillRect(3, 3, 2, 1);
      ctx.fillRect(11, 11, 2, 1);
      ctx.fillRect(12, 12, 2, 1);
    });

    // 12. Water Texture
    texCanvases.water = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(30, 120, 240, 0.75)';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = 'rgba(80, 170, 255, 0.85)';
      for (let y = 2; y < 16; y += 4) {
        ctx.fillRect(2, y, 4, 1);
        ctx.fillRect(10, y + 2, 4, 1);
      }
    });

    // 13. Ores (Coal, Iron, Gold, Diamond)
    function createOreCanvas(accentColor, highlightColor) {
      return createPixelCanvas(ctx => {
        ctx.drawImage(texCanvases.stone, 0, 0);
        const spots = [[3, 3], [4, 4], [11, 4], [12, 5], [7, 8], [8, 9], [3, 12], [4, 13], [12, 11], [13, 12]];
        spots.forEach(([x, y]) => {
          ctx.fillStyle = accentColor;
          ctx.fillRect(x, y, 2, 2);
          ctx.fillStyle = highlightColor;
          ctx.fillRect(x, y, 1, 1);
        });
      });
    }

    texCanvases.coal_ore = createOreCanvas('#222222', '#3d3d3d');
    texCanvases.iron_ore = createOreCanvas('#d8af93', '#f0d2be');
    texCanvases.gold_ore = createOreCanvas('#facc15', '#fef08a');
    texCanvases.diamond_ore = createOreCanvas('#22d3ee', '#a5f3fc');

    // 14. Bedrock
    texCanvases.bedrock = createPixelCanvas(ctx => {
      ctx.fillStyle = '#262626';
      ctx.fillRect(0, 0, 16, 16);
      for (let x = 0; x < 16; x++) {
        for (let y = 0; y < 16; y++) {
          const r = seededNoise(x, y, 14);
          if (r > 0.6) ctx.fillStyle = '#141414';
          else if (r < 0.2) ctx.fillStyle = '#3b3b3b';
          else ctx.fillStyle = '#262626';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 15. Snow Top & Side
    texCanvases.snow_top = createPixelCanvas(ctx => {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 16, 16);
      for (let x = 0; x < 16; x++) {
        for (let y = 0; y < 16; y++) {
          if (seededNoise(x, y, 15) > 0.8) {
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });

    texCanvases.snow_side = createPixelCanvas(ctx => {
      ctx.drawImage(texCanvases.dirt, 0, 0);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 16, 5);
      for (let x = 0; x < 16; x++) {
        const hang = Math.floor(seededNoise(x, 0, 16) * 3) + 4;
        ctx.fillRect(x, 0, 1, hang);
      }
    });

    // 16. Bricks
    texCanvases.bricks = createPixelCanvas(ctx => {
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#d1d5db';
      ctx.fillRect(0, 3, 16, 1);
      ctx.fillRect(0, 7, 16, 1);
      ctx.fillRect(0, 11, 16, 1);
      ctx.fillRect(0, 15, 16, 1);
      ctx.fillRect(7, 0, 1, 4);
      ctx.fillRect(15, 4, 1, 4);
      ctx.fillRect(7, 8, 1, 4);
      ctx.fillRect(15, 12, 1, 4);
    });

    // 17. Bookshelf
    texCanvases.bookshelf = createPixelCanvas(ctx => {
      ctx.drawImage(texCanvases.planks, 0, 0);
      ctx.fillStyle = '#1e1b18';
      ctx.fillRect(1, 2, 14, 5);
      ctx.fillRect(1, 9, 14, 5);
      const bookColors = ['#dc2626', '#2563eb', '#16a34a', '#ca8a04', '#9333ea'];
      for (let i = 2; i < 14; i += 2) {
        ctx.fillStyle = bookColors[Math.floor(seededNoise(i, 1) * bookColors.length)];
        ctx.fillRect(i, 2, 2, 5);
        ctx.fillStyle = bookColors[Math.floor(seededNoise(i, 2) * bookColors.length)];
        ctx.fillRect(i, 9, 2, 5);
      }
    });

    // 18. TNT
    texCanvases.tnt_side = createPixelCanvas(ctx => {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 5, 16, 6);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 5px sans-serif';
      ctx.fillText('TNT', 2, 10);
    });

    texCanvases.tnt_top = createPixelCanvas(ctx => {
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(7, 7, 2, 2);
    });

    // Convert all canvases into Three.js Textures
    const threeTextures = {};
    for (const key in texCanvases) {
      const tex = new THREE.CanvasTexture(texCanvases[key]);
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestMipmapNearestFilter;
      threeTextures[key] = tex;
    }

    // Helper to create Material with vertex colors (for AO shading)
    function makeMat(texture, isTransp = false, opacity = 1.0) {
      return new THREE.MeshLambertMaterial({
        map: texture,
        transparent: isTransp,
        opacity: opacity,
        vertexColors: true,
        side: isTransp ? THREE.DoubleSide : THREE.FrontSide
      });
    }

    // Material Array: [+X, -X, +Y (Top), -Y (Bottom), +Z, -Z]
    function makeCubeMats(sideTex, topTex, bottomTex) {
      const s = makeMat(sideTex);
      const t = makeMat(topTex || sideTex);
      const b = makeMat(bottomTex || topTex || sideTex);
      return [s, s, t, b, s, s];
    }

    blockMaterials[BLOCKS.GRASS] = makeCubeMats(threeTextures.grass_side, threeTextures.grass_top, threeTextures.dirt);
    blockMaterials[BLOCKS.DIRT] = makeCubeMats(threeTextures.dirt, threeTextures.dirt, threeTextures.dirt);
    blockMaterials[BLOCKS.STONE] = makeCubeMats(threeTextures.stone);
    blockMaterials[BLOCKS.COBBLESTONE] = makeCubeMats(threeTextures.cobblestone);
    blockMaterials[BLOCKS.WOOD] = makeCubeMats(threeTextures.wood_side, threeTextures.wood_top, threeTextures.wood_top);
    blockMaterials[BLOCKS.PLANKS] = makeCubeMats(threeTextures.planks);
    blockMaterials[BLOCKS.LEAVES] = makeCubeMats(threeTextures.leaves, threeTextures.leaves, threeTextures.leaves);
    blockMaterials[BLOCKS.SAND] = makeCubeMats(threeTextures.sand);
    blockMaterials[BLOCKS.GLASS] = [
      makeMat(threeTextures.glass, true, 0.8),
      makeMat(threeTextures.glass, true, 0.8),
      makeMat(threeTextures.glass, true, 0.8),
      makeMat(threeTextures.glass, true, 0.8),
      makeMat(threeTextures.glass, true, 0.8),
      makeMat(threeTextures.glass, true, 0.8)
    ];
    blockMaterials[BLOCKS.WATER] = [
      makeMat(threeTextures.water, true, 0.7),
      makeMat(threeTextures.water, true, 0.7),
      makeMat(threeTextures.water, true, 0.7),
      makeMat(threeTextures.water, true, 0.7),
      makeMat(threeTextures.water, true, 0.7),
      makeMat(threeTextures.water, true, 0.7)
    ];
    blockMaterials[BLOCKS.COAL_ORE] = makeCubeMats(threeTextures.coal_ore);
    blockMaterials[BLOCKS.IRON_ORE] = makeCubeMats(threeTextures.iron_ore);
    blockMaterials[BLOCKS.GOLD_ORE] = makeCubeMats(threeTextures.gold_ore);
    blockMaterials[BLOCKS.DIAMOND_ORE] = makeCubeMats(threeTextures.diamond_ore);
    blockMaterials[BLOCKS.BEDROCK] = makeCubeMats(threeTextures.bedrock);
    blockMaterials[BLOCKS.SNOW] = makeCubeMats(threeTextures.snow_side, threeTextures.snow_top, threeTextures.dirt);
    blockMaterials[BLOCKS.BRICKS] = makeCubeMats(threeTextures.bricks);
    blockMaterials[BLOCKS.BOOKSHELF] = makeCubeMats(threeTextures.bookshelf, threeTextures.planks, threeTextures.planks);
    blockMaterials[BLOCKS.TNT] = makeCubeMats(threeTextures.tnt_side, threeTextures.tnt_top, threeTextures.tnt_top);

    // Save thumbnail preview canvases for UI
    blockIcons[BLOCKS.GRASS] = texCanvases.grass_side;
    blockIcons[BLOCKS.DIRT] = texCanvases.dirt;
    blockIcons[BLOCKS.STONE] = texCanvases.stone;
    blockIcons[BLOCKS.COBBLESTONE] = texCanvases.cobblestone;
    blockIcons[BLOCKS.WOOD] = texCanvases.wood_side;
    blockIcons[BLOCKS.PLANKS] = texCanvases.planks;
    blockIcons[BLOCKS.LEAVES] = texCanvases.leaves;
    blockIcons[BLOCKS.SAND] = texCanvases.sand;
    blockIcons[BLOCKS.GLASS] = texCanvases.glass;
    blockIcons[BLOCKS.WATER] = texCanvases.water;
    blockIcons[BLOCKS.COAL_ORE] = texCanvases.coal_ore;
    blockIcons[BLOCKS.IRON_ORE] = texCanvases.iron_ore;
    blockIcons[BLOCKS.GOLD_ORE] = texCanvases.gold_ore;
    blockIcons[BLOCKS.DIAMOND_ORE] = texCanvases.diamond_ore;
    blockIcons[BLOCKS.BEDROCK] = texCanvases.bedrock;
    blockIcons[BLOCKS.SNOW] = texCanvases.snow_side;
    blockIcons[BLOCKS.BRICKS] = texCanvases.bricks;
    blockIcons[BLOCKS.BOOKSHELF] = texCanvases.bookshelf;
    blockIcons[BLOCKS.TNT] = texCanvases.tnt_side;
  }

  // =========================================================================
  // Procedural Simplex / Perlin Noise World Generator
  // =========================================================================
  const SimplexNoise = (function () {
    const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
    const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = Math.floor(seededNoise(i, i * 2, 77) * 256);
    const perm = new Uint8Array(512);
    const permMod12 = new Uint8Array(512);
    for (let i = 0; i < 512; i++) {
      perm[i] = p[i & 255];
      permMod12[i] = (perm[i] % 12);
    }
    const grad3 = [
      [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
      [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
      [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
    ];

    function noise2D(xin, yin) {
      let n0, n1, n2;
      const s = (xin + yin) * F2;
      const i = Math.floor(xin + s);
      const j = Math.floor(yin + s);
      const t = (i + j) * G2;
      const X0 = i - t;
      const Y0 = j - t;
      const x0 = xin - X0;
      const y0 = yin - Y0;
      let i1, j1;
      if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }
      const x1 = x0 - i1 + G2;
      const y1 = y0 - j1 + G2;
      const x2 = x0 - 1.0 + 2.0 * G2;
      const y2 = y0 - 1.0 + 2.0 * G2;
      const ii = i & 255;
      const jj = j & 255;
      const gi0 = permMod12[ii + perm[jj]];
      const gi1 = permMod12[ii + i1 + perm[jj + j1]];
      const gi2 = permMod12[ii + 1 + perm[jj + 1]];
      let t0 = 0.5 - x0 * x0 - y0 * y0;
      if (t0 < 0) n0 = 0.0;
      else {
        t0 *= t0;
        n0 = t0 * t0 * (grad3[gi0][0] * x0 + grad3[gi0][1] * y0);
      }
      let t1 = 0.5 - x1 * x1 - y1 * y1;
      if (t1 < 0) n1 = 0.0;
      else {
        t1 *= t1;
        n1 = t1 * t1 * (grad3[gi1][0] * x1 + grad3[gi1][1] * y1);
      }
      let t2 = 0.5 - x2 * x2 - y2 * y2;
      if (t2 < 0) n2 = 0.0;
      else {
        t2 *= t2;
        n2 = t2 * t2 * (grad3[gi2][0] * x2 + grad3[gi2][1] * y2);
      }
      return 70.0 * (n0 + n1 + n2);
    }

    return { noise2D };
  })();

  function getTerrainHeight(wx, wz) {
    // Multi-octave terrain heightmap
    const scale1 = 0.015;
    const scale2 = 0.05;
    const scale3 = 0.12;

    const n1 = SimplexNoise.noise2D(wx * scale1, wz * scale1);
    const n2 = SimplexNoise.noise2D(wx * scale2, wz * scale2) * 0.5;
    const n3 = SimplexNoise.noise2D(wx * scale3, wz * scale3) * 0.25;

    const combined = (n1 + n2 + n3); // approx -1.75 to 1.75
    // Base height 26, amplitude 12
    const h = Math.floor(26 + combined * 9);
    return Math.max(4, Math.min(CHUNK_HEIGHT - 6, h));
  }

  function getBiome(wx, wz) {
    const biomeNoise = SimplexNoise.noise2D(wx * 0.005, wz * 0.005);
    if (biomeNoise < -0.3) return 'desert';
    if (biomeNoise > 0.45) return 'snowy_mountains';
    if (biomeNoise > 0.1) return 'forest';
    return 'plains';
  }

  // =========================================================================
  // Chunk & World Storage Engine
  // =========================================================================
  class Chunk {
    constructor(cx, cz) {
      this.cx = cx;
      this.cz = cz;
      this.blocks = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
      this.mesh = null;
      this.isModified = false;
      this.generateTerrain();
    }

    getIndex(x, y, z) {
      return (y * CHUNK_SIZE + z) * CHUNK_SIZE + x;
    }

    getBlock(x, y, z) {
      if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
        return BLOCKS.AIR;
      }
      return this.blocks[this.getIndex(x, y, z)];
    }

    setBlock(x, y, z, blockId) {
      if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) return;
      this.blocks[this.getIndex(x, y, z)] = blockId;
      this.isModified = true;
    }

    generateTerrain() {
      const treesToPlant = [];

      for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
          const wx = this.cx * CHUNK_SIZE + x;
          const wz = this.cz * CHUNK_SIZE + z;
          const height = getTerrainHeight(wx, wz);
          const biome = getBiome(wx, wz);

          // Bedrock bottom
          this.setBlock(x, 0, z, BLOCKS.BEDROCK);
          if (seededNoise(wx, wz, 99) > 0.4) {
            this.setBlock(x, 1, z, BLOCKS.BEDROCK);
          }

          // Generate vertical column
          for (let y = 1; y < CHUNK_HEIGHT; y++) {
            // Apply saved user edits if any
            const editKey = `${wx},${y},${wz}`;
            if (worldModifications.has(editKey)) {
              this.setBlock(x, y, z, worldModifications.get(editKey));
              continue;
            }

            if (y > height) {
              // Fill with water if below water level
              if (y <= WATER_LEVEL) {
                this.setBlock(x, y, z, BLOCKS.WATER);
              } else {
                this.setBlock(x, y, z, BLOCKS.AIR);
              }
              continue;
            }

            // Top layer & soil
            if (y === height) {
              if (biome === 'desert' || height <= WATER_LEVEL + 1) {
                this.setBlock(x, y, z, BLOCKS.SAND);
              } else if (biome === 'snowy_mountains' && height > 32) {
                this.setBlock(x, y, z, BLOCKS.SNOW);
              } else {
                this.setBlock(x, y, z, BLOCKS.GRASS);
                // Tree chance on surface in forest or plains
                if (biome === 'forest' && seededNoise(wx, wz, 55) > 0.94) {
                  treesToPlant.push({ x, y: height + 1, z });
                } else if (biome === 'plains' && seededNoise(wx, wz, 55) > 0.985) {
                  treesToPlant.push({ x, y: height + 1, z });
                }
              }
            } else if (y > height - 4) {
              if (biome === 'desert' || height <= WATER_LEVEL + 1) {
                this.setBlock(x, y, z, BLOCKS.SAND);
              } else {
                this.setBlock(x, y, z, BLOCKS.DIRT);
              }
            } else {
              // Stone & Ores layer
              let stoneBlock = BLOCKS.STONE;
              const rOre = seededNoise(wx * 2, y * 3 + wz, 12);
              if (y < 12 && rOre > 0.97) stoneBlock = BLOCKS.DIAMOND_ORE;
              else if (y < 20 && rOre > 0.94) stoneBlock = BLOCKS.GOLD_ORE;
              else if (y < 36 && rOre > 0.88) stoneBlock = BLOCKS.IRON_ORE;
              else if (y < 50 && rOre > 0.82) stoneBlock = BLOCKS.COAL_ORE;
              this.setBlock(x, y, z, stoneBlock);
            }
          }
        }
      }

      // Plant Trees
      treesToPlant.forEach(tree => {
        this.growTree(tree.x, tree.y, tree.z);
      });
    }

    growTree(tx, ty, tz) {
      const trunkHeight = 4 + Math.floor(seededNoise(tx, tz, 88) * 3);
      // Trunk
      for (let h = 0; h < trunkHeight; h++) {
        if (ty + h < CHUNK_HEIGHT) {
          this.setBlock(tx, ty + h, tz, BLOCKS.WOOD);
        }
      }
      // Leaves canopy
      const leafBase = ty + trunkHeight - 2;
      for (let lx = -2; lx <= 2; lx++) {
        for (let lz = -2; lz <= 2; lz++) {
          for (let ly = 0; ly <= 2; ly++) {
            if (Math.abs(lx) === 2 && Math.abs(lz) === 2 && ly === 2) continue;
            const px = tx + lx;
            const py = leafBase + ly;
            const pz = tz + lz;
            if (px >= 0 && px < CHUNK_SIZE && pz >= 0 && pz < CHUNK_SIZE && py < CHUNK_HEIGHT) {
              if (this.getBlock(px, py, pz) === BLOCKS.AIR) {
                this.setBlock(px, py, pz, BLOCKS.LEAVES);
              }
            }
          }
        }
      }
    }
  }

  function getGlobalBlock(gx, gy, gz) {
    if (gy < 0 || gy >= CHUNK_HEIGHT) return BLOCKS.AIR;
    const cx = Math.floor(gx / CHUNK_SIZE);
    const cz = Math.floor(gz / CHUNK_SIZE);
    const chunk = chunks.get(`${cx},${cz}`);
    if (!chunk) return BLOCKS.AIR;
    const lx = ((gx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((gz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    return chunk.getBlock(lx, gy, lz);
  }

  function setGlobalBlock(gx, gy, gz, blockId) {
    if (gy < 0 || gy >= CHUNK_HEIGHT) return;
    const cx = Math.floor(gx / CHUNK_SIZE);
    const cz = Math.floor(gz / CHUNK_SIZE);
    const chunk = chunks.get(`${cx},${cz}`);
    if (!chunk) return;
    const lx = ((gx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((gz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    chunk.setBlock(lx, gy, lz, blockId);

    // Save to modification registry
    worldModifications.set(`${gx},${gy},${gz}`, blockId);

    // Re-mesh current chunk
    meshChunk(chunk);

    // If on chunk border, re-mesh adjacent chunk
    if (lx === 0) meshChunkAt(cx - 1, cz);
    if (lx === CHUNK_SIZE - 1) meshChunkAt(cx + 1, cz);
    if (lz === 0) meshChunkAt(cx, cz - 1);
    if (lz === CHUNK_SIZE - 1) meshChunkAt(cx, cz + 1);
  }

  function meshChunkAt(cx, cz) {
    const c = chunks.get(`${cx},${cz}`);
    if (c) meshChunk(c);
  }

  // =========================================================================
  // Chunk Mesher with Hidden Face Culling & Ambient Occlusion
  // =========================================================================
  const FACE_DIRS = [
    { dir: [1, 0, 0], matIdx: 0, norm: [1, 0, 0], quad: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]] }, // +X
    { dir: [-1, 0, 0], matIdx: 1, norm: [-1, 0, 0], quad: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]] }, // -X
    { dir: [0, 1, 0], matIdx: 2, norm: [0, 1, 0], quad: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]] }, // +Y (Top)
    { dir: [0, -1, 0], matIdx: 3, norm: [0, -1, 0], quad: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] }, // -Y (Bottom)
    { dir: [0, 0, 1], matIdx: 4, norm: [0, 0, 1], quad: [[1, 0, 1], [1, 1, 1], [0, 1, 1], [0, 0, 1]] }, // +Z
    { dir: [0, 0, -1], matIdx: 5, norm: [0, 0, -1], quad: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]] }  // -Z
  ];

  function calculateVertexAO(side1, side2, corner) {
    if (side1 && side2) return 0.55;
    const count = (side1 ? 1 : 0) + (side2 ? 1 : 0) + (corner ? 1 : 0);
    if (count === 2) return 0.70;
    if (count === 1) return 0.85;
    return 1.0;
  }

  function meshChunk(chunk) {
    if (chunk.mesh) {
      scene.remove(chunk.mesh);
      chunk.mesh.geometry.dispose();
      chunk.mesh = null;
    }

    // Accumulate geometry per block type (to batch draw calls)
    const blockBatches = {};

    const originX = chunk.cx * CHUNK_SIZE;
    const originZ = chunk.cz * CHUNK_SIZE;

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let y = 0; y < CHUNK_HEIGHT; y++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
          const block = chunk.getBlock(x, y, z);
          if (block === BLOCKS.AIR) continue;

          const gx = originX + x;
          const gz = originZ + z;

          for (let f = 0; f < FACE_DIRS.length; f++) {
            const face = FACE_DIRS[f];
            const nx = gx + face.dir[0];
            const ny = y + face.dir[1];
            const nz = gz + face.dir[2];

            const neighbor = getGlobalBlock(nx, ny, nz);

            // Hidden face culling condition:
            // Render face only if neighbor is air, or neighbor is transparent while current block is opaque,
            // or both are transparent but different blocks (e.g. water next to glass).
            const isNeighborTransp = BLOCK_TRANSPARENT[neighbor];
            const isCurrentTransp = BLOCK_TRANSPARENT[block];

            let shouldRenderFace = false;
            if (neighbor === BLOCKS.AIR) {
              shouldRenderFace = true;
            } else if (isNeighborTransp && !isCurrentTransp) {
              shouldRenderFace = true;
            } else if (isCurrentTransp && isNeighborTransp && block !== neighbor) {
              shouldRenderFace = true;
            }

            if (!shouldRenderFace) continue;

            if (!blockBatches[block]) {
              blockBatches[block] = {
                positions: [],
                normals: [],
                uvs: [],
                colors: [],
                indices: [],
                vertCount: 0
              };
            }

            const batch = blockBatches[block];
            const vBase = batch.vertCount;

            // Ambient Occlusion shading per vertex
            let ao0 = 1.0, ao1 = 1.0, ao2 = 1.0, ao3 = 1.0;
            if (settings.smoothLighting && !isCurrentTransp) {
              // Basic directional ambient shading
              ao0 = 0.95; ao1 = 1.0; ao2 = 0.95; ao3 = 0.9;
            }

            const quad = face.quad;
            // 4 Vertices of the quad
            for (let v = 0; v < 4; v++) {
              batch.positions.push(gx + quad[v][0], y + quad[v][1], gz + quad[v][2]);
              batch.normals.push(face.norm[0], face.norm[1], face.norm[2]);
            }

            // UVs
            batch.uvs.push(0, 0, 0, 1, 1, 1, 1, 0);

            // Colors (AO)
            batch.colors.push(ao0, ao0, ao0, ao1, ao1, ao1, ao2, ao2, ao2, ao3, ao3, ao3);

            // 2 Triangles per quad
            batch.indices.push(vBase, vBase + 1, vBase + 2, vBase, vBase + 2, vBase + 3);
            batch.vertCount += 4;
          }
        }
      }
    }

    // Create merged chunk group mesh
    const chunkGroup = new THREE.Group();

    for (const blockIdStr in blockBatches) {
      const bId = parseInt(blockIdStr);
      const batch = blockBatches[bId];
      if (batch.indices.length === 0) continue;

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(batch.positions, 3));
      geom.setAttribute('normal', new THREE.Float32BufferAttribute(batch.normals, 3));
      geom.setAttribute('uv', new THREE.Float32BufferAttribute(batch.uvs, 2));
      geom.setAttribute('color', new THREE.Float32BufferAttribute(batch.colors, 3));
      geom.setIndex(batch.indices);

      // Block materials: 6-array or single
      const mat = blockMaterials[bId] ? blockMaterials[bId][0] : new THREE.MeshLambertMaterial({ color: 0x888888 });
      const mesh = new THREE.Mesh(geom, mat);
      chunkGroup.add(mesh);
    }

    chunk.mesh = chunkGroup;
    scene.add(chunkGroup);
  }

  // =========================================================================
  // Player Controls & Physics Engine
  // =========================================================================
  function isBlockSolid(b) {
    return b !== BLOCKS.AIR && b !== BLOCKS.WATER;
  }

  function checkPlayerCollision(px, py, pz) {
    const minX = px - player.width / 2;
    const maxX = px + player.width / 2;
    const minY = py;
    const maxY = py + player.height;
    const minZ = pz - player.width / 2;
    const maxZ = pz + player.width / 2;

    const bMinX = Math.floor(minX);
    const bMaxX = Math.floor(maxX);
    const bMinY = Math.floor(minY);
    const bMaxY = Math.floor(maxY);
    const bMinZ = Math.floor(minZ);
    const bMaxZ = Math.floor(maxZ);

    for (let x = bMinX; x <= bMaxX; x++) {
      for (let y = bMinY; y <= bMaxY; y++) {
        for (let z = bMinZ; z <= bMaxZ; z++) {
          const b = getGlobalBlock(x, y, z);
          if (isBlockSolid(b)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  function updatePhysics(dt) {
    // Water check
    const footBlock = getGlobalBlock(Math.floor(player.x), Math.floor(player.y), Math.floor(player.z));
    player.inWater = (footBlock === BLOCKS.WATER);

    // Creative Flight Mode
    if (player.isFlying) {
      let moveX = 0, moveZ = 0, moveY = 0;
      if (keys['KeyW']) moveZ -= 1;
      if (keys['KeyS']) moveZ += 1;
      if (keys['KeyA']) moveX -= 1;
      if (keys['KeyD']) moveX += 1;
      if (keys['Space']) moveY += 1;
      if (keys['ShiftLeft'] || keys['ShiftRight']) moveY -= 1;

      const flySpeed = player.isSprinting ? 24.0 : 12.0;
      const sinYaw = Math.sin(player.yaw);
      const cosYaw = Math.cos(player.yaw);

      const dx = (moveX * cosYaw + moveZ * sinYaw) * flySpeed * dt;
      const dz = (-moveX * sinYaw + moveZ * cosYaw) * flySpeed * dt;
      const dy = moveY * flySpeed * dt;

      player.x += dx;
      player.y += dy;
      player.z += dz;
      player.vx = 0;
      player.vy = 0;
      player.vz = 0;
      return;
    }

    // Walking / Sprinting Movement Input
    let moveX = 0, moveZ = 0;
    if (keys['KeyW']) moveZ -= 1;
    if (keys['KeyS']) moveZ += 1;
    if (keys['KeyA']) moveX -= 1;
    if (keys['KeyD']) moveX += 1;

    player.isSprinting = !!keys['ShiftLeft'] && (moveZ < 0);

    const speed = player.inWater ? 2.5 : (player.isSprinting ? 7.0 : 4.5);
    const len = Math.hypot(moveX, moveZ);
    if (len > 0) {
      moveX /= len;
      moveZ /= len;
    }

    const sinYaw = Math.sin(player.yaw);
    const cosYaw = Math.cos(player.yaw);

    const targetVx = (moveX * cosYaw + moveZ * sinYaw) * speed;
    const targetVz = (-moveX * sinYaw + moveZ * cosYaw) * speed;

    // Smooth horizontal acceleration/friction
    const accel = player.onGround ? 18.0 : 6.0;
    player.vx += (targetVx - player.vx) * Math.min(1.0, accel * dt);
    player.vz += (targetVz - player.vz) * Math.min(1.0, accel * dt);

    // Gravity & Jump
    if (player.inWater) {
      player.vy = -1.5; // slow water sinking
      if (keys['Space']) {
        player.vy = 3.0; // swim up
        playSynthesizedSound('swim');
      }
    } else {
      player.vy -= 26.0 * dt; // Gravity
      if (keys['Space'] && player.onGround) {
        player.vy = 8.8; // Jump impulse
        player.onGround = false;
        playSynthesizedSound('jump');
      }
    }

    // AABB Collision with step-up
    const stepHeight = 1.1; // 1-block auto step-up

    // X Axis Movement
    let nextX = player.x + player.vx * dt;
    if (!checkPlayerCollision(nextX, player.y, player.z)) {
      player.x = nextX;
    } else {
      // Try 1-block auto step-up if on ground
      if (player.onGround && !checkPlayerCollision(nextX, player.y + stepHeight, player.z)) {
        player.y += stepHeight;
        player.x = nextX;
      } else {
        player.vx = 0;
      }
    }

    // Z Axis Movement
    let nextZ = player.z + player.vz * dt;
    if (!checkPlayerCollision(player.x, player.y, nextZ)) {
      player.z = nextZ;
    } else {
      if (player.onGround && !checkPlayerCollision(player.x, player.y + stepHeight, nextZ)) {
        player.y += stepHeight;
        player.z = nextZ;
      } else {
        player.vz = 0;
      }
    }

    // Y Axis Movement (Vertical)
    const nextY = player.y + player.vy * dt;
    if (!checkPlayerCollision(player.x, nextY, player.z)) {
      player.y = nextY;
      player.onGround = false;
    } else {
      if (player.vy < 0) {
        // Landed on ground
        player.onGround = true;
        // Fall damage in survival
        if (settings.gameMode === 'survival' && player.vy < -16.0) {
          const fallDmg = Math.floor((-player.vy - 16.0) * 0.8);
          if (fallDmg > 0) damagePlayer(fallDmg);
        }
      }
      player.vy = 0;
    }

    // Void safety respawn
    if (player.y < -10) {
      player.x = 8.5;
      player.y = 40.0;
      player.z = 8.5;
      player.vy = 0;
      showToast('Respawned on surface');
    }
  }

  function damagePlayer(amount) {
    player.health = Math.max(0, player.health - amount);
    playSynthesizedSound('hurt');
    renderSurvivalMeters();
    if (player.health === 0) {
      showToast('You died! Respawning...');
      player.health = 20;
      player.x = 8.5;
      player.y = 40.0;
      player.z = 8.5;
      renderSurvivalMeters();
    }
  }

  // =========================================================================
  // Voxel Raycasting (DDA / Targeted Block)
  // =========================================================================
  function raycastBlock(maxDist = 6.0) {
    const origin = new THREE.Vector3(player.x, player.y + player.eyeHeight, player.z);
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);

    let x = Math.floor(origin.x);
    let y = Math.floor(origin.y);
    let z = Math.floor(origin.z);

    const stepX = dir.x > 0 ? 1 : -1;
    const stepY = dir.y > 0 ? 1 : -1;
    const stepZ = dir.z > 0 ? 1 : -1;

    const tDeltaX = Math.abs(1 / dir.x);
    const tDeltaY = Math.abs(1 / dir.y);
    const tDeltaZ = Math.abs(1 / dir.z);

    let tMaxX = dir.x > 0 ? (Math.floor(origin.x) + 1 - origin.x) * tDeltaX : (origin.x - Math.floor(origin.x)) * tDeltaX;
    let tMaxY = dir.y > 0 ? (Math.floor(origin.y) + 1 - origin.y) * tDeltaY : (origin.y - Math.floor(origin.y)) * tDeltaY;
    let tMaxZ = dir.z > 0 ? (Math.floor(origin.z) + 1 - origin.z) * tDeltaZ : (origin.z - Math.floor(origin.z)) * tDeltaZ;

    let hit = null;
    let dist = 0;
    let normal = [0, 1, 0];

    while (dist < maxDist) {
      if (tMaxX < tMaxY) {
        if (tMaxX < tMaxZ) {
          x += stepX;
          dist = tMaxX;
          tMaxX += tDeltaX;
          normal = [-stepX, 0, 0];
        } else {
          z += stepZ;
          dist = tMaxZ;
          tMaxZ += tDeltaZ;
          normal = [0, 0, -stepZ];
        }
      } else {
        if (tMaxY < tMaxZ) {
          y += stepY;
          dist = tMaxY;
          tMaxY += tDeltaY;
          normal = [0, -stepY, 0];
        } else {
          z += stepZ;
          dist = tMaxZ;
          tMaxZ += tDeltaZ;
          normal = [0, 0, -stepZ];
        }
      }

      const b = getGlobalBlock(x, y, z);
      if (b !== BLOCKS.AIR && b !== BLOCKS.WATER) {
        hit = { x, y, z, normal, block: b };
        break;
      }
    }

    return hit;
  }

  // =========================================================================
  // Block Breaking & Placing
  // =========================================================================
  function breakTargetedBlock() {
    const target = raycastBlock();
    if (!target) return;

    // Spawn block break explosion particles
    spawnBreakParticles(target.x, target.y, target.z, target.block);
    playSynthesizedSound('break');

    // Remove block
    setGlobalBlock(target.x, target.y, target.z, BLOCKS.AIR);
  }

  function placeSelectedBlock() {
    const target = raycastBlock();
    if (!target) return;

    const px = target.x + target.normal[0];
    const py = target.y + target.normal[1];
    const pz = target.z + target.normal[2];

    // Check if placing block intersects with player bounding box
    const minX = player.x - player.width / 2;
    const maxX = player.x + player.width / 2;
    const minY = player.y;
    const maxY = player.y + player.height;
    const minZ = player.z - player.width / 2;
    const maxZ = player.z + player.width / 2;

    if (px >= Math.floor(minX) && px <= Math.floor(maxX) &&
        py >= Math.floor(minY) && py <= Math.floor(maxY) &&
        pz >= Math.floor(minZ) && pz <= Math.floor(maxZ)) {
      return; // Cannot place inside player
    }

    const selectedBlock = player.hotbar[player.activeSlot] || BLOCKS.DIRT;
    setGlobalBlock(px, py, pz, selectedBlock);
    playSynthesizedSound('place');
  }

  // =========================================================================
  // Particle Explosion Effects
  // =========================================================================
  function spawnBreakParticles(bx, by, bz, blockId) {
    const count = 12;
    const geom = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const mat = new THREE.MeshLambertMaterial({ color: getBlockColor(blockId) });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(
        bx + 0.5 + (Math.random() - 0.5) * 0.6,
        by + 0.5 + (Math.random() - 0.5) * 0.6,
        bz + 0.5 + (Math.random() - 0.5) * 0.6
      );
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 4 + 1.5,
        (Math.random() - 0.5) * 4
      );
      scene.add(mesh);
      particles.push({ mesh, vel, life: 0.6, maxLife: 0.6 });
    }
  }

  function getBlockColor(b) {
    switch (b) {
      case BLOCKS.GRASS: return 0x4c9b38;
      case BLOCKS.DIRT: return 0x866043;
      case BLOCKS.STONE: return 0x808080;
      case BLOCKS.COBBLESTONE: return 0x6b6b6b;
      case BLOCKS.WOOD: return 0x685032;
      case BLOCKS.PLANKS: return 0x9c7a4a;
      case BLOCKS.LEAVES: return 0x2d6a22;
      case BLOCKS.SAND: return 0xd6c589;
      case BLOCKS.GLASS: return 0xd7f0ff;
      case BLOCKS.COAL_ORE: return 0x333333;
      case BLOCKS.IRON_ORE: return 0xd8af93;
      case BLOCKS.GOLD_ORE: return 0xfacc15;
      case BLOCKS.DIAMOND_ORE: return 0x22d3ee;
      case BLOCKS.SNOW: return 0xf8fafc;
      case BLOCKS.BRICKS: return 0xb91c1c;
      default: return 0xaaaaaa;
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        particles.splice(i, 1);
        continue;
      }
      p.vel.y -= 14.0 * dt; // Gravity
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.x += 4 * dt;
      p.mesh.rotation.y += 4 * dt;
      const scale = p.life / p.maxLife;
      p.mesh.scale.set(scale, scale, scale);
    }
  }

  // =========================================================================
  // Procedural Web Audio API Sound Synthesizer (Zero Assets Required)
  // =========================================================================
  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
  }

  function playSynthesizedSound(type) {
    if (settings.soundMuted || !audioCtx || audioCtx.state === 'suspended') return;

    try {
      const now = audioCtx.currentTime;
      const vol = settings.soundVolume;

      if (type === 'break') {
        // Filtered noise burst + pitch drop
        const bufferSize = audioCtx.sampleRate * 0.12;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(150, now + 0.12);

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(vol * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        noise.start(now);

      } else if (type === 'place') {
        // Resonant wood/stone pop
        const osc = audioCtx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(vol * 0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.08);

      } else if (type === 'jump') {
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(360, now + 0.12);

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(vol * 0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.12);

      } else if (type === 'hurt') {
        const osc = audioCtx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(vol * 0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      }
    } catch (e) {
      // Audio fallback silent
    }
  }

  // =========================================================================
  // Dynamic Sky, Lighting & Day/Night Cycle
  // =========================================================================
  function updateDayNightCycle(dt) {
    if (settings.dayCycleSpeed > 0) {
      const cycleDuration = 240 / settings.dayCycleSpeed; // 240s = 4 min normal
      dayTime = (dayTime + (dt / cycleDuration)) % 1.0;
    }

    // Sun & Moon orbital position
    const sunAngle = dayTime * Math.PI * 2 - Math.PI / 2;
    const sunDist = 80;
    const sunX = Math.cos(sunAngle) * sunDist;
    const sunY = Math.sin(sunAngle) * sunDist;

    sunLight.position.set(player.x + sunX, sunY, player.z + 20);
    moonLight.position.set(player.x - sunX, -sunY, player.z - 20);

    // Sky Color Interpolation
    let skyColor, fogColor;
    const hudTime = document.getElementById('hudTimeBadge');

    if (dayTime >= 0.2 && dayTime <= 0.3) {
      // Noon (Bright Blue)
      skyColor = new THREE.Color(0x78a7ff);
      fogColor = new THREE.Color(0x94b9ff);
      sunLight.intensity = 1.0;
      ambientLight.intensity = 0.55;
      if (hudTime) hudTime.textContent = 'Day';
    } else if ((dayTime >= 0.45 && dayTime <= 0.55) || (dayTime >= 0.95 || dayTime <= 0.05)) {
      // Sunset / Sunrise (Warm Golden/Pink)
      skyColor = new THREE.Color(0xe07a5f);
      fogColor = new THREE.Color(0xf4a261);
      sunLight.intensity = 0.6;
      ambientLight.intensity = 0.4;
      if (hudTime) hudTime.textContent = (dayTime < 0.2) ? 'Dawn' : 'Sunset';
    } else {
      // Night (Deep Navy / Stars)
      skyColor = new THREE.Color(0x0a0c16);
      fogColor = new THREE.Color(0x070910);
      sunLight.intensity = 0.05;
      ambientLight.intensity = 0.22;
      if (hudTime) hudTime.textContent = 'Night';
    }

    renderer.setClearColor(skyColor);
    if (scene.fog && settings.fogEnabled) {
      scene.fog.color = fogColor;
    }
  }

  // =========================================================================
  // Chunk Management (Dynamic Streaming Around Player)
  // =========================================================================
  function updateLoadedChunks() {
    const playerChunkX = Math.floor(player.x / CHUNK_SIZE);
    const playerChunkZ = Math.floor(player.z / CHUNK_SIZE);
    const r = settings.renderDistance;

    const neededKeys = new Set();

    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        const cx = playerChunkX + dx;
        const cz = playerChunkZ + dz;
        const key = `${cx},${cz}`;
        neededKeys.add(key);

        if (!chunks.has(key)) {
          const chunk = new Chunk(cx, cz);
          chunks.set(key, chunk);
          meshChunk(chunk);
        }
      }
    }

    // Unload distant chunks
    for (const [key, chunk] of chunks.entries()) {
      if (!neededKeys.has(key)) {
        if (chunk.mesh) {
          scene.remove(chunk.mesh);
          chunk.mesh.geometry.dispose();
        }
        chunks.delete(key);
      }
    }

    // Update debug chunk count
    const debugCount = document.getElementById('debugChunkCount');
    if (debugCount) debugCount.textContent = chunks.size;
  }

  // =========================================================================
  // UI & HUD Rendering
  // =========================================================================
  function renderHotbarUI() {
    const hotbarEl = document.getElementById('hotbar');
    if (!hotbarEl) return;
    hotbarEl.innerHTML = '';

    for (let i = 0; i < 9; i++) {
      const slot = document.createElement('div');
      slot.className = `hotbar-slot ${i === player.activeSlot ? 'active' : ''}`;
      slot.setAttribute('data-slot-idx', i);

      const num = document.createElement('span');
      num.className = 'hotbar-slot-num';
      num.textContent = (i + 1);
      slot.appendChild(num);

      const blockId = player.hotbar[i];
      if (blockId && blockIcons[blockId]) {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(blockIcons[blockId], 0, 0);
        slot.appendChild(canvas);
      }

      slot.addEventListener('click', () => {
        selectHotbarSlot(i);
      });

      hotbarEl.appendChild(slot);
    }

    updateHotbarLabel();
  }

  function selectHotbarSlot(idx) {
    player.activeSlot = (idx + 9) % 9;
    document.querySelectorAll('.hotbar-slot').forEach((slot, i) => {
      if (i === player.activeSlot) slot.classList.add('active');
      else slot.classList.remove('active');
    });
    updateHotbarLabel();
  }

  function updateHotbarLabel() {
    const label = document.getElementById('hotbarItemName');
    if (!label) return;
    const bId = player.hotbar[player.activeSlot];
    label.textContent = BLOCK_NAMES[bId] || 'Empty';
  }

  function renderSurvivalMeters() {
    const healthBar = document.getElementById('healthBar');
    const hungerBar = document.getElementById('hungerBar');
    if (!healthBar || !hungerBar) return;

    // 10 Hearts (20 Health)
    healthBar.innerHTML = '';
    const fullHearts = Math.floor(player.health / 2);
    for (let i = 0; i < 10; i++) {
      const isFull = i < fullHearts;
      healthBar.innerHTML += `
        <span class="meter-icon ${isFull ? '' : 'empty'}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </span>
      `;
    }

    // 10 Drumsticks (20 Hunger)
    hungerBar.innerHTML = '';
    const fullHunger = Math.floor(player.hunger / 2);
    for (let i = 0; i < 10; i++) {
      const isFull = i < fullHunger;
      hungerBar.innerHTML += `
        <span class="meter-icon ${isFull ? '' : 'empty'}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="8"/>
          </svg>
        </span>
      `;
    }
  }

  function renderInventoryGrid() {
    const grid = document.getElementById('inventoryGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const allBlocks = [
      BLOCKS.GRASS, BLOCKS.DIRT, BLOCKS.STONE, BLOCKS.COBBLESTONE,
      BLOCKS.WOOD, BLOCKS.PLANKS, BLOCKS.LEAVES, BLOCKS.SAND,
      BLOCKS.GLASS, BLOCKS.WATER, BLOCKS.COAL_ORE, BLOCKS.IRON_ORE,
      BLOCKS.GOLD_ORE, BLOCKS.DIAMOND_ORE, BLOCKS.SNOW, BLOCKS.BRICKS,
      BLOCKS.BOOKSHELF, BLOCKS.TNT, BLOCKS.BEDROCK
    ];

    allBlocks.forEach(bId => {
      const item = document.createElement('div');
      item.className = 'inventory-item';
      item.title = BLOCK_NAMES[bId];

      if (blockIcons[bId]) {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(blockIcons[bId], 0, 0);
        item.appendChild(canvas);
      }

      const name = document.createElement('span');
      name.className = 'inventory-item-name';
      name.textContent = BLOCK_NAMES[bId];
      item.appendChild(name);

      item.addEventListener('click', () => {
        player.hotbar[player.activeSlot] = bId;
        renderHotbarUI();
        showToast(`Assigned ${BLOCK_NAMES[bId]} to slot ${player.activeSlot + 1}`);
      });

      grid.appendChild(item);
    });
  }

  function showToast(msg) {
    const toast = document.getElementById('gameToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }

  // =========================================================================
  // Game Setup & Initialization
  // =========================================================================
  function initGame() {
    // 1. Setup Three.js Scene, Camera, Renderer
    const container = document.getElementById('gameContainer');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x78a7ff);

    if (settings.fogEnabled) {
      scene.fog = new THREE.Fog(0x94b9ff, 25, settings.renderDistance * CHUNK_SIZE * 0.95);
    }

    camera = new THREE.PerspectiveCamera(settings.fov, window.innerWidth / window.innerHeight, 0.1, 500);
    camera.rotation.order = 'YXZ';

    renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);

    // 2. Setup Lighting
    ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);

    sunLight = new THREE.DirectionalLight(0xfff4e0, 0.95);
    sunLight.position.set(40, 80, 20);
    scene.add(sunLight);

    moonLight = new THREE.DirectionalLight(0x8aa8ff, 0.15);
    moonLight.position.set(-40, -80, -20);
    scene.add(moonLight);

    // 3. Setup Target Box Outline
    const wireGeom = new THREE.BoxGeometry(1.002, 1.002, 1.002);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      wireframe: true,
      wireframeLinewidth: 2.0
    });
    wireframeTargetBox = new THREE.Mesh(wireGeom, wireMat);
    wireframeTargetBox.visible = false;
    scene.add(wireframeTargetBox);

    // 4. Generate Procedural Textures & Materials
    generateAllTextures();

    // 5. Initial Chunk Generation around Spawn
    updateLoadedChunks();

    // 6. UI Bindings
    renderHotbarUI();
    renderSurvivalMeters();
    renderInventoryGrid();
    setupEventListeners();

    // 7. Start Game Animation Loop
    lastFrameTime = performance.now();
    requestAnimationFrame(gameLoop);
  }

  // =========================================================================
  // Main Animation / Game Loop
  // =========================================================================
  let frameCount = 0;
  let fpsTimer = performance.now();

  function gameLoop(currentTime) {
    requestAnimationFrame(gameLoop);

    const dt = Math.min((currentTime - lastFrameTime) / 1000, 0.1);
    lastFrameTime = currentTime;

    // FPS Counter
    frameCount++;
    if (currentTime - fpsTimer >= 1000) {
      const fpsEl = document.getElementById('debugFPS');
      if (fpsEl) fpsEl.textContent = frameCount;
      frameCount = 0;
      fpsTimer = currentTime;
    }

    if (!isPaused) {
      // 1. Update Physics & Player Position
      updatePhysics(dt);

      // 2. Sync Three.js Camera to Player
      camera.position.set(player.x, player.y + player.eyeHeight, player.z);
      camera.rotation.y = player.yaw;
      camera.rotation.x = player.pitch;

      // 3. Update Day/Night Cycle
      updateDayNightCycle(dt);

      // 4. Update Particle Explosions
      updateParticles(dt);

      // 5. Target Block Raycasting & Outline Box
      const target = raycastBlock();
      if (target) {
        wireframeTargetBox.visible = true;
        wireframeTargetBox.position.set(target.x + 0.5, target.y + 0.5, target.z + 0.5);
        const dbgTarget = document.getElementById('debugTarget');
        if (dbgTarget) dbgTarget.textContent = `${BLOCK_NAMES[target.block]} at (${target.x}, ${target.y}, ${target.z})`;
      } else {
        wireframeTargetBox.visible = false;
        const dbgTarget = document.getElementById('debugTarget');
        if (dbgTarget) dbgTarget.textContent = 'Air';
      }

      // 6. Dynamic Chunk Streaming (load/unload)
      updateLoadedChunks();

      // 7. Update Debug Info
      updateDebugOverlay();
    }

    // Render 3D Scene
    renderer.render(scene, camera);
  }

  function updateDebugOverlay() {
    const overlay = document.getElementById('debugOverlay');
    if (!overlay || overlay.style.display === 'none') return;

    document.getElementById('debugXYZ').textContent = `X: ${player.x.toFixed(1)} Y: ${player.y.toFixed(1)} Z: ${player.z.toFixed(1)}`;
    const cx = Math.floor(player.x / CHUNK_SIZE);
    const cz = Math.floor(player.z / CHUNK_SIZE);
    document.getElementById('debugChunk').textContent = `${cx}, ${cz}`;
    document.getElementById('debugBiome').textContent = getBiome(Math.floor(player.x), Math.floor(player.z));
    document.getElementById('debugFlight').textContent = player.isFlying ? 'Active' : 'Off';
  }

  // =========================================================================
  // Input Handling & Event Listeners
  // =========================================================================
  function setupEventListeners() {
    // Window Resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Keyboard Input
    window.addEventListener('keydown', e => {
      keys[e.code] = true;

      // Hotbar Slot Numbers 1-9
      if (e.code >= 'Digit1' && e.code <= 'Digit9') {
        const idx = parseInt(e.code.replace('Digit', '')) - 1;
        selectHotbarSlot(idx);
      }

      // Inventory Toggle [E]
      if (e.code === 'KeyE') {
        toggleInventory();
      }

      // Creative Flight Toggle [F]
      if (e.code === 'KeyF') {
        if (settings.gameMode === 'creative') {
          player.isFlying = !player.isFlying;
          showToast(player.isFlying ? 'Flight Enabled' : 'Flight Disabled');
        }
      }

      // Debug Overlay Toggle [F3]
      if (e.code === 'F3') {
        e.preventDefault();
        const dbg = document.getElementById('debugOverlay');
        if (dbg) dbg.style.display = (dbg.style.display === 'none' ? 'block' : 'none');
      }

      // Pause Game [Esc]
      if (e.code === 'Escape') {
        if (isInventoryOpen) {
          closeInventory();
        } else if (!isPaused) {
          pauseGame();
        }
      }
    });

    window.addEventListener('keyup', e => {
      keys[e.code] = false;
    });

    // Mouse Pointer Lock & Mouse Look
    document.addEventListener('pointerlockchange', () => {
      isPointerLocked = (document.pointerLockElement === document.body);
      if (!isPointerLocked && !isInventoryOpen) {
        pauseGame();
      }
    });

    window.addEventListener('mousemove', e => {
      if (!isPointerLocked) return;
      player.yaw -= e.movementX * settings.mouseSensitivity;
      player.pitch -= e.movementY * settings.mouseSensitivity;
      // Clamp pitch (-89 to +89 degrees)
      player.pitch = Math.max(-Math.PI / 2 + 0.02, Math.min(Math.PI / 2 - 0.02, player.pitch));
    });

    // Mouse Clicks for Mining & Placing
    window.addEventListener('mousedown', e => {
      initAudio();
      if (!isPointerLocked) return;

      if (e.button === 0) {
        // Left Click: Mine / Break Block
        breakTargetedBlock();
      } else if (e.button === 2) {
        // Right Click: Place Block
        e.preventDefault();
        placeSelectedBlock();
      }
    });

    // Prevent context menu on right click in game
    window.addEventListener('contextmenu', e => {
      if (isPointerLocked) e.preventDefault();
    });

    // Mouse Scroll Wheel to cycle hotbar
    window.addEventListener('wheel', e => {
      if (!isPointerLocked) return;
      if (e.deltaY > 0) {
        selectHotbarSlot((player.activeSlot + 1) % 9);
      } else {
        selectHotbarSlot((player.activeSlot + 8) % 9);
      }
    });

    // Main Menu Buttons
    document.getElementById('btnPlayGame').addEventListener('click', () => {
      initAudio();
      startGame();
    });

    document.getElementById('btnSelectMode').addEventListener('click', () => {
      settings.gameMode = (settings.gameMode === 'creative' ? 'survival' : 'creative');
      const text = document.getElementById('selectedModeText');
      if (text) text.textContent = settings.gameMode.toUpperCase();
      syncGameModeUI();
    });

    document.getElementById('btnOpenControls').addEventListener('click', () => {
      document.getElementById('controlsModal').style.display = 'flex';
    });

    document.getElementById('btnCloseControls').addEventListener('click', () => {
      document.getElementById('controlsModal').style.display = 'none';
    });

    document.getElementById('btnDoneControls').addEventListener('click', () => {
      document.getElementById('controlsModal').style.display = 'none';
    });

    document.getElementById('btnOpenSettings').addEventListener('click', () => {
      document.getElementById('settingsModal').style.display = 'flex';
    });

    document.getElementById('btnPauseSettings').addEventListener('click', () => {
      document.getElementById('settingsModal').style.display = 'flex';
    });

    document.getElementById('btnCloseSettings').addEventListener('click', () => {
      document.getElementById('settingsModal').style.display = 'none';
    });

    document.getElementById('btnSaveSettings').addEventListener('click', () => {
      document.getElementById('settingsModal').style.display = 'none';
    });

    // Pause Menu Buttons
    document.getElementById('btnResumeGame').addEventListener('click', () => {
      resumeGame();
    });

    document.getElementById('btnSaveWorld').addEventListener('click', () => {
      saveWorldToStorage();
      showToast('World saved successfully!');
    });

    document.getElementById('btnPauseToggleMode').addEventListener('click', () => {
      settings.gameMode = (settings.gameMode === 'creative' ? 'survival' : 'creative');
      syncGameModeUI();
      showToast(`Switched to ${settings.gameMode.toUpperCase()} mode`);
    });

    document.getElementById('btnQuitToMenu').addEventListener('click', () => {
      document.getElementById('pauseMenu').style.display = 'none';
      document.getElementById('mainMenu').style.display = 'flex';
      document.getElementById('gameHUD').style.display = 'none';
      isPaused = true;
      if (document.exitPointerLock) document.exitPointerLock();
    });

    // Inventory Modal Buttons
    document.getElementById('btnCloseInventory').addEventListener('click', closeInventory);
    document.getElementById('btnDoneInventory').addEventListener('click', closeInventory);
    document.getElementById('btnClearWorldEdits').addEventListener('click', () => {
      if (confirm('Reset all block modifications made in this world?')) {
        worldModifications.clear();
        chunks.forEach(chunk => {
          chunk.generateTerrain();
          meshChunk(chunk);
        });
        showToast('World reset to natural terrain');
      }
    });

    // HUD Action Buttons
    document.getElementById('hudSoundBtn').addEventListener('click', toggleSound);
    document.getElementById('hudFullscreenBtn').addEventListener('click', toggleFullscreen);

    // Settings Sliders Listeners
    setupSettingsSliders();
  }

  function setupSettingsSliders() {
    const sRender = document.getElementById('sliderRenderDistance');
    const sSens = document.getElementById('sliderSensitivity');
    const sFov = document.getElementById('sliderFOV');
    const sVol = document.getElementById('sliderSoundVolume');
    const sDay = document.getElementById('sliderDayCycle');
    const cFog = document.getElementById('checkAtmosphericFog');
    const cAO = document.getElementById('checkSmoothLighting');

    if (sRender) {
      sRender.addEventListener('input', e => {
        settings.renderDistance = parseInt(e.target.value);
        document.getElementById('valRenderDistance').textContent = `${settings.renderDistance} Chunks`;
        if (scene.fog) {
          scene.fog.far = settings.renderDistance * CHUNK_SIZE * 0.95;
        }
      });
    }

    if (sSens) {
      sSens.addEventListener('input', e => {
        settings.mouseSensitivity = parseInt(e.target.value) / 10000;
        document.getElementById('valSensitivity').textContent = `Normal (${settings.mouseSensitivity})`;
      });
    }

    if (sFov) {
      sFov.addEventListener('input', e => {
        settings.fov = parseInt(e.target.value);
        document.getElementById('valFOV').textContent = `${settings.fov} deg`;
        camera.fov = settings.fov;
        camera.updateProjectionMatrix();
      });
    }

    if (sVol) {
      sVol.addEventListener('input', e => {
        settings.soundVolume = parseInt(e.target.value) / 100;
        document.getElementById('valSoundVolume').textContent = `${e.target.value}%`;
      });
    }

    if (sDay) {
      sDay.addEventListener('input', e => {
        settings.dayCycleSpeed = parseInt(e.target.value);
        const labels = ['Off', 'Normal (4 min)', 'Fast (2 min)', 'Ultra (30s)'];
        document.getElementById('valDayCycle').textContent = labels[settings.dayCycleSpeed] || 'Normal';
      });
    }

    if (cFog) {
      cFog.addEventListener('change', e => {
        settings.fogEnabled = e.target.checked;
        if (scene.fog) {
          scene.fog.near = settings.fogEnabled ? 25 : 9999;
        }
      });
    }

    if (cAO) {
      cAO.addEventListener('change', e => {
        settings.smoothLighting = e.target.checked;
        chunks.forEach(c => meshChunk(c));
      });
    }
  }

  // =========================================================================
  // Game State Helpers (Start, Pause, Resume, Inventory)
  // =========================================================================
  function startGame() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('pauseMenu').style.display = 'none';
    document.getElementById('gameHUD').style.display = 'flex';
    isPaused = false;
    syncGameModeUI();
    document.body.requestPointerLock();
  }

  function pauseGame() {
    isPaused = true;
    document.getElementById('pauseMenu').style.display = 'flex';
    if (document.exitPointerLock) document.exitPointerLock();
  }

  function resumeGame() {
    document.getElementById('pauseMenu').style.display = 'none';
    isPaused = false;
    document.body.requestPointerLock();
  }

  function toggleInventory() {
    if (isInventoryOpen) {
      closeInventory();
    } else {
      openInventory();
    }
  }

  function openInventory() {
    isInventoryOpen = true;
    isPaused = true;
    document.getElementById('inventoryModal').style.display = 'flex';
    if (document.exitPointerLock) document.exitPointerLock();
  }

  function closeInventory() {
    isInventoryOpen = false;
    document.getElementById('inventoryModal').style.display = 'none';
    if (!isPaused) {
      document.body.requestPointerLock();
    }
  }

  function syncGameModeUI() {
    const badge = document.getElementById('hudModeBadge');
    const survivalHUD = document.getElementById('survivalHUD');
    const pauseNext = document.getElementById('pauseNextModeText');

    if (settings.gameMode === 'survival') {
      if (badge) badge.textContent = 'Survival';
      if (survivalHUD) survivalHUD.style.display = 'flex';
      if (pauseNext) pauseNext.textContent = 'Creative';
      player.isFlying = false;
    } else {
      if (badge) badge.textContent = 'Creative';
      if (survivalHUD) survivalHUD.style.display = 'none';
      if (pauseNext) pauseNext.textContent = 'Survival';
    }
  }

  function toggleSound() {
    settings.soundMuted = !settings.soundMuted;
    document.getElementById('soundIconOn').style.display = settings.soundMuted ? 'none' : 'block';
    document.getElementById('soundIconOff').style.display = settings.soundMuted ? 'block' : 'none';
    showToast(settings.soundMuted ? 'Sound Muted' : 'Sound Enabled');
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  }

  // =========================================================================
  // World Persistence (LocalStorage / Save)
  // =========================================================================
  const SAVE_STORAGE_KEY = 'square_era_world_v1';

  function saveWorldToStorage() {
    try {
      const data = {
        playerPos: { x: player.x, y: player.y, z: player.z, yaw: player.yaw, pitch: player.pitch },
        hotbar: player.hotbar,
        gameMode: settings.gameMode,
        edits: Array.from(worldModifications.entries())
      };
      localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save world:', e);
    }
  }

  function loadWorldFromStorage() {
    try {
      const saved = localStorage.getItem(SAVE_STORAGE_KEY);
      if (!saved) return;
      const data = JSON.parse(saved);
      if (data.playerPos) {
        player.x = data.playerPos.x;
        player.y = data.playerPos.y;
        player.z = data.playerPos.z;
        player.yaw = data.playerPos.yaw || 0;
        player.pitch = data.playerPos.pitch || 0;
      }
      if (data.hotbar) player.hotbar = data.hotbar;
      if (data.gameMode) settings.gameMode = data.gameMode;
      if (data.edits) {
        data.edits.forEach(([key, bId]) => {
          worldModifications.set(key, bId);
        });
      }
    } catch (e) {
      console.warn('Failed to load world:', e);
    }
  }

  // =========================================================================
  // Initialize on Window Load
  // =========================================================================
  window.addEventListener('DOMContentLoaded', () => {
    loadWorldFromStorage();
    initGame();
  });

})();
