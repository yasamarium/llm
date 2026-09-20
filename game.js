/**
 * Square Era - 3D Voxel Sandbox Game Engine
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
  let sunMesh, moonMesh, starField, skyDome;
  let handGroup, handArmMesh, handItemMesh;
  let wireframeTargetBox;
  let chunks = new Map(); // "cx,cz" => Chunk
  let particles = [];
  let isPointerLocked = false;
  let lastFrameTime = performance.now();
  let lastSpacePressTime = 0;
  let dayTime = 0.25; // 0: dawn, 0.25: noon, 0.5: sunset, 0.75: midnight
  let isPaused = true;
  let isInventoryOpen = false;

  // Viewmodel & camera animation timers
  let walkDistance = 0;
  let armSwingProgress = 0;
  let bobTimer = 0;
  let cameraStepOffset = 0;

  // Chunk streaming throttling
  let chunkCheckTimer = 0;
  let lastPlayerChunkX = 999999;
  let lastPlayerChunkZ = 999999;

  // Key States
  const keys = {};

  // Audio Context (Procedural Synthesizer)
  let audioCtx = null;

  // Texture Atlas & Material Cache
  const blockMaterials = {};
  const blockIcons = {};

  // =========================================================================
  // Safe Mesh Disposal Helper (Prevents Browser Crash on Group Dispose)
  // =========================================================================
  function disposeChunkMesh(group) {
    if (!group) return;
    scene.remove(group);
    group.traverse(child => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
      }
    });
  }

  // =========================================================================
  // Procedural 32x32 High-Fidelity Pixel Texture Generator
  // =========================================================================
  function createPixelCanvas(drawFn) {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
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

    // Helper to draw beveled pixel borders
    function drawPixelBevel(ctx, lightColor, darkColor) {
      ctx.fillStyle = lightColor;
      ctx.fillRect(0, 0, 32, 1);
      ctx.fillRect(0, 0, 1, 32);
      ctx.fillStyle = darkColor;
      ctx.fillRect(0, 31, 32, 1);
      ctx.fillRect(31, 0, 1, 32);
    }

    // 1. Dirt Texture (32x32 rich earthy loam)
    texCanvases.dirt = createPixelCanvas(ctx => {
      ctx.fillStyle = '#866043';
      ctx.fillRect(0, 0, 32, 32);
      for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 32; y++) {
          const r = seededNoise(x, y, 1);
          if (r > 0.72) {
            ctx.fillStyle = '#6d4c33';
            ctx.fillRect(x, y, 1, 1);
          } else if (r < 0.22) {
            ctx.fillStyle = '#9b7252';
            ctx.fillRect(x, y, 1, 1);
          } else if (r > 0.94) {
            ctx.fillStyle = '#553a25';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });

    // 2. Grass Top (32x32 lush grass carpet)
    texCanvases.grass_top = createPixelCanvas(ctx => {
      ctx.fillStyle = '#4c9b38';
      ctx.fillRect(0, 0, 32, 32);
      for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 32; y++) {
          const r = seededNoise(x, y, 2);
          if (r > 0.68) {
            ctx.fillStyle = '#3d822b';
            ctx.fillRect(x, y, 1, 1);
          } else if (r < 0.22) {
            ctx.fillStyle = '#5fb346';
            ctx.fillRect(x, y, 1, 1);
          } else if (r > 0.92) {
            ctx.fillStyle = '#326c23';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });

    // 3. Grass Side (32x32 Dirt with natural dangling blades)
    texCanvases.grass_side = createPixelCanvas(ctx => {
      ctx.drawImage(texCanvases.dirt, 0, 0);
      ctx.fillStyle = '#4c9b38';
      for (let x = 0; x < 32; x++) {
        const hang = Math.floor(seededNoise(x, 0, 3) * 6) + 4;
        ctx.fillRect(x, 0, 1, hang);
        // Highlight blade tips
        if (seededNoise(x, 1, 3) > 0.5) {
          ctx.fillStyle = '#5fb346';
          ctx.fillRect(x, 0, 1, Math.max(1, hang - 2));
          ctx.fillStyle = '#4c9b38';
        }
        // Shadow underneath grass overhang
        ctx.fillStyle = 'rgba(40, 25, 15, 0.4)';
        ctx.fillRect(x, hang, 1, 1);
        ctx.fillStyle = '#4c9b38';
      }
    });

    // 4. Stone Texture (32x32 granite with fractures)
    texCanvases.stone = createPixelCanvas(ctx => {
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 32, 32);
      for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 32; y++) {
          const r = seededNoise(x, y, 4);
          if (r > 0.75) {
            ctx.fillStyle = '#686868';
            ctx.fillRect(x, y, 1, 1);
          } else if (r < 0.20) {
            ctx.fillStyle = '#9c9c9c';
            ctx.fillRect(x, y, 1, 1);
          } else if (r > 0.95) {
            ctx.fillStyle = '#505050';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });

    // 5. Cobblestone Texture (32x32 individual cobblestones with dark mortar)
    texCanvases.cobblestone = createPixelCanvas(ctx => {
      ctx.fillStyle = '#6b6b6b';
      ctx.fillRect(0, 0, 32, 32);
      for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 32; y++) {
          const isBorder = (x % 8 === 0) || (y % 8 === 0);
          const r = seededNoise(x, y, 5);
          if (isBorder) {
            ctx.fillStyle = '#3c3c3c';
          } else if (r > 0.65) {
            ctx.fillStyle = '#8a8a8a';
          } else if (r < 0.25) {
            ctx.fillStyle = '#525252';
          } else {
            ctx.fillStyle = '#737373';
          }
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 6. Sand Texture (32x32 golden dunes with subtle ripples)
    texCanvases.sand = createPixelCanvas(ctx => {
      ctx.fillStyle = '#d6c589';
      ctx.fillRect(0, 0, 32, 32);
      for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 32; y++) {
          const ripple = Math.sin((x + y * 0.5) * 0.4) * 0.1;
          const r = seededNoise(x, y, 6) + ripple;
          if (r > 0.75) {
            ctx.fillStyle = '#c7b270';
            ctx.fillRect(x, y, 1, 1);
          } else if (r < 0.22) {
            ctx.fillStyle = '#eadba7';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });

    // 7. Wood Log Side (32x32 vertical oak bark)
    texCanvases.wood_side = createPixelCanvas(ctx => {
      ctx.fillStyle = '#685032';
      ctx.fillRect(0, 0, 32, 32);
      for (let x = 0; x < 32; x++) {
        const lineVal = seededNoise(x, 0, 7);
        for (let y = 0; y < 32; y++) {
          const grain = seededNoise(x, y, 71);
          if (lineVal > 0.65) {
            ctx.fillStyle = (grain > 0.4) ? '#533e24' : '#45331d';
          } else if (lineVal < 0.25) {
            ctx.fillStyle = (grain > 0.4) ? '#7d613d' : '#685032';
          } else {
            ctx.fillStyle = (grain > 0.5) ? '#685032' : '#5c452a';
          }
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 8. Wood Log Top (32x32 concentric tree rings)
    texCanvases.wood_top = createPixelCanvas(ctx => {
      ctx.fillStyle = '#b08b59';
      ctx.fillRect(0, 0, 32, 32);
      ctx.strokeStyle = '#533e24';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(1, 1, 30, 30);
      ctx.strokeRect(4.5, 4.5, 23, 23);
      ctx.strokeRect(9.5, 9.5, 13, 13);
      ctx.fillStyle = '#533e24';
      ctx.fillRect(14, 14, 4, 4);
      // Subtle noise on rings
      for (let i = 0; i < 40; i++) {
        const rx = Math.floor(seededNoise(i, 1, 8) * 32);
        const ry = Math.floor(seededNoise(i, 2, 8) * 32);
        ctx.fillStyle = '#9e7b4e';
        ctx.fillRect(rx, ry, 1, 1);
      }
    });

    // 9. Wood Planks (32x32 horizontal planed timber with nail joints)
    texCanvases.planks = createPixelCanvas(ctx => {
      ctx.fillStyle = '#9c7a4a';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#543e20';
      // 4 horizontal plank seams
      ctx.fillRect(0, 7, 32, 1);
      ctx.fillRect(0, 15, 32, 1);
      ctx.fillRect(0, 23, 32, 1);
      ctx.fillRect(0, 31, 32, 1);
      // Vertical seams
      ctx.fillRect(14, 0, 1, 7);
      ctx.fillRect(22, 8, 1, 7);
      ctx.fillRect(8, 16, 1, 7);
      ctx.fillRect(26, 24, 1, 7);
      // Wood grain & nails
      for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 32; y++) {
          if (seededNoise(x, y, 9) > 0.8) {
            ctx.fillStyle = '#8b6b3e';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
      // Nail dots
      ctx.fillStyle = '#3a2b16';
      ctx.fillRect(13, 1, 1, 1);
      ctx.fillRect(15, 1, 1, 1);
      ctx.fillRect(21, 9, 1, 1);
      ctx.fillRect(7, 17, 1, 1);
    });

    // 10. Leaves (32x32 dense oak foliage with light highlights)
    texCanvases.leaves = createPixelCanvas(ctx => {
      ctx.fillStyle = '#387324';
      ctx.fillRect(0, 0, 32, 32);
      for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 32; y++) {
          const r = seededNoise(x, y, 10);
          if (r > 0.7) {
            ctx.fillStyle = '#2d5e1c';
            ctx.fillRect(x, y, 1, 1);
          } else if (r < 0.22) {
            ctx.fillStyle = '#4fa132';
            ctx.fillRect(x, y, 1, 1);
          } else if (r > 0.94) {
            ctx.fillStyle = '#1d3e12';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });

    // 11. Glass (32x32 transparent crystal with specular glare streaks)
    texCanvases.glass = createPixelCanvas(ctx => {
      ctx.clearRect(0, 0, 32, 32);
      ctx.fillStyle = 'rgba(230, 245, 255, 0.25)';
      ctx.fillRect(0, 0, 32, 32);
      // Frosted outer bevel border
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(0, 0, 32, 1);
      ctx.fillRect(0, 0, 1, 32);
      ctx.fillStyle = 'rgba(180, 215, 240, 0.7)';
      ctx.fillRect(0, 31, 32, 1);
      ctx.fillRect(31, 0, 1, 32);
      // Diagonal glare streaks
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      for (let i = 4; i < 14; i++) {
        ctx.fillRect(i, i + 2, 1, 1);
      }
      for (let i = 18; i < 26; i++) {
        ctx.fillRect(i, i + 1, 1, 1);
      }
    });

    // 12. Water (32x32 shimmering azure waves)
    texCanvases.water = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(46, 120, 220, 0.65)';
      ctx.fillRect(0, 0, 32, 32);
      // Surface ripples
      for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 32; y++) {
          const wave = Math.sin(x * 0.4 + y * 0.3);
          if (wave > 0.6) {
            ctx.fillStyle = 'rgba(80, 170, 255, 0.35)';
            ctx.fillRect(x, y, 1, 1);
          } else if (wave < -0.6) {
            ctx.fillStyle = 'rgba(25, 80, 180, 0.4)';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });

    // Helper to generate ore textures (base stone + ore veins)
    function createOreCanvas(accentColor, highlightColor, darkColor) {
      return createPixelCanvas(ctx => {
        ctx.drawImage(texCanvases.stone, 0, 0);
        // Ore clusters
        const seeds = [
          [8, 6], [9, 6], [8, 7], [9, 7], [10, 7],
          [20, 14], [21, 14], [20, 15], [21, 15], [22, 15],
          [7, 22], [8, 22], [7, 23], [8, 23],
          [22, 24], [23, 24], [22, 25]
        ];
        seeds.forEach(([ox, oy]) => {
          ctx.fillStyle = accentColor;
          ctx.fillRect(ox, oy, 2, 2);
          ctx.fillStyle = highlightColor;
          ctx.fillRect(ox, oy, 1, 1);
          if (darkColor) {
            ctx.fillStyle = darkColor;
            ctx.fillRect(ox + 1, oy + 1, 1, 1);
          }
        });
      });
    }

    texCanvases.coal_ore = createOreCanvas('#222222', '#444444', '#111111');
    texCanvases.iron_ore = createOreCanvas('#c49e7b', '#e2c5a7', '#8e6f51');
    texCanvases.gold_ore = createOreCanvas('#ffd700', '#fff3a8', '#c99f00');
    texCanvases.diamond_ore = createOreCanvas('#4eedd7', '#b5fff6', '#26a392');

    // 13. Bedrock (32x32 dark indestructible basalt)
    texCanvases.bedrock = createPixelCanvas(ctx => {
      ctx.fillStyle = '#222222';
      ctx.fillRect(0, 0, 32, 32);
      for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 32; y++) {
          const r = seededNoise(x, y, 15);
          if (r > 0.7) {
            ctx.fillStyle = '#111111';
            ctx.fillRect(x, y, 1, 1);
          } else if (r < 0.2) {
            ctx.fillStyle = '#3a3a3a';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });

    // 14. Snow Top (32x32 powdered snow)
    texCanvases.snow_top = createPixelCanvas(ctx => {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 32, 32);
      for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 32; y++) {
          const r = seededNoise(x, y, 16);
          if (r > 0.8) {
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(x, y, 1, 1);
          } else if (r < 0.15) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });

    // 15. Snow Side (Dirt with snow blanket overhang)
    texCanvases.snow_side = createPixelCanvas(ctx => {
      ctx.drawImage(texCanvases.dirt, 0, 0);
      ctx.fillStyle = '#f8fafc';
      for (let x = 0; x < 32; x++) {
        const hang = Math.floor(seededNoise(x, 0, 17) * 4) + 6;
        ctx.fillRect(x, 0, 1, hang);
      }
    });

    // 16. Bricks (32x32 terracotta mortar brick courses)
    texCanvases.bricks = createPixelCanvas(ctx => {
      ctx.fillStyle = '#b94a34';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#dcd5c9';
      // 4 horizontal mortar seams
      ctx.fillRect(0, 7, 32, 1);
      ctx.fillRect(0, 15, 32, 1);
      ctx.fillRect(0, 23, 32, 1);
      ctx.fillRect(0, 31, 32, 1);
      // Staggered vertical joints
      ctx.fillRect(8, 0, 1, 7);
      ctx.fillRect(24, 0, 1, 7);
      ctx.fillRect(0, 8, 1, 7);
      ctx.fillRect(16, 8, 1, 7);
      ctx.fillRect(8, 16, 1, 7);
      ctx.fillRect(24, 16, 1, 7);
      ctx.fillRect(0, 24, 1, 7);
      ctx.fillRect(16, 24, 1, 7);
    });

    // 17. Bookshelf (32x32 oak bookcase with multi-colored tome spines)
    texCanvases.bookshelf = createPixelCanvas(ctx => {
      ctx.drawImage(texCanvases.planks, 0, 0);
      // Top shelf opening
      ctx.fillStyle = '#2b1f14';
      ctx.fillRect(2, 2, 28, 11);
      ctx.fillRect(2, 17, 28, 11);
      // Draw colorful book spines
      const colors = ['#b91c1c', '#1d4ed8', '#047857', '#b45309', '#6d28d9', '#c026d3'];
      let bx = 3;
      while (bx < 28) {
        const c = colors[bx % colors.length];
        const w = (bx % 3 === 0) ? 3 : 2;
        ctx.fillStyle = c;
        ctx.fillRect(bx, 3, w, 10);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillRect(bx, 5, w, 1);
        bx += w + 1;
      }
      let bx2 = 3;
      while (bx2 < 28) {
        const c = colors[(bx2 + 3) % colors.length];
        const w = (bx2 % 2 === 0) ? 3 : 2;
        ctx.fillStyle = c;
        ctx.fillRect(bx2, 18, w, 10);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillRect(bx2, 20, w, 1);
        bx2 += w + 1;
      }
    });

    // 18. TNT (32x32 dynamite sticks with central label)
    texCanvases.tnt_side = createPixelCanvas(ctx => {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 11, 32, 10);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText('TNT', 8, 19);
      drawPixelBevel(ctx, 'rgba(255,255,255,0.4)', 'rgba(0,0,0,0.4)');
    });

    texCanvases.tnt_top = createPixelCanvas(ctx => {
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(12, 12, 8, 8);
      ctx.fillStyle = '#111111';
      ctx.fillRect(15, 15, 2, 2);
    });

    // Convert canvases to Three.js Textures
    const threeTextures = {};
    for (const key in texCanvases) {
      const tex = new THREE.CanvasTexture(texCanvases[key]);
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestMipmapNearestFilter;
      threeTextures[key] = tex;
    }

    // Material Helper
    function makeMat(texture, isTransp = false, opacity = 1.0, isWater = false) {
      return new THREE.MeshLambertMaterial({
        map: texture,
        transparent: isTransp,
        opacity: opacity,
        vertexColors: true,
        side: isTransp ? THREE.DoubleSide : THREE.FrontSide,
        depthWrite: !isWater // Critical: water allows seeing underlying seabed
      });
    }

    // Multi-face Material Array: [+X, -X, +Y (Top), -Y (Bottom), +Z, -Z]
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
      makeMat(threeTextures.glass, true, 0.75),
      makeMat(threeTextures.glass, true, 0.75),
      makeMat(threeTextures.glass, true, 0.75),
      makeMat(threeTextures.glass, true, 0.75),
      makeMat(threeTextures.glass, true, 0.75),
      makeMat(threeTextures.glass, true, 0.75)
    ];
    blockMaterials[BLOCKS.WATER] = [
      makeMat(threeTextures.water, true, 0.65, true),
      makeMat(threeTextures.water, true, 0.65, true),
      makeMat(threeTextures.water, true, 0.65, true),
      makeMat(threeTextures.water, true, 0.65, true),
      makeMat(threeTextures.water, true, 0.65, true),
      makeMat(threeTextures.water, true, 0.65, true)
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
  // Procedural 2D/3D Simplex World Generator
  // =========================================================================
  const SimplexNoise = (function () {
    const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
    const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = Math.floor(seededNoise(i, 0, 99) * 256);
    const perm = new Uint8Array(512);
    const gradP = new Array(512);
    const grad3 = [
      [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
      [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
      [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
    ];
    for (let i = 0; i < 512; i++) {
      perm[i] = p[i & 255];
      gradP[i] = grad3[perm[i] % 12];
    }

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
      const gi0 = gradP[ii + perm[jj]];
      const gi1 = gradP[ii + i1 + perm[jj + j1]];
      const gi2 = gradP[ii + 1 + perm[jj + 1]];
      let t0 = 0.5 - x0 * x0 - y0 * y0;
      if (t0 < 0) n0 = 0.0; else { t0 *= t0; n0 = t0 * t0 * (gi0[0] * x0 + gi0[1] * y0); }
      let t1 = 0.5 - x1 * x1 - y1 * y1;
      if (t1 < 0) n1 = 0.0; else { t1 *= t1; n1 = t1 * t1 * (gi1[0] * x1 + gi1[1] * y1); }
      let t2 = 0.5 - x2 * x2 - y2 * y2;
      if (t2 < 0) n2 = 0.0; else { t2 *= t2; n2 = t2 * t2 * (gi2[0] * x2 + gi2[1] * y2); }
      return 70.0 * (n0 + n1 + n2);
    }
    return { noise2D };
  })();

  function getTerrainHeight(wx, wz) {
    const scale1 = 0.015;
    const scale2 = 0.04;
    const scale3 = 0.08;
    const n1 = SimplexNoise.noise2D(wx * scale1, wz * scale1);
    const n2 = SimplexNoise.noise2D(wx * scale2, wz * scale2) * 0.5;
    const n3 = SimplexNoise.noise2D(wx * scale3, wz * scale3) * 0.25;
    const combined = (n1 + n2 + n3) / 1.75; // -1 to +1

    // Biome height base
    const biomeVal = SimplexNoise.noise2D(wx * 0.005, wz * 0.005);
    let base = 26;
    let amp = 10;
    if (biomeVal > 0.3) {
      // Mountains
      base = 32; amp = 14;
    } else if (biomeVal < -0.3) {
      // Ocean / Lake
      base = 16; amp = 6;
    }
    return Math.floor(base + combined * amp);
  }

  function getBiome(wx, wz) {
    const val = SimplexNoise.noise2D(wx * 0.005, wz * 0.005);
    if (val > 0.35) return 'Mountains';
    if (val > 0.05) return 'Forest';
    if (val > -0.2) return 'Plains';
    if (val > -0.45) return 'Desert';
    return 'Ocean';
  }

  // =========================================================================
  // Chunk Data Structure
  // =========================================================================
  class Chunk {
    constructor(cx, cz) {
      this.cx = cx;
      this.cz = cz;
      this.blocks = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
      this.mesh = null;
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
    }

    generateTerrain() {
      const originX = this.cx * CHUNK_SIZE;
      const originZ = this.cz * CHUNK_SIZE;

      for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
          const wx = originX + x;
          const wz = originZ + z;
          const height = Math.min(CHUNK_HEIGHT - 2, Math.max(2, getTerrainHeight(wx, wz)));
          const biome = getBiome(wx, wz);

          // Bedrock bottom layer
          this.setBlock(x, 0, z, BLOCKS.BEDROCK);

          for (let y = 1; y < CHUNK_HEIGHT; y++) {
            if (y < height - 4) {
              // Stone layer with procedural ores
              let b = BLOCKS.STONE;
              const oreRand = seededNoise(wx, y + wz * 48, 100);
              if (oreRand > 0.985 && y < 14) b = BLOCKS.DIAMOND_ORE;
              else if (oreRand > 0.97 && y < 22) b = BLOCKS.GOLD_ORE;
              else if (oreRand > 0.94 && y < 35) b = BLOCKS.IRON_ORE;
              else if (oreRand > 0.90) b = BLOCKS.COAL_ORE;
              this.setBlock(x, y, z, b);
            } else if (y < height) {
              // Sub-surface layer
              if (biome === 'Desert') {
                this.setBlock(x, y, z, BLOCKS.SAND);
              } else {
                this.setBlock(x, y, z, BLOCKS.DIRT);
              }
            } else if (y === height) {
              // Top surface layer
              if (biome === 'Desert') {
                this.setBlock(x, y, z, BLOCKS.SAND);
              } else if (biome === 'Mountains' && height > 38) {
                this.setBlock(x, y, z, BLOCKS.SNOW);
              } else if (height <= WATER_LEVEL + 1) {
                this.setBlock(x, y, z, BLOCKS.SAND);
              } else {
                this.setBlock(x, y, z, BLOCKS.GRASS);
              }
            } else if (y <= WATER_LEVEL) {
              // Water bodies
              this.setBlock(x, y, z, BLOCKS.WATER);
            } else {
              this.setBlock(x, y, z, BLOCKS.AIR);
            }
          }

          // Procedural Trees (Plains & Forest biomes)
          if ((biome === 'Forest' || biome === 'Plains') && height > WATER_LEVEL + 1 && height < CHUNK_HEIGHT - 8) {
            const treeChance = (biome === 'Forest') ? 0.045 : 0.012;
            if (seededNoise(wx, wz, 555) < treeChance && x >= 2 && x <= CHUNK_SIZE - 3 && z >= 2 && z <= CHUNK_SIZE - 3) {
              this.growTree(x, height + 1, z);
            }
          }
        }
      }

      // Re-apply saved user modifications for this chunk
      worldModifications.forEach((blockId, key) => {
        const [gx, gy, gz] = key.split(',').map(Number);
        const lcx = Math.floor(gx / CHUNK_SIZE);
        const lcz = Math.floor(gz / CHUNK_SIZE);
        if (lcx === this.cx && lcz === this.cz) {
          const lx = ((gx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
          const lz = ((gz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
          this.setBlock(lx, gy, lz, blockId);
        }
      });
    }

    growTree(tx, ty, tz) {
      const trunkHeight = 4 + Math.floor(seededNoise(tx, tz, 77) * 2);
      // Oak Log Trunk
      for (let y = 0; y < trunkHeight; y++) {
        this.setBlock(tx, ty + y, tz, BLOCKS.WOOD);
      }
      // Canopy Leaves
      const leafBase = ty + trunkHeight - 2;
      for (let ly = leafBase; ly <= leafBase + 3; ly++) {
        const radius = (ly >= leafBase + 2) ? 1 : 2;
        for (let lx = tx - radius; lx <= tx + radius; lx++) {
          for (let lz = tz - radius; lz <= tz + radius; lz++) {
            if (lx === tx && lz === tz && ly < ty + trunkHeight) continue;
            if (this.getBlock(lx, ly, lz) === BLOCKS.AIR) {
              this.setBlock(lx, ly, lz, BLOCKS.LEAVES);
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

    // Re-mesh current chunk safely
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
  // Chunk Mesher with Multi-Material Groups & 4-Stage Vertex Ambient Occlusion
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
    if (side1 && side2) return 0.52;
    const count = (side1 ? 1 : 0) + (side2 ? 1 : 0) + (corner ? 1 : 0);
    if (count === 3) return 0.58;
    if (count === 2) return 0.72;
    if (count === 1) return 0.86;
    return 1.0;
  }

  function meshChunk(chunk) {
    // Safely dispose old mesh group
    if (chunk.mesh) {
      disposeChunkMesh(chunk.mesh);
      chunk.mesh = null;
    }

    // Accumulate geometry per block type
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
                groups: [],
                vertCount: 0
              };
            }

            const batch = blockBatches[block];
            const vBase = batch.vertCount;

            // Full 6-Face Ambient Occlusion for premium smooth lighting
            let ao0 = 1.0, ao1 = 1.0, ao2 = 1.0, ao3 = 1.0;
            if (settings.smoothLighting && !isCurrentTransp) {
              const d = face.dir;
              // Calculate AO neighbors based on face direction
              if (d[1] === 1) {
                // +Y (Top)
                const sN = isBlockSolid(getGlobalBlock(gx, y+1, gz-1));
                const sS = isBlockSolid(getGlobalBlock(gx, y+1, gz+1));
                const sE = isBlockSolid(getGlobalBlock(gx+1, y+1, gz));
                const sW = isBlockSolid(getGlobalBlock(gx-1, y+1, gz));
                ao0 = calculateVertexAO(sW, sS, isBlockSolid(getGlobalBlock(gx-1, y+1, gz+1)));
                ao1 = calculateVertexAO(sE, sS, isBlockSolid(getGlobalBlock(gx+1, y+1, gz+1)));
                ao2 = calculateVertexAO(sE, sN, isBlockSolid(getGlobalBlock(gx+1, y+1, gz-1)));
                ao3 = calculateVertexAO(sW, sN, isBlockSolid(getGlobalBlock(gx-1, y+1, gz-1)));
              } else if (d[1] === -1) {
                // -Y (Bottom)
                const sN = isBlockSolid(getGlobalBlock(gx, y-1, gz-1));
                const sS = isBlockSolid(getGlobalBlock(gx, y-1, gz+1));
                const sE = isBlockSolid(getGlobalBlock(gx+1, y-1, gz));
                const sW = isBlockSolid(getGlobalBlock(gx-1, y-1, gz));
                ao0 = calculateVertexAO(sW, sN, isBlockSolid(getGlobalBlock(gx-1, y-1, gz-1)));
                ao1 = calculateVertexAO(sE, sN, isBlockSolid(getGlobalBlock(gx+1, y-1, gz-1)));
                ao2 = calculateVertexAO(sE, sS, isBlockSolid(getGlobalBlock(gx+1, y-1, gz+1)));
                ao3 = calculateVertexAO(sW, sS, isBlockSolid(getGlobalBlock(gx-1, y-1, gz+1)));
              } else if (d[0] === 1) {
                // +X (East)
                const sUp = isBlockSolid(getGlobalBlock(gx+1, y+1, gz));
                const sDn = isBlockSolid(getGlobalBlock(gx+1, y-1, gz));
                const sN = isBlockSolid(getGlobalBlock(gx+1, y, gz-1));
                const sS = isBlockSolid(getGlobalBlock(gx+1, y, gz+1));
                ao0 = calculateVertexAO(sDn, sN, isBlockSolid(getGlobalBlock(gx+1, y-1, gz-1)));
                ao1 = calculateVertexAO(sUp, sN, isBlockSolid(getGlobalBlock(gx+1, y+1, gz-1)));
                ao2 = calculateVertexAO(sUp, sS, isBlockSolid(getGlobalBlock(gx+1, y+1, gz+1)));
                ao3 = calculateVertexAO(sDn, sS, isBlockSolid(getGlobalBlock(gx+1, y-1, gz+1)));
              } else if (d[0] === -1) {
                // -X (West)
                const sUp = isBlockSolid(getGlobalBlock(gx-1, y+1, gz));
                const sDn = isBlockSolid(getGlobalBlock(gx-1, y-1, gz));
                const sN = isBlockSolid(getGlobalBlock(gx-1, y, gz-1));
                const sS = isBlockSolid(getGlobalBlock(gx-1, y, gz+1));
                ao0 = calculateVertexAO(sDn, sS, isBlockSolid(getGlobalBlock(gx-1, y-1, gz+1)));
                ao1 = calculateVertexAO(sUp, sS, isBlockSolid(getGlobalBlock(gx-1, y+1, gz+1)));
                ao2 = calculateVertexAO(sUp, sN, isBlockSolid(getGlobalBlock(gx-1, y+1, gz-1)));
                ao3 = calculateVertexAO(sDn, sN, isBlockSolid(getGlobalBlock(gx-1, y-1, gz-1)));
              } else if (d[2] === 1) {
                // +Z (South)
                const sUp = isBlockSolid(getGlobalBlock(gx, y+1, gz+1));
                const sDn = isBlockSolid(getGlobalBlock(gx, y-1, gz+1));
                const sE = isBlockSolid(getGlobalBlock(gx+1, y, gz+1));
                const sW = isBlockSolid(getGlobalBlock(gx-1, y, gz+1));
                ao0 = calculateVertexAO(sDn, sE, isBlockSolid(getGlobalBlock(gx+1, y-1, gz+1)));
                ao1 = calculateVertexAO(sUp, sE, isBlockSolid(getGlobalBlock(gx+1, y+1, gz+1)));
                ao2 = calculateVertexAO(sUp, sW, isBlockSolid(getGlobalBlock(gx-1, y+1, gz+1)));
                ao3 = calculateVertexAO(sDn, sW, isBlockSolid(getGlobalBlock(gx-1, y-1, gz+1)));
              } else if (d[2] === -1) {
                // -Z (North)
                const sUp = isBlockSolid(getGlobalBlock(gx, y+1, gz-1));
                const sDn = isBlockSolid(getGlobalBlock(gx, y-1, gz-1));
                const sE = isBlockSolid(getGlobalBlock(gx+1, y, gz-1));
                const sW = isBlockSolid(getGlobalBlock(gx-1, y, gz-1));
                ao0 = calculateVertexAO(sDn, sW, isBlockSolid(getGlobalBlock(gx-1, y-1, gz-1)));
                ao1 = calculateVertexAO(sUp, sW, isBlockSolid(getGlobalBlock(gx-1, y+1, gz-1)));
                ao2 = calculateVertexAO(sUp, sE, isBlockSolid(getGlobalBlock(gx+1, y+1, gz-1)));
                ao3 = calculateVertexAO(sDn, sE, isBlockSolid(getGlobalBlock(gx+1, y-1, gz-1)));
              }
            }

            const quad = face.quad;
            for (let v = 0; v < 4; v++) {
              batch.positions.push(gx + quad[v][0], y + quad[v][1], gz + quad[v][2]);
              batch.normals.push(face.norm[0], face.norm[1], face.norm[2]);
            }

            // Standard quad UVs
            batch.uvs.push(0, 0, 0, 1, 1, 1, 1, 0);

            // Shading colors
            batch.colors.push(ao0, ao0, ao0, ao1, ao1, ao1, ao2, ao2, ao2, ao3, ao3, ao3);

            // Record multi-material group for this face
            const indexStart = batch.indices.length;
            batch.indices.push(vBase, vBase + 1, vBase + 2, vBase, vBase + 2, vBase + 3);
            batch.groups.push({ start: indexStart, count: 6, matIdx: face.matIdx });
            batch.vertCount += 4;
          }
        }
      }
    }

    // Assemble chunk mesh group
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

      // Assign face material groups (allows top, side, and bottom textures to render correctly)
      for (let i = 0; i < batch.groups.length; i++) {
        const g = batch.groups[i];
        geom.addGroup(g.start, g.count, g.matIdx);
      }

      const mats = blockMaterials[bId] || [new THREE.MeshLambertMaterial({ color: 0x888888 })];
      const mesh = new THREE.Mesh(geom, mats);

      if (bId === BLOCKS.WATER) {
        mesh.renderOrder = 2; // Water rendered cleanly above solids
      }

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
    const hw = 0.28; // Slightly narrower than block so player moves freely through 1-block corridors
    const minX = Math.floor(px - hw + 0.001);
    const maxX = Math.floor(px + hw - 0.001);
    const minY = Math.floor(py + 0.001);
    const maxY = Math.floor(py + player.height - 0.001);
    const minZ = Math.floor(pz - hw + 0.001);
    const maxZ = Math.floor(pz + hw - 0.001);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          if (isBlockSolid(getGlobalBlock(x, y, z))) {
            return true;
          }
        }
      }
    }
    return false;
  }

  function updatePhysics(dt) {
    // 1. In-water check
    const currentBlock = getGlobalBlock(Math.floor(player.x), Math.floor(player.y + 0.5), Math.floor(player.z));
    player.inWater = (currentBlock === BLOCKS.WATER);

    // 2. Movement Inputs (Support both WASD and Arrow Keys)
    let forward = 0;
    let right = 0;
    if (keys['KeyW'] || keys['ArrowUp']) forward += 1;
    if (keys['KeyS'] || keys['ArrowDown']) forward -= 1;
    if (keys['KeyA'] || keys['ArrowLeft']) right -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) right += 1;

    player.isSprinting = !player.isFlying && (!!keys['ShiftLeft'] || !!keys['ShiftRight'] || !!keys['ControlLeft'] || !!keys['ControlRight']);

    let moveSpeed = 4.6;
    if (player.isFlying) {
      moveSpeed = (keys['ControlLeft'] || keys['ControlRight']) ? 12.0 : 8.8;
    } else {
      if (player.isSprinting) moveSpeed = 6.8;
      if (player.inWater) moveSpeed = 2.9;
    }

    // True First-Person Camera Vectors
    // In Three.js with order 'YXZ' and camera.rotation.y = yaw:
    // Forward look on XZ plane is (-sin(yaw), -cos(yaw))
    // Right strafe on XZ plane is (cos(yaw), -sin(yaw))
    const fx = -Math.sin(player.yaw);
    const fz = -Math.cos(player.yaw);
    const rx = Math.cos(player.yaw);
    const rz = -Math.sin(player.yaw);

    const moveX = forward * fx + right * rx;
    const moveZ = forward * fz + right * rz;
    const inputLen = Math.hypot(moveX, moveZ);

    let targetVx = 0;
    let targetVz = 0;
    if (inputLen > 1e-4) {
      targetVx = (moveX / inputLen) * moveSpeed;
      targetVz = (moveZ / inputLen) * moveSpeed;
    }

    // High-responsiveness acceleration and snappy braking
    const hasInput = (forward !== 0 || right !== 0);
    const accel = player.onGround ? (hasInput ? 28.0 : 20.0) : 7.0;
    player.vx += (targetVx - player.vx) * Math.min(dt * accel, 1.0);
    player.vz += (targetVz - player.vz) * Math.min(dt * accel, 1.0);

    // Zero out tiny residual velocities to prevent micro-drifting
    if (!hasInput && Math.hypot(player.vx, player.vz) < 0.05) {
      player.vx = 0;
      player.vz = 0;
    }

    // 3. Vertical Physics (Gravity, Jumping, Water & Flight)
    if (player.isFlying) {
      player.vy = 0;
      const flyVerticalSpeed = 7.8;
      // Space moves up, Shift or KeyC moves down
      if (keys['Space']) player.vy = flyVerticalSpeed;
      if (keys['ShiftLeft'] || keys['ShiftRight'] || keys['KeyC']) player.vy = -flyVerticalSpeed;
      const newY = player.y + player.vy * dt;
      if (!checkPlayerCollision(player.x, newY, player.z)) {
        player.y = newY;
        player.onGround = false;
      } else {
        if (player.vy < 0) {
          player.y = Math.ceil(newY);
          while (checkPlayerCollision(player.x, player.y, player.z) && player.y < CHUNK_HEIGHT) {
            player.y += 0.05;
          }
          player.onGround = true;
        }
        player.vy = 0;
      }
    } else if (player.inWater) {
      player.vy -= 7.0 * dt; // Fluid buoyancy
      player.vy *= Math.pow(0.5, dt * 5.0); // Water drag
      if (keys['Space']) player.vy = 3.2; // Swimming up smoothly
      if (keys['ShiftLeft'] || keys['KeyC']) player.vy = -3.2; // Swimming down
      const newY = player.y + player.vy * dt;
      if (!checkPlayerCollision(player.x, newY, player.z)) {
        player.y = newY;
      } else {
        player.vy = 0;
      }
      player.onGround = false;
    } else {
      // Normal Gravity
      player.vy -= 28.0 * dt;
      player.vy = Math.max(player.vy, -38.0); // Terminal fall velocity

      // Jump
      if (keys['Space'] && player.onGround) {
        player.vy = 8.8; // Crisp, responsive jump
        player.onGround = false;
        playSynthesizedSound('jump');
      }

      // Vertical movement & collision
      const newY = player.y + player.vy * dt;
      if (!checkPlayerCollision(player.x, newY, player.z)) {
        player.y = newY;
        player.onGround = false;
      } else {
        if (player.vy < 0) {
          // Clean landing: snap to top of the block
          player.y = Math.ceil(newY);
          while (checkPlayerCollision(player.x, player.y, player.z) && player.y < CHUNK_HEIGHT) {
            player.y += 0.05;
          }
          player.onGround = true;
          if (settings.gameMode === 'survival' && player.vy < -16.0) {
            damagePlayer(Math.floor((-player.vy - 16.0) / 2.5));
          }
        } else if (player.vy > 0) {
          // Ceiling collision
          player.y = Math.floor(newY + player.height) - player.height - 0.001;
        }
        player.vy = 0;
      }
    }

    // 4. Smooth Horizontal Movement & Intelligent 1-Block Auto Step-Up
    const stepHeight = 1.05; // Can smoothly step over 1-block terrain elevation
    const dx = player.vx * dt;
    const dz = player.vz * dt;

    if (Math.abs(dx) > 1e-5 || Math.abs(dz) > 1e-5) {
      // Try direct diagonal movement
      if (!checkPlayerCollision(player.x + dx, player.y, player.z + dz)) {
        player.x += dx;
        player.z += dz;
      } else {
        // Try stepping up if on ground
        let stepped = false;
        if (player.onGround) {
          for (let sh = 0.25; sh <= stepHeight; sh += 0.25) {
            if (!checkPlayerCollision(player.x, player.y + sh, player.z) &&
                !checkPlayerCollision(player.x + dx, player.y + sh, player.z + dz)) {
              player.x += dx;
              player.z += dz;
              player.y += sh;
              cameraStepOffset -= sh;
              stepped = true;
              break;
            }
          }
        }

        if (!stepped) {
          // Slide along X axis
          if (!checkPlayerCollision(player.x + dx, player.y, player.z)) {
            player.x += dx;
          } else {
            // Try step up on X
            let steppedX = false;
            if (player.onGround) {
              for (let sh = 0.25; sh <= stepHeight; sh += 0.25) {
                if (!checkPlayerCollision(player.x, player.y + sh, player.z) &&
                    !checkPlayerCollision(player.x + dx, player.y + sh, player.z)) {
                  player.x += dx;
                  player.y += sh;
                  cameraStepOffset -= sh;
                  steppedX = true;
                  break;
                }
              }
            }
            if (!steppedX) player.vx = 0;
          }

          // Slide along Z axis
          if (!checkPlayerCollision(player.x, player.y, player.z + dz)) {
            player.z += dz;
          } else {
            // Try step up on Z
            let steppedZ = false;
            if (player.onGround) {
              for (let sh = 0.25; sh <= stepHeight; sh += 0.25) {
                if (!checkPlayerCollision(player.x, player.y + sh, player.z) &&
                    !checkPlayerCollision(player.x, player.y + sh, player.z + dz)) {
                  player.z += dz;
                  player.y += sh;
                  cameraStepOffset -= sh;
                  steppedZ = true;
                  break;
                }
              }
            }
            if (!steppedZ) player.vz = 0;
          }
        }
      }
    }

    // Footstep Sound & Walk Distance Tracking
    const horizSpeed = Math.hypot(player.vx, player.vz);
    if (player.onGround && horizSpeed > 0.8) {
      walkDistance += horizSpeed * dt;
      if (Math.floor(walkDistance * 1.6) > Math.floor((walkDistance - horizSpeed * dt) * 1.6)) {
        playSynthesizedSound('step');
      }
    }

    // Void fallback check
    if (player.y < -10) {
      player.x = 8.5;
      player.y = 42.0;
      player.z = 8.5;
      player.vy = 0;
      showToast('Respawned above world');
    }
  }

  function damagePlayer(amount) {
    if (amount <= 0 || settings.gameMode === 'creative') return;
    player.health = Math.max(0, player.health - amount);
    renderSurvivalMeters();
    playSynthesizedSound('hurt');
    if (player.health === 0) {
      showToast('You died! Respawned at spawn.');
      player.health = 20;
      player.hunger = 20;
      player.x = 8.5;
      player.y = 42.0;
      player.z = 8.5;
      renderSurvivalMeters();
    }
  }

  // =========================================================================
  // Robust DDA Voxel Raycaster (Guaranteed Finite & Zero-Division Proof)
  // =========================================================================
  function raycastBlock(maxDist = 6.0) {
    const origin = new THREE.Vector3(player.x, player.y + player.eyeHeight, player.z);
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);

    // Prevent division by zero
    const dx = Math.abs(dir.x) < 1e-6 ? (dir.x >= 0 ? 1e-6 : -1e-6) : dir.x;
    const dy = Math.abs(dir.y) < 1e-6 ? (dir.y >= 0 ? 1e-6 : -1e-6) : dir.y;
    const dz = Math.abs(dir.z) < 1e-6 ? (dir.z >= 0 ? 1e-6 : -1e-6) : dir.z;

    let x = Math.floor(origin.x);
    let y = Math.floor(origin.y);
    let z = Math.floor(origin.z);

    const stepX = dx > 0 ? 1 : -1;
    const stepY = dy > 0 ? 1 : -1;
    const stepZ = dz > 0 ? 1 : -1;

    const tDeltaX = Math.abs(1 / dx);
    const tDeltaY = Math.abs(1 / dy);
    const tDeltaZ = Math.abs(1 / dz);

    let tMaxX = dx > 0 ? (Math.floor(origin.x) + 1 - origin.x) * tDeltaX : (origin.x - Math.floor(origin.x)) * tDeltaX;
    let tMaxY = dy > 0 ? (Math.floor(origin.y) + 1 - origin.y) * tDeltaY : (origin.y - Math.floor(origin.y)) * tDeltaY;
    let tMaxZ = dz > 0 ? (Math.floor(origin.z) + 1 - origin.z) * tDeltaZ : (origin.z - Math.floor(origin.z)) * tDeltaZ;

    let hit = null;
    let dist = 0;
    let normal = [0, 1, 0];

    // Strictly bounded loop prevents any browser lockup
    const maxSteps = Math.min(80, Math.ceil(maxDist * 4) + 8);
    for (let step = 0; step < maxSteps; step++) {
      if (dist >= maxDist) break;

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
    triggerArmSwing();
    const target = raycastBlock();
    if (!target) return;

    // Spawn particle burst
    spawnBreakParticles(target.x, target.y, target.z, target.block);
    playSynthesizedSound('break');

    // Remove block
    setGlobalBlock(target.x, target.y, target.z, BLOCKS.AIR);
  }

  function placeSelectedBlock() {
    triggerArmSwing();
    const target = raycastBlock();
    if (!target) return;

    const px = target.x + target.normal[0];
    const py = target.y + target.normal[1];
    const pz = target.z + target.normal[2];

    // Player bounding box intersection check
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
    const count = 18;
    const geom = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const color = getBlockColor(blockId);
    const mat = new THREE.MeshBasicMaterial({ color });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(
        bx + 0.5 + (Math.random() - 0.5) * 0.7,
        by + 0.5 + (Math.random() - 0.5) * 0.7,
        bz + 0.5 + (Math.random() - 0.5) * 0.7
      );
      scene.add(mesh);

      particles.push({
        mesh,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 4.0,
          Math.random() * 3.5 + 1.0,
          (Math.random() - 0.5) * 4.0
        ),
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1.0
      });
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
      case BLOCKS.LEAVES: return 0x387324;
      case BLOCKS.SAND: return 0xd6c589;
      case BLOCKS.GLASS: return 0xd0e8ff;
      case BLOCKS.WATER: return 0x3b82f6;
      case BLOCKS.COAL_ORE: return 0x222222;
      case BLOCKS.IRON_ORE: return 0xc49e7b;
      case BLOCKS.GOLD_ORE: return 0xffd700;
      case BLOCKS.DIAMOND_ORE: return 0x4eedd7;
      case BLOCKS.SNOW: return 0xf8fafc;
      case BLOCKS.BRICKS: return 0xb94a34;
      case BLOCKS.BOOKSHELF: return 0x8b5a2b;
      case BLOCKS.TNT: return 0xdc2626;
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

  // Atmospheric Ambient Dust Motes (Subtle, warm, non-whitish)
  let ambientDust = null;
  function setupAmbientDust() {
    const dustCount = 120;
    const dustGeom = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 50;
      dustPos[i * 3 + 1] = Math.random() * 25 + 4;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      size: 0.05,
      color: 0xffdfaa,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      fog: false
    });
    ambientDust = new THREE.Points(dustGeom, dustMat);
    scene.add(ambientDust);
  }

  function updateAmbientDust(dt) {
    if (!ambientDust) return;
    ambientDust.position.set(player.x, player.y, player.z);
    const posAttr = ambientDust.geometry.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      let py = posAttr.getY(i);
      py += dt * (0.15 + Math.sin(i * 0.7) * 0.1);
      if (py > 30) py -= 25;
      posAttr.setY(i, py);
      posAttr.setX(i, posAttr.getX(i) + Math.sin(performance.now() * 0.0003 + i) * dt * 0.3);
    }
    posAttr.needsUpdate = true;
    const isDay = (dayTime > 0.10 && dayTime < 0.45);
    ambientDust.material.opacity = isDay ? 0.12 : 0.03;
  }

  // =========================================================================
  // Procedural Sound Synthesizer (Web Audio API)
  // =========================================================================
  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSynthesizedSound(type) {
    if (!audioCtx || settings.soundMuted || settings.soundVolume <= 0) return;
    try {
      const now = audioCtx.currentTime;
      const master = audioCtx.createGain();
      master.gain.value = settings.soundVolume * 0.4;
      master.connect(audioCtx.destination);

      if (type === 'break') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'place') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'step') {
        const bufferSize = audioCtx.sampleRate * 0.04;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 450;
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(master);
        noise.start(now);
      } else if (type === 'jump') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.14);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 0.14);
      } else if (type === 'hurt') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.linearRampToValueAtTime(55, now + 0.18);
        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 0.18);
      }
    } catch (e) {
      // Audio error ignored
    }
  }

  // =========================================================================
  // First-Person 3D Viewmodel (Player Arm & Held Block)
  // =========================================================================
  function setupFirstPersonViewmodel() {
    handGroup = new THREE.Group();
    handGroup.position.set(0.38, -0.32, -0.55);
    handGroup.rotation.set(0.18, -0.35, 0.1);

    // 1. Forearm Mesh
    const armGeom = new THREE.BoxGeometry(0.13, 0.38, 0.13);
    const armMat = new THREE.MeshLambertMaterial({ color: 0x009898 }); // Turquoise shirt sleeve
    handArmMesh = new THREE.Mesh(armGeom, armMat);
    handArmMesh.position.set(0.05, -0.12, 0.1);
    handArmMesh.rotation.set(0.3, 0.1, -0.2);
    handGroup.add(handArmMesh);

    // 2. Held Block Mesh
    const itemGeom = new THREE.BoxGeometry(0.24, 0.24, 0.24);
    const initBlock = player.hotbar[player.activeSlot] || BLOCKS.GRASS;
    const initMat = blockMaterials[initBlock] || new THREE.MeshLambertMaterial({ color: 0x4c9b38 });
    handItemMesh = new THREE.Mesh(itemGeom, initMat);
    handItemMesh.position.set(0, 0.05, -0.08);
    handItemMesh.rotation.set(0.2, 0.45, -0.1);
    handGroup.add(handItemMesh);

    // Attach viewmodel directly to Camera
    camera.add(handGroup);
    scene.add(camera);
  }

  function updateHeldItemModel() {
    if (!handItemMesh) return;
    const currentBlock = player.hotbar[player.activeSlot] || BLOCKS.AIR;
    if (currentBlock === BLOCKS.AIR) {
      handItemMesh.visible = false;
    } else {
      handItemMesh.visible = true;
      const mats = blockMaterials[currentBlock] || new THREE.MeshLambertMaterial({ color: 0x888888 });
      handItemMesh.material = mats;
    }
  }

  function triggerArmSwing() {
    armSwingProgress = 1.0;
  }

  function updateViewmodelAnimation(dt) {
    if (!handGroup) return;

    // 1. Walking bobbing
    const horizSpeed = Math.hypot(player.vx, player.vz);
    let bobX = 0;
    let bobY = 0;
    if (player.onGround && horizSpeed > 0.5) {
      bobTimer += dt * (player.isSprinting ? 12.0 : 8.0);
      bobX = Math.cos(bobTimer) * 0.012;
      bobY = Math.abs(Math.sin(bobTimer)) * 0.015;
    } else {
      bobTimer += dt * 1.2;
      bobX = Math.sin(bobTimer * 0.7) * 0.003;
      bobY = Math.sin(bobTimer * 0.5) * 0.004;
    }

    // 2. Arm swing animation
    if (armSwingProgress > 0) {
      armSwingProgress = Math.max(0, armSwingProgress - dt * 4.8);
    }
    const swingSin = Math.sin(armSwingProgress * Math.PI);
    const swingAngleX = swingSin * 0.55;
    const swingAngleZ = -swingSin * 0.35;

    // Apply combined transforms
    handGroup.position.set(0.38 + bobX, -0.32 + bobY - swingSin * 0.06, -0.55 + swingSin * 0.08);
    handGroup.rotation.set(0.18 - swingAngleX, -0.35 + swingSin * 0.25, 0.1 + swingAngleZ);
  }

  // =========================================================================
  // Celestial 3D Skybox, Lighting & Day/Night Cycle
  // =========================================================================
  function setupCelestialSkybox() {
    // 1. Procedural High-Fidelity Square Sun with Layered Radiant Glow
    const sunGroup = new THREE.Group();

    // 64x64 Pixel Art Solar Core
    const sunCanvas = document.createElement('canvas');
    sunCanvas.width = 64;
    sunCanvas.height = 64;
    const sctx = sunCanvas.getContext('2d');
    sctx.clearRect(0, 0, 64, 64);
    // Outer flame border
    sctx.fillStyle = '#ff7b00';
    sctx.fillRect(4, 4, 56, 56);
    // Corona ring
    sctx.fillStyle = '#ffaa00';
    sctx.fillRect(8, 8, 48, 48);
    // Vivid warm gold body
    sctx.fillStyle = '#ffcf33';
    sctx.fillRect(14, 14, 36, 36);
    // Blazing white-gold center
    sctx.fillStyle = '#fff8bd';
    sctx.fillRect(20, 20, 24, 24);
    sctx.fillStyle = '#ffffff';
    sctx.fillRect(24, 24, 16, 16);

    const sunTex = new THREE.CanvasTexture(sunCanvas);
    sunTex.magFilter = THREE.NearestFilter;
    sunTex.minFilter = THREE.NearestFilter;

    const sunCoreGeom = new THREE.PlaneGeometry(16, 16);
    const sunCoreMat = new THREE.MeshBasicMaterial({
      map: sunTex,
      transparent: true,
      depthWrite: false,
      fog: false
    });
    const sunCoreMesh = new THREE.Mesh(sunCoreGeom, sunCoreMat);
    sunGroup.add(sunCoreMesh);

    // Radial Golden Halo Canvas
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 128;
    glowCanvas.height = 128;
    const gctx = glowCanvas.getContext('2d');
    const grad = gctx.createRadialGradient(64, 64, 4, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 235, 140, 0.85)');
    grad.addColorStop(0.25, 'rgba(255, 175, 40, 0.45)');
    grad.addColorStop(0.65, 'rgba(255, 110, 10, 0.12)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, 128, 128);

    const sunGlowTex = new THREE.CanvasTexture(glowCanvas);
    const glowGeom1 = new THREE.PlaneGeometry(34, 34);
    const glowMat1 = new THREE.MeshBasicMaterial({
      map: sunGlowTex,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false
    });
    const glowMesh1 = new THREE.Mesh(glowGeom1, glowMat1);
    glowMesh1.position.z = -0.1;
    sunGroup.add(glowMesh1);

    const glowGeom2 = new THREE.PlaneGeometry(58, 58);
    const glowMat2 = new THREE.MeshBasicMaterial({
      map: sunGlowTex,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false
    });
    const glowMesh2 = new THREE.Mesh(glowGeom2, glowMat2);
    glowMesh2.position.z = -0.2;
    sunGroup.add(glowMesh2);

    sunMesh = sunGroup;
    scene.add(sunMesh);

    // 2. Procedural High-Fidelity Square Moon with Detailed Craters & Seas
    const moonGroup = new THREE.Group();

    const moonCanvas = document.createElement('canvas');
    moonCanvas.width = 64;
    moonCanvas.height = 64;
    const mctx = moonCanvas.getContext('2d');
    mctx.clearRect(0, 0, 64, 64);
    // Stylized lunar bevel border
    mctx.fillStyle = '#64748b';
    mctx.fillRect(6, 6, 52, 52);
    mctx.fillStyle = '#94a3b8';
    mctx.fillRect(10, 10, 44, 44);
    // Lunar surface body
    mctx.fillStyle = '#e2e8f0';
    mctx.fillRect(14, 14, 36, 36);
    // Dark lunar maria (basalt plains)
    mctx.fillStyle = '#94a3b8';
    mctx.fillRect(18, 20, 10, 8);
    mctx.fillRect(22, 30, 12, 10);
    mctx.fillRect(34, 20, 8, 12);
    mctx.fillRect(32, 34, 10, 6);
    // Craters with shadows
    mctx.fillStyle = '#475569';
    mctx.fillRect(22, 22, 3, 3);
    mctx.fillRect(36, 24, 4, 4);
    mctx.fillRect(26, 36, 5, 5);
    // Bright crater rim highlights
    mctx.fillStyle = '#ffffff';
    mctx.fillRect(21, 21, 3, 1);
    mctx.fillRect(21, 21, 1, 3);
    mctx.fillRect(35, 23, 4, 1);
    mctx.fillRect(35, 23, 1, 4);

    const moonTex = new THREE.CanvasTexture(moonCanvas);
    moonTex.magFilter = THREE.NearestFilter;
    moonTex.minFilter = THREE.NearestFilter;

    const moonCoreGeom = new THREE.PlaneGeometry(14, 14);
    const moonCoreMat = new THREE.MeshBasicMaterial({
      map: moonTex,
      transparent: true,
      depthWrite: false,
      fog: false
    });
    const moonCoreMesh = new THREE.Mesh(moonCoreGeom, moonCoreMat);
    moonGroup.add(moonCoreMesh);

    // Moon silver-blue glow aura
    const moonGlowCanvas = document.createElement('canvas');
    moonGlowCanvas.width = 128;
    moonGlowCanvas.height = 128;
    const mgctx = moonGlowCanvas.getContext('2d');
    const mgrad = mgctx.createRadialGradient(64, 64, 4, 64, 64, 64);
    mgrad.addColorStop(0, 'rgba(190, 220, 255, 0.7)');
    mgrad.addColorStop(0.35, 'rgba(140, 180, 245, 0.3)');
    mgrad.addColorStop(0.7, 'rgba(100, 140, 220, 0.08)');
    mgrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    mgctx.fillStyle = mgrad;
    mgctx.fillRect(0, 0, 128, 128);

    const moonGlowTex = new THREE.CanvasTexture(moonGlowCanvas);
    const moonGlowGeom = new THREE.PlaneGeometry(30, 30);
    const moonGlowMat = new THREE.MeshBasicMaterial({
      map: moonGlowTex,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false
    });
    const moonGlowMesh = new THREE.Mesh(moonGlowGeom, moonGlowMat);
    moonGlowMesh.position.z = -0.1;
    moonGroup.add(moonGlowMesh);

    moonMesh = moonGroup;
    scene.add(moonMesh);

    // 3. 800 Twinkling Stars
    const starCount = 800;
    const starGeom = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 160.0;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 15; // Upper hemisphere
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      size: 1.8,
      color: 0xffffff,
      transparent: true,
      opacity: 0.0,
      fog: false
    });
    starField = new THREE.Points(starGeom, starMat);
    scene.add(starField);
  }

  function updateDayNightCycle(dt) {
    if (settings.dayCycleSpeed > 0) {
      const cycleDuration = 240 / settings.dayCycleSpeed;
      dayTime = (dayTime + (dt / cycleDuration)) % 1.0;
    }

    const sunAngle = dayTime * Math.PI * 2 - Math.PI / 2;
    const orbitDist = 140;
    const celestialX = Math.cos(sunAngle) * orbitDist;
    const celestialY = Math.sin(sunAngle) * orbitDist;
    const celestialZ = 30;

    sunLight.position.set(player.x + celestialX, player.y + celestialY, player.z + celestialZ);
    moonLight.position.set(player.x - celestialX, player.y - celestialY, player.z - celestialZ);
    if (sunMesh) {
      sunMesh.position.set(player.x + celestialX, player.y + celestialY, player.z + celestialZ);
      sunMesh.lookAt(player.x, player.y, player.z);
    }
    if (moonMesh) {
      moonMesh.position.set(player.x - celestialX, player.y - celestialY, player.z - celestialZ);
      moonMesh.lookAt(player.x, player.y, player.z);
    }
    if (starField) starField.position.set(player.x, player.y, player.z);
    if (skyDome) skyDome.position.set(player.x, player.y - 10, player.z);

    // Balanced color keys: [time, skyR,skyG,skyB, fogR,fogG,fogB, sunIntensity, ambIntensity, starOpacity]
    const colorKeys = [
      [0.00, 0.85,0.44,0.30,  0.88,0.50,0.35,  0.60,0.30,  0.35], // Dawn
      [0.12, 0.38,0.60,0.95,  0.46,0.66,0.95,  0.78,0.34,  0.0],  // Morning
      [0.25, 0.35,0.58,0.98,  0.42,0.64,0.96,  0.82,0.36,  0.0],  // Noon
      [0.40, 0.38,0.60,0.95,  0.46,0.66,0.95,  0.78,0.34,  0.0],  // Afternoon
      [0.50, 0.86,0.40,0.24,  0.88,0.46,0.28,  0.60,0.30,  0.35], // Sunset
      [0.60, 0.12,0.08,0.20,  0.10,0.06,0.16,  0.14,0.20,  0.70], // Dusk
      [0.75, 0.03,0.04,0.08,  0.02,0.03,0.06,  0.02,0.15,  0.95], // Midnight
      [0.90, 0.03,0.04,0.08,  0.02,0.03,0.06,  0.02,0.15,  0.95], // Late Night
      [1.00, 0.85,0.44,0.30,  0.88,0.50,0.35,  0.60,0.30,  0.35], // Dawn wrap
    ];

    let lo = colorKeys[0], hi = colorKeys[1];
    for (let i = 0; i < colorKeys.length - 1; i++) {
      if (dayTime >= colorKeys[i][0] && dayTime < colorKeys[i+1][0]) {
        lo = colorKeys[i];
        hi = colorKeys[i+1];
        break;
      }
    }
    const range = hi[0] - lo[0];
    const t = range > 0 ? (dayTime - lo[0]) / range : 0;

    const skyR = lo[1] + (hi[1] - lo[1]) * t;
    const skyG = lo[2] + (hi[2] - lo[2]) * t;
    const skyB = lo[3] + (hi[3] - lo[3]) * t;
    const fogR = lo[4] + (hi[4] - lo[4]) * t;
    const fogG = lo[5] + (hi[5] - lo[5]) * t;
    const fogB = lo[6] + (hi[6] - lo[6]) * t;
    sunLight.intensity = lo[7] + (hi[7] - lo[7]) * t;
    ambientLight.intensity = lo[8] + (hi[8] - lo[8]) * t;
    const starOp = lo[9] + (hi[9] - lo[9]) * t;
    if (starField) starField.material.opacity = starOp;

    const skyColor = new THREE.Color(skyR, skyG, skyB);
    const fogColor = new THREE.Color(fogR, fogG, fogB);
    renderer.setClearColor(skyColor);
    if (scene.fog && settings.fogEnabled) {
      scene.fog.color = fogColor;
    }

    // Update sky dome vertex colors (smooth zenith to horizon gradient)
    if (skyDome) {
      const posAttr = skyDome.geometry.attributes.position;
      const colAttr = skyDome.geometry.attributes.color;
      for (let i = 0; i < posAttr.count; i++) {
        const ny = posAttr.getY(i) / 400;
        const nt = Math.max(0, Math.min(1, ny));
        const zR = skyR * (0.65 + nt * 0.35);
        const zG = skyG * (0.65 + nt * 0.35);
        const zB = skyB * (0.75 + nt * 0.25);
        colAttr.setXYZ(i, zR, zG, zB);
      }
      colAttr.needsUpdate = true;
    }

    // HUD time label
    const hudTime = document.getElementById('hudTimeBadge');
    if (hudTime) {
      if (dayTime < 0.06 || dayTime >= 0.94) hudTime.textContent = 'Dawn';
      else if (dayTime < 0.40) hudTime.textContent = 'Day';
      else if (dayTime < 0.56) hudTime.textContent = 'Sunset';
      else if (dayTime < 0.65) hudTime.textContent = 'Dusk';
      else hudTime.textContent = 'Night';
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

    // Safely unload distant chunks
    for (const [key, chunk] of chunks.entries()) {
      if (!neededKeys.has(key)) {
        if (chunk.mesh) {
          disposeChunkMesh(chunk.mesh);
          chunk.mesh = null;
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
        canvas.width = 32;
        canvas.height = 32;
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
    updateHeldItemModel();
  }

  function selectHotbarSlot(idx) {
    player.activeSlot = (idx + 9) % 9;
    document.querySelectorAll('.hotbar-slot').forEach((slot, i) => {
      if (i === player.activeSlot) slot.classList.add('active');
      else slot.classList.remove('active');
    });
    updateHotbarLabel();
    updateHeldItemModel();
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
        canvas.width = 32;
        canvas.height = 32;
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
    scene.background = new THREE.Color(0x5a92ee);
    // Premium Sky Gradient Dome (fog: false ensures sky is always vivid)
    const skyGeom = new THREE.SphereGeometry(400, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const skyColors = [];
    const skyPosAttr = skyGeom.attributes.position;
    for (let i = 0; i < skyPosAttr.count; i++) {
      const y = skyPosAttr.getY(i);
      const t = Math.max(0, Math.min(1, y / 400));
      const r = 0.42 * (1 - t) + 0.15 * t;
      const g = 0.64 * (1 - t) + 0.35 * t;
      const b = 0.96 * (1 - t) + 0.90 * t;
      skyColors.push(r, g, b);
    }
    skyGeom.setAttribute('color', new THREE.Float32BufferAttribute(skyColors, 3));
    const skyMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, depthWrite: false, fog: false });
    const skyDome = new THREE.Mesh(skyGeom, skyMat);
    skyDome.renderOrder = -999;
    scene.add(skyDome);

    // Linear Fog: Near starts at 65% of chunk distance, meaning ZERO fog anywhere near player!
    if (settings.fogEnabled) {
      const fogNear = Math.max(16, settings.renderDistance * CHUNK_SIZE * 0.65);
      const fogFar = settings.renderDistance * CHUNK_SIZE;
      scene.fog = new THREE.Fog(0x6ca0f5, fogNear, fogFar);
    }

    camera = new THREE.PerspectiveCamera(settings.fov, window.innerWidth / window.innerHeight, 0.1, 500);
    camera.rotation.order = 'YXZ';

    // Standard linear pipeline for rich, vibrant voxel colors without washed-out bleaching
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);

    // 2. Setup Balanced Lighting
    ambientLight = new THREE.AmbientLight(0xffffff, 0.36);
    scene.add(ambientLight);
    const hemiLight = new THREE.HemisphereLight(0x78a7ff, 0x3d2b1f, 0.22);
    scene.add(hemiLight);

    sunLight = new THREE.DirectionalLight(0xfff6e6, 0.82);
    sunLight.position.set(40, 80, 20);
    scene.add(sunLight);

    moonLight = new THREE.DirectionalLight(0x7290d8, 0.18);
    moonLight.position.set(-40, -80, -20);
    scene.add(moonLight);

    // 3. Setup Celestial 3D Skybox (Sun, Moon, Stars)
    setupCelestialSkybox();
    setupAmbientDust();

    // 4. Setup Target Box Outline
    const wireGeom = new THREE.BoxGeometry(1.002, 1.002, 1.002);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      wireframe: true,
      wireframeLinewidth: 2.0
    });
    wireframeTargetBox = new THREE.Mesh(wireGeom, wireMat);
    wireframeTargetBox.visible = false;
    scene.add(wireframeTargetBox);

    // 5. Generate Procedural 32x32 Textures & Materials
    generateAllTextures();

    // 6. Setup First-Person Viewmodel (Hand holding block)
    setupFirstPersonViewmodel();

    // 7. Initial Chunk Generation around Spawn
    updateLoadedChunks();

    // 8. UI Bindings
    renderHotbarUI();
    renderSurvivalMeters();
    renderInventoryGrid();
    setupEventListeners();

    // 9. Start Game Animation Loop
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

      // Smooth step-up camera glide
      cameraStepOffset *= Math.pow(0.0001, dt);
      if (Math.abs(cameraStepOffset) < 0.002) cameraStepOffset = 0;

      // 2. Sync Three.js Camera to Player
      // Smooth camera interpolation for premium feel
      const camLerp = Math.min(dt * 18.0, 1.0);
      const targetCamX = player.x;
      const targetCamY = player.y + player.eyeHeight + cameraStepOffset;
      const targetCamZ = player.z;
      camera.position.x += (targetCamX - camera.position.x) * camLerp;
      camera.position.y += (targetCamY - camera.position.y) * camLerp;
      camera.position.z += (targetCamZ - camera.position.z) * camLerp;
      camera.rotation.y = player.yaw;
      camera.rotation.x = player.pitch;

      // Dynamic Sprint FOV transition
      const targetFOV = player.isSprinting ? settings.fov + 6 : settings.fov;
      camera.fov += (targetFOV - camera.fov) * Math.min(dt * 8.0, 1.0);
      camera.updateProjectionMatrix();

      // 3. Update Viewmodel Animation (bobbing & swing)
      updateViewmodelAnimation(dt);

      // 4. Update Day/Night Cycle & Celestial bodies
      updateDayNightCycle(dt);

      // 5. Update Particle Explosions
      updateParticles(dt);

      updateAmbientDust(dt);

      // 8.5. Animate Water UV scrolling for realistic shimmer
      chunks.forEach(chunk => {
        if (chunk.mesh) {
          chunk.mesh.traverse(child => {
            if (child.isMesh && child.renderOrder === 2) {
              const uvAttr = child.geometry.attributes.uv;
              if (uvAttr) {
                for (let i = 0; i < uvAttr.count; i++) {
                  uvAttr.setX(i, uvAttr.getX(i) + dt * 0.03);
                }
                uvAttr.needsUpdate = true;
              }
            }
          });
        }
      });

      // 6. Target Block Raycasting & Outline Box
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

      // 7. Dynamic Chunk Streaming (Throttled for ultra-smooth 60 FPS)
      chunkCheckTimer += dt;
      const currentChunkX = Math.floor(player.x / CHUNK_SIZE);
      const currentChunkZ = Math.floor(player.z / CHUNK_SIZE);
      if (currentChunkX !== lastPlayerChunkX || currentChunkZ !== lastPlayerChunkZ || chunkCheckTimer > 0.35) {
        lastPlayerChunkX = currentChunkX;
        lastPlayerChunkZ = currentChunkZ;
        chunkCheckTimer = 0;
        updateLoadedChunks();
      }

      // 8. Update Debug Info
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

      // Double Space for Flight Mode Toggle
      if (e.code === 'Space') {
        const now = performance.now();
        if (!e.repeat) {
          if (now - lastSpacePressTime < 320) {
            player.isFlying = !player.isFlying;
            lastSpacePressTime = 0;
            if (player.isFlying) {
              player.vy = 4.0;
              player.onGround = false;
              showToast('Flight Enabled (Space: Up, Shift: Down)');
            } else {
              player.vy = 0;
              showToast('Flight Disabled');
            }
            const dbgFlight = document.getElementById('debugFlight');
            if (dbgFlight) dbgFlight.textContent = player.isFlying ? 'Active' : 'Off';
          } else {
            lastSpacePressTime = now;
          }
        }
      }

      // Hotbar Slot Numbers 1-9
      if (e.code >= 'Digit1' && e.code <= 'Digit9') {
        const idx = parseInt(e.code.replace('Digit', '')) - 1;
        selectHotbarSlot(idx);
      }

      // Inventory Toggle [E]
      if (e.code === 'KeyE') {
        toggleInventory();
      }

      // Flight Toggle Shortcut [F]
      if (e.code === 'KeyF') {
        player.isFlying = !player.isFlying;
        showToast(player.isFlying ? 'Flight Enabled (Space: Up, Shift: Down)' : 'Flight Disabled');
        const dbgFlight = document.getElementById('debugFlight');
        if (dbgFlight) dbgFlight.textContent = player.isFlying ? 'Active' : 'Off';
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
      // Reset input keys on pointerlock change to eliminate phantom auto-walking
      for (const k in keys) keys[k] = false;
      player.vx = 0;
      player.vz = 0;
      lastSpacePressTime = 0;
    });

    window.addEventListener('blur', () => {
      for (const k in keys) keys[k] = false;
      player.vx = 0;
      player.vz = 0;
    });

    window.addEventListener('mousemove', e => {
      if (!isPointerLocked) return;
      // Clamp extreme mouse movement spikes for ultra-smooth aiming
      const dx = Math.max(-100, Math.min(100, e.movementX));
      const dy = Math.max(-100, Math.min(100, e.movementY));
      player.yaw -= dx * settings.mouseSensitivity;
      player.pitch -= dy * settings.mouseSensitivity;
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
        if (scene && scene.fog) {
          scene.fog.near = Math.max(16, settings.renderDistance * CHUNK_SIZE * 0.65);
          scene.fog.far = settings.renderDistance * CHUNK_SIZE;
        }
        updateLoadedChunks();
      });
    }

    if (sSens) {
      sSens.addEventListener('input', e => {
        const val = parseInt(e.target.value);
        settings.mouseSensitivity = val * 0.0001;
        document.getElementById('valSensitivity').textContent = `Speed (${settings.mouseSensitivity.toFixed(4)})`;
      });
    }

    if (sFov) {
      sFov.addEventListener('input', e => {
        settings.fov = parseInt(e.target.value);
        document.getElementById('valFOV').textContent = `${settings.fov} deg`;
        if (camera) {
          camera.fov = settings.fov;
          camera.updateProjectionMatrix();
        }
      });
    }

    if (sVol) {
      sVol.addEventListener('input', e => {
        const val = parseInt(e.target.value);
        settings.soundVolume = val / 100;
        document.getElementById('valSoundVolume').textContent = `${val}%`;
      });
    }

    if (sDay) {
      sDay.addEventListener('input', e => {
        settings.dayCycleSpeed = parseInt(e.target.value);
        const labels = ['Paused', 'Normal (4 min)', 'Fast (2 min)', 'Ultra (1 min)'];
        document.getElementById('valDayCycle').textContent = labels[settings.dayCycleSpeed];
      });
    }

    if (cFog) {
      cFog.addEventListener('change', e => {
        settings.fogEnabled = e.target.checked;
        if (scene) {
          const fn = Math.max(16, settings.renderDistance * CHUNK_SIZE * 0.65);
          const ff = settings.renderDistance * CHUNK_SIZE;
          scene.fog = settings.fogEnabled
            ? new THREE.Fog(renderer.getClearColor(new THREE.Color()), fn, ff)
            : null;
        }
      });
    }

    if (cAO) {
      cAO.addEventListener('change', e => {
        settings.smoothLighting = e.target.checked;
        chunks.forEach(chunk => meshChunk(chunk));
      });
    }
  }

  // =========================================================================
  // Game State Controllers
  // =========================================================================
  function startGame() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('gameHUD').style.display = 'flex';
    isPaused = false;
    // Ensure player is safely above terrain on start
    const floorH = getTerrainHeight(Math.floor(player.x), Math.floor(player.z));
    if (player.y < floorH + 1) {
      player.y = floorH + 1.2;
      player.vy = 0;
    }
    syncGameModeUI();
    document.body.requestPointerLock();
  }

  function pauseGame() {
    isPaused = true;
    document.getElementById('pauseMenu').style.display = 'flex';
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
    const pauseNextText = document.getElementById('pauseNextModeText');

    if (settings.gameMode === 'creative') {
      if (badge) badge.textContent = 'Creative';
      if (survivalHUD) survivalHUD.style.display = 'none';
      if (pauseNextText) pauseNextText.textContent = 'Survival';
    } else {
      if (badge) badge.textContent = 'Survival';
      if (survivalHUD) survivalHUD.style.display = 'flex';
      if (pauseNextText) pauseNextText.textContent = 'Creative';
      player.isFlying = false;
    }
  }

  function toggleSound() {
    settings.soundMuted = !settings.soundMuted;
    const iconOn = document.getElementById('soundIconOn');
    const iconOff = document.getElementById('soundIconOff');
    if (iconOn && iconOff) {
      iconOn.style.display = settings.soundMuted ? 'none' : 'block';
      iconOff.style.display = settings.soundMuted ? 'block' : 'none';
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }

  // =========================================================================
  // Persistence (LocalStorage)
  // =========================================================================
  const STORAGE_KEY = 'square_era_world_v1';

  function saveWorldToStorage() {
    try {
      const data = {
        seed: 42,
        player: { x: player.x, y: player.y, z: player.z, yaw: player.yaw, pitch: player.pitch, hotbar: player.hotbar },
        dayTime: dayTime,
        modifications: Array.from(worldModifications.entries())
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not save world to local storage:', e);
    }
  }

  function loadWorldFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data.player) {
        player.x = data.player.x;
        player.y = data.player.y;
        player.z = data.player.z;
        player.yaw = data.player.yaw;
        player.pitch = data.player.pitch;
        if (data.player.hotbar) player.hotbar = data.player.hotbar;
      }
      if (typeof data.dayTime === 'number') dayTime = data.dayTime;
      if (data.modifications) {
        worldModifications.clear();
        data.modifications.forEach(([k, v]) => worldModifications.set(k, v));
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  // =========================================================================
  // Bootstrapping
  // =========================================================================
  window.addEventListener('DOMContentLoaded', () => {
    loadWorldFromStorage();
    initGame();
  });

})();
