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

  // Block IDs (Includes architecture & decorative blocks for villages & cities)
  // Block IDs (Comprehensive Minecraft Java Edition Catalog)
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
    TNT: 19,
    STONE_BRICKS: 20,
    GLOWSTONE: 21,
    ROSE: 22,
    POLISHED_STONE: 23,
    LAVA: 24,
    IGNITER: 25,
    OBSIDIAN: 26,
    AMETHYST: 27,

    // Building Blocks
    COARSE_DIRT: 28,
    PODZOL: 29,
    MYCELIUM: 30,
    GRAVEL: 31,
    RED_SAND: 32,
    CLAY: 33,
    MUD: 34,
    PACKED_MUD: 35,
    MOSSY_COBBLE: 36,
    SLIME_BLOCK: 37,
    HONEY_BLOCK: 38,
    SPONGE: 39,
    ICE: 40,
    PACKED_ICE: 41,
    BLUE_ICE: 42,
    CRYING_OBSIDIAN: 43,
    NETHERRACK: 44,
    END_STONE: 45,
    PURPUR_BLOCK: 46,
    PRISMARINE: 47,
    DARK_PRISMARINE: 48,
    HAY_BALE: 49,
    TARGET_BLOCK: 50,
    LANTERN: 51,
    CAMPFIRE: 52,
    SCAFFOLDING: 53,

    // Wood & Plant Sets
    SPRUCE_LOG: 54,
    SPRUCE_PLANKS: 55,
    SPRUCE_LEAVES: 56,
    BIRCH_LOG: 57,
    BIRCH_PLANKS: 58,
    BIRCH_LEAVES: 59,
    JUNGLE_LOG: 60,
    JUNGLE_PLANKS: 61,
    JUNGLE_LEAVES: 62,
    ACACIA_LOG: 63,
    ACACIA_PLANKS: 64,
    DARK_OAK_LOG: 65,
    DARK_OAK_PLANKS: 66,
    CHERRY_LOG: 67,
    CHERRY_PLANKS: 68,
    CHERRY_LEAVES: 69,
    MANGROVE_LOG: 70,
    MANGROVE_PLANKS: 71,
    BAMBOO_BLOCK: 72,
    CACTUS: 73,
    SUGAR_CANE: 74,
    KELP: 75,
    LILY_PAD: 76,
    VINES: 77,
    POPLAR_LOG: 78,
    POPLAR_PLANKS: 79,
    POPLAR_LEAVES: 80,

    // Ores & Minerals
    COPPER_ORE: 81,
    REDSTONE_ORE: 82,
    LAPIS_ORE: 83,
    EMERALD_ORE: 84,
    NETHER_QUARTZ_ORE: 85,
    ANCIENT_DEBRIS: 86,
    RAW_IRON: 87,
    RAW_COPPER: 88,
    RAW_GOLD: 89,
    IRON_INGOT: 90,
    COPPER_INGOT: 91,
    GOLD_INGOT: 92,
    NETHERITE_INGOT: 93,
    DIAMOND: 94,
    EMERALD: 95,
    LAPIS_LAZULI: 96,
    REDSTONE_DUST: 97,
    NETHER_QUARTZ: 98,
    AMETHYST_SHARD: 99,
    FLINT: 100,

    // Food & Farming
    APPLE: 101,
    GOLDEN_APPLE: 102,
    BREAD: 103,
    CARROT: 104,
    GOLDEN_CARROT: 105,
    POTATO: 106,
    BAKED_POTATO: 107,
    MELON_SLICE: 108,
    SWEET_BERRIES: 109,
    COOKED_BEEF: 110,
    COOKED_PORKCHOP: 111,
    COOKED_CHICKEN: 112,
    COOKED_MUTTON: 113,
    COOKED_FISH: 114,
    EGG: 115,
    MILK_BUCKET: 116,
    HONEY_BOTTLE: 117,
    WHEAT: 118,
    WHEAT_SEEDS: 119,
    BONE_MEAL: 120,

    // Tools & Combat
    DIAMOND_SWORD: 121,
    IRON_SWORD: 122,
    DIAMOND_PICKAXE: 123,
    IRON_PICKAXE: 124,
    DIAMOND_AXE: 125,
    IRON_AXE: 126,
    DIAMOND_SHOVEL: 127,
    BOW: 128,
    ARROW: 129,
    SHIELD: 130,
    TOTEM_OF_UNDYING: 131,
    ENDER_PEARL: 132,
    EYE_OF_ENDER: 133,
    SHEARS: 134,
    COMPASS: 135,
    CLOCK: 136,
    WATER_BUCKET: 137,
    LAVA_BUCKET: 138,
    ELYTRA: 139,

    // Workstations & Storage
    CRAFTING_TABLE: 140,
    FURNACE: 141,
    BLAST_FURNACE: 142,
    SMOKER: 143,
    ANVIL: 144,
    ENCHANTING_TABLE: 145,
    BREWING_STAND: 146,
    CAULDRON: 147,
    CHEST: 148,
    BARREL: 149,
    HOPPER: 150,
    DISPENSER: 151,
    JUKEBOX: 152,
    NOTE_BLOCK: 153,
    BED: 154,

    // Redstone & Mechanisms
    REDSTONE_TORCH: 155,
    REPEATER: 156,
    COMPARATOR: 157,
    LEVER: 158,
    BUTTON: 159,
    PRESSURE_PLATE: 160,
    PISTON: 161,
    STICKY_PISTON: 162,
    REDSTONE_LAMP: 163,
    OBSERVER: 164,
    RAIL: 165,
    POWERED_RAIL: 166,

    // Dyes & Decorative
    WHITE_DYE: 167,
    ORANGE_DYE: 168,
    MAGENTA_DYE: 169,
    LIGHT_BLUE_DYE: 170,
    YELLOW_DYE: 171,
    LIME_DYE: 172,
    PINK_DYE: 173,
    GRAY_DYE: 174,
    CYAN_DYE: 175,
    PURPLE_DYE: 176,
    BLUE_DYE: 177,
    BROWN_DYE: 178,
    GREEN_DYE: 179,
    RED_DYE: 180,
    BLACK_DYE: 181,
    POPPY: 182,
    DANDELION: 183,
    TULIP: 184,
    BLUE_ORCHID: 185,
    SUNFLOWER: 186,
    WITHER_ROSE: 187,
    CANDLE: 188,
    CAKE: 189,

    // Potions & Magic
    POTION_HEALING: 190,
    POTION_REGEN: 191,
    POTION_FIRE_RES: 192,
    POTION_SWIFTNESS: 193,
    POTION_NIGHT_VISION: 194,
    POTION_STRENGTH: 195,
    POTION_INVISIBILITY: 196,
    POTION_POISON: 197,

    // Spawn Eggs
    SPAWN_CREEPER: 198,
    SPAWN_ZOMBIE: 199,
    SPAWN_SKELETON: 200,
    SPAWN_SPIDER: 201,
    SPAWN_ENDERMAN: 202,
    SPAWN_PIG: 203,
    SPAWN_COW: 204,
    SPAWN_SHEEP: 205,
    SPAWN_CHICKEN: 206,
    SPAWN_VILLAGER: 207,
    SPAWN_GOLEM: 208,
    SPAWN_WOLF: 209,
    SPAWN_SLIME: 210,
    SPAWN_BLAZE: 211,
    SPAWN_WARDEN: 212
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
    [BLOCKS.TNT]: 'TNT Explosive',
    [BLOCKS.STONE_BRICKS]: 'Stone Bricks',
    [BLOCKS.GLOWSTONE]: 'Glowstone Lantern',
    [BLOCKS.ROSE]: 'Red Rose Flower',
    [BLOCKS.POLISHED_STONE]: 'Polished Stone',
    [BLOCKS.LAVA]: 'Molten Lava',
    [BLOCKS.IGNITER]: 'Igniter (Flint & Steel)',
    [BLOCKS.OBSIDIAN]: 'Obsidian Block',
    [BLOCKS.AMETHYST]: 'Amethyst Crystal',

    // Building
    [BLOCKS.COARSE_DIRT]: 'Coarse Dirt',
    [BLOCKS.PODZOL]: 'Podzol',
    [BLOCKS.MYCELIUM]: 'Mycelium',
    [BLOCKS.GRAVEL]: 'Gravel',
    [BLOCKS.RED_SAND]: 'Red Sand',
    [BLOCKS.CLAY]: 'Clay Block',
    [BLOCKS.MUD]: 'Mud',
    [BLOCKS.PACKED_MUD]: 'Packed Mud',
    [BLOCKS.MOSSY_COBBLE]: 'Mossy Cobblestone',
    [BLOCKS.SLIME_BLOCK]: 'Slime Block',
    [BLOCKS.HONEY_BLOCK]: 'Honey Block',
    [BLOCKS.SPONGE]: 'Sponge',
    [BLOCKS.ICE]: 'Ice',
    [BLOCKS.PACKED_ICE]: 'Packed Ice',
    [BLOCKS.BLUE_ICE]: 'Blue Ice',
    [BLOCKS.CRYING_OBSIDIAN]: 'Crying Obsidian',
    [BLOCKS.NETHERRACK]: 'Netherrack',
    [BLOCKS.END_STONE]: 'End Stone',
    [BLOCKS.PURPUR_BLOCK]: 'Purpur Block',
    [BLOCKS.PRISMARINE]: 'Prismarine',
    [BLOCKS.DARK_PRISMARINE]: 'Dark Prismarine',
    [BLOCKS.HAY_BALE]: 'Hay Bale',
    [BLOCKS.TARGET_BLOCK]: 'Target Block',
    [BLOCKS.LANTERN]: 'Lantern',
    [BLOCKS.CAMPFIRE]: 'Campfire',
    [BLOCKS.SCAFFOLDING]: 'Scaffolding',

    // Wood sets
    [BLOCKS.SPRUCE_LOG]: 'Spruce Log',
    [BLOCKS.SPRUCE_PLANKS]: 'Spruce Planks',
    [BLOCKS.SPRUCE_LEAVES]: 'Spruce Leaves',
    [BLOCKS.BIRCH_LOG]: 'Birch Log',
    [BLOCKS.BIRCH_PLANKS]: 'Birch Planks',
    [BLOCKS.BIRCH_LEAVES]: 'BirCH Leaves',
    [BLOCKS.JUNGLE_LOG]: 'Jungle Log',
    [BLOCKS.JUNGLE_PLANKS]: 'Jungle Planks',
    [BLOCKS.JUNGLE_LEAVES]: 'Jungle Leaves',
    [BLOCKS.ACACIA_LOG]: 'Acacia Log',
    [BLOCKS.ACACIA_PLANKS]: 'Acacia Planks',
    [BLOCKS.DARK_OAK_LOG]: 'Dark Oak Log',
    [BLOCKS.DARK_OAK_PLANKS]: 'Dark Oak Planks',
    [BLOCKS.CHERRY_LOG]: 'Cherry Log',
    [BLOCKS.CHERRY_PLANKS]: 'Cherry Planks',
    [BLOCKS.CHERRY_LEAVES]: 'Cherry Leaves',
    [BLOCKS.MANGROVE_LOG]: 'Mangrove Log',
    [BLOCKS.MANGROVE_PLANKS]: 'Mangrove Planks',
    [BLOCKS.BAMBOO_BLOCK]: 'Bamboo Block',
    [BLOCKS.CACTUS]: 'Cactus',
    [BLOCKS.SUGAR_CANE]: 'Sugar Cane',
    [BLOCKS.KELP]: 'Kelp',
    [BLOCKS.LILY_PAD]: 'Lily Pad',
    [BLOCKS.VINES]: 'Vines',
    [BLOCKS.POPLAR_LOG]: 'Poplar Log',
    [BLOCKS.POPLAR_PLANKS]: 'Poplar Planks',
    [BLOCKS.POPLAR_LEAVES]: 'Poplar Leaves',

    // Ores & Minerals
    [BLOCKS.COPPER_ORE]: 'Copper Ore',
    [BLOCKS.REDSTONE_ORE]: 'Redstone Ore',
    [BLOCKS.LAPIS_ORE]: 'Lapis Lazuli Ore',
    [BLOCKS.EMERALD_ORE]: 'Emerald Ore',
    [BLOCKS.NETHER_QUARTZ_ORE]: 'Nether Quartz Ore',
    [BLOCKS.ANCIENT_DEBRIS]: 'Ancient Debris',
    [BLOCKS.RAW_IRON]: 'Raw Iron',
    [BLOCKS.RAW_COPPER]: 'Raw Copper',
    [BLOCKS.RAW_GOLD]: 'Raw Gold',
    [BLOCKS.IRON_INGOT]: 'Iron Ingot',
    [BLOCKS.COPPER_INGOT]: 'Copper Ingot',
    [BLOCKS.GOLD_INGOT]: 'Gold Ingot',
    [BLOCKS.NETHERITE_INGOT]: 'Netherite Ingot',
    [BLOCKS.DIAMOND]: 'Diamond Gem',
    [BLOCKS.EMERALD]: 'Emerald Gem',
    [BLOCKS.LAPIS_LAZULI]: 'Lapis Lazuli',
    [BLOCKS.REDSTONE_DUST]: 'Redstone Dust',
    [BLOCKS.NETHER_QUARTZ]: 'Nether Quartz',
    [BLOCKS.AMETHYST_SHARD]: 'Amethyst Shard',
    [BLOCKS.FLINT]: 'Flint',

    // Food & Farming
    [BLOCKS.APPLE]: 'Red Apple',
    [BLOCKS.GOLDEN_APPLE]: 'Golden Apple',
    [BLOCKS.BREAD]: 'Fresh Bread',
    [BLOCKS.CARROT]: 'Golden Carrot',
    [BLOCKS.GOLDEN_CARROT]: 'Golden Carrot',
    [BLOCKS.POTATO]: 'Potato',
    [BLOCKS.BAKED_POTATO]: 'Baked Potato',
    [BLOCKS.MELON_SLICE]: 'Melon Slice',
    [BLOCKS.SWEET_BERRIES]: 'Sweet Berries',
    [BLOCKS.COOKED_BEEF]: 'Cooked Beef Steak',
    [BLOCKS.COOKED_PORKCHOP]: 'Cooked Porkchop',
    [BLOCKS.COOKED_CHICKEN]: 'Cooked Chicken',
    [BLOCKS.COOKED_MUTTON]: 'Cooked Mutton',
    [BLOCKS.COOKED_FISH]: 'Cooked Cod Fish',
    [BLOCKS.EGG]: 'Chicken Egg',
    [BLOCKS.MILK_BUCKET]: 'Milk Bucket',
    [BLOCKS.HONEY_BOTTLE]: 'Honey Bottle',
    [BLOCKS.WHEAT]: 'Wheat Harvest',
    [BLOCKS.WHEAT_SEEDS]: 'Wheat Seeds',
    [BLOCKS.BONE_MEAL]: 'Bone Meal Fertilizer',

    // Tools & Combat
    [BLOCKS.DIAMOND_SWORD]: 'Diamond Sword',
    [BLOCKS.IRON_SWORD]: 'Iron Sword',
    [BLOCKS.DIAMOND_PICKAXE]: 'Diamond Pickaxe',
    [BLOCKS.IRON_PICKAXE]: 'Iron Pickaxe',
    [BLOCKS.DIAMOND_AXE]: 'Diamond Axe',
    [BLOCKS.IRON_AXE]: 'Iron Axe',
    [BLOCKS.DIAMOND_SHOVEL]: 'Diamond Shovel',
    [BLOCKS.BOW]: 'Archers Bow',
    [BLOCKS.ARROW]: 'Arrow',
    [BLOCKS.SHIELD]: 'Knight Shield',
    [BLOCKS.TOTEM_OF_UNDYING]: 'Totem of Undying',
    [BLOCKS.ENDER_PEARL]: 'Ender Pearl',
    [BLOCKS.EYE_OF_ENDER]: 'Eye of Ender',
    [BLOCKS.SHEARS]: 'Shears',
    [BLOCKS.COMPASS]: 'Magnetic Compass',
    [BLOCKS.CLOCK]: 'Celestial Clock',
    [BLOCKS.WATER_BUCKET]: 'Water Bucket',
    [BLOCKS.LAVA_BUCKET]: 'Lava Bucket',
    [BLOCKS.ELYTRA]: 'Elytra Wings',

    // Workstations & Storage
    [BLOCKS.CRAFTING_TABLE]: 'Crafting Table',
    [BLOCKS.FURNACE]: 'Smelting Furnace',
    [BLOCKS.BLAST_FURNACE]: 'Blast Furnace',
    [BLOCKS.SMOKER]: 'Food Smoker',
    [BLOCKS.ANVIL]: 'Heavy Anvil',
    [BLOCKS.ENCHANTING_TABLE]: 'Enchanting Table',
    [BLOCKS.BREWING_STAND]: 'Brewing Stand',
    [BLOCKS.CAULDRON]: 'Cauldron',
    [BLOCKS.CHEST]: 'Wooden Chest',
    [BLOCKS.BARREL]: 'Storage Barrel',
    [BLOCKS.HOPPER]: 'Hopper Funnel',
    [BLOCKS.DISPENSER]: 'Dispenser Mechanism',
    [BLOCKS.JUKEBOX]: 'Music Jukebox',
    [BLOCKS.NOTE_BLOCK]: 'Note Block',
    [BLOCKS.BED]: 'Cozy Red Bed',

    // Redstone
    [BLOCKS.REDSTONE_TORCH]: 'Redstone Torch',
    [BLOCKS.REPEATER]: 'Redstone Repeater',
    [BLOCKS.COMPARATOR]: 'Redstone Comparator',
    [BLOCKS.LEVER]: 'Toggle Lever',
    [BLOCKS.BUTTON]: 'Stone Button',
    [BLOCKS.PRESSURE_PLATE]: 'Pressure Plate',
    [BLOCKS.PISTON]: 'Mechanical Piston',
    [BLOCKS.STICKY_PISTON]: 'Sticky Piston',
    [BLOCKS.REDSTONE_LAMP]: 'Redstone Lamp',
    [BLOCKS.OBSERVER]: 'Observer Sensor',
    [BLOCKS.RAIL]: 'Minecart Rail',
    [BLOCKS.POWERED_RAIL]: 'Powered Golden Rail',

    // Dyes & Decor
    [BLOCKS.WHITE_DYE]: 'White Dye',
    [BLOCKS.ORANGE_DYE]: 'Orange Dye',
    [BLOCKS.MAGENTA_DYE]: 'Magenta Dye',
    [BLOCKS.LIGHT_BLUE_DYE]: 'Light Blue Dye',
    [BLOCKS.YELLOW_DYE]: 'Yellow Dye',
    [BLOCKS.LIME_DYE]: 'Lime Green Dye',
    [BLOCKS.PINK_DYE]: 'Pink Dye',
    [BLOCKS.GRAY_DYE]: 'Gray Dye',
    [BLOCKS.CYAN_DYE]: 'Cyan Dye',
    [BLOCKS.PURPLE_DYE]: 'Purple Dye',
    [BLOCKS.BLUE_DYE]: 'Blue Dye',
    [BLOCKS.BROWN_DYE]: 'Brown Dye',
    [BLOCKS.GREEN_DYE]: 'Green Dye',
    [BLOCKS.RED_DYE]: 'Red Dye',
    [BLOCKS.BLACK_DYE]: 'Black Dye',
    [BLOCKS.POPPY]: 'Red Poppy',
    [BLOCKS.DANDELION]: 'Yellow Dandelion',
    [BLOCKS.TULIP]: 'Orange Tulip',
    [BLOCKS.BLUE_ORCHID]: 'Blue Orchid',
    [BLOCKS.SUNFLOWER]: 'Radiant Sunflower',
    [BLOCKS.WITHER_ROSE]: 'Wither Rose',
    [BLOCKS.CANDLE]: 'Lit Candle',
    [BLOCKS.CAKE]: 'Delicious Cake',

    // Potions
    [BLOCKS.POTION_HEALING]: 'Potion of Healing',
    [BLOCKS.POTION_REGEN]: 'Potion of Regeneration',
    [BLOCKS.POTION_FIRE_RES]: 'Potion of Fire Resistance',
    [BLOCKS.POTION_SWIFTNESS]: 'Potion of Swiftness',
    [BLOCKS.POTION_NIGHT_VISION]: 'Potion of Night Vision',
    [BLOCKS.POTION_STRENGTH]: 'Potion of Strength',
    [BLOCKS.POTION_INVISIBILITY]: 'Potion of Invisibility',
    [BLOCKS.POTION_POISON]: 'Potion of Poison',

    // Spawn Eggs
    [BLOCKS.SPAWN_CREEPER]: 'Creeper Spawn Egg',
    [BLOCKS.SPAWN_ZOMBIE]: 'Zombie Spawn Egg',
    [BLOCKS.SPAWN_SKELETON]: 'Skeleton Spawn Egg',
    [BLOCKS.SPAWN_SPIDER]: 'Spider Spawn Egg',
    [BLOCKS.SPAWN_ENDERMAN]: 'Enderman Spawn Egg',
    [BLOCKS.SPAWN_PIG]: 'Pig Spawn Egg',
    [BLOCKS.SPAWN_COW]: 'Cow Spawn Egg',
    [BLOCKS.SPAWN_SHEEP]: 'Sheep Spawn Egg',
    [BLOCKS.SPAWN_CHICKEN]: 'Chicken Spawn Egg',
    [BLOCKS.SPAWN_VILLAGER]: 'Villager Spawn Egg',
    [BLOCKS.SPAWN_GOLEM]: 'Iron Golem Spawn Egg',
    [BLOCKS.SPAWN_WOLF]: 'Wolf Spawn Egg',
    [BLOCKS.SPAWN_SLIME]: 'Slime Spawn Egg',
    [BLOCKS.SPAWN_BLAZE]: 'Blaze Spawn Egg',
    [BLOCKS.SPAWN_WARDEN]: 'Warden Spawn Egg'
  };


  // Item Category Mapping for Tabbed Palette & Search Filtering
  const ITEM_CATEGORIES = {
    [BLOCKS.GRASS]: 'building', [BLOCKS.DIRT]: 'building', [BLOCKS.STONE]: 'building',
    [BLOCKS.COBBLESTONE]: 'building', [BLOCKS.SAND]: 'building', [BLOCKS.GLASS]: 'building',
    [BLOCKS.WATER]: 'building', [BLOCKS.BEDROCK]: 'building', [BLOCKS.SNOW]: 'building',
    [BLOCKS.BRICKS]: 'building', [BLOCKS.STONE_BRICKS]: 'building', [BLOCKS.GLOWSTONE]: 'building',
    [BLOCKS.POLISHED_STONE]: 'building', [BLOCKS.LAVA]: 'building', [BLOCKS.OBSIDIAN]: 'building',
    [BLOCKS.AMETHYST]: 'building', [BLOCKS.COARSE_DIRT]: 'building', [BLOCKS.PODZOL]: 'building',
    [BLOCKS.MYCELIUM]: 'building', [BLOCKS.GRAVEL]: 'building', [BLOCKS.RED_SAND]: 'building',
    [BLOCKS.CLAY]: 'building', [BLOCKS.MUD]: 'building', [BLOCKS.PACKED_MUD]: 'building',
    [BLOCKS.MOSSY_COBBLE]: 'building', [BLOCKS.SLIME_BLOCK]: 'building', [BLOCKS.HONEY_BLOCK]: 'building',
    [BLOCKS.SPONGE]: 'building', [BLOCKS.ICE]: 'building', [BLOCKS.PACKED_ICE]: 'building',
    [BLOCKS.BLUE_ICE]: 'building', [BLOCKS.CRYING_OBSIDIAN]: 'building', [BLOCKS.NETHERRACK]: 'building',
    [BLOCKS.END_STONE]: 'building', [BLOCKS.PURPUR_BLOCK]: 'building', [BLOCKS.PRISMARINE]: 'building',
    [BLOCKS.DARK_PRISMARINE]: 'building', [BLOCKS.HAY_BALE]: 'building', [BLOCKS.TARGET_BLOCK]: 'building',
    [BLOCKS.LANTERN]: 'building', [BLOCKS.CAMPFIRE]: 'building', [BLOCKS.SCAFFOLDING]: 'building',

    [BLOCKS.WOOD]: 'wood', [BLOCKS.LEAVES]: 'wood', [BLOCKS.PLANKS]: 'wood',
    [BLOCKS.SPRUCE_LOG]: 'wood', [BLOCKS.SPRUCE_PLANKS]: 'wood', [BLOCKS.SPRUCE_LEAVES]: 'wood',
    [BLOCKS.BIRCH_LOG]: 'wood', [BLOCKS.BIRCH_PLANKS]: 'wood', [BLOCKS.BIRCH_LEAVES]: 'wood',
    [BLOCKS.JUNGLE_LOG]: 'wood', [BLOCKS.JUNGLE_PLANKS]: 'wood', [BLOCKS.JUNGLE_LEAVES]: 'wood',
    [BLOCKS.ACACIA_LOG]: 'wood', [BLOCKS.ACACIA_PLANKS]: 'wood', [BLOCKS.DARK_OAK_LOG]: 'wood',
    [BLOCKS.DARK_OAK_PLANKS]: 'wood', [BLOCKS.CHERRY_LOG]: 'wood', [BLOCKS.CHERRY_PLANKS]: 'wood',
    [BLOCKS.CHERRY_LEAVES]: 'wood', [BLOCKS.MANGROVE_LOG]: 'wood', [BLOCKS.MANGROVE_PLANKS]: 'wood',
    [BLOCKS.BAMBOO_BLOCK]: 'wood', [BLOCKS.CACTUS]: 'wood', [BLOCKS.SUGAR_CANE]: 'wood',
    [BLOCKS.KELP]: 'wood', [BLOCKS.LILY_PAD]: 'wood', [BLOCKS.VINES]: 'wood',
    [BLOCKS.POPLAR_LOG]: 'wood', [BLOCKS.POPLAR_PLANKS]: 'wood', [BLOCKS.POPLAR_LEAVES]: 'wood',

    [BLOCKS.COAL_ORE]: 'ores', [BLOCKS.IRON_ORE]: 'ores', [BLOCKS.GOLD_ORE]: 'ores',
    [BLOCKS.DIAMOND_ORE]: 'ores', [BLOCKS.COPPER_ORE]: 'ores', [BLOCKS.REDSTONE_ORE]: 'ores',
    [BLOCKS.LAPIS_ORE]: 'ores', [BLOCKS.EMERALD_ORE]: 'ores', [BLOCKS.NETHER_QUARTZ_ORE]: 'ores',
    [BLOCKS.ANCIENT_DEBRIS]: 'ores', [BLOCKS.RAW_IRON]: 'ores', [BLOCKS.RAW_COPPER]: 'ores',
    [BLOCKS.RAW_GOLD]: 'ores', [BLOCKS.IRON_INGOT]: 'ores', [BLOCKS.COPPER_INGOT]: 'ores',
    [BLOCKS.GOLD_INGOT]: 'ores', [BLOCKS.NETHERITE_INGOT]: 'ores', [BLOCKS.DIAMOND]: 'ores',
    [BLOCKS.EMERALD]: 'ores', [BLOCKS.LAPIS_LAZULI]: 'ores', [BLOCKS.REDSTONE_DUST]: 'ores',
    [BLOCKS.NETHER_QUARTZ]: 'ores', [BLOCKS.AMETHYST_SHARD]: 'ores', [BLOCKS.FLINT]: 'ores',

    [BLOCKS.APPLE]: 'food', [BLOCKS.GOLDEN_APPLE]: 'food', [BLOCKS.BREAD]: 'food',
    [BLOCKS.CARROT]: 'food', [BLOCKS.GOLDEN_CARROT]: 'food', [BLOCKS.POTATO]: 'food',
    [BLOCKS.BAKED_POTATO]: 'food', [BLOCKS.MELON_SLICE]: 'food', [BLOCKS.SWEET_BERRIES]: 'food',
    [BLOCKS.COOKED_BEEF]: 'food', [BLOCKS.COOKED_PORKCHOP]: 'food', [BLOCKS.COOKED_CHICKEN]: 'food',
    [BLOCKS.COOKED_MUTTON]: 'food', [BLOCKS.COOKED_FISH]: 'food', [BLOCKS.EGG]: 'food',
    [BLOCKS.MILK_BUCKET]: 'food', [BLOCKS.HONEY_BOTTLE]: 'food', [BLOCKS.WHEAT]: 'food',
    [BLOCKS.WHEAT_SEEDS]: 'food', [BLOCKS.BONE_MEAL]: 'food',

    [BLOCKS.TNT]: 'tools', [BLOCKS.IGNITER]: 'tools', [BLOCKS.DIAMOND_SWORD]: 'tools',
    [BLOCKS.IRON_SWORD]: 'tools', [BLOCKS.DIAMOND_PICKAXE]: 'tools', [BLOCKS.IRON_PICKAXE]: 'tools',
    [BLOCKS.DIAMOND_AXE]: 'tools', [BLOCKS.IRON_AXE]: 'tools', [BLOCKS.DIAMOND_SHOVEL]: 'tools',
    [BLOCKS.BOW]: 'tools', [BLOCKS.ARROW]: 'tools', [BLOCKS.SHIELD]: 'tools',
    [BLOCKS.TOTEM_OF_UNDYING]: 'tools', [BLOCKS.ENDER_PEARL]: 'tools', [BLOCKS.EYE_OF_ENDER]: 'tools',
    [BLOCKS.SHEARS]: 'tools', [BLOCKS.COMPASS]: 'tools', [BLOCKS.CLOCK]: 'tools',
    [BLOCKS.WATER_BUCKET]: 'tools', [BLOCKS.LAVA_BUCKET]: 'tools', [BLOCKS.ELYTRA]: 'tools',

    [BLOCKS.BOOKSHELF]: 'workstations', [BLOCKS.CRAFTING_TABLE]: 'workstations',
    [BLOCKS.FURNACE]: 'workstations', [BLOCKS.BLAST_FURNACE]: 'workstations',
    [BLOCKS.SMOKER]: 'workstations', [BLOCKS.ANVIL]: 'workstations',
    [BLOCKS.ENCHANTING_TABLE]: 'workstations', [BLOCKS.BREWING_STAND]: 'workstations',
    [BLOCKS.CAULDRON]: 'workstations', [BLOCKS.CHEST]: 'workstations',
    [BLOCKS.BARREL]: 'workstations', [BLOCKS.HOPPER]: 'workstations',
    [BLOCKS.DISPENSER]: 'workstations', [BLOCKS.JUKEBOX]: 'workstations',
    [BLOCKS.NOTE_BLOCK]: 'workstations', [BLOCKS.BED]: 'workstations',

    [BLOCKS.REDSTONE_TORCH]: 'redstone', [BLOCKS.REPEATER]: 'redstone',
    [BLOCKS.COMPARATOR]: 'redstone', [BLOCKS.LEVER]: 'redstone', [BLOCKS.BUTTON]: 'redstone',
    [BLOCKS.PRESSURE_PLATE]: 'redstone', [BLOCKS.PISTON]: 'redstone',
    [BLOCKS.STICKY_PISTON]: 'redstone', [BLOCKS.REDSTONE_LAMP]: 'redstone',
    [BLOCKS.OBSERVER]: 'redstone', [BLOCKS.RAIL]: 'redstone', [BLOCKS.POWERED_RAIL]: 'redstone',

    [BLOCKS.ROSE]: 'decor', [BLOCKS.WHITE_DYE]: 'decor', [BLOCKS.ORANGE_DYE]: 'decor',
    [BLOCKS.MAGENTA_DYE]: 'decor', [BLOCKS.LIGHT_BLUE_DYE]: 'decor', [BLOCKS.YELLOW_DYE]: 'decor',
    [BLOCKS.LIME_DYE]: 'decor', [BLOCKS.PINK_DYE]: 'decor', [BLOCKS.GRAY_DYE]: 'decor',
    [BLOCKS.CYAN_DYE]: 'decor', [BLOCKS.PURPLE_DYE]: 'decor', [BLOCKS.BLUE_DYE]: 'decor',
    [BLOCKS.BROWN_DYE]: 'decor', [BLOCKS.GREEN_DYE]: 'decor', [BLOCKS.RED_DYE]: 'decor',
    [BLOCKS.BLACK_DYE]: 'decor', [BLOCKS.POPPY]: 'decor', [BLOCKS.DANDELION]: 'decor',
    [BLOCKS.TULIP]: 'decor', [BLOCKS.BLUE_ORCHID]: 'decor', [BLOCKS.SUNFLOWER]: 'decor',
    [BLOCKS.WITHER_ROSE]: 'decor', [BLOCKS.CANDLE]: 'decor', [BLOCKS.CAKE]: 'decor',

    [BLOCKS.POTION_HEALING]: 'potions', [BLOCKS.POTION_REGEN]: 'potions',
    [BLOCKS.POTION_FIRE_RES]: 'potions', [BLOCKS.POTION_SWIFTNESS]: 'potions',
    [BLOCKS.POTION_NIGHT_VISION]: 'potions', [BLOCKS.POTION_STRENGTH]: 'potions',
    [BLOCKS.POTION_INVISIBILITY]: 'potions', [BLOCKS.POTION_POISON]: 'potions',

    [BLOCKS.SPAWN_CREEPER]: 'eggs', [BLOCKS.SPAWN_ZOMBIE]: 'eggs', [BLOCKS.SPAWN_SKELETON]: 'eggs',
    [BLOCKS.SPAWN_SPIDER]: 'eggs', [BLOCKS.SPAWN_ENDERMAN]: 'eggs', [BLOCKS.SPAWN_PIG]: 'eggs',
    [BLOCKS.SPAWN_COW]: 'eggs', [BLOCKS.SPAWN_SHEEP]: 'eggs', [BLOCKS.SPAWN_CHICKEN]: 'eggs',
    [BLOCKS.SPAWN_VILLAGER]: 'eggs', [BLOCKS.SPAWN_GOLEM]: 'eggs', [BLOCKS.SPAWN_WOLF]: 'eggs',
    [BLOCKS.SPAWN_SLIME]: 'eggs', [BLOCKS.SPAWN_BLAZE]: 'eggs', [BLOCKS.SPAWN_WARDEN]: 'eggs'
  };

  const BLOCK_TRANSPARENT = {
    [BLOCKS.AIR]: true,
    [BLOCKS.LEAVES]: true,
    [BLOCKS.SPRUCE_LEAVES]: true,
    [BLOCKS.BIRCH_LEAVES]: true,
    [BLOCKS.JUNGLE_LEAVES]: true,
    [BLOCKS.CHERRY_LEAVES]: true,
    [BLOCKS.POPLAR_LEAVES]: true,
    [BLOCKS.GLASS]: true,
    [BLOCKS.WATER]: true,
    [BLOCKS.LAVA]: true,
    [BLOCKS.ICE]: true,
    [BLOCKS.BLUE_ICE]: true,
    [BLOCKS.SLIME_BLOCK]: true,
    [BLOCKS.HONEY_BLOCK]: true,
    [BLOCKS.ROSE]: true,
    [BLOCKS.POPPY]: true,
    [BLOCKS.DANDELION]: true,
    [BLOCKS.TULIP]: true,
    [BLOCKS.BLUE_ORCHID]: true,
    [BLOCKS.SUNFLOWER]: true,
    [BLOCKS.WITHER_ROSE]: true,
    [BLOCKS.SUGAR_CANE]: true,
    [BLOCKS.KELP]: true,
    [BLOCKS.LILY_PAD]: true,
    [BLOCKS.VINES]: true,
    [BLOCKS.REDSTONE_TORCH]: true,
    [BLOCKS.REDSTONE_DUST]: true,
    [BLOCKS.RAIL]: true,
    [BLOCKS.POWERED_RAIL]: true,
    [BLOCKS.LANTERN]: true,
    [BLOCKS.IGNITER]: true
  };

  // Detect mobile touchscreen devices
  const isMobileDevice = (typeof window !== 'undefined') && (
    ('ontouchstart' in window) ||
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
    (typeof window.innerWidth === 'number' && window.innerWidth <= 820) ||
    (typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || ''))
  );

  // User Settings State
  const settings = {
    renderDistance: isMobileDevice ? 3 : 4,
    mouseSensitivity: 0.0025,
    touchSensitivity: 0.0035,
    touchControls: 'auto', // 'auto', 'on', 'off'
    mobilePreset: 'balanced', // 'performance' (0.85x), 'balanced' (1.0x), 'sharp' (1.25x)
    fov: 75,
    soundVolume: 0.7,
    soundMuted: false,
    dayCycleSpeed: 1, // 0: off, 1: normal, 2: fast, 3: ultra
    fogEnabled: true,
    smoothLighting: true,
    gameMode: 'creative' // 'creative' or 'survival'
  };

  function getTargetPixelRatio() {
    if (typeof window === 'undefined') return 1.0;
    const dpr = window.devicePixelRatio || 1.0;
    if (isMobileDevice) {
      if (settings.mobilePreset === 'performance') return Math.min(dpr, 0.85);
      if (settings.mobilePreset === 'sharp') return Math.min(dpr, 1.25);
      return Math.min(dpr, 1.0);
    }
    return Math.min(dpr, 1.5);
  }

  // Mobile Touch Input State
  const touchMoveState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprinting: false
  };

  const touchActionState = {
    jump: false,
    flyUp: false,
    flyDown: false
  };

  let activeLookTouchId = null;
  let lastLookTouchX = 0;
  let lastLookTouchY = 0;
  let lookTouchStartTime = 0;
  let lookTouchStartX = 0;
  let lookTouchStartY = 0;
  let activeBreakInterval = null;
  let lastJumpTapTime = 0;

  // Player State (Spawn on open village cobblestone street)
  const player = {
    x: 7.5,
    y: 28.0,
    z: 3.5,
    vx: 0,
    vy: 0,
    vz: 0,
    pitch: 0,
    yaw: 0,
    targetPitch: 0,
    targetYaw: 0,
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

  // Chunk Meshing Queue for butter-smooth staggered frame pacing
  const chunkMeshQueue = [];

  // Three.js Core Globals
  let scene, camera, renderer;
  let sunLight, ambientLight, moonLight;
  let sunMesh, moonMesh, starField, skyDome;
  let cloudMesh, cloudTex;
  let npcs = [];
  let mobs = [];
  let primedTNTs = [];
  const aiNodeCores = [];
  let activeNearbyAICore = null;
  let isAiChatOpen = false;
  let multiplayerManager;
  let activeInvCategory = 'all';
  let invSearchQuery = '';
  const playerEffects = { swiftness: 0, regen: 0, fireRes: 0, nightVision: 0, strength: 0 };
  let cameraShake = 0;
  let handGroup, handArmMesh, handItemMesh;
  let wireframeTargetBox;
  let chunks = new Map(); // "cx,cz" => Chunk
  let threeTextures = {};
  let particles = [];
  let isPointerLocked = false;
  let lastFrameTime = performance.now();
  let lastSpacePressTime = 0;
  let dayTime = 0.25; // 0: dawn, 0.25: noon, 0.5: sunset, 0.75: midnight
  let isPaused = true;
  let isInventoryOpen = false;
  let isDead = false;

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

    // 19. Stone Bricks (32x32 Chiseled Masonry Blocks)
    texCanvases.stone_bricks = createPixelCanvas(ctx => {
      ctx.fillStyle = '#7a8288';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#4b5156';
      // Mortar courses
      ctx.fillRect(0, 7, 32, 1);
      ctx.fillRect(0, 15, 32, 1);
      ctx.fillRect(0, 23, 32, 1);
      ctx.fillRect(0, 31, 32, 1);
      // Vertical joints
      ctx.fillRect(16, 0, 1, 7);
      ctx.fillRect(8, 8, 1, 7);
      ctx.fillRect(24, 8, 1, 7);
      ctx.fillRect(16, 16, 1, 7);
      ctx.fillRect(8, 24, 1, 7);
      ctx.fillRect(24, 24, 1, 7);
      // Bevel & texture noise
      for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 32; y++) {
          if (seededNoise(x, y, 20) > 0.8) {
            ctx.fillStyle = '#8f979e';
            ctx.fillRect(x, y, 1, 1);
          } else if (seededNoise(x, y, 20) < 0.2) {
            ctx.fillStyle = '#656c72';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });

    // 20. Glowstone Lantern (32x32 Glowing Amber Glass Lamp)
    texCanvases.glowstone = createPixelCanvas(ctx => {
      ctx.fillStyle = '#eab308';
      ctx.fillRect(0, 0, 32, 32);
      // Warm amber frame
      ctx.fillStyle = '#854d0e';
      ctx.fillRect(0, 0, 32, 2);
      ctx.fillRect(0, 30, 32, 2);
      ctx.fillRect(0, 0, 2, 32);
      ctx.fillRect(30, 0, 2, 32);
      // Radiant crystalline core
      for (let x = 2; x < 30; x++) {
        for (let y = 2; y < 30; y++) {
          const r = seededNoise(x, y, 21);
          if (r > 0.75) ctx.fillStyle = '#fef08a';
          else if (r > 0.45) ctx.fillStyle = '#fde047';
          else if (r > 0.2) ctx.fillStyle = '#ca8a04';
          else ctx.fillStyle = '#a16207';
          ctx.fillRect(x, y, 1, 1);
        }
      }
      // Bright center sparkle
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(14, 14, 4, 4);
    });

    // 21. Red Rose Flower (32x32 Garden Flora)
    texCanvases.rose = createPixelCanvas(ctx => {
      ctx.clearRect(0, 0, 32, 32);
      // Green stem
      ctx.fillStyle = '#15803d';
      ctx.fillRect(15, 14, 2, 18);
      // Side leaves
      ctx.fillRect(11, 22, 4, 2);
      ctx.fillRect(17, 18, 4, 2);
      // Red flower petals
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(10, 6, 12, 10);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(12, 4, 8, 12);
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(12, 8, 8, 6);
      // Core highlight
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(14, 7, 4, 3);
    });

    // 22. Polished Stone Tiles (32x32 City Avenue Pavement)
    texCanvases.polished_stone = createPixelCanvas(ctx => {
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(0, 0, 32, 32);
      // Beveled tile grid (4 quadrants)
      ctx.fillStyle = '#64748b';
      ctx.fillRect(0, 15, 32, 2);
      ctx.fillRect(15, 0, 2, 32);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(0, 0, 32, 1);
      ctx.fillRect(0, 0, 1, 32);
      ctx.fillRect(0, 16, 32, 1);
      ctx.fillRect(16, 0, 1, 32);
      // Marble speckles
      for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 32; y++) {
          if (seededNoise(x, y, 22) > 0.85) {
            ctx.fillStyle = '#f1f5f9';
            ctx.fillRect(x, y, 1, 1);
          } else if (seededNoise(x, y, 22) < 0.15) {
            ctx.fillStyle = '#475569';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });

    // 23. Molten Lava (32x32 Magma with Radiant Heat Crust)
    texCanvases.lava = createPixelCanvas(ctx => {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0, 0, 32, 32);
      for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 32; y++) {
          const n = seededNoise(x, y, 99);
          if (n > 0.72) {
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(x, y, 1, 1);
          } else if (n > 0.45) {
            ctx.fillStyle = '#ea580c';
            ctx.fillRect(x, y, 1, 1);
          } else if (n > 0.25) {
            ctx.fillStyle = '#b91c1c';
            ctx.fillRect(x, y, 1, 1);
          } else {
            ctx.fillStyle = '#7f1d1d';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(6, 8, 8, 2);
      ctx.fillRect(18, 20, 10, 2);
      ctx.fillRect(12, 14, 4, 4);
    });

    // 24. Igniter / Flint and Steel (32x32 Metallic Striker & Fire Spark)
    texCanvases.igniter = createPixelCanvas(ctx => {
      ctx.clearRect(0, 0, 32, 32);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(8, 6, 12, 4);
      ctx.fillRect(6, 8, 4, 14);
      ctx.fillRect(8, 20, 12, 4);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(8, 7, 10, 2);
      ctx.fillStyle = '#334155';
      ctx.fillRect(14, 12, 8, 8);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(16, 14, 6, 6);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(21, 10, 4, 4);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(23, 8, 3, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(22, 11, 2, 2);
    });

    // 25. Obsidian (32x32 Deep Violet-Black Blast-Resistant Basalt)
    texCanvases.obsidian = createPixelCanvas(ctx => {
      ctx.fillStyle = '#120b1e';
      ctx.fillRect(0, 0, 32, 32);
      for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 32; y++) {
          const r = seededNoise(x, y, 105);
          if (r > 0.85) {
            ctx.fillStyle = '#3b1d60';
            ctx.fillRect(x, y, 1, 1);
          } else if (r > 0.65) {
            ctx.fillStyle = '#221138';
            ctx.fillRect(x, y, 1, 1);
          } else if (r < 0.15) {
            ctx.fillStyle = '#0a0512';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });

    // 26. Amethyst (32x32 Radiant Crystalline Gemstone)
    texCanvases.amethyst = createPixelCanvas(ctx => {
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(0, 0, 32, 32);
      for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 32; y++) {
          const r = seededNoise(x, y, 112);
          if (r > 0.82) {
            ctx.fillStyle = '#c084fc';
            ctx.fillRect(x, y, 1, 1);
          } else if (r > 0.5) {
            ctx.fillStyle = '#9333ea';
            ctx.fillRect(x, y, 1, 1);
          } else if (r < 0.2) {
            ctx.fillStyle = '#581c87';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
      ctx.fillStyle = '#f3e8ff';
      ctx.fillRect(8, 8, 3, 3);
      ctx.fillRect(20, 18, 4, 4);
      drawPixelBevel(ctx, 'rgba(255,255,255,0.4)', 'rgba(0,0,0,0.4)');
    });

    // Convert canvases to Three.js Textures
    threeTextures = {};
    for (const key in texCanvases) {
      const tex = new THREE.CanvasTexture(texCanvases[key]);
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestMipmapNearestFilter;
      if (key === 'water' || key === 'lava') {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
      }
      threeTextures[key] = tex;
    }

    // Material Helper

    // -------------------------------------------------------------------------
    // Procedural 32x32 Textures for All Minecraft Java Catalog Items
    // -------------------------------------------------------------------------
    function drawBorderBox(ctx, bg, border, w = 32, h = 32) {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = border;
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
    }

    function addNoiseGrains(ctx, color, threshold = 0.75, count = 28) {
      ctx.fillStyle = color;
      for (let i = 0; i < count; i++) {
        const x = Math.floor(Math.random() * 30) + 1;
        const y = Math.floor(Math.random() * 30) + 1;
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Building Blocks
    texCanvases.coarse_dirt = createPixelCanvas(ctx => {
      ctx.fillStyle = '#775235'; ctx.fillRect(0, 0, 32, 32);
      addNoiseGrains(ctx, '#5c3e26', 0.6, 50);
      addNoiseGrains(ctx, '#936a49', 0.6, 30);
    });
    texCanvases.podzol = createPixelCanvas(ctx => {
      ctx.fillStyle = '#5c3e28'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#3a2717'; ctx.fillRect(4, 4, 24, 6); ctx.fillRect(10, 16, 14, 8);
    });
    texCanvases.mycelium = createPixelCanvas(ctx => {
      ctx.fillStyle = '#6e6268'; ctx.fillRect(0, 0, 32, 32);
      addNoiseGrains(ctx, '#8e7984', 0.5, 45);
      addNoiseGrains(ctx, '#54464d', 0.5, 30);
    });
    texCanvases.gravel = createPixelCanvas(ctx => {
      ctx.fillStyle = '#787373'; ctx.fillRect(0, 0, 32, 32);
      addNoiseGrains(ctx, '#585252', 0.5, 55);
      addNoiseGrains(ctx, '#9c9595', 0.5, 40);
    });
    texCanvases.red_sand = createPixelCanvas(ctx => {
      ctx.fillStyle = '#bd6729'; ctx.fillRect(0, 0, 32, 32);
      addNoiseGrains(ctx, '#9e4e1a', 0.5, 40);
    });
    texCanvases.clay = createPixelCanvas(ctx => {
      ctx.fillStyle = '#a0a7b5'; ctx.fillRect(0, 0, 32, 32);
      addNoiseGrains(ctx, '#868d9c', 0.5, 35);
    });
    texCanvases.mud = createPixelCanvas(ctx => {
      ctx.fillStyle = '#3c3437'; ctx.fillRect(0, 0, 32, 32);
      addNoiseGrains(ctx, '#2a2427', 0.5, 40);
    });
    texCanvases.packed_mud = createPixelCanvas(ctx => {
      ctx.fillStyle = '#8f5c3a'; ctx.fillRect(0, 0, 32, 32);
      drawPixelBevel(ctx, '#a86f48', '#694125');
    });
    texCanvases.mossy_cobble = createPixelCanvas(ctx => {
      ctx.drawImage(texCanvases.cobblestone, 0, 0);
      ctx.fillStyle = 'rgba(74, 128, 46, 0.7)';
      ctx.fillRect(2, 2, 12, 10); ctx.fillRect(16, 14, 14, 12);
    });
    texCanvases.slime_block = createPixelCanvas(ctx => {
      ctx.fillStyle = '#7acb64'; ctx.fillRect(0, 0, 32, 32);
      drawBorderBox(ctx, 'rgba(135, 222, 110, 0.85)', '#4e9938');
    });
    texCanvases.honey_block = createPixelCanvas(ctx => {
      ctx.fillStyle = '#f59e0b'; ctx.fillRect(0, 0, 32, 32);
      drawBorderBox(ctx, '#fbbf24', '#b45309');
    });
    texCanvases.sponge = createPixelCanvas(ctx => {
      ctx.fillStyle = '#c8c049'; ctx.fillRect(0, 0, 32, 32);
      addNoiseGrains(ctx, '#878028', 0.5, 50);
    });
    texCanvases.ice = createPixelCanvas(ctx => {
      ctx.fillStyle = '#9bd3f7'; ctx.fillRect(0, 0, 32, 32);
      drawBorderBox(ctx, 'rgba(186, 230, 253, 0.65)', '#38bdf8');
    });
    texCanvases.packed_ice = createPixelCanvas(ctx => {
      ctx.fillStyle = '#7ec5f2'; ctx.fillRect(0, 0, 32, 32);
      drawPixelBevel(ctx, '#a5dbf8', '#4fa2da');
    });
    texCanvases.blue_ice = createPixelCanvas(ctx => {
      ctx.fillStyle = '#4ba7f2'; ctx.fillRect(0, 0, 32, 32);
      drawPixelBevel(ctx, '#79c3f8', '#2576c0');
    });
    texCanvases.crying_obsidian = createPixelCanvas(ctx => {
      ctx.drawImage(texCanvases.obsidian, 0, 0);
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(6, 4, 4, 14); ctx.fillRect(18, 12, 5, 12);
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(7, 6, 2, 6);
    });
    texCanvases.netherrack = createPixelCanvas(ctx => {
      ctx.fillStyle = '#652323'; ctx.fillRect(0, 0, 32, 32);
      addNoiseGrains(ctx, '#451212', 0.5, 50);
      addNoiseGrains(ctx, '#8a3333', 0.5, 30);
    });
    texCanvases.end_stone = createPixelCanvas(ctx => {
      ctx.fillStyle = '#dfdf9f'; ctx.fillRect(0, 0, 32, 32);
      addNoiseGrains(ctx, '#b5b572', 0.5, 45);
    });
    texCanvases.purpur_block = createPixelCanvas(ctx => {
      ctx.fillStyle = '#a371a3'; ctx.fillRect(0, 0, 32, 32);
      drawPixelBevel(ctx, '#be8fbe', '#7a4e7a');
    });
    texCanvases.prismarine = createPixelCanvas(ctx => {
      ctx.fillStyle = '#5c968c'; ctx.fillRect(0, 0, 32, 32);
      drawPixelBevel(ctx, '#77b2a8', '#3f6d65');
    });
    texCanvases.dark_prismarine = createPixelCanvas(ctx => {
      ctx.fillStyle = '#2d544c'; ctx.fillRect(0, 0, 32, 32);
      drawPixelBevel(ctx, '#3f6f65', '#1a3731');
    });
    texCanvases.hay_bale = createPixelCanvas(ctx => {
      ctx.fillStyle = '#d4af37'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(0, 8, 32, 3); ctx.fillRect(0, 20, 32, 3);
    });
    texCanvases.target_block = createPixelCanvas(ctx => {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#ef4444';
      ctx.strokeRect(4, 4, 24, 24); ctx.fillRect(12, 12, 8, 8);
    });
    texCanvases.lantern = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#334155'; ctx.fillRect(8, 6, 16, 20);
      ctx.fillStyle = '#fbbf24'; ctx.fillRect(10, 10, 12, 12);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(14, 14, 4, 4);
    });
    texCanvases.campfire = createPixelCanvas(ctx => {
      ctx.fillStyle = '#5c3a21'; ctx.fillRect(4, 20, 24, 8);
      ctx.fillStyle = '#ea580c'; ctx.fillRect(10, 10, 12, 10);
      ctx.fillStyle = '#fde047'; ctx.fillRect(13, 8, 6, 8);
    });
    texCanvases.scaffolding = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(4, 0, 3, 32); ctx.fillRect(25, 0, 3, 32);
      ctx.fillRect(0, 4, 32, 3); ctx.fillRect(0, 25, 32, 3);
    });

    // Wood sets
    texCanvases.spruce_log = createPixelCanvas(ctx => {
      ctx.fillStyle = '#422e1b'; ctx.fillRect(0, 0, 32, 32);
      addNoiseGrains(ctx, '#2c1e11', 0.5, 40);
    });
    texCanvases.spruce_planks = createPixelCanvas(ctx => {
      ctx.fillStyle = '#684e32'; ctx.fillRect(0, 0, 32, 32);
      drawPixelBevel(ctx, '#7d6041', '#4c3722');
    });
    texCanvases.spruce_leaves = createPixelCanvas(ctx => {
      ctx.fillStyle = '#2e5539'; ctx.fillRect(0, 0, 32, 32);
      addNoiseGrains(ctx, '#1e3825', 0.5, 45);
    });
    texCanvases.birch_log = createPixelCanvas(ctx => {
      ctx.fillStyle = '#dbdbd2'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#262423';
      ctx.fillRect(4, 8, 8, 3); ctx.fillRect(16, 20, 10, 3);
    });
    texCanvases.birch_planks = createPixelCanvas(ctx => {
      ctx.fillStyle = '#c5b583'; ctx.fillRect(0, 0, 32, 32);
      drawPixelBevel(ctx, '#d6c898', '#a89868');
    });
    texCanvases.birch_leaves = createPixelCanvas(ctx => {
      ctx.fillStyle = '#597e32'; ctx.fillRect(0, 0, 32, 32);
      addNoiseGrains(ctx, '#709938', 0.5, 40);
    });
    texCanvases.jungle_log = createPixelCanvas(ctx => {
      ctx.fillStyle = '#554419'; ctx.fillRect(0, 0, 32, 32);
      addNoiseGrains(ctx, '#3d300e', 0.5, 40);
    });
    texCanvases.jungle_planks = createPixelCanvas(ctx => {
      ctx.fillStyle = '#9c6f50'; ctx.fillRect(0, 0, 32, 32);
      drawPixelBevel(ctx, '#b07f5c', '#7e573c');
    });
    texCanvases.jungle_leaves = createPixelCanvas(ctx => {
      ctx.fillStyle = '#397818'; ctx.fillRect(0, 0, 32, 32);
      addNoiseGrains(ctx, '#4c9623', 0.5, 45);
    });
    texCanvases.acacia_log = createPixelCanvas(ctx => {
      ctx.fillStyle = '#655e56'; ctx.fillRect(0, 0, 32, 32);
      addNoiseGrains(ctx, '#4d4741', 0.5, 40);
    });
    texCanvases.acacia_planks = createPixelCanvas(ctx => {
      ctx.fillStyle = '#ad5832'; ctx.fillRect(0, 0, 32, 32);
      drawPixelBevel(ctx, '#c4693d', '#8b4324');
    });
    texCanvases.dark_oak_log = createPixelCanvas(ctx => {
      ctx.fillStyle = '#2f2112'; ctx.fillRect(0, 0, 32, 32);
      addNoiseGrains(ctx, '#1f160b', 0.5, 40);
    });
    texCanvases.dark_oak_planks = createPixelCanvas(ctx => {
      ctx.fillStyle = '#422c19'; ctx.fillRect(0, 0, 32, 32);
      drawPixelBevel(ctx, '#543820', '#2e1d10');
    });
    texCanvases.cherry_log = createPixelCanvas(ctx => {
      ctx.fillStyle = '#3a2024'; ctx.fillRect(0, 0, 32, 32);
      addNoiseGrains(ctx, '#2b171a', 0.5, 40);
    });
    texCanvases.cherry_planks = createPixelCanvas(ctx => {
      ctx.fillStyle = '#d98b96'; ctx.fillRect(0, 0, 32, 32);
      drawPixelBevel(ctx, '#e49fa9', '#b56d78');
    });
    texCanvases.cherry_leaves = createPixelCanvas(ctx => {
      ctx.fillStyle = '#f472b6'; ctx.fillRect(0, 0, 32, 32);
      addNoiseGrains(ctx, '#ec4899', 0.5, 45);
      addNoiseGrains(ctx, '#ffffff', 0.3, 20);
    });
    texCanvases.mangrove_log = createPixelCanvas(ctx => {
      ctx.fillStyle = '#542d27'; ctx.fillRect(0, 0, 32, 32);
      addNoiseGrains(ctx, '#3d1f1a', 0.5, 40);
    });
    texCanvases.mangrove_planks = createPixelCanvas(ctx => {
      ctx.fillStyle = '#75342a'; ctx.fillRect(0, 0, 32, 32);
      drawPixelBevel(ctx, '#8b4135', '#57231a');
    });
    texCanvases.bamboo_block = createPixelCanvas(ctx => {
      ctx.fillStyle = '#83a83e'; ctx.fillRect(0, 0, 32, 32);
      drawPixelBevel(ctx, '#98bd4e', '#698a2e');
    });
    texCanvases.cactus = createPixelCanvas(ctx => {
      ctx.fillStyle = '#4d7828'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#1e380b';
      ctx.fillRect(6, 6, 2, 2); ctx.fillRect(20, 10, 2, 2); ctx.fillRect(10, 22, 2, 2);
    });
    texCanvases.sugar_cane = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#84cc16';
      ctx.fillRect(8, 0, 4, 32); ctx.fillRect(20, 0, 4, 32);
    });
    texCanvases.kelp = createPixelCanvas(ctx => {
      ctx.fillStyle = '#15803d'; ctx.fillRect(8, 0, 16, 32);
      addNoiseGrains(ctx, '#166534', 0.5, 30);
    });
    texCanvases.lily_pad = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#166534';
      ctx.beginPath(); ctx.arc(16, 16, 12, 0, Math.PI * 1.8); ctx.fill();
    });
    texCanvases.vines = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(4, 0, 3, 32); ctx.fillRect(14, 4, 3, 28); ctx.fillRect(24, 0, 3, 30);
    });
    texCanvases.poplar_log = createPixelCanvas(ctx => {
      ctx.fillStyle = '#78716c'; ctx.fillRect(0, 0, 32, 32);
      addNoiseGrains(ctx, '#57534e', 0.5, 40);
    });
    texCanvases.poplar_planks = createPixelCanvas(ctx => {
      ctx.fillStyle = '#a8a29e'; ctx.fillRect(0, 0, 32, 32);
      drawPixelBevel(ctx, '#d6d3d1', '#78716c');
    });
    texCanvases.poplar_leaves = createPixelCanvas(ctx => {
      ctx.fillStyle = '#eab308'; ctx.fillRect(0, 0, 32, 32);
      addNoiseGrains(ctx, '#ca8a04', 0.5, 40);
    });

    // Ores & Minerals
    texCanvases.copper_ore = createPixelCanvas(ctx => {
      ctx.drawImage(texCanvases.stone, 0, 0);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(6, 6, 6, 6); ctx.fillRect(18, 16, 7, 7);
      ctx.fillStyle = '#06b6d4'; ctx.fillRect(8, 8, 3, 3);
    });
    texCanvases.redstone_ore = createPixelCanvas(ctx => {
      ctx.drawImage(texCanvases.stone, 0, 0);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(8, 8, 5, 5); ctx.fillRect(18, 16, 6, 6); ctx.fillRect(10, 22, 4, 4);
    });
    texCanvases.lapis_ore = createPixelCanvas(ctx => {
      ctx.drawImage(texCanvases.stone, 0, 0);
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(6, 10, 6, 6); ctx.fillRect(18, 8, 7, 7);
    });
    texCanvases.emerald_ore = createPixelCanvas(ctx => {
      ctx.drawImage(texCanvases.stone, 0, 0);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(8, 8, 6, 6); ctx.fillRect(16, 16, 8, 8);
    });
    texCanvases.nether_quartz_ore = createPixelCanvas(ctx => {
      ctx.drawImage(texCanvases.netherrack, 0, 0);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(8, 6, 6, 8); ctx.fillRect(18, 16, 7, 8);
    });
    texCanvases.ancient_debris = createPixelCanvas(ctx => {
      ctx.fillStyle = '#4c3933'; ctx.fillRect(0, 0, 32, 32);
      drawPixelBevel(ctx, '#654e46', '#2b1f1b');
    });

    // Items (Ingots, Gems, Dusts)
    function drawIngot(ctx, color, highlight) {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = color;
      ctx.fillRect(6, 12, 20, 10);
      ctx.fillStyle = highlight;
      ctx.fillRect(6, 10, 20, 3); ctx.fillRect(6, 10, 3, 12);
    }
    texCanvases.raw_iron = createPixelCanvas(ctx => { drawIngot(ctx, '#d4a373', '#faedcd'); });
    texCanvases.raw_copper = createPixelCanvas(ctx => { drawIngot(ctx, '#ea580c', '#fdba74'); });
    texCanvases.raw_gold = createPixelCanvas(ctx => { drawIngot(ctx, '#eab308', '#fef08a'); });
    texCanvases.iron_ingot = createPixelCanvas(ctx => { drawIngot(ctx, '#cbd5e1', '#ffffff'); });
    texCanvases.copper_ingot = createPixelCanvas(ctx => { drawIngot(ctx, '#ea580c', '#fdba74'); });
    texCanvases.gold_ingot = createPixelCanvas(ctx => { drawIngot(ctx, '#facc15', '#fef9c3'); });
    texCanvases.netherite_ingot = createPixelCanvas(ctx => { drawIngot(ctx, '#33272a', '#524347'); });
    texCanvases.diamond = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath(); ctx.moveTo(16, 4); ctx.lineTo(26, 14); ctx.lineTo(16, 28); ctx.lineTo(6, 14); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(14, 10, 4, 4);
    });
    texCanvases.emerald = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(8, 6, 16, 20); ctx.fillStyle = '#6ee7b7'; ctx.fillRect(12, 10, 8, 12);
    });
    texCanvases.lapis_lazuli = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#1d4ed8'; ctx.fillRect(8, 8, 16, 16);
      ctx.fillStyle = '#60a5fa'; ctx.fillRect(12, 12, 6, 6);
    });
    texCanvases.redstone_dust = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(10, 10, 4, 4); ctx.fillRect(18, 12, 4, 4); ctx.fillRect(14, 18, 5, 5);
    });
    texCanvases.nether_quartz = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#f8fafc'; ctx.fillRect(10, 8, 12, 16);
    });
    texCanvases.amethyst_shard = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#a855f7';
      ctx.beginPath(); ctx.moveTo(16, 4); ctx.lineTo(24, 26); ctx.lineTo(16, 22); ctx.lineTo(8, 26); ctx.closePath(); ctx.fill();
    });
    texCanvases.flint = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#475569'; ctx.fillRect(8, 8, 16, 14);
    });

    // Foods
    function drawApple(ctx, color) {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(16, 18, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5c3a21'; ctx.fillRect(15, 4, 2, 6);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(12, 12, 3, 3);
    }
    texCanvases.apple = createPixelCanvas(ctx => { drawApple(ctx, '#ef4444'); });
    texCanvases.golden_apple = createPixelCanvas(ctx => { drawApple(ctx, '#facc15'); });
    texCanvases.bread = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#b45309'; ctx.fillRect(6, 12, 20, 10);
      ctx.fillStyle = '#d97706'; ctx.fillRect(8, 10, 16, 3);
    });
    texCanvases.carrot = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#ea580c'; ctx.fillRect(10, 12, 12, 16);
      ctx.fillStyle = '#16a34a'; ctx.fillRect(13, 4, 6, 8);
    });
    texCanvases.golden_carrot = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#facc15'; ctx.fillRect(10, 12, 12, 16);
      ctx.fillStyle = '#4ade80'; ctx.fillRect(13, 4, 6, 8);
    });
    texCanvases.potato = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#ca8a04'; ctx.fillRect(8, 10, 16, 12);
    });
    texCanvases.baked_potato = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#92400e'; ctx.fillRect(8, 10, 16, 12);
    });
    texCanvases.melon_slice = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(16, 14, 12, 0, Math.PI); ctx.fill();
      ctx.fillStyle = '#16a34a'; ctx.fillRect(4, 14, 24, 3);
    });
    texCanvases.sweet_berries = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#dc2626';
      ctx.beginPath(); ctx.arc(12, 16, 5, 0, Math.PI * 2); ctx.arc(20, 18, 5, 0, Math.PI * 2); ctx.fill();
    });
    texCanvases.cooked_beef = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#652323'; ctx.fillRect(6, 10, 20, 12);
    });
    texCanvases.cooked_porkchop = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#f87171'; ctx.fillRect(6, 10, 20, 12);
    });
    texCanvases.cooked_chicken = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#d97706'; ctx.fillRect(8, 10, 16, 12);
    });
    texCanvases.cooked_mutton = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#78350f'; ctx.fillRect(6, 10, 20, 12);
    });
    texCanvases.cooked_fish = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#0284c7'; ctx.fillRect(6, 12, 18, 8);
    });
    texCanvases.egg = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath(); ctx.ellipse(16, 16, 8, 11, 0, 0, Math.PI * 2); ctx.fill();
    });
    texCanvases.milk_bucket = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#94a3b8'; ctx.fillRect(8, 12, 16, 14);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(10, 10, 12, 6);
    });
    texCanvases.honey_bottle = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#f59e0b'; ctx.fillRect(10, 12, 12, 14);
      ctx.fillStyle = '#d97706'; ctx.fillRect(13, 6, 6, 6);
    });
    texCanvases.wheat = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#ca8a04'; ctx.fillRect(12, 4, 8, 24);
    });
    texCanvases.wheat_seeds = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#15803d'; ctx.fillRect(10, 10, 4, 4); ctx.fillRect(18, 16, 4, 4);
    });
    texCanvases.bone_meal = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#f8fafc'; ctx.fillRect(10, 10, 12, 12);
    });

    // Tools & Weapons
    function drawSword(ctx, bladeColor, hiltColor) {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = bladeColor;
      for (let i = 0; i < 14; i++) { ctx.fillRect(8 + i, 22 - i, 3, 3); }
      ctx.fillStyle = hiltColor;
      ctx.fillRect(6, 24, 6, 6);
    }
    texCanvases.diamond_sword = createPixelCanvas(ctx => { drawSword(ctx, '#38bdf8', '#5c3a21'); });
    texCanvases.iron_sword = createPixelCanvas(ctx => { drawSword(ctx, '#cbd5e1', '#5c3a21'); });

    function drawPickaxe(ctx, headColor) {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#78350f';
      for (let i = 0; i < 16; i++) { ctx.fillRect(6 + i, 24 - i, 2, 2); }
      ctx.fillStyle = headColor;
      ctx.fillRect(16, 4, 12, 4); ctx.fillRect(24, 8, 4, 8);
    }
    texCanvases.diamond_pickaxe = createPixelCanvas(ctx => { drawPickaxe(ctx, '#38bdf8'); });
    texCanvases.iron_pickaxe = createPixelCanvas(ctx => { drawPickaxe(ctx, '#cbd5e1'); });

    function drawAxe(ctx, headColor) {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#78350f';
      for (let i = 0; i < 16; i++) { ctx.fillRect(6 + i, 24 - i, 2, 2); }
      ctx.fillStyle = headColor;
      ctx.fillRect(18, 6, 8, 10);
    }
    texCanvases.diamond_axe = createPixelCanvas(ctx => { drawAxe(ctx, '#38bdf8'); });
    texCanvases.iron_axe = createPixelCanvas(ctx => { drawAxe(ctx, '#cbd5e1'); });

    texCanvases.diamond_shovel = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#78350f';
      for (let i = 0; i < 14; i++) { ctx.fillRect(6 + i, 24 - i, 2, 2); }
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(20, 4, 8, 8);
    });
    texCanvases.bow = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#92400e';
      ctx.beginPath(); ctx.arc(16, 16, 12, -Math.PI / 2, Math.PI / 2); ctx.stroke();
    });
    texCanvases.arrow = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#78350f'; ctx.fillRect(6, 15, 20, 2);
      ctx.fillStyle = '#94a3b8'; ctx.fillRect(22, 13, 6, 6);
    });
    texCanvases.shield = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#64748b'; ctx.fillRect(8, 4, 16, 24);
      ctx.fillStyle = '#3b82f6'; ctx.fillRect(10, 6, 12, 20);
    });
    texCanvases.totem_of_undying = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#eab308'; ctx.fillRect(10, 6, 12, 20);
      ctx.fillStyle = '#10b981'; ctx.fillRect(12, 10, 3, 3); ctx.fillRect(17, 10, 3, 3);
    });
    texCanvases.ender_pearl = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#065f46';
      ctx.beginPath(); ctx.arc(16, 16, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#34d399'; ctx.beginPath(); ctx.arc(14, 14, 4, 0, Math.PI * 2); ctx.fill();
    });
    texCanvases.eye_of_ender = createPixelCanvas(ctx => {
      ctx.drawImage(texCanvases.ender_pearl, 0, 0);
      ctx.fillStyle = '#ef4444'; ctx.fillRect(14, 12, 4, 8);
    });
    texCanvases.shears = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(8, 8, 8, 16); ctx.fillRect(16, 8, 8, 16);
    });
    texCanvases.compass = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#475569';
      ctx.beginPath(); ctx.arc(16, 16, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ef4444'; ctx.fillRect(15, 6, 2, 10);
    });
    texCanvases.clock = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#eab308';
      ctx.beginPath(); ctx.arc(16, 16, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1e293b'; ctx.fillRect(15, 6, 2, 10);
    });
    texCanvases.water_bucket = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#94a3b8'; ctx.fillRect(8, 12, 16, 14);
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(10, 10, 12, 6);
    });
    texCanvases.lava_bucket = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#94a3b8'; ctx.fillRect(8, 12, 16, 14);
      ctx.fillStyle = '#ea580c'; ctx.fillRect(10, 10, 12, 6);
    });
    texCanvases.elytra = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#475569';
      ctx.beginPath(); ctx.moveTo(16, 6); ctx.lineTo(6, 26); ctx.lineTo(16, 22); ctx.lineTo(26, 26); ctx.closePath(); ctx.fill();
    });

    // Workstations & Storage
    texCanvases.crafting_table = createPixelCanvas(ctx => {
      ctx.fillStyle = '#9c6f50'; ctx.fillRect(0, 0, 32, 32);
      drawPixelBevel(ctx, '#b07f5c', '#7e573c');
      ctx.fillStyle = '#5c3a21'; ctx.fillRect(4, 4, 10, 10);
    });
    texCanvases.furnace = createPixelCanvas(ctx => {
      ctx.fillStyle = '#64748b'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#1e293b'; ctx.fillRect(8, 12, 16, 14);
      ctx.fillStyle = '#ea580c'; ctx.fillRect(12, 18, 8, 6);
    });
    texCanvases.blast_furnace = createPixelCanvas(ctx => {
      ctx.fillStyle = '#475569'; ctx.fillRect(0, 0, 32, 32);
      drawPixelBevel(ctx, '#94a3b8', '#1e293b');
    });
    texCanvases.smoker = createPixelCanvas(ctx => {
      ctx.fillStyle = '#78350f'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#334155'; ctx.fillRect(6, 6, 20, 20);
    });
    texCanvases.anvil = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#334155'; ctx.fillRect(4, 6, 24, 8); ctx.fillRect(10, 14, 12, 8); ctx.fillRect(6, 22, 20, 6);
    });
    texCanvases.enchanting_table = createPixelCanvas(ctx => {
      ctx.fillStyle = '#7f1d1d'; ctx.fillRect(0, 16, 32, 16);
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, 32, 16);
      ctx.fillStyle = '#ef4444'; ctx.fillRect(10, 6, 12, 8);
    });
    texCanvases.brewing_stand = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#475569'; ctx.fillRect(14, 4, 4, 24); ctx.fillRect(6, 24, 20, 6);
    });
    texCanvases.cauldron = createPixelCanvas(ctx => {
      ctx.fillStyle = '#334155'; ctx.fillRect(4, 6, 24, 22);
      ctx.fillStyle = '#1e293b'; ctx.fillRect(8, 8, 16, 18);
    });
    texCanvases.chest = createPixelCanvas(ctx => {
      ctx.fillStyle = '#9c6f50'; ctx.fillRect(0, 0, 32, 32);
      drawPixelBevel(ctx, '#b07f5c', '#5c3a21');
      ctx.fillStyle = '#e2e8f0'; ctx.fillRect(14, 12, 4, 6);
    });
    texCanvases.barrel = createPixelCanvas(ctx => {
      ctx.fillStyle = '#854d0e'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#451a03'; ctx.fillRect(0, 6, 32, 3); ctx.fillRect(0, 22, 32, 3);
    });
    texCanvases.hopper = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#475569'; ctx.fillRect(4, 6, 24, 10); ctx.fillRect(12, 16, 8, 12);
    });
    texCanvases.dispenser = createPixelCanvas(ctx => {
      ctx.fillStyle = '#64748b'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(16, 16, 6, 0, Math.PI * 2); ctx.fill();
    });
    texCanvases.jukebox = createPixelCanvas(ctx => {
      ctx.fillStyle = '#78350f'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(12, 12, 8, 8);
    });
    texCanvases.note_block = createPixelCanvas(ctx => {
      ctx.fillStyle = '#78350f'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#0f172a'; ctx.fillRect(12, 12, 8, 8);
    });
    texCanvases.bed = createPixelCanvas(ctx => {
      ctx.fillStyle = '#dc2626'; ctx.fillRect(0, 6, 24, 20);
      ctx.fillStyle = '#f8fafc'; ctx.fillRect(20, 6, 12, 20);
      ctx.fillStyle = '#78350f'; ctx.fillRect(0, 24, 32, 4);
    });

    // Redstone
    texCanvases.redstone_torch = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#78350f'; ctx.fillRect(14, 12, 4, 16);
      ctx.fillStyle = '#ef4444'; ctx.fillRect(12, 4, 8, 8);
    });
    texCanvases.repeater = createPixelCanvas(ctx => {
      ctx.fillStyle = '#94a3b8'; ctx.fillRect(4, 16, 24, 12);
      ctx.fillStyle = '#ef4444'; ctx.fillRect(10, 8, 4, 8); ctx.fillRect(18, 8, 4, 8);
    });
    texCanvases.comparator = createPixelCanvas(ctx => {
      ctx.fillStyle = '#94a3b8'; ctx.fillRect(4, 16, 24, 12);
      ctx.fillStyle = '#ef4444'; ctx.fillRect(14, 6, 4, 10); ctx.fillRect(8, 14, 4, 8); ctx.fillRect(20, 14, 4, 8);
    });
    texCanvases.lever = createPixelCanvas(ctx => {
      ctx.fillStyle = '#64748b'; ctx.fillRect(8, 20, 16, 8);
      ctx.fillStyle = '#78350f'; ctx.fillRect(14, 6, 4, 16);
    });
    texCanvases.button = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#64748b'; ctx.fillRect(10, 12, 12, 8);
    });
    texCanvases.pressure_plate = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#94a3b8'; ctx.fillRect(4, 22, 24, 6);
    });
    texCanvases.piston = createPixelCanvas(ctx => {
      ctx.fillStyle = '#78350f'; ctx.fillRect(0, 0, 32, 8);
      ctx.fillStyle = '#64748b'; ctx.fillRect(0, 8, 32, 24);
    });
    texCanvases.sticky_piston = createPixelCanvas(ctx => {
      ctx.drawImage(texCanvases.piston, 0, 0);
      ctx.fillStyle = '#22c55e'; ctx.fillRect(8, 0, 16, 8);
    });
    texCanvases.redstone_lamp = createPixelCanvas(ctx => {
      ctx.fillStyle = '#78350f'; ctx.fillRect(0, 0, 32, 32);
      drawPixelBevel(ctx, '#b45309', '#451a03');
      ctx.fillStyle = '#fbbf24'; ctx.fillRect(8, 8, 16, 16);
    });
    texCanvases.observer = createPixelCanvas(ctx => {
      ctx.fillStyle = '#475569'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#ef4444'; ctx.fillRect(12, 12, 8, 8);
    });
    texCanvases.rail = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#94a3b8'; ctx.fillRect(4, 0, 3, 32); ctx.fillRect(25, 0, 3, 32);
      ctx.fillStyle = '#78350f'; ctx.fillRect(4, 8, 24, 2); ctx.fillRect(4, 20, 24, 2);
    });
    texCanvases.powered_rail = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#facc15'; ctx.fillRect(4, 0, 3, 32); ctx.fillRect(25, 0, 3, 32);
      ctx.fillStyle = '#ef4444'; ctx.fillRect(14, 0, 4, 32);
    });

    // Dyes
    function drawDye(ctx, color) {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.ellipse(16, 18, 9, 8, 0, 0, Math.PI * 2); ctx.fill();
    }
    texCanvases.white_dye = createPixelCanvas(ctx => { drawDye(ctx, '#ffffff'); });
    texCanvases.orange_dye = createPixelCanvas(ctx => { drawDye(ctx, '#f97316'); });
    texCanvases.magenta_dye = createPixelCanvas(ctx => { drawDye(ctx, '#d946ef'); });
    texCanvases.light_blue_dye = createPixelCanvas(ctx => { drawDye(ctx, '#38bdf8'); });
    texCanvases.yellow_dye = createPixelCanvas(ctx => { drawDye(ctx, '#eab308'); });
    texCanvases.lime_dye = createPixelCanvas(ctx => { drawDye(ctx, '#84cc16'); });
    texCanvases.pink_dye = createPixelCanvas(ctx => { drawDye(ctx, '#f472b6'); });
    texCanvases.gray_dye = createPixelCanvas(ctx => { drawDye(ctx, '#4b5563'); });
    texCanvases.cyan_dye = createPixelCanvas(ctx => { drawDye(ctx, '#06b6d4'); });
    texCanvases.purple_dye = createPixelCanvas(ctx => { drawDye(ctx, '#a855f7'); });
    texCanvases.blue_dye = createPixelCanvas(ctx => { drawDye(ctx, '#2563eb'); });
    texCanvases.brown_dye = createPixelCanvas(ctx => { drawDye(ctx, '#78350f'); });
    texCanvases.green_dye = createPixelCanvas(ctx => { drawDye(ctx, '#16a34a'); });
    texCanvases.red_dye = createPixelCanvas(ctx => { drawDye(ctx, '#dc2626'); });
    texCanvases.black_dye = createPixelCanvas(ctx => { drawDye(ctx, '#0f172a'); });

    // Flowers
    function drawFlower(ctx, petalColor, centerColor) {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#16a34a'; ctx.fillRect(15, 14, 2, 16);
      ctx.fillStyle = petalColor;
      ctx.beginPath(); ctx.arc(16, 12, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = centerColor;
      ctx.beginPath(); ctx.arc(16, 12, 3, 0, Math.PI * 2); ctx.fill();
    }
    texCanvases.poppy = createPixelCanvas(ctx => { drawFlower(ctx, '#ef4444', '#0f172a'); });
    texCanvases.dandelion = createPixelCanvas(ctx => { drawFlower(ctx, '#facc15', '#ca8a04'); });
    texCanvases.tulip = createPixelCanvas(ctx => { drawFlower(ctx, '#fb923c', '#ea580c'); });
    texCanvases.blue_orchid = createPixelCanvas(ctx => { drawFlower(ctx, '#38bdf8', '#0284c7'); });
    texCanvases.sunflower = createPixelCanvas(ctx => { drawFlower(ctx, '#facc15', '#451a03'); });
    texCanvases.wither_rose = createPixelCanvas(ctx => { drawFlower(ctx, '#1e1b4b', '#0f172a'); });
    texCanvases.candle = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#fef08a'; ctx.fillRect(13, 10, 6, 18);
      ctx.fillStyle = '#ea580c'; ctx.fillRect(14, 4, 4, 6);
    });
    texCanvases.cake = createPixelCanvas(ctx => {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(4, 10, 24, 6);
      ctx.fillStyle = '#d97706'; ctx.fillRect(4, 16, 24, 12);
      ctx.fillStyle = '#ef4444'; ctx.fillRect(8, 12, 3, 3); ctx.fillRect(18, 12, 3, 3);
    });

    // Potions
    function drawPotion(ctx, liquidColor) {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#78350f'; ctx.fillRect(13, 4, 6, 4); // Cork
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'; ctx.fillRect(12, 8, 8, 4);
      ctx.fillStyle = liquidColor;
      ctx.beginPath(); ctx.arc(16, 20, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(13, 15, 3, 3); // Glint
    }
    texCanvases.potion_healing = createPixelCanvas(ctx => { drawPotion(ctx, '#f43f5e'); });
    texCanvases.potion_regen = createPixelCanvas(ctx => { drawPotion(ctx, '#ec4899'); });
    texCanvases.potion_fire_res = createPixelCanvas(ctx => { drawPotion(ctx, '#ea580c'); });
    texCanvases.potion_swiftness = createPixelCanvas(ctx => { drawPotion(ctx, '#38bdf8'); });
    texCanvases.potion_night_vision = createPixelCanvas(ctx => { drawPotion(ctx, '#1d4ed8'); });
    texCanvases.potion_strength = createPixelCanvas(ctx => { drawPotion(ctx, '#9333ea'); });
    texCanvases.potion_invisibility = createPixelCanvas(ctx => { drawPotion(ctx, '#94a3b8'); });
    texCanvases.potion_poison = createPixelCanvas(ctx => { drawPotion(ctx, '#4d7c0f'); });

    // Spawn Eggs
    function drawSpawnEgg(ctx, baseColor, spotColor) {
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = baseColor;
      ctx.beginPath(); ctx.ellipse(16, 16, 10, 13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = spotColor;
      ctx.fillRect(12, 10, 3, 3); ctx.fillRect(18, 14, 4, 4); ctx.fillRect(13, 20, 3, 3);
    }
    texCanvases.spawn_creeper = createPixelCanvas(ctx => { drawSpawnEgg(ctx, '#22c55e', '#0f172a'); });
    texCanvases.spawn_zombie = createPixelCanvas(ctx => { drawSpawnEgg(ctx, '#15803d', '#1d4ed8'); });
    texCanvases.spawn_skeleton = createPixelCanvas(ctx => { drawSpawnEgg(ctx, '#cbd5e1', '#64748b'); });
    texCanvases.spawn_spider = createPixelCanvas(ctx => { drawSpawnEgg(ctx, '#334155', '#dc2626'); });
    texCanvases.spawn_enderman = createPixelCanvas(ctx => { drawSpawnEgg(ctx, '#0f172a', '#a855f7'); });
    texCanvases.spawn_pig = createPixelCanvas(ctx => { drawSpawnEgg(ctx, '#f472b6', '#db2777'); });
    texCanvases.spawn_cow = createPixelCanvas(ctx => { drawSpawnEgg(ctx, '#451a03', '#ffffff'); });
    texCanvases.spawn_sheep = createPixelCanvas(ctx => { drawSpawnEgg(ctx, '#ffffff', '#f472b6'); });
    texCanvases.spawn_chicken = createPixelCanvas(ctx => { drawSpawnEgg(ctx, '#ffffff', '#ef4444'); });
    texCanvases.spawn_villager = createPixelCanvas(ctx => { drawSpawnEgg(ctx, '#9a3412', '#451a03'); });
    texCanvases.spawn_golem = createPixelCanvas(ctx => { drawSpawnEgg(ctx, '#e2e8f0', '#22c55e'); });
    texCanvases.spawn_wolf = createPixelCanvas(ctx => { drawSpawnEgg(ctx, '#94a3b8', '#dc2626'); });
    texCanvases.spawn_slime = createPixelCanvas(ctx => { drawSpawnEgg(ctx, '#4ade80', '#15803d'); });
    texCanvases.spawn_blaze = createPixelCanvas(ctx => { drawSpawnEgg(ctx, '#f59e0b', '#dc2626'); });
    texCanvases.spawn_warden = createPixelCanvas(ctx => { drawSpawnEgg(ctx, '#0f172a', '#06b6d4'); });

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
    blockMaterials[BLOCKS.STONE_BRICKS] = makeCubeMats(threeTextures.stone_bricks);
    blockMaterials[BLOCKS.GLOWSTONE] = makeCubeMats(threeTextures.glowstone);
    blockMaterials[BLOCKS.ROSE] = [
      makeMat(threeTextures.rose, true, 0.95),
      makeMat(threeTextures.rose, true, 0.95),
      makeMat(threeTextures.rose, true, 0.95),
      makeMat(threeTextures.rose, true, 0.95),
      makeMat(threeTextures.rose, true, 0.95),
      makeMat(threeTextures.rose, true, 0.95)
    ];
    blockMaterials[BLOCKS.POLISHED_STONE] = makeCubeMats(threeTextures.polished_stone);
    blockMaterials[BLOCKS.LAVA] = [
      makeMat(threeTextures.lava, true, 0.90, true),
      makeMat(threeTextures.lava, true, 0.90, true),
      makeMat(threeTextures.lava, true, 0.90, true),
      makeMat(threeTextures.lava, true, 0.90, true),
      makeMat(threeTextures.lava, true, 0.90, true),
      makeMat(threeTextures.lava, true, 0.90, true)
    ];
    blockMaterials[BLOCKS.IGNITER] = makeCubeMats(threeTextures.igniter);
    blockMaterials[BLOCKS.OBSIDIAN] = makeCubeMats(threeTextures.obsidian);
    blockMaterials[BLOCKS.AMETHYST] = makeCubeMats(threeTextures.amethyst);

    // Register all expanded Minecraft block materials
    const autoBlockMappings = [
      [BLOCKS.COARSE_DIRT, 'coarse_dirt'], [BLOCKS.PODZOL, 'podzol'], [BLOCKS.MYCELIUM, 'mycelium'],
      [BLOCKS.GRAVEL, 'gravel'], [BLOCKS.RED_SAND, 'red_sand'], [BLOCKS.CLAY, 'clay'],
      [BLOCKS.MUD, 'mud'], [BLOCKS.PACKED_MUD, 'packed_mud'], [BLOCKS.MOSSY_COBBLE, 'mossy_cobble'],
      [BLOCKS.SLIME_BLOCK, 'slime_block', true], [BLOCKS.HONEY_BLOCK, 'honey_block', true],
      [BLOCKS.SPONGE, 'sponge'], [BLOCKS.ICE, 'ice', true], [BLOCKS.PACKED_ICE, 'packed_ice'],
      [BLOCKS.BLUE_ICE, 'blue_ice', true], [BLOCKS.CRYING_OBSIDIAN, 'crying_obsidian'],
      [BLOCKS.NETHERRACK, 'netherrack'], [BLOCKS.END_STONE, 'end_stone'], [BLOCKS.PURPUR_BLOCK, 'purpur_block'],
      [BLOCKS.PRISMARINE, 'prismarine'], [BLOCKS.DARK_PRISMARINE, 'dark_prismarine'],
      [BLOCKS.HAY_BALE, 'hay_bale'], [BLOCKS.TARGET_BLOCK, 'target_block'], [BLOCKS.LANTERN, 'lantern', true],
      [BLOCKS.CAMPFIRE, 'campfire'], [BLOCKS.SCAFFOLDING, 'scaffolding', true],
      [BLOCKS.SPRUCE_LOG, 'spruce_log'], [BLOCKS.SPRUCE_PLANKS, 'spruce_planks'], [BLOCKS.SPRUCE_LEAVES, 'spruce_leaves', true],
      [BLOCKS.BIRCH_LOG, 'birch_log'], [BLOCKS.BIRCH_PLANKS, 'birch_planks'], [BLOCKS.BIRCH_LEAVES, 'birch_leaves', true],
      [BLOCKS.JUNGLE_LOG, 'jungle_log'], [BLOCKS.JUNGLE_PLANKS, 'jungle_planks'], [BLOCKS.JUNGLE_LEAVES, 'jungle_leaves', true],
      [BLOCKS.ACACIA_LOG, 'acacia_log'], [BLOCKS.ACACIA_PLANKS, 'acacia_planks'],
      [BLOCKS.DARK_OAK_LOG, 'dark_oak_log'], [BLOCKS.DARK_OAK_PLANKS, 'dark_oak_planks'],
      [BLOCKS.CHERRY_LOG, 'cherry_log'], [BLOCKS.CHERRY_PLANKS, 'cherry_planks'], [BLOCKS.CHERRY_LEAVES, 'cherry_leaves', true],
      [BLOCKS.MANGROVE_LOG, 'mangrove_log'], [BLOCKS.MANGROVE_PLANKS, 'mangrove_planks'],
      [BLOCKS.BAMBOO_BLOCK, 'bamboo_block'], [BLOCKS.CACTUS, 'cactus'], [BLOCKS.SUGAR_CANE, 'sugar_cane', true],
      [BLOCKS.KELP, 'kelp', true], [BLOCKS.LILY_PAD, 'lily_pad', true], [BLOCKS.VINES, 'vines', true],
      [BLOCKS.POPLAR_LOG, 'poplar_log'], [BLOCKS.POPLAR_PLANKS, 'poplar_planks'], [BLOCKS.POPLAR_LEAVES, 'poplar_leaves', true],
      [BLOCKS.COPPER_ORE, 'copper_ore'], [BLOCKS.REDSTONE_ORE, 'redstone_ore'], [BLOCKS.LAPIS_ORE, 'lapis_ore'],
      [BLOCKS.EMERALD_ORE, 'emerald_ore'], [BLOCKS.NETHER_QUARTZ_ORE, 'nether_quartz_ore'], [BLOCKS.ANCIENT_DEBRIS, 'ancient_debris'],
      [BLOCKS.RAW_IRON, 'raw_iron'], [BLOCKS.RAW_COPPER, 'raw_copper'], [BLOCKS.RAW_GOLD, 'raw_gold'],
      [BLOCKS.IRON_INGOT, 'iron_ingot'], [BLOCKS.COPPER_INGOT, 'copper_ingot'], [BLOCKS.GOLD_INGOT, 'gold_ingot'],
      [BLOCKS.NETHERITE_INGOT, 'netherite_ingot'], [BLOCKS.DIAMOND, 'diamond'], [BLOCKS.EMERALD, 'emerald'],
      [BLOCKS.LAPIS_LAZULI, 'lapis_lazuli'], [BLOCKS.REDSTONE_DUST, 'redstone_dust', true],
      [BLOCKS.NETHER_QUARTZ, 'nether_quartz'], [BLOCKS.AMETHYST_SHARD, 'amethyst_shard'], [BLOCKS.FLINT, 'flint'],
      [BLOCKS.APPLE, 'apple'], [BLOCKS.GOLDEN_APPLE, 'golden_apple'], [BLOCKS.BREAD, 'bread'],
      [BLOCKS.CARROT, 'carrot'], [BLOCKS.GOLDEN_CARROT, 'golden_carrot'], [BLOCKS.POTATO, 'potato'],
      [BLOCKS.BAKED_POTATO, 'baked_potato'], [BLOCKS.MELON_SLICE, 'melon_slice'], [BLOCKS.SWEET_BERRIES, 'sweet_berries'],
      [BLOCKS.COOKED_BEEF, 'cooked_beef'], [BLOCKS.COOKED_PORKCHOP, 'cooked_porkchop'], [BLOCKS.COOKED_CHICKEN, 'cooked_chicken'],
      [BLOCKS.COOKED_MUTTON, 'cooked_mutton'], [BLOCKS.COOKED_FISH, 'cooked_fish'], [BLOCKS.EGG, 'egg'],
      [BLOCKS.MILK_BUCKET, 'milk_bucket'], [BLOCKS.HONEY_BOTTLE, 'honey_bottle'], [BLOCKS.WHEAT, 'wheat'],
      [BLOCKS.WHEAT_SEEDS, 'wheat_seeds'], [BLOCKS.BONE_MEAL, 'bone_meal'],
      [BLOCKS.DIAMOND_SWORD, 'diamond_sword'], [BLOCKS.IRON_SWORD, 'iron_sword'],
      [BLOCKS.DIAMOND_PICKAXE, 'diamond_pickaxe'], [BLOCKS.IRON_PICKAXE, 'iron_pickaxe'],
      [BLOCKS.DIAMOND_AXE, 'diamond_axe'], [BLOCKS.IRON_AXE, 'iron_axe'],
      [BLOCKS.DIAMOND_SHOVEL, 'diamond_shovel'], [BLOCKS.BOW, 'bow'], [BLOCKS.ARROW, 'arrow'],
      [BLOCKS.SHIELD, 'shield'], [BLOCKS.TOTEM_OF_UNDYING, 'totem_of_undying'], [BLOCKS.ENDER_PEARL, 'ender_pearl'],
      [BLOCKS.EYE_OF_ENDER, 'eye_of_ender'], [BLOCKS.SHEARS, 'shears'], [BLOCKS.COMPASS, 'compass'],
      [BLOCKS.CLOCK, 'clock'], [BLOCKS.WATER_BUCKET, 'water_bucket'], [BLOCKS.LAVA_BUCKET, 'lava_bucket'],
      [BLOCKS.ELYTRA, 'elytra'],
      [BLOCKS.CRAFTING_TABLE, 'crafting_table'], [BLOCKS.FURNACE, 'furnace'], [BLOCKS.BLAST_FURNACE, 'blast_furnace'],
      [BLOCKS.SMOKER, 'smoker'], [BLOCKS.ANVIL, 'anvil'], [BLOCKS.ENCHANTING_TABLE, 'enchanting_table'],
      [BLOCKS.BREWING_STAND, 'brewing_stand', true], [BLOCKS.CAULDRON, 'cauldron'], [BLOCKS.CHEST, 'chest'],
      [BLOCKS.BARREL, 'barrel'], [BLOCKS.HOPPER, 'hopper'], [BLOCKS.DISPENSER, 'dispenser'],
      [BLOCKS.JUKEBOX, 'jukebox'], [BLOCKS.NOTE_BLOCK, 'note_block'], [BLOCKS.BED, 'bed'],
      [BLOCKS.REDSTONE_TORCH, 'redstone_torch', true], [BLOCKS.REPEATER, 'repeater'],
      [BLOCKS.COMPARATOR, 'comparator'], [BLOCKS.LEVER, 'lever'], [BLOCKS.BUTTON, 'button'],
      [BLOCKS.PRESSURE_PLATE, 'pressure_plate'], [BLOCKS.PISTON, 'piston'], [BLOCKS.STICKY_PISTON, 'sticky_piston'],
      [BLOCKS.REDSTONE_LAMP, 'redstone_lamp'], [BLOCKS.OBSERVER, 'observer'], [BLOCKS.RAIL, 'rail', true],
      [BLOCKS.POWERED_RAIL, 'powered_rail', true],
      [BLOCKS.WHITE_DYE, 'white_dye'], [BLOCKS.ORANGE_DYE, 'orange_dye'], [BLOCKS.MAGENTA_DYE, 'magenta_dye'],
      [BLOCKS.LIGHT_BLUE_DYE, 'light_blue_dye'], [BLOCKS.YELLOW_DYE, 'yellow_dye'], [BLOCKS.LIME_DYE, 'lime_dye'],
      [BLOCKS.PINK_DYE, 'pink_dye'], [BLOCKS.GRAY_DYE, 'gray_dye'], [BLOCKS.CYAN_DYE, 'cyan_dye'],
      [BLOCKS.PURPLE_DYE, 'purple_dye'], [BLOCKS.BLUE_DYE, 'blue_dye'], [BLOCKS.BROWN_DYE, 'brown_dye'],
      [BLOCKS.GREEN_DYE, 'green_dye'], [BLOCKS.RED_DYE, 'red_dye'], [BLOCKS.BLACK_DYE, 'black_dye'],
      [BLOCKS.POPPY, 'poppy', true], [BLOCKS.DANDELION, 'dandelion', true], [BLOCKS.TULIP, 'tulip', true],
      [BLOCKS.BLUE_ORCHID, 'blue_orchid', true], [BLOCKS.SUNFLOWER, 'sunflower', true], [BLOCKS.WITHER_ROSE, 'wither_rose', true],
      [BLOCKS.CANDLE, 'candle'], [BLOCKS.CAKE, 'cake'],
      [BLOCKS.POTION_HEALING, 'potion_healing'], [BLOCKS.POTION_REGEN, 'potion_regen'],
      [BLOCKS.POTION_FIRE_RES, 'potion_fire_res'], [BLOCKS.POTION_SWIFTNESS, 'potion_swiftness'],
      [BLOCKS.POTION_NIGHT_VISION, 'potion_night_vision'], [BLOCKS.POTION_STRENGTH, 'potion_strength'],
      [BLOCKS.POTION_INVISIBILITY, 'potion_invisibility'], [BLOCKS.POTION_POISON, 'potion_poison'],
      [BLOCKS.SPAWN_CREEPER, 'spawn_creeper'], [BLOCKS.SPAWN_ZOMBIE, 'spawn_zombie'],
      [BLOCKS.SPAWN_SKELETON, 'spawn_skeleton'], [BLOCKS.SPAWN_SPIDER, 'spawn_spider'],
      [BLOCKS.SPAWN_ENDERMAN, 'spawn_enderman'], [BLOCKS.SPAWN_PIG, 'spawn_pig'],
      [BLOCKS.SPAWN_COW, 'spawn_cow'], [BLOCKS.SPAWN_SHEEP, 'spawn_sheep'],
      [BLOCKS.SPAWN_CHICKEN, 'spawn_chicken'], [BLOCKS.SPAWN_VILLAGER, 'spawn_villager'],
      [BLOCKS.SPAWN_GOLEM, 'spawn_golem'], [BLOCKS.SPAWN_WOLF, 'spawn_wolf'],
      [BLOCKS.SPAWN_SLIME, 'spawn_slime'], [BLOCKS.SPAWN_BLAZE, 'spawn_blaze'],
      [BLOCKS.SPAWN_WARDEN, 'spawn_warden']
    ];

    autoBlockMappings.forEach(([id, texKey, isTransp]) => {
      const tex = threeTextures[texKey] || threeTextures.stone;
      if (isTransp) {
        blockMaterials[id] = [
          makeMat(tex, true, 0.85), makeMat(tex, true, 0.85),
          makeMat(tex, true, 0.85), makeMat(tex, true, 0.85),
          makeMat(tex, true, 0.85), makeMat(tex, true, 0.85)
        ];
      } else {
        blockMaterials[id] = makeCubeMats(tex);
      }
      blockIcons[id] = texCanvases[texKey] || texCanvases.stone;
    });

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
    blockIcons[BLOCKS.STONE_BRICKS] = texCanvases.stone_bricks;
    blockIcons[BLOCKS.GLOWSTONE] = texCanvases.glowstone;
    blockIcons[BLOCKS.ROSE] = texCanvases.rose;
    blockIcons[BLOCKS.POLISHED_STONE] = texCanvases.polished_stone;
    blockIcons[BLOCKS.LAVA] = texCanvases.lava;
    blockIcons[BLOCKS.IGNITER] = texCanvases.igniter;
    blockIcons[BLOCKS.OBSIDIAN] = texCanvases.obsidian;
    blockIcons[BLOCKS.AMETHYST] = texCanvases.amethyst;
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

  function isAIHomeChunk(cx, cz) {
    if (cx === 1 && cz === 1) return true;   // Spawn Hub AI Sanctuary Sector [24, 26, 24]
    if (cx === 3 && cz === -2) return true;  // Forest Glade AI Observatory [52, 26, -28]
    if (cx === -4 && cz === 3) return true;  // Mountain AI Ridge [-60, 36, 52]
    if (cx === -3 && cz === -3) return true; // Desert Tech Sanctum [-44, 26, -44]
    // Procedural wild sanctuaries across infinite wilderness
    if (((cx % 10 + 10) % 10 === 6) && ((cz % 10 + 10) % 10 === 6)) return true;
    return false;
  }

  function registerAINodeCore(x, y, z, name, sectorId) {
    if (aiNodeCores.some(c => Math.hypot(c.x - x, c.z - z) < 5)) return;

    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Outer cyber diamond
    const geomOuter = new THREE.OctahedronGeometry(0.52, 0);
    const matOuter = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0284c7,
      emissiveIntensity: 0.85,
      roughness: 0.15,
      metalness: 0.9,
      transparent: true,
      opacity: 0.88
    });
    const meshOuter = new THREE.Mesh(geomOuter, matOuter);
    group.add(meshOuter);

    // Inner pulsating amethyst core
    const geomInner = new THREE.DodecahedronGeometry(0.26, 0);
    const matInner = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x9333ea,
      emissiveIntensity: 1.3,
      roughness: 0.2
    });
    const meshInner = new THREE.Mesh(geomInner, matInner);
    group.add(meshInner);

    // Orbiting cyber rings
    const ringGeom = new THREE.TorusGeometry(0.78, 0.025, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.rotation.x = Math.PI / 3;
    group.add(ringMesh);

    // Luminous point light
    const light = new THREE.PointLight(0x06b6d4, 1.8, 12);
    group.add(light);

    scene.add(group);

    aiNodeCores.push({
      x, y, z,
      name,
      sectorId,
      group,
      meshOuter,
      meshInner,
      ringMesh,
      light
    });
  }

  function updateAICores(dt, now) {
    aiNodeCores.forEach(core => {
      core.meshOuter.rotation.y += 0.028;
      core.meshOuter.rotation.x += 0.014;
      core.meshInner.rotation.y -= 0.038;
      core.ringMesh.rotation.z += 0.022;
      const hoverY = core.y + Math.sin(now * 0.003) * 0.12;
      core.group.position.y = hoverY;
    });
  }

  function updateAICoreProximity() {
    let closestCore = null;
    let closestDist = 999;
    aiNodeCores.forEach(core => {
      const d = Math.hypot(player.x - core.x, player.y - core.y, player.z - core.z);
      if (d < closestDist) {
        closestDist = d;
        closestCore = core;
      }
    });

    const promptEl = document.getElementById('aiInteractPrompt');
    const chatModal = document.getElementById('aiChatModal');
    const isChatVisible = chatModal && chatModal.style.display !== 'none';

    if (closestCore && closestDist < 4.5 && !isInventoryOpen && !isDead && !isChatVisible) {
      activeNearbyAICore = closestCore;
      if (promptEl && promptEl.style.display !== 'flex') {
        promptEl.style.display = 'flex';
      }
    } else {
      activeNearbyAICore = null;
      if (promptEl && promptEl.style.display !== 'none') {
        promptEl.style.display = 'none';
      }
    }
  }

  function isCityChunk(cx, cz) {
    return (cx >= -1 && cx <= 2 && cz >= -1 && cz <= 2);
  }

  function getTerrainHeight(wx, wz) {
    // 1. Dedicated Grand City Zone: Uniform level 25 plateau for cohesive metropolis
    if (wx >= -16 && wx < 48 && wz >= -16 && wz < 48) {
      return 25;
    }

    // City edge slope blend
    const distToCityX = Math.max(0, -16 - wx, wx - 47);
    const distToCityZ = Math.max(0, -16 - wz, wz - 47);
    const edgeDist = Math.hypot(distToCityX, distToCityZ);

    const scale1 = 0.012;
    const scale2 = 0.035;
    const n1 = SimplexNoise.noise2D(wx * scale1, wz * scale1);
    const n2 = SimplexNoise.noise2D(wx * scale2, wz * scale2) * 0.5;
    const combined = (n1 + n2) / 1.5;

    // 2. Focused Mountain Ranges: Only in rare, dedicated mountain ridges ("kahi kahi pe mountains")
    const mountainNoise = SimplexNoise.noise2D(wx * 0.003 + 77.7, wz * 0.003 + 33.3);
    let naturalH;
    if (mountainNoise > 0.56) {
      // True towering mountain peaks
      const mFactor = (mountainNoise - 0.56) / 0.44; // 0 to 1
      const mountainBase = 28 + mFactor * 24;
      const peaks = Math.abs(SimplexNoise.noise2D(wx * 0.024, wz * 0.024)) * 14;
      naturalH = Math.floor(mountainBase + peaks);
    } else {
      // Gentle rolling natural plains, forests, and calm riverbeds
      const base = 25;
      const amp = 4.5;
      naturalH = Math.floor(base + combined * amp);
    }

    // Smooth transition from city edge to wild terrain
    if (edgeDist < 12) {
      const t = edgeDist / 12;
      return Math.floor(25 * (1 - t) + naturalH * t);
    }

    return naturalH;
  }

  function getBiome(wx, wz) {
    if (wx >= -16 && wx < 48 && wz >= -16 && wz < 48) return 'City';
    const mountainNoise = SimplexNoise.noise2D(wx * 0.003 + 77.7, wz * 0.003 + 33.3);
    if (mountainNoise > 0.56) return 'Mountains';
    const val = SimplexNoise.noise2D(wx * 0.006, wz * 0.006);
    if (val > 0.18) return 'Forest';
    if (val < -0.38) return 'Desert';
    return 'Plains';
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

          // Only grow trees outside the city zone and off roadways
          const inCity = isCityChunk(this.cx, this.cz);
          if (!inCity) {
            const isRoadPath = (this.cx === 0 && (x === 7 || x === 8)) || (this.cz === 0 && (z === 7 || z === 8));
            if (!isRoadPath && (biome === 'Forest' || biome === 'Plains') && height > WATER_LEVEL + 1 && height < CHUNK_HEIGHT - 8) {
              const treeChance = (biome === 'Forest') ? 0.045 : 0.012;
              if (seededNoise(wx, wz, 555) < treeChance && x >= 2 && x <= CHUNK_SIZE - 3 && z >= 2 && z <= CHUNK_SIZE - 3) {
                this.growTree(x, height + 1, z);
              }
            }
          }
        }
      }

      // Generate Grand City Sector if inside the 4x4 Metropolis Zone
      if (isCityChunk(this.cx, this.cz)) {
        this.generateGrandCitySector(this.cx, this.cz);
      } else {
        // Outside City: Pure natural wilderness + connecting highways leading into nature
        this.generateExitRoads(this.cx, this.cz);
      }

      // Generate AI Home Sanctuaries across city and wilderness
      if (isAIHomeChunk(this.cx, this.cz)) {
        this.generateAIHomeStructure(this.cx, this.cz);
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

    // =======================================================================
    // AI Home Sanctuary Generator (Futuristic cyber shrine with Node Core)
    // =======================================================================
    generateAIHomeStructure(cx, cz) {
      const originX = cx * CHUNK_SIZE;
      const originZ = cz * CHUNK_SIZE;
      const centerX = originX + 8;
      const centerZ = originZ + 8;

      let floorY = 25;
      if (!isCityChunk(cx, cz)) {
        floorY = Math.min(CHUNK_HEIGHT - 12, Math.max(22, getTerrainHeight(centerX, centerZ)));
      }

      // 1. 9x9 Sanctuary Platform (Amethyst floor, Obsidian foundation, Glowstone inlays)
      for (let lx = 3; lx <= 11; lx++) {
        for (let lz = 3; lz <= 11; lz++) {
          const isBorder = (lx === 3 || lx === 11 || lz === 3 || lz === 11);
          const isCorner = (lx === 3 || lx === 11) && (lz === 3 || lz === 11);
          const isCenterCross = (lx === 7 || lx === 8 || lz === 7 || lz === 8);

          // Solid foundation down to bedrock/terrain
          for (let y = floorY - 2; y < floorY; y++) {
            this.setBlock(lx, y, lz, BLOCKS.OBSIDIAN);
          }

          if (isCorner) {
            this.setBlock(lx, floorY, lz, BLOCKS.CRYING_OBSIDIAN);
          } else if (isBorder) {
            this.setBlock(lx, floorY, lz, BLOCKS.OBSIDIAN);
          } else if (isCenterCross) {
            this.setBlock(lx, floorY, lz, BLOCKS.AMETHYST);
          } else {
            this.setBlock(lx, floorY, lz, BLOCKS.PURPUR_BLOCK);
          }

          // Clear air inside interior (5 blocks high)
          for (let y = floorY + 1; y <= floorY + 6; y++) {
            this.setBlock(lx, y, lz, BLOCKS.AIR);
          }
        }
      }

      // 2. Corner Pillars (Obsidian & Purpur with Lanterns)
      const corners = [[3, 3], [11, 3], [3, 11], [11, 11]];
      corners.forEach(([cxPos, czPos]) => {
        for (let y = floorY + 1; y <= floorY + 5; y++) {
          this.setBlock(cxPos, y, czPos, BLOCKS.OBSIDIAN);
        }
        this.setBlock(cxPos, floorY + 3, czPos, BLOCKS.CRYING_OBSIDIAN);
        this.setBlock(cxPos, floorY + 5, czPos, BLOCKS.GLOWSTONE);
      });

      // 3. Transparent Observation Glass Walls with Arched Openings on all 4 sides
      for (let lx = 4; lx <= 10; lx++) {
        if (lx !== 7 && lx !== 8) {
          this.setBlock(lx, floorY + 1, 3, BLOCKS.GLASS);
          this.setBlock(lx, floorY + 2, 3, BLOCKS.GLASS);
          this.setBlock(lx, floorY + 1, 11, BLOCKS.GLASS);
          this.setBlock(lx, floorY + 2, 11, BLOCKS.GLASS);
        }
      }
      for (let lz = 4; lz <= 10; lz++) {
        if (lz !== 7 && lz !== 8) {
          this.setBlock(3, floorY + 1, lz, BLOCKS.GLASS);
          this.setBlock(3, floorY + 2, lz, BLOCKS.GLASS);
          this.setBlock(11, floorY + 1, lz, BLOCKS.GLASS);
          this.setBlock(11, floorY + 2, lz, BLOCKS.GLASS);
        }
      }

      // 4. Domed Cyber Canopy Roof with Prismarine & Glowstone Skylight
      for (let lx = 3; lx <= 11; lx++) {
        for (let lz = 3; lz <= 11; lz++) {
          this.setBlock(lx, floorY + 5, lz, BLOCKS.PRISMARINE);
        }
      }
      for (let lx = 5; lx <= 9; lx++) {
        for (let lz = 5; lz <= 9; lz++) {
          this.setBlock(lx, floorY + 6, lz, BLOCKS.PURPUR_BLOCK);
        }
      }
      this.setBlock(7, floorY + 6, 7, BLOCKS.GLOWSTONE);
      this.setBlock(8, floorY + 6, 7, BLOCKS.GLOWSTONE);
      this.setBlock(7, floorY + 6, 8, BLOCKS.GLOWSTONE);
      this.setBlock(8, floorY + 6, 8, BLOCKS.GLOWSTONE);

      // 5. Central Cyber Altar Pedestal
      this.setBlock(7, floorY + 1, 7, BLOCKS.OBSIDIAN);
      this.setBlock(8, floorY + 1, 7, BLOCKS.OBSIDIAN);
      this.setBlock(7, floorY + 1, 8, BLOCKS.OBSIDIAN);
      this.setBlock(8, floorY + 1, 8, BLOCKS.OBSIDIAN);

      this.setBlock(7, floorY + 1, 6, BLOCKS.POLISHED_STONE);
      this.setBlock(8, floorY + 1, 6, BLOCKS.POLISHED_STONE);
      this.setBlock(6, floorY + 1, 7, BLOCKS.POLISHED_STONE);
      this.setBlock(6, floorY + 1, 8, BLOCKS.POLISHED_STONE);

      // Register Holographic AI Node Core
      let sanctuaryName = 'Maiko Primary Hub Sanctuary';
      if (cx === 3 && cz === -2) sanctuaryName = 'Forest Glade Quantum Observatory';
      else if (cx === -4 && cz === 3) sanctuaryName = 'Mountain Ridge Apex Terminal';
      else if (cx === -3 && cz === -3) sanctuaryName = 'Desert Tech Cyber Sanctum';
      else if (!isCityChunk(cx, cz)) sanctuaryName = `Wild Sector [${cx}, ${cz}] AI Node`;

      registerAINodeCore(centerX - 0.5, floorY + 2.8, centerZ - 0.5, sanctuaryName, `${cx},${cz}`);
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

    // =======================================================================
    // Grand Metropolis Generator (Single large cohesive city spanning 4x4 chunks)
    // =======================================================================
    generateGrandCitySector(cx, cz) {
      const baseH = 25;

      // 1. Continuous Avenue and Road Network throughout the metropolis
      for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
          // East-West Central Avenue
          if (cz === 0 && (z === 7 || z === 8)) {
            this.setBlock(x, baseH, z, BLOCKS.POLISHED_STONE);
          } else if (cz === 0 && (z === 6 || z === 9)) {
            this.setBlock(x, baseH, z, BLOCKS.COBBLESTONE); // Road Curb
          } else if (cz === 0 && (z === 5 || z === 10)) {
            this.setBlock(x, baseH, z, BLOCKS.STONE_BRICKS); // Sidewalk
          }

          // North-South Central Avenue
          if (cx === 0 && (x === 7 || x === 8)) {
            this.setBlock(x, baseH, z, BLOCKS.POLISHED_STONE);
          } else if (cx === 0 && (x === 6 || x === 9)) {
            this.setBlock(x, baseH, z, BLOCKS.COBBLESTONE); // Road Curb
          } else if (cx === 0 && (x === 5 || x === 10)) {
            this.setBlock(x, baseH, z, BLOCKS.STONE_BRICKS); // Sidewalk
          }

          // Internal grid cross-streets on sector boundaries
          if ((x === 1 || x === 14) && (z >= 3 && z <= 12)) {
            this.setBlock(x, baseH, z, BLOCKS.COBBLESTONE);
          }
          if ((z === 1 || z === 14) && (x >= 3 && x <= 12)) {
            this.setBlock(x, baseH, z, BLOCKS.COBBLESTONE);
          }
        }
      }

      // Streetlamp Posts along the avenue
      if (cx === 0) {
        this.buildStreetlamp(5, baseH, 3);
        this.buildStreetlamp(10, baseH, 3);
        this.buildStreetlamp(5, baseH, 12);
        this.buildStreetlamp(10, baseH, 12);
      }
      if (cz === 0) {
        this.buildStreetlamp(3, baseH, 5);
        this.buildStreetlamp(3, baseH, 10);
        this.buildStreetlamp(12, baseH, 5);
        this.buildStreetlamp(12, baseH, 10);
      }

      // 2. District Specific Architecture
      if (cx === 0 && cz === 0) {
        // Sector (0, 0): Grand Central Plaza & Monumental Fountain
        // Player spawns on open cobblestone avenue at (7.5, 3.5)
        // Grand Fountain in center (x:6..9, z:6..9)
        for (let x = 6; x <= 9; x++) {
          for (let z = 6; z <= 9; z++) {
            const isRim = (x === 6 || x === 9 || z === 6 || z === 9);
            if (isRim) {
              this.setBlock(x, baseH + 1, z, BLOCKS.STONE_BRICKS);
            } else {
              this.setBlock(x, baseH, z, BLOCKS.WATER);
              this.setBlock(x, baseH - 1, z, BLOCKS.POLISHED_STONE);
              this.setBlock(x, baseH - 2, z, BLOCKS.GLOWSTONE);
            }
          }
        }
        // Fountain Center Spire
        this.setBlock(7, baseH + 1, 7, BLOCKS.STONE_BRICKS);
        this.setBlock(7, baseH + 2, 7, BLOCKS.GLOWSTONE);
        this.setBlock(7, baseH + 3, 7, BLOCKS.WATER);

        // North-West Town Hall / Guildhall
        this.buildTownHall(1, baseH, 1, 5, 5, 5);

        // Rose Gardens on Plaza Corners
        this.buildGardenBed(11, baseH, 1, 4, 3);
        this.buildGardenBed(1, baseH, 11, 4, 3);
      } else if (cx === 1 && cz === 0) {
        // Sector (1, 0): Commercial Market District & Bakeries
        this.buildMarketStall(2, baseH, 2, BLOCKS.BRICKS);
        this.buildMarketStall(2, baseH, 11, BLOCKS.WOOD);
        this.buildCottage(9, baseH, 1, 6, 5, 4, 'Bakery');
        this.buildCottage(9, baseH, 10, 6, 5, 4, 'Merchant');
      } else if (cx === 0 && cz === 1) {
        // Sector (0, 1): Financial District (North Skyscraper)
        this.buildSkyscraper(1, baseH, 1, 6, 6, 20, BLOCKS.STONE_BRICKS, BLOCKS.GLASS);
        this.buildCottage(10, baseH, 2, 5, 5, 4, 'Office');
        this.buildGardenBed(10, baseH, 10, 4, 4);
      } else if (cx === 1 && cz === 1) {
        // Sector (1, 1): Maiko Quantum AI Sanctuary & South Skyscraper
        this.generateAIHomeStructure(cx, cz);
        this.buildSkyscraper(1, baseH, 2, 5, 5, 14, BLOCKS.BRICKS, BLOCKS.GLASS);
      } else if (cx === -1 && cz === 0) {
        // Sector (-1, 0): Old Town Residential Quarter
        this.buildCottage(2, baseH, 1, 5, 6, 4, 'Townhouse 1');
        this.buildCottage(9, baseH, 1, 5, 6, 4, 'Townhouse 2');
        this.buildCottage(2, baseH, 9, 6, 6, 5, 'Manor');
      } else if (cx === -1 && cz === 1) {
        // Sector (-1, 1): Suburban Villa & Orchard
        this.buildCottage(3, baseH, 3, 7, 6, 5, 'Villa');
        this.buildGardenBed(11, baseH, 3, 3, 8);
      } else if (cx === 0 && cz === -1) {
        // Sector (0, -1): Grand Clocktower Plaza
        this.buildClocktower(2, baseH, 2);
        this.buildGardenBed(9, baseH, 2, 5, 4);
        this.buildGardenBed(9, baseH, 9, 5, 4);
      } else if (cx === 1 && cz === -1) {
        // Sector (1, -1): City Library & Botanical Conservatory
        this.buildLibrary(2, baseH, 2, 12, 10, 6);
      } else {
        // Outer Suburban Chunks: Perimeter Cottages, Watchposts & Town Gates
        this.buildCottage(4, baseH, 4, 6, 6, 4, 'Perimeter Home');
        this.buildGardenBed(11, baseH, 4, 4, 4);
      }
    }

    // =======================================================================
    // Connecting Highway Roads leading into the wild
    // =======================================================================
    generateExitRoads(cx, cz) {
      // North & South Highway
      if (cx === 0 && Math.abs(cz) <= 6) {
        const originX = cx * CHUNK_SIZE;
        const originZ = cz * CHUNK_SIZE;
        for (let z = 0; z < CHUNK_SIZE; z++) {
          const wz = originZ + z;
          const h = getTerrainHeight(originX + 7, wz);
          this.setBlock(7, h, z, BLOCKS.COBBLESTONE);
          this.setBlock(8, h, z, BLOCKS.COBBLESTONE);
          this.setBlock(6, h, z, BLOCKS.DIRT);
          this.setBlock(9, h, z, BLOCKS.DIRT);
          // Lantern posts every 10 blocks
          if (z % 10 === 0) {
            this.setBlock(5, h + 1, z, BLOCKS.WOOD);
            this.setBlock(5, h + 2, z, BLOCKS.GLOWSTONE);
          }
        }
      }

      // East & West Highway
      if (cz === 0 && Math.abs(cx) <= 6) {
        const originX = cx * CHUNK_SIZE;
        const originZ = cz * CHUNK_SIZE;
        for (let x = 0; x < CHUNK_SIZE; x++) {
          const wx = originX + x;
          const h = getTerrainHeight(wx, originZ + 7);
          this.setBlock(x, h, 7, BLOCKS.COBBLESTONE);
          this.setBlock(x, h, 8, BLOCKS.COBBLESTONE);
          this.setBlock(x, h, 6, BLOCKS.DIRT);
          this.setBlock(x, h, 9, BLOCKS.DIRT);
          // Lantern posts every 10 blocks
          if (x % 10 === 0) {
            this.setBlock(x, h + 1, 5, BLOCKS.WOOD);
            this.setBlock(x, h + 2, 5, BLOCKS.GLOWSTONE);
          }
        }
      }
    }

    buildStreetlamp(lx, ly, lz) {
      this.setBlock(lx, ly + 1, lz, BLOCKS.STONE_BRICKS);
      this.setBlock(lx, ly + 2, lz, BLOCKS.STONE_BRICKS);
      this.setBlock(lx, ly + 3, lz, BLOCKS.GLOWSTONE);
      this.setBlock(lx, ly + 4, lz, BLOCKS.POLISHED_STONE);
    }

    buildGardenBed(gx, gy, gz, w, d) {
      for (let x = gx; x < gx + w; x++) {
        for (let z = gz; z < gz + d; z++) {
          this.setBlock(x, gy, z, BLOCKS.DIRT);
          this.setBlock(x, gy + 1, z, (x + z) % 2 === 0 ? BLOCKS.ROSE : BLOCKS.LEAVES);
        }
      }
    }

    buildMarketStall(sx, sy, sz, roofBlock) {
      // 4 wooden corner posts
      this.setBlock(sx, sy + 1, sz, BLOCKS.WOOD);
      this.setBlock(sx, sy + 2, sz, BLOCKS.WOOD);
      this.setBlock(sx + 3, sy + 1, sz, BLOCKS.WOOD);
      this.setBlock(sx + 3, sy + 2, sz, BLOCKS.WOOD);
      this.setBlock(sx, sy + 1, sz + 3, BLOCKS.WOOD);
      this.setBlock(sx, sy + 2, sz + 3, BLOCKS.WOOD);
      this.setBlock(sx + 3, sy + 1, sz + 3, BLOCKS.WOOD);
      this.setBlock(sx + 3, sy + 2, sz + 3, BLOCKS.WOOD);

      // Plank counter
      this.setBlock(sx + 1, sy + 1, sz, BLOCKS.PLANKS);
      this.setBlock(sx + 2, sy + 1, sz, BLOCKS.PLANKS);
      this.setBlock(sx + 1, sy + 1, sz + 1, BLOCKS.BOOKSHELF);

      // Canopy roof & glowing lantern
      for (let x = sx; x <= sx + 3; x++) {
        for (let z = sz; z <= sz + 3; z++) {
          this.setBlock(x, sy + 3, z, roofBlock);
        }
      }
      this.setBlock(sx + 1, sy + 2, sz + 1, BLOCKS.GLOWSTONE);
    }

    buildClocktower(sx, sy, sz) {
      const w = 5, d = 5, h = 24;
      for (let y = sy + 1; y <= sy + h; y++) {
        for (let x = sx; x < sx + w; x++) {
          for (let z = sz; z < sz + d; z++) {
            const isCorner = (x === sx || x === sx + w - 1) && (z === sz || z === sz + d - 1);
            const isEdge = (x === sx || x === sx + w - 1 || z === sz || z === sz + d - 1);
            if (isCorner) {
              this.setBlock(x, y, z, BLOCKS.STONE_BRICKS);
            } else if (isEdge) {
              if (y >= sy + h - 4 && y <= sy + h - 2) {
                // Clock faces on top
                this.setBlock(x, y, z, BLOCKS.GLOWSTONE);
              } else {
                this.setBlock(x, y, z, (y % 4 === 0) ? BLOCKS.POLISHED_STONE : BLOCKS.STONE_BRICKS);
              }
            } else {
              this.setBlock(x, y, z, BLOCKS.AIR);
            }
          }
        }
      }
      // Spire roof
      for (let x = sx; x < sx + w; x++) {
        for (let z = sz; z < sz + d; z++) {
          this.setBlock(x, sy + h + 1, z, BLOCKS.BRICKS);
        }
      }
      this.setBlock(sx + 2, sy + h + 2, sz + 2, BLOCKS.STONE_BRICKS);
      this.setBlock(sx + 2, sy + h + 3, sz + 2, BLOCKS.GLOWSTONE);
    }

    buildLibrary(sx, sy, sz, w, d, h) {
      for (let y = sy + 1; y <= sy + h; y++) {
        for (let x = sx; x < sx + w; x++) {
          for (let z = sz; z < sz + d; z++) {
            const isEdge = (x === sx || x === sx + w - 1 || z === sz || z === sz + d - 1);
            if (isEdge) {
              if (y === sy + 2 || y === sy + 3) {
                this.setBlock(x, y, z, BLOCKS.GLASS);
              } else {
                this.setBlock(x, y, z, BLOCKS.STONE_BRICKS);
              }
            } else {
              // Interior bookshelves and study halls
              if ((x % 3 === 0) && (z >= sz + 2 && z <= sz + d - 3) && y <= sy + 3) {
                this.setBlock(x, y, z, BLOCKS.BOOKSHELF);
              } else {
                this.setBlock(x, y, z, BLOCKS.AIR);
              }
            }
          }
        }
      }
      // Roof and chandeliers
      for (let x = sx; x < sx + w; x++) {
        for (let z = sz; z < sz + d; z++) {
          this.setBlock(x, sy + h + 1, z, BLOCKS.POLISHED_STONE);
        }
      }
      this.setBlock(sx + 3, sy + h, sz + 4, BLOCKS.GLOWSTONE);
      this.setBlock(sx + 8, sy + h, sz + 4, BLOCKS.GLOWSTONE);
    }

    buildTownHall(sx, sy, sz, w, d, h) {
      for (let y = sy + 1; y <= sy + h; y++) {
        for (let x = sx; x < sx + w; x++) {
          for (let z = sz; z < sz + d; z++) {
            const isCorner = (x === sx || x === sx + w - 1) && (z === sz || z === sz + d - 1);
            const isEdge = (x === sx || x === sx + w - 1 || z === sz || z === sz + d - 1);
            if (isCorner) {
              this.setBlock(x, y, z, BLOCKS.STONE_BRICKS);
            } else if (isEdge) {
              if (y === sy + 2 && (x === sx + 2 || z === sz + 2)) {
                this.setBlock(x, y, z, BLOCKS.GLASS);
              } else {
                this.setBlock(x, y, z, BLOCKS.BRICKS);
              }
            } else {
              this.setBlock(x, y, z, BLOCKS.AIR);
            }
          }
        }
      }
      // Front entrance
      this.setBlock(sx + 2, sy + 1, sz, BLOCKS.AIR);
      this.setBlock(sx + 2, sy + 2, sz, BLOCKS.AIR);
      // Roof
      for (let x = sx; x < sx + w; x++) {
        for (let z = sz; z < sz + d; z++) {
          this.setBlock(x, sy + h + 1, z, BLOCKS.STONE_BRICKS);
        }
      }
      this.setBlock(sx + 2, sy + h, sz + 2, BLOCKS.GLOWSTONE);
    }

    buildCottage(sx, sy, sz, w, d, h) {
      // Clear interior & foundation
      for (let x = sx; x < sx + w; x++) {
        for (let z = sz; z < sz + d; z++) {
          this.setBlock(x, sy, z, BLOCKS.COBBLESTONE);
          for (let y = sy + 1; y < sy + h + 2; y++) {
            this.setBlock(x, y, z, BLOCKS.AIR);
          }
        }
      }
      // Walls & Corners
      for (let y = sy + 1; y <= sy + h; y++) {
        for (let x = sx; x < sx + w; x++) {
          for (let z = sz; z < sz + d; z++) {
            const isCorner = (x === sx || x === sx + w - 1) && (z === sz || z === sz + d - 1);
            const isEdge = (x === sx || x === sx + w - 1 || z === sz || z === sz + d - 1);
            if (isCorner) {
              this.setBlock(x, y, z, BLOCKS.WOOD);
            } else if (isEdge) {
              if (y === sy + 2 && (x === sx + 2 || z === sz + 2)) {
                this.setBlock(x, y, z, BLOCKS.GLASS);
              } else {
                this.setBlock(x, y, z, BLOCKS.PLANKS);
              }
            }
          }
        }
      }
      // Door opening on front
      this.setBlock(sx + 2, sy + 1, sz, BLOCKS.AIR);
      this.setBlock(sx + 2, sy + 2, sz, BLOCKS.AIR);

      // Pitched Roof
      for (let x = sx; x < sx + w; x++) {
        for (let z = sz; z < sz + d; z++) {
          this.setBlock(x, sy + h + 1, z, BLOCKS.BRICKS);
        }
      }
      this.setBlock(sx + 1, sy + 1, sz + d - 2, BLOCKS.BOOKSHELF);
      this.setBlock(sx + w - 2, sy + h, sz + d - 2, BLOCKS.GLOWSTONE);
    }

    buildSkyscraper(sx, sy, sz, w, d, h, wallBlock, accentBlock) {
      for (let x = sx; x < sx + w; x++) {
        for (let z = sz; z < sz + d; z++) {
          this.setBlock(x, sy, z, BLOCKS.POLISHED_STONE);
          for (let y = sy + 1; y < sy + h + 4; y++) {
            this.setBlock(x, y, z, BLOCKS.AIR);
          }
        }
      }
      for (let y = sy + 1; y <= sy + h; y++) {
        const isFloorSlab = ((y - sy) % 4 === 0);
        for (let x = sx; x < sx + w; x++) {
          for (let z = sz; z < sz + d; z++) {
            const isCorner = (x === sx || x === sx + w - 1) && (z === sz || z === sz + d - 1);
            const isEdge = (x === sx || x === sx + w - 1 || z === sz || z === sz + d - 1);
            if (isFloorSlab) {
              this.setBlock(x, y, z, (x === sx + 2 && z === sz + 2) ? BLOCKS.GLOWSTONE : BLOCKS.STONE_BRICKS);
            } else if (isCorner) {
              this.setBlock(x, y, z, wallBlock);
            } else if (isEdge) {
              if ((y - sy) % 4 === 2 || (y - sy) % 4 === 3) {
                this.setBlock(x, y, z, BLOCKS.GLASS);
              } else {
                this.setBlock(x, y, z, accentBlock);
              }
            }
          }
        }
      }
      // Rooftop terrace
      for (let x = sx; x < sx + w; x++) {
        for (let z = sz; z < sz + d; z++) {
          this.setBlock(x, sy + h + 1, z, BLOCKS.POLISHED_STONE);
          const isEdge = (x === sx || x === sx + w - 1 || z === sz || z === sz + d - 1);
          if (isEdge) {
            this.setBlock(x, sy + h + 2, z, BLOCKS.STONE_BRICKS);
          }
        }
      }
      const midX = sx + Math.floor(w / 2);
      const midZ = sz + Math.floor(d / 2);
      this.setBlock(midX, sy + h + 2, midZ, BLOCKS.STONE_BRICKS);
      this.setBlock(midX, sy + h + 3, midZ, BLOCKS.GLOWSTONE);
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
    if (typeof multiplayerManager !== 'undefined' && multiplayerManager && multiplayerManager.isOnline) {
      multiplayerManager.broadcastBlockChange(gx, gy, gz, blockId);
    }

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

      geom.computeBoundingSphere();
      geom.computeBoundingBox();
      chunkGroup.add(mesh);
    }

    chunk.mesh = chunkGroup;
    scene.add(chunkGroup);
  }

  // =========================================================================
  // Player Controls & Physics Engine
  // =========================================================================
  function isBlockSolid(b) {
    return b !== BLOCKS.AIR && b !== BLOCKS.WATER && b !== BLOCKS.LAVA && b !== BLOCKS.ROSE && b !== BLOCKS.IGNITER;
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
    // 1. In-water & In-lava check
    const currentBlock = getGlobalBlock(Math.floor(player.x), Math.floor(player.y + 0.5), Math.floor(player.z));
    player.inWater = (currentBlock === BLOCKS.WATER);
    player.inLava = (currentBlock === BLOCKS.LAVA);

    // 2. Movement Inputs (Support both WASD, Arrow Keys, and Mobile Touch D-Pad)
    let forward = 0;
    let right = 0;
    if (keys['KeyW'] || keys['ArrowUp'] || touchMoveState.forward) forward += 1;
    if (keys['KeyS'] || keys['ArrowDown'] || touchMoveState.backward) forward -= 1;
    if (keys['KeyA'] || keys['ArrowLeft'] || touchMoveState.left) right -= 1;
    if (keys['KeyD'] || keys['ArrowRight'] || touchMoveState.right) right += 1;

    player.isSprinting = !player.isFlying && (!!keys['ShiftLeft'] || !!keys['ShiftRight'] || !!keys['ControlLeft'] || !!keys['ControlRight'] || touchMoveState.sprinting);

    let moveSpeed = 4.6;
    if (playerEffects.swiftness > 0) {
      playerEffects.swiftness = Math.max(0, playerEffects.swiftness - dt);
      moveSpeed *= 1.45;
    }
    if (playerEffects.regen > 0) {
      playerEffects.regen = Math.max(0, playerEffects.regen - dt);
      playerEffects._timer = (playerEffects._timer || 0) + dt;
      if (playerEffects._timer >= 2.0) {
        playerEffects._timer = 0;
        player.health = Math.min(20, player.health + 1);
        syncSurvivalHUD();
      }
    }
    if (playerEffects.fireRes > 0) {
      playerEffects.fireRes = Math.max(0, playerEffects.fireRes - dt);
      player.inLava = false;
    }
    if (player.isFlying) {
      moveSpeed = (keys['ControlLeft'] || keys['ControlRight']) ? 12.0 : 8.8;
    } else {
      if (player.isSprinting) moveSpeed = 6.8;
      if (player.inWater) moveSpeed = 2.9;
      if (player.inLava) moveSpeed = 1.8;
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

    // High-responsiveness acceleration and snappy braking with frame-rate-independent exponential damping
    const hasInput = (forward !== 0 || right !== 0);
    const accel = player.onGround ? (hasInput ? 28.0 : 20.0) : 7.0;
    const blend = 1.0 - Math.exp(-accel * dt);
    player.vx += (targetVx - player.vx) * blend;
    player.vz += (targetVz - player.vz) * blend;

    // Zero out tiny residual velocities to prevent micro-drifting
    if (!hasInput && Math.hypot(player.vx, player.vz) < 0.05) {
      player.vx = 0;
      player.vz = 0;
    }

    // 3. Vertical Physics (Gravity, Jumping, Water & Flight)
    if (player.isFlying) {
      player.vy = 0;
      const flyVerticalSpeed = 7.8;
      // Space moves up, Shift or KeyC moves down, touch fly buttons support
      if (keys['Space'] || touchActionState.jump || touchActionState.flyUp) player.vy = flyVerticalSpeed;
      if (keys['ShiftLeft'] || keys['ShiftRight'] || keys['KeyC'] || touchActionState.flyDown) player.vy = -flyVerticalSpeed;
      const newY = player.y + player.vy * dt;
      if (!checkPlayerCollision(player.x, newY, player.z)) {
        player.y = newY;
        player.onGround = false;
      } else {
        if (player.vy < 0) {
          player.y = Math.ceil(newY);
          let flySafety = 0;
          while (checkPlayerCollision(player.x, player.y, player.z) && player.y < CHUNK_HEIGHT && flySafety < 80) {
            player.y += 0.05;
            flySafety++;
          }
          player.onGround = true;
        }
        player.vy = 0;
      }
    } else if (player.inWater || player.inLava) {
      const isLava = player.inLava;
      player.vy -= (isLava ? 10.0 : 7.0) * dt;
      player.vy *= Math.pow(isLava ? 0.2 : 0.5, dt * 5.0);
      if (keys['Space'] || touchActionState.jump) player.vy = (isLava ? 2.4 : 3.2);
      if (keys['ShiftLeft'] || keys['KeyC']) player.vy = (isLava ? -2.0 : -3.2);
      const newY = player.y + player.vy * dt;
      if (!checkPlayerCollision(player.x, newY, player.z)) {
        player.y = newY;
      } else {
        player.vy = 0;
      }
      player.onGround = false;

      // Lava burn damage in survival mode
      if (isLava && settings.gameMode === 'survival') {
        damagePlayer(1);
        if (Math.random() < 0.25) {
          createParticleExplosion(player.x, player.y + 0.5, player.z, BLOCKS.LAVA, 2);
          playSynthesizedSound('hurt');
        }
      }
    } else {
      // Normal Gravity
      player.vy -= 28.0 * dt;
      player.vy = Math.max(player.vy, -38.0); // Terminal fall velocity

      // Jump (Keyboard Space or Touch Jump Button)
      if ((keys['Space'] || touchActionState.jump) && player.onGround) {
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
          let landSafety = 0;
          while (checkPlayerCollision(player.x, player.y, player.z) && player.y < CHUNK_HEIGHT && landSafety < 80) {
            player.y += 0.05;
            landSafety++;
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
      if (settings.gameMode === 'survival') {
        damagePlayer(20);
      } else {
        player.x = 8.5;
        player.y = 42.0;
        player.z = 8.5;
        player.vy = 0;
        showToast('Respawned above world');
      }
    }
  }

  function damagePlayer(amount) {
    if (amount <= 0 || settings.gameMode === 'creative' || isDead) return;
    player.health = Math.max(0, player.health - amount);
    renderSurvivalMeters();
    playSynthesizedSound('hurt');
    if (player.health <= 0) {
      player.health = 0;
      renderSurvivalMeters();
      triggerDeath();
    }
  }

  function triggerDeath() {
    isDead = true;
    player.isFlying = false;
    player.vx = 0;
    player.vy = 0;
    player.vz = 0;
    if (document.exitPointerLock) document.exitPointerLock();
    const deathModal = document.getElementById('deathModal');
    if (deathModal) deathModal.style.display = 'flex';
  }

  function respawnPlayer() {
    isDead = false;
    player.health = 20;
    player.hunger = 20;
    const spawnH = Math.max(25, getTerrainHeight(8, 8));
    player.x = 8.5;
    player.y = spawnH + 1.5;
    player.z = 8.5;
    player.vx = 0;
    player.vy = 0;
    player.vz = 0;
    player.isFlying = false;
    renderSurvivalMeters();

    const deathModal = document.getElementById('deathModal');
    if (deathModal) deathModal.style.display = 'none';

    showToast('Respawned safely at spawn point!');
    document.body.requestPointerLock();
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
  // =========================================================================
  // Primed TNT Entity & Explosion Physics Engine
  // =========================================================================
  class PrimedTNT {
    constructor(x, y, z, fuseSeconds = 2.4) {
      this.x = x;
      this.y = y;
      this.z = z;
      this.vy = 1.8; // Small vertical hop on ignite
      this.fuse = fuseSeconds;
      this.totalFuse = fuseSeconds;
      this.isExploded = false;

      const geom = new THREE.BoxGeometry(0.98, 0.98, 0.98);
      const sideMat = blockMaterials[BLOCKS.TNT][0].clone();
      const topMat = blockMaterials[BLOCKS.TNT][2].clone();
      const btmMat = blockMaterials[BLOCKS.TNT][3].clone();
      this.mats = [sideMat, sideMat, topMat, btmMat, sideMat, sideMat];
      this.whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      this.mesh = new THREE.Mesh(geom, this.mats);
      this.mesh.position.set(this.x, this.y, this.z);
      scene.add(this.mesh);

      playSynthesizedSound('ignite');
    }

    update(dt) {
      this.fuse -= dt;

      // True Voxel Block Collision (Lands on whatever block is beneath it)
      this.vy -= 18.0 * dt;
      const stepY = this.vy * dt;
      const targetY = this.y + stepY;

      const checkBlockY = Math.floor(targetY - 0.48);
      const bx = Math.floor(this.x);
      const bz = Math.floor(this.z);
      const blockUnder = getGlobalBlock(bx, checkBlockY, bz);

      if (this.vy < 0 && isBlockSolid(blockUnder) && targetY <= checkBlockY + 1.0 + 0.48) {
        this.y = checkBlockY + 1.0 + 0.49;
        this.vy = 0;
      } else {
        this.y = Math.max(0.5, targetY);
      }
      this.mesh.position.set(this.x, this.y, this.z);

      // Flashing white/red and pulsing swelling scale
      const flashFreq = (this.totalFuse - this.fuse) * 9.0;
      const isWhite = Math.sin(flashFreq * Math.PI) > 0.2;
      this.mesh.material = isWhite ? this.whiteMat : this.mats;

      const scalePulse = 1.0 + Math.sin(flashFreq * Math.PI) * 0.12;
      this.mesh.scale.set(scalePulse, scalePulse, scalePulse);

      // Smoke and spark particles from top
      if (Math.random() < 0.4) {
        createParticleExplosion(this.x, this.y + 0.55, this.z, BLOCKS.GLOWSTONE, 2);
      }

      if (this.fuse <= 0 && !this.isExploded) {
        this.explode();
      }
    }

    explode() {
      this.isExploded = true;
      scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      explodeAt(this.x, this.y, this.z, 5.2);
    }
  }

  function updatePrimedTNTs(dt) {
    for (let i = primedTNTs.length - 1; i >= 0; i--) {
      primedTNTs[i].update(dt);
      if (primedTNTs[i].isExploded) {
        primedTNTs.splice(i, 1);
      }
    }
  }

  let isHandlingRemoteExplosion = false;
  function explodeAt(ex, ey, ez, radius = 5.2) {
    playSynthesizedSound('explosion');
    cameraShake = Math.max(cameraShake, 0.55);
    if (!isHandlingRemoteExplosion && typeof multiplayerManager !== 'undefined' && multiplayerManager && multiplayerManager.isOnline) {
      multiplayerManager.broadcastExplosion(ex, ey, ez, radius);
    }

    // Massive fiery shockwave particles
    createParticleExplosion(ex, ey, ez, BLOCKS.TNT, 45);
    createParticleExplosion(ex, ey + 0.5, ez, BLOCKS.LAVA, 30);
    createParticleExplosion(ex, ey + 0.8, ez, BLOCKS.GLOWSTONE, 25);

    const rCeil = Math.ceil(radius);
    const affectedChunks = new Set();
    const rSq = radius * radius;
    const innerRadiusSq = (radius * 0.82) * (radius * 0.82);

    for (let dx = -rCeil; dx <= rCeil; dx++) {
      for (let dy = -rCeil; dy <= rCeil; dy++) {
        for (let dz = -rCeil; dz <= rCeil; dz++) {
          const dSq = dx * dx + dy * dy + dz * dz;
          if (dSq <= rSq) {
            const bx = Math.floor(ex + dx);
            const by = Math.floor(ey + dy);
            const bz = Math.floor(ez + dz);

            if (by <= 0 || by >= CHUNK_HEIGHT) continue; // Bedrock and top sky protected

            const block = getGlobalBlock(bx, by, bz);
            if (block === BLOCKS.AIR || block === BLOCKS.BEDROCK || block === BLOCKS.OBSIDIAN || block === BLOCKS.CRYING_OBSIDIAN) {
              continue;
            }

            if (block === BLOCKS.TNT) {
              // Fast chain reaction ignition
              const cx = Math.floor(bx / CHUNK_SIZE);
              const cz = Math.floor(bz / CHUNK_SIZE);
              const chunk = chunks.get(`${cx},${cz}`);
              if (chunk) {
                const lx = ((bx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
                const lz = ((bz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
                chunk.setBlock(lx, by, lz, BLOCKS.AIR);
                worldModifications.set(`${bx},${by},${bz}`, BLOCKS.AIR);
              }
              const chainTNT = new PrimedTNT(bx + 0.5, by + 0.5, bz + 0.5, 0.25 + Math.random() * 0.35);
              primedTNTs.push(chainTNT);
              continue;
            }

            // 100% destruction inside inner sphere, high probability at edge
            const shouldDestroy = (dSq <= innerRadiusSq) || (Math.random() < (1.0 - (dSq - innerRadiusSq) / (rSq - innerRadiusSq) * 0.35));
            if (shouldDestroy) {
              const cx = Math.floor(bx / CHUNK_SIZE);
              const cz = Math.floor(bz / CHUNK_SIZE);
              const chunk = chunks.get(`${cx},${cz}`);
              if (chunk) {
                const lx = ((bx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
                const lz = ((bz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
                chunk.setBlock(lx, by, lz, BLOCKS.AIR);
                worldModifications.set(`${bx},${by},${bz}`, BLOCKS.AIR);

                affectedChunks.add(`${cx},${cz}`);
                if (lx === 0) affectedChunks.add(`${cx - 1},${cz}`);
                if (lx === CHUNK_SIZE - 1) affectedChunks.add(`${cx + 1},${cz}`);
                if (lz === 0) affectedChunks.add(`${cx},${cz - 1}`);
                if (lz === CHUNK_SIZE - 1) affectedChunks.add(`${cx},${cz + 1}`);

                if (Math.random() < 0.06) {
                  createParticleExplosion(bx + 0.5, by + 0.5, bz + 0.5, block, 2);
                }
              }
            }
          }
        }
      }
    }

    // Single-pass chunk re-meshing for all affected chunks (0 frame drops!)
    affectedChunks.forEach(key => {
      const chunk = chunks.get(key);
      if (chunk) {
        meshChunk(chunk);
      }
    });

    // Knockback and survival damage to Player
    const pDist = Math.hypot(player.x - ex, player.y - ey, player.z - ez);
    if (pDist < radius * 2.5) {
      const pForce = (1.0 - pDist / (radius * 2.5)) * 18.0;
      const dirX = (player.x - ex) / (pDist || 1);
      const dirY = Math.max(0.35, (player.y - ey) / (pDist || 1));
      const dirZ = (player.z - ez) / (pDist || 1);
      player.vx += dirX * pForce;
      player.vy += dirY * pForce * 0.7;
      player.vz += dirZ * pForce;

      if (settings.gameMode === 'survival') {
        const dmg = Math.floor((1.0 - pDist / (radius * 2.5)) * 20);
        if (dmg > 0) damagePlayer(dmg);
      }
    }

    // Knockback to Animal Mobs
    mobs.forEach(mob => {
      const mDist = Math.hypot(mob.x - ex, mob.y - ey, mob.z - ez);
      if (mDist < radius * 2.2) {
        const mForce = (1.0 - mDist / (radius * 2.2)) * 10.0;
        mob.x += ((mob.x - ex) / (mDist || 1)) * mForce;
        mob.z += ((mob.z - ez) / (mDist || 1)) * mForce;
      }
    });
  }

  function igniteTargetedTNT(target) {
    if (!target || target.block !== BLOCKS.TNT) return false;
    setGlobalBlock(target.x, target.y, target.z, BLOCKS.AIR);
    const chunk = chunks.get(`${Math.floor(target.x / CHUNK_SIZE)},${Math.floor(target.z / CHUNK_SIZE)}`);
    if (chunk) meshChunk(chunk);
    const tnt = new PrimedTNT(target.x + 0.5, target.y + 0.5, target.z + 0.5, 2.4);
    primedTNTs.push(tnt);
    triggerArmSwing();
    showToast('TNT Ignited! FUSE LIT!');
    return true;
  }
  function breakTargetedBlock() {
    triggerArmSwing();
    const target = raycastBlock();
    if (!target) return;

    // Bedrock is indestructible
    if (target.block === BLOCKS.BEDROCK) {
      showToast('Bedrock is indestructible!');
      return;
    }

    // Clicking or Mining TNT always ignites it into action!
    if (target.block === BLOCKS.TNT) {
      igniteTargetedTNT(target);
      return;
    }

    // Spawn particle burst
    spawnBreakParticles(target.x, target.y, target.z, target.block);
    playSynthesizedSound('break');

    // Remove block
    setGlobalBlock(target.x, target.y, target.z, BLOCKS.AIR);
  }

  function placeSelectedBlock() {
    triggerArmSwing();
    const selectedBlock = player.hotbar[player.activeSlot] || BLOCKS.DIRT;

    // 1. Food Consumption Mechanic
    const foodItems = {
      [BLOCKS.APPLE]: { hunger: 4, health: 2, name: 'Apple' },
      [BLOCKS.GOLDEN_APPLE]: { hunger: 8, health: 20, name: 'Golden Apple' },
      [BLOCKS.BREAD]: { hunger: 5, health: 2, name: 'Bread' },
      [BLOCKS.CARROT]: { hunger: 3, health: 1, name: 'Carrot' },
      [BLOCKS.GOLDEN_CARROT]: { hunger: 6, health: 4, name: 'Golden Carrot' },
      [BLOCKS.POTATO]: { hunger: 1, health: 0, name: 'Potato' },
      [BLOCKS.BAKED_POTATO]: { hunger: 5, health: 2, name: 'Baked Potato' },
      [BLOCKS.MELON_SLICE]: { hunger: 2, health: 1, name: 'Melon Slice' },
      [BLOCKS.SWEET_BERRIES]: { hunger: 2, health: 1, name: 'Sweet Berries' },
      [BLOCKS.COOKED_BEEF]: { hunger: 8, health: 4, name: 'Cooked Beef' },
      [BLOCKS.COOKED_PORKCHOP]: { hunger: 8, health: 4, name: 'Cooked Porkchop' },
      [BLOCKS.COOKED_CHICKEN]: { hunger: 6, health: 3, name: 'Cooked Chicken' },
      [BLOCKS.COOKED_MUTTON]: { hunger: 6, health: 3, name: 'Cooked Mutton' },
      [BLOCKS.COOKED_FISH]: { hunger: 6, health: 3, name: 'Cooked Fish' },
      [BLOCKS.HONEY_BOTTLE]: { hunger: 6, health: 2, name: 'Honey Bottle' }
    };

    if (foodItems[selectedBlock]) {
      const food = foodItems[selectedBlock];
      player.hunger = Math.min(20, player.hunger + food.hunger);
      player.health = Math.min(20, player.health + food.health);
      syncSurvivalHUD();
      playSynthesizedSound('eat');
      createParticleExplosion(player.x, player.y + 1.2, player.z, selectedBlock, 8);
      showToast(`Consumed ${food.name} (+${food.hunger} Hunger, +${food.health} Health)`);
      return;
    }

    // 2. Milk Bucket: Clears status effects
    if (selectedBlock === BLOCKS.MILK_BUCKET) {
      playerEffects.swiftness = 0;
      playerEffects.regen = 0;
      playerEffects.fireRes = 0;
      playerEffects.nightVision = 0;
      playSynthesizedSound('drink');
      showToast('Drank Milk: All status effects cleared');
      return;
    }

    // 3. Potions Drinking
    const potionItems = {
      [BLOCKS.POTION_HEALING]: { name: 'Potion of Healing', heal: 8 },
      [BLOCKS.POTION_REGEN]: { name: 'Potion of Regeneration', regen: 30 },
      [BLOCKS.POTION_SWIFTNESS]: { name: 'Potion of Swiftness', swiftness: 45 },
      [BLOCKS.POTION_FIRE_RES]: { name: 'Potion of Fire Resistance', fireRes: 60 },
      [BLOCKS.POTION_NIGHT_VISION]: { name: 'Potion of Night Vision', nightVision: 60 },
      [BLOCKS.POTION_STRENGTH]: { name: 'Potion of Strength', strength: 45 },
      [BLOCKS.POTION_INVISIBILITY]: { name: 'Potion of Invisibility' },
      [BLOCKS.POTION_POISON]: { name: 'Potion of Poison' }
    };

    if (potionItems[selectedBlock]) {
      const pot = potionItems[selectedBlock];
      playSynthesizedSound('drink');
      if (pot.heal) {
        player.health = Math.min(20, player.health + pot.heal);
        syncSurvivalHUD();
      }
      if (pot.swiftness) playerEffects.swiftness = pot.swiftness;
      if (pot.regen) playerEffects.regen = pot.regen;
      if (pot.fireRes) playerEffects.fireRes = pot.fireRes;
      if (pot.nightVision) playerEffects.nightVision = pot.nightVision;
      showToast(`Drank ${pot.name}!`);
      return;
    }

    // 4. Ender Pearl Teleportation
    if (selectedBlock === BLOCKS.ENDER_PEARL) {
      const target = raycastBlock(48);
      if (target) {
        createParticleExplosion(player.x, player.y + 1, player.z, BLOCKS.AMETHYST, 12);
        player.x = target.x + 0.5;
        player.y = target.y + 1.2;
        player.z = target.z + 0.5;
        player.vy = 0;
        playSynthesizedSound('teleport');
        createParticleExplosion(player.x, player.y + 1, player.z, BLOCKS.AMETHYST, 20);
        if (settings.gameMode === 'survival') damagePlayer(2);
        showToast('Teleported via Ender Pearl!');
      } else {
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        player.x += dir.x * 16;
        player.y = Math.max(25, player.y + dir.y * 16);
        player.z += dir.z * 16;
        playSynthesizedSound('teleport');
        createParticleExplosion(player.x, player.y + 1, player.z, BLOCKS.AMETHYST, 20);
        showToast('Ender Pearl teleported forward!');
      }
      return;
    }

    // 5. Spawn Eggs Mechanic
    const spawnEggMobMap = {
      [BLOCKS.SPAWN_PIG]: 'pig',
      [BLOCKS.SPAWN_COW]: 'cow',
      [BLOCKS.SPAWN_SHEEP]: 'sheep',
      [BLOCKS.SPAWN_CHICKEN]: 'chicken',
      [BLOCKS.SPAWN_ZOMBIE]: 'zombie',
      [BLOCKS.SPAWN_CREEPER]: 'creeper',
      [BLOCKS.SPAWN_SKELETON]: 'skeleton',
      [BLOCKS.SPAWN_SPIDER]: 'spider',
      [BLOCKS.SPAWN_ENDERMAN]: 'enderman',
      [BLOCKS.SPAWN_VILLAGER]: 'villager',
      [BLOCKS.SPAWN_GOLEM]: 'golem',
      [BLOCKS.SPAWN_WOLF]: 'wolf',
      [BLOCKS.SPAWN_SLIME]: 'slime',
      [BLOCKS.SPAWN_BLAZE]: 'blaze',
      [BLOCKS.SPAWN_WARDEN]: 'warden'
    };

    if (spawnEggMobMap[selectedBlock]) {
      const target = raycastBlock();
      const sx = target ? target.x + 0.5 : player.x + 2;
      const sy = target ? target.y + 1.0 : player.y;
      const sz = target ? target.z + 0.5 : player.z + 2;
      const mobType = spawnEggMobMap[selectedBlock];
      const newMob = new Mob(mobType, sx, sz);
      newMob.y = sy;
      if (newMob.group) newMob.group.position.set(sx, sy, sz);
      mobs.push(newMob);
      playSynthesizedSound('place');
      createParticleExplosion(sx, sy + 0.5, sz, BLOCKS.GLOWSTONE, 14);
      showToast(`Spawned ${BLOCK_NAMES[selectedBlock].replace(' Spawn Egg', '')}!`);
      return;
    }

    // 6. Water Bucket & Lava Bucket Placement
    if (selectedBlock === BLOCKS.WATER_BUCKET) {
      const target = raycastBlock();
      if (!target) return;
      const px = target.x + target.normal[0];
      const py = target.y + target.normal[1];
      const pz = target.z + target.normal[2];
      setGlobalBlock(px, py, pz, BLOCKS.WATER);
      playSynthesizedSound('place');
      showToast('Placed Water Source');
      return;
    }
    if (selectedBlock === BLOCKS.LAVA_BUCKET) {
      const target = raycastBlock();
      if (!target) return;
      const px = target.x + target.normal[0];
      const py = target.y + target.normal[1];
      const pz = target.z + target.normal[2];
      setGlobalBlock(px, py, pz, BLOCKS.LAVA);
      playSynthesizedSound('place');
      showToast('Placed Molten Lava Source');
      return;
    }

    const target = raycastBlock();
    if (!target) return;

    // Handle Igniter Tool (Flint & Steel)
    if (selectedBlock === BLOCKS.IGNITER) {
      if (target.block === BLOCKS.TNT) {
        igniteTargetedTNT(target);
        return;
      } else {
        playSynthesizedSound('ignite');
        createParticleExplosion(target.x + 0.5, target.y + 1.0, target.z + 0.5, BLOCKS.GLOWSTONE, 5);
        return;
      }
    }

    // Check if placing TNT adjacent to Lava: auto-ignite immediately
    if (selectedBlock === BLOCKS.TNT) {
      const px = target.x + target.normal[0];
      const py = target.y + target.normal[1];
      const pz = target.z + target.normal[2];
      const adjBlocks = [
        getGlobalBlock(px + 1, py, pz), getGlobalBlock(px - 1, py, pz),
        getGlobalBlock(px, py + 1, pz), getGlobalBlock(px, py - 1, pz),
        getGlobalBlock(px, py, pz + 1), getGlobalBlock(px, py, pz - 1)
      ];
      if (adjBlocks.includes(BLOCKS.LAVA)) {
        triggerArmSwing();
        setGlobalBlock(px, py, pz, BLOCKS.AIR);
        const tnt = new PrimedTNT(px + 0.5, py + 0.5, pz + 0.5, 0.4);
        primedTNTs.push(tnt);
        showToast('TNT Ignited by Molten Lava!');
        return;
      }
    }

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
      case BLOCKS.STONE_BRICKS: return 0x7a8288;
      case BLOCKS.GLOWSTONE: return 0xeab308;
      case BLOCKS.ROSE: return 0xdc2626;
      case BLOCKS.POLISHED_STONE: return 0x94a3b8;
      case BLOCKS.LAVA: return 0xea580c;
      case BLOCKS.IGNITER: return 0x94a3b8;
      case BLOCKS.OBSIDIAN: return 0x1f1435;
      case BLOCKS.AMETHYST: return 0xa855f7;
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
    const dustCount = isMobileDevice ? 50 : 120;
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
    try {
      if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          audioCtx = new AudioContext();
        }
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
    } catch (e) {
      console.warn('Audio init deferred:', e);
    }
  }

  function playSynthesizedSound(type) {
    if (!audioCtx || settings.soundMuted || settings.soundVolume <= 0) return;
    try {
      const now = audioCtx.currentTime;
      const master = audioCtx.createGain();
      master.gain.value = settings.soundVolume * 0.4;
      master.connect(audioCtx.destination);

      if (type === 'eat') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(340 + Math.random() * 80, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.09);
        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'drink') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.14);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 0.14);
      } else if (type === 'teleport') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(920, now + 0.22);
        gain.gain.setValueAtTime(0.55, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'chat') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(660, now + 0.06);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (type === 'break') {
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
      } else if (type === 'mob_sheep') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(240, now + 0.35);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'mob_cow') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(115, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.45);
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (type === 'mob_pig') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.linearRampToValueAtTime(180, now + 0.08);
        osc.frequency.linearRampToValueAtTime(310, now + 0.18);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'ignite') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.09);
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'explosion') {
        const bufferSize = Math.floor(audioCtx.sampleRate * 0.7);
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.20));
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.exponentialRampToValueAtTime(50, now + 0.65);
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(1.0, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(master);
        noise.start(now);

        const sub = audioCtx.createOscillator();
        const subGain = audioCtx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(95, now);
        sub.frequency.exponentialRampToValueAtTime(25, now + 0.4);
        subGain.gain.setValueAtTime(0.9, now);
        subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        sub.connect(subGain);
        subGain.connect(master);
        sub.start(now);
        sub.stop(now + 0.4);
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
  // Dynamic Voxel Clouds System (Altitude Y=46.5, Wind Drift & Day Tinting)
  // =========================================================================
  function setupCloudLayer() {
    // 64x64 Procedural Pixel Cloud Canvas with Puffy Voxel Patches
    const cloudCanvas = document.createElement('canvas');
    cloudCanvas.width = 64;
    cloudCanvas.height = 64;
    const cctx = cloudCanvas.getContext('2d');
    cctx.clearRect(0, 0, 64, 64);

    // Generate chunky pixel clouds
    for (let x = 0; x < 64; x += 2) {
      for (let y = 0; y < 64; y += 2) {
        const n1 = Math.sin(x * 0.15) * Math.cos(y * 0.15);
        const n2 = Math.sin(x * 0.35 + 1.2) * Math.cos(y * 0.35 + 0.8) * 0.5;
        const val = n1 + n2;
        if (val > 0.18) {
          cctx.fillStyle = 'rgba(255, 255, 255, 0.90)';
          cctx.fillRect(x, y, 2, 2);
          if (val > 0.42) {
            cctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
            cctx.fillRect(x, y, 1, 1);
          }
        }
      }
    }

    cloudTex = new THREE.CanvasTexture(cloudCanvas);
    cloudTex.magFilter = THREE.NearestFilter;
    cloudTex.minFilter = THREE.NearestFilter;
    cloudTex.wrapS = THREE.RepeatWrapping;
    cloudTex.wrapT = THREE.RepeatWrapping;
    cloudTex.repeat.set(16, 16);

    // Massive 1600x1600 high altitude cloud layer
    const cloudGeom = new THREE.PlaneGeometry(1600, 1600);
    const cloudMat = new THREE.MeshBasicMaterial({
      map: cloudTex,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false
    });

    cloudMesh = new THREE.Mesh(cloudGeom, cloudMat);
    cloudMesh.rotation.x = Math.PI / 2; // Flat horizontal plane
    cloudMesh.position.set(player.x, 115.0, player.z); // High in the stratosphere above mountains
    cloudMesh.renderOrder = -400;
    scene.add(cloudMesh);
  }

  let cloudWindX = 0;
  let cloudWindZ = 0;

  function updateClouds(dt) {
    if (!cloudMesh || !cloudTex) return;

    // Continuous natural wind drift (100% independent of player movement)
    cloudWindX += dt * 0.0025;
    cloudWindZ += dt * 0.0010;
    cloudTex.offset.x = cloudWindX;
    cloudTex.offset.y = cloudWindZ;

    // Discretely snap the mesh position to 100-block intervals around the player
    // Because the texture repeats every 100 blocks, snapping by 100 blocks is 100% seamless and imperceptible.
    // While moving within any 100-block zone, the mesh is COMPLETELY STATIONARY in world space!
    const step = 100.0;
    cloudMesh.position.x = Math.floor(player.x / step) * step;
    cloudMesh.position.y = 125.0; // High in the sky far above mountains
    cloudMesh.position.z = Math.floor(player.z / step) * step;

    // Dynamic Day/Night cloud color tinting
    const isDay = (dayTime >= 0.12 && dayTime <= 0.45);
    const isDawnDusk = ((dayTime >= 0.00 && dayTime < 0.12) || (dayTime > 0.45 && dayTime <= 0.58));
    if (isDay) {
      cloudMesh.material.color.setRGB(1.0, 1.0, 1.0);
      cloudMesh.material.opacity = 0.82;
    } else if (isDawnDusk) {
      cloudMesh.material.color.setRGB(1.0, 0.75, 0.58); // Sunset peach/gold
      cloudMesh.material.opacity = 0.86;
    } else {
      cloudMesh.material.color.setRGB(0.18, 0.22, 0.35); // Moonlit indigo
      cloudMesh.material.opacity = 0.52;
    }
  }

  // =========================================================================
  // Cute Animated NPCs System (Mostly Female with Chibi Voxel Rigs & Wandering AI)
  // =========================================================================
  const NPC_PRESETS = [
    {
      name: 'Sakura',
      role: 'Village Florist',
      hairColor: 0x6d4c41, // Soft brown
      ribbonColor: 0xf472b6, // Pink
      dressColor: 0xfb7185, // Sakura rose dress
      eyeColor: '#78350f',
      dialogues: [
        'Welcome to Square Era! The flowers here smell wonderful today!',
        'Have you visited the village well? The water is crystal clear!',
        'I love watching the clouds drift by in the afternoon.'
      ]
    },
    {
      name: 'Aoi',
      role: 'City Architect',
      hairColor: 0x1e293b, // Deep navy
      ribbonColor: 0x38bdf8, // Sky blue
      dressColor: 0x0284c7, // Modern blue jacket & skirt
      eyeColor: '#0369a1',
      dialogues: [
        'I designed these city towers! What do you think of the architecture?',
        'Double-tap space to fly up and see the city skyline from above!',
        'Remember to place glowstone lanterns at night to keep the avenues bright!'
      ]
    },
    {
      name: 'Lily',
      role: 'Town Baker',
      hairColor: 0xfde047, // Golden blonde
      ribbonColor: 0xf43f5e, // Cherry red
      dressColor: 0xfef08a, // Warm cream dress with apron
      eyeColor: '#15803d',
      dialogues: [
        'Hello there! Stay safe while exploring out there!',
        'Press [I] anytime to view all the blocks in your creative palette!',
        'Freshly baked treats are the best after a long day of mining.'
      ]
    },
    {
      name: 'Hana',
      role: 'Botanist',
      hairColor: 0xc2410c, // Auburn ginger
      ribbonColor: 0x4ade80, // Leaf green
      dressColor: 0x22c55e, // Mint green sundress
      eyeColor: '#92400e',
      dialogues: [
        'The trees grow so tall across these biomes!',
        'Look at that sunset! The colors across the horizon are gorgeous.',
        'If you dig deep enough, you might discover diamonds near bedrock!'
      ]
    },
    {
      name: 'Rin',
      role: 'Street Merchant',
      hairColor: 0x7c3aed, // Lavender violet
      ribbonColor: 0xa855f7, // Purple
      dressColor: 0x8b5cf6, // Lavender kimono dress
      eyeColor: '#581c87',
      dialogues: [
        'Welcome traveler! Feel free to explore our village streets.',
        'You can build anything you imagine with these voxel blocks!',
        'Nighttime can be cold, stay close to the cozy glowstone lights.'
      ]
    },
    {
      name: 'Maya',
      role: 'Explorer',
      hairColor: 0x451a03, // Dark brunette
      ribbonColor: 0xf97316, // Orange
      dressColor: 0xfb923c, // Coral explorer tunic
      eyeColor: '#0d9488',
      dialogues: [
        'I just returned from exploring the mountain peaks!',
        'The view from above the clouds is simply breathtaking.',
        'Let us build a magnificent castle together!'
      ]
    },
    {
      name: 'Noah',
      role: 'Friendly Villager',
      hairColor: 0x3f3f46, // Dark grey
      ribbonColor: 0x3b82f6, // Blue
      dressColor: 0x64748b, // Denim jacket
      eyeColor: '#374151',
      dialogues: [
        'Hey there friend! Need a hand with any construction?',
        'The city avenues look amazing at night with all the lights turned on.'
      ]
    }
  ];

  class NPC {
    constructor(preset, x, z) {
      this.preset = preset;
      this.x = x;
      this.z = z;
      this.y = Math.max(20, getTerrainHeight(Math.floor(x), Math.floor(z)) + 1);
      this.targetX = x;
      this.targetZ = z;
      this.yaw = Math.random() * Math.PI * 2;
      this.walkTimer = Math.random() * 10;
      this.wanderTimer = Math.random() * 4;
      this.isWalking = false;
      this.moveSpeed = 1.6;

      this.createModel();
    }

    createModel() {
      this.group = new THREE.Group();
      this.group.position.set(this.x, this.y, this.z);

      // Cute Chibi Proportions: Head (0.44), Torso (0.45), Arms, Legs
      // 1. Head Group
      this.headGroup = new THREE.Group();
      this.headGroup.position.set(0, 1.25, 0);

      // Cute Anime Face Texture (32x32 with big sparkly eyes & rosy cheeks)
      const faceCanvas = document.createElement('canvas');
      faceCanvas.width = 32;
      faceCanvas.height = 32;
      const fctx = faceCanvas.getContext('2d');
      fctx.fillStyle = '#ffedd5'; // Skin tone
      fctx.fillRect(0, 0, 32, 32);
      // Sparkly cute eyes
      fctx.fillStyle = this.preset.eyeColor;
      fctx.fillRect(6, 12, 6, 8);
      fctx.fillRect(20, 12, 6, 8);
      // White eye highlights
      fctx.fillStyle = '#ffffff';
      fctx.fillRect(7, 13, 2, 3);
      fctx.fillRect(21, 13, 2, 3);
      // Rosy cheeks (blush dots)
      fctx.fillStyle = '#fb7185';
      fctx.fillRect(5, 21, 5, 2);
      fctx.fillRect(22, 21, 5, 2);
      // Cute smile
      fctx.fillStyle = '#e11d48';
      fctx.fillRect(14, 23, 4, 1);

      const faceTex = new THREE.CanvasTexture(faceCanvas);
      faceTex.magFilter = THREE.NearestFilter;

      const skinMat = new THREE.MeshLambertMaterial({ color: 0xffedd5 });
      const faceMat = new THREE.MeshLambertMaterial({ map: faceTex });
      // Head cube: [+X, -X, +Y, -Y, +Z (Face), -Z]
      const headMats = [skinMat, skinMat, skinMat, skinMat, faceMat, skinMat];
      const headGeom = new THREE.BoxGeometry(0.44, 0.44, 0.44);
      const headMesh = new THREE.Mesh(headGeom, headMats);
      this.headGroup.add(headMesh);

      // Cute Hairstyle Mesh
      const hairMat = new THREE.MeshLambertMaterial({ color: this.preset.hairColor });
      const hairTopGeom = new THREE.BoxGeometry(0.48, 0.22, 0.48);
      const hairTopMesh = new THREE.Mesh(hairTopGeom, hairMat);
      hairTopMesh.position.set(0, 0.16, -0.02);
      this.headGroup.add(hairTopMesh);

      // Hair Bangs & Side Twintails/Strands
      const strandGeom = new THREE.BoxGeometry(0.12, 0.36, 0.12);
      const leftStrand = new THREE.Mesh(strandGeom, hairMat);
      leftStrand.position.set(-0.25, -0.08, -0.05);
      this.headGroup.add(leftStrand);

      const rightStrand = new THREE.Mesh(strandGeom, hairMat);
      rightStrand.position.set(0.25, -0.08, -0.05);
      this.headGroup.add(rightStrand);

      // Cute Hair Ribbon
      const ribbonMat = new THREE.MeshLambertMaterial({ color: this.preset.ribbonColor });
      const ribbonGeom = new THREE.BoxGeometry(0.18, 0.08, 0.08);
      const ribbonMesh = new THREE.Mesh(ribbonGeom, ribbonMat);
      ribbonMesh.position.set(0, 0.26, 0.18);
      this.headGroup.add(ribbonMesh);

      this.group.add(this.headGroup);

      // 2. Torso with Cute Dress
      const dressMat = new THREE.MeshLambertMaterial({ color: this.preset.dressColor });
      const torsoGeom = new THREE.BoxGeometry(0.40, 0.50, 0.24);
      this.torsoMesh = new THREE.Mesh(torsoGeom, dressMat);
      this.torsoMesh.position.set(0, 0.80, 0);
      this.group.add(this.torsoMesh);

      // 3. Left & Right Arms (Pivots at shoulders)
      const armGeom = new THREE.BoxGeometry(0.12, 0.45, 0.12);
      armGeom.translate(0, -0.20, 0); // Pivot at shoulder

      this.leftArm = new THREE.Mesh(armGeom, skinMat);
      this.leftArm.position.set(-0.27, 0.98, 0);
      this.group.add(this.leftArm);

      this.rightArm = new THREE.Mesh(armGeom, skinMat);
      this.rightArm.position.set(0.27, 0.98, 0);
      this.group.add(this.rightArm);

      // 4. Left & Right Legs (Pivots at hips)
      const legGeom = new THREE.BoxGeometry(0.15, 0.55, 0.15);
      legGeom.translate(0, -0.25, 0); // Pivot at hip

      this.leftLeg = new THREE.Mesh(legGeom, dressMat);
      this.leftLeg.position.set(-0.11, 0.55, 0);
      this.group.add(this.leftLeg);

      this.rightLeg = new THREE.Mesh(legGeom, dressMat);
      this.rightLeg.position.set(0.11, 0.55, 0);
      this.group.add(this.rightLeg);

      // 5. Floating Name Tag Sprite
      const tagCanvas = document.createElement('canvas');
      tagCanvas.width = 256;
      tagCanvas.height = 64;
      const tctx = tagCanvas.getContext('2d');
      if (tctx) {
        tctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        // Safe cross-browser rounded rectangle
        const rx = 4, ry = 8, rw = 248, rh = 48, rad = 10;
        tctx.beginPath();
        tctx.moveTo(rx + rad, ry);
        tctx.lineTo(rx + rw - rad, ry);
        tctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rad);
        tctx.lineTo(rx + rw, ry + rh - rad);
        tctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rad, ry + rh);
        tctx.lineTo(rx + rad, ry + rh);
        tctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rad);
        tctx.lineTo(rx, ry + rad);
        tctx.quadraticCurveTo(rx, ry, rx + rad, ry);
        tctx.closePath();
        tctx.fill();
        tctx.strokeStyle = '#38bdf8';
        tctx.lineWidth = 2;
        tctx.stroke();
        tctx.fillStyle = '#ffffff';
        tctx.font = 'bold 20px sans-serif';
        tctx.textAlign = 'center';
        tctx.fillText(`${this.preset.name} [${this.preset.role}]`, 128, 40);
      }

      const tagTex = new THREE.CanvasTexture(tagCanvas);
      const tagMat = new THREE.SpriteMaterial({ map: tagTex, depthWrite: false });
      this.nameTag = new THREE.Sprite(tagMat);
      this.nameTag.position.set(0, 1.75, 0);
      this.nameTag.scale.set(1.4, 0.35, 1.0);
      this.group.add(this.nameTag);

      scene.add(this.group);
    }

    update(dt) {
      // 1. Distance to player
      const dx = player.x - this.x;
      const dz = player.z - this.z;
      const distToPlayer = Math.hypot(dx, dz);

      // When player is close (< 4.0 blocks), face the player
      if (distToPlayer < 4.0) {
        const targetYaw = Math.atan2(dx, dz);
        this.yaw += (targetYaw - this.yaw) * Math.min(dt * 6.0, 1.0);
        this.headGroup.rotation.y = Math.sin(performance.now() * 0.002) * 0.15; // Gentle cute head tilt
        this.isWalking = false;
      } else {
        this.headGroup.rotation.y = 0;
        // Wandering AI
        this.wanderTimer -= dt;
        if (this.wanderTimer <= 0) {
          this.wanderTimer = 3.5 + Math.random() * 4.0;
          if (Math.random() < 0.65) {
            // Pick a nearby destination
            const ang = Math.random() * Math.PI * 2;
            const dist = 3.0 + Math.random() * 5.0;
            this.targetX = this.x + Math.cos(ang) * dist;
            this.targetZ = this.z + Math.sin(ang) * dist;
            this.isWalking = true;
          } else {
            this.isWalking = false;
          }
        }

        if (this.isWalking) {
          const tdx = this.targetX - this.x;
          const tdz = this.targetZ - this.z;
          const tdist = Math.hypot(tdx, tdz);
          if (tdist > 0.4) {
            this.yaw = Math.atan2(tdx, tdz);
            const step = this.moveSpeed * dt;
            this.x += (tdx / tdist) * step;
            this.z += (tdz / tdist) * step;
          } else {
            this.isWalking = false;
          }
        }
      }

      // 2. Terrain ground height tracking (Cached per block for silky 60fps)
      const bx = Math.floor(this.x);
      const bz = Math.floor(this.z);
      if (this.lastBx !== bx || this.lastBz !== bz) {
        this.lastBx = bx;
        this.lastBz = bz;
        this.cachedGroundH = getTerrainHeight(bx, bz);
      }
      const targetY = (this.cachedGroundH || 25) + 1.0;
      this.y += (targetY - this.y) * Math.min(dt * 10.0, 1.0);

      // 3. Apply Group Position & Rotation
      this.group.position.set(this.x, this.y, this.z);
      this.group.rotation.y = this.yaw;

      // 4. Walking and Idle Animations
      if (this.isWalking) {
        this.walkTimer += dt * 8.0;
        const swing = Math.sin(this.walkTimer) * 0.55;
        this.leftArm.rotation.x = swing;
        this.rightArm.rotation.x = -swing;
        this.leftLeg.rotation.x = -swing;
        this.rightLeg.rotation.x = swing;
      } else {
        // Idle breathing & subtle arm rest
        this.walkTimer = 0;
        const breath = Math.sin(performance.now() * 0.003) * 0.03;
        this.torsoMesh.position.y = 0.80 + breath;
        this.leftArm.rotation.x *= 0.85;
        this.rightArm.rotation.x *= 0.85;
        this.leftLeg.rotation.x *= 0.85;
        this.rightLeg.rotation.x *= 0.85;
      }
    }

    interact() {
      const line = this.preset.dialogues[Math.floor(Math.random() * this.preset.dialogues.length)];
      showToast(`${this.preset.name}: "${line}"`);
      playSynthesizedSound('place');
    }
  }

  function spawnInitialNPCs() {
    npcs = [];
    // Place cute NPCs into their themed sectors in the Grand City
    npcs.push(new NPC(NPC_PRESETS[0], 11.5, 3.5));  // Sakura (Florist at Plaza Rose Garden)
    npcs.push(new NPC(NPC_PRESETS[1], 4.5, 18.5));  // Aoi (Architect at Skyscraper Plaza)
    npcs.push(new NPC(NPC_PRESETS[2], 22.5, 5.5));  // Lily (Baker at Market District)
    npcs.push(new NPC(NPC_PRESETS[3], 18.5, -6.5)); // Hana (Botanist at Library Conservatory)
    npcs.push(new NPC(NPC_PRESETS[4], 19.5, 11.5)); // Rin (Merchant at Market Stalls)
    npcs.push(new NPC(NPC_PRESETS[5], 7.5, -14.5)); // Maya (Explorer at City North Gate)
    npcs.push(new NPC(NPC_PRESETS[6], -6.5, 7.5));  // Noah (Villager at Old Town Quarter)
  }

  function updateNPCs(dt) {
    for (let i = 0; i < npcs.length; i++) {
      npcs[i].update(dt);
    }
  }

  // =========================================================================
  // Animal Mobs System (Sheep, Cow, Pig with 4-leg walk & sounds)
  // =========================================================================
  class Mob {
    constructor(type, x, z) {
      this.type = type; // 'sheep', 'cow', 'pig'
      this.x = x;
      this.z = z;
      this.y = Math.max(20, getTerrainHeight(Math.floor(x), Math.floor(z)) + 0.4);
      this.targetX = x;
      this.targetZ = z;
      this.yaw = Math.random() * Math.PI * 2;
      this.walkTimer = Math.random() * 10;
      this.idleTimer = 1.0 + Math.random() * 3.0;
      this.isWalking = false;
      this.moveSpeed = (type === 'pig') ? 1.7 : 1.25;
      this.legs = [];
      this.head = null;
      this.createModel();
    }

    createModel() {
      this.group = new THREE.Group();
      this.group.position.set(this.x, this.y, this.z);

      if (this.type === 'sheep') {
        // Sheep: White fluffy wool body, beige face with black eyes, 4 legs
        const woolMat = new THREE.MeshLambertMaterial({ color: 0xf5f5f5 });
        const faceMat = new THREE.MeshLambertMaterial({ color: 0xdfcca8 });
        const legMat = new THREE.MeshLambertMaterial({ color: 0xcfbaa0 });

        // Fluffy Wool Body
        const bodyGeom = new THREE.BoxGeometry(0.85, 0.75, 1.25);
        const bodyMesh = new THREE.Mesh(bodyGeom, woolMat);
        bodyMesh.position.set(0, 0.75, 0);
        this.group.add(bodyMesh);

        // Head Group
        this.head = new THREE.Group();
        this.head.position.set(0, 0.95, 0.68);
        const headGeom = new THREE.BoxGeometry(0.42, 0.42, 0.46);
        const headMesh = new THREE.Mesh(headGeom, faceMat);
        this.head.add(headMesh);
        // Wool cap on head
        const capGeom = new THREE.BoxGeometry(0.44, 0.22, 0.35);
        const capMesh = new THREE.Mesh(capGeom, woolMat);
        capMesh.position.set(0, 0.16, -0.05);
        this.head.add(capMesh);
        this.group.add(this.head);

        // 4 Legs
        const legGeom = new THREE.BoxGeometry(0.22, 0.55, 0.22);
        const legOffsets = [[-0.3, 0.28, 0.45], [0.3, 0.28, 0.45], [-0.3, 0.28, -0.45], [0.3, 0.28, -0.45]];
        this.legs = legOffsets.map(([lx, ly, lz]) => {
          const leg = new THREE.Mesh(legGeom, legMat);
          leg.position.set(lx, ly, lz);
          this.group.add(leg);
          return leg;
        });
      } else if (this.type === 'cow') {
        // Cow: Spotted brown/white body, horns, pink snout, 4 sturdy legs
        const bodyMat = new THREE.MeshLambertMaterial({ color: 0x5c3a21 });
        const spotMat = new THREE.MeshLambertMaterial({ color: 0xf1f5f9 });
        const snoutMat = new THREE.MeshLambertMaterial({ color: 0xfda4af });
        const hornMat = new THREE.MeshLambertMaterial({ color: 0xd6d3d1 });

        // Body
        const bodyGeom = new THREE.BoxGeometry(0.95, 0.85, 1.35);
        const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
        bodyMesh.position.set(0, 0.85, 0);
        this.group.add(bodyMesh);

        // White Belly Patch
        const patchGeom = new THREE.BoxGeometry(0.97, 0.45, 0.65);
        const patchMesh = new THREE.Mesh(patchGeom, spotMat);
        patchMesh.position.set(0, 0.85, 0.1);
        this.group.add(patchMesh);

        // Head
        this.head = new THREE.Group();
        this.head.position.set(0, 1.15, 0.8);
        const headGeom = new THREE.BoxGeometry(0.48, 0.48, 0.48);
        const headMesh = new THREE.Mesh(headGeom, bodyMat);
        this.head.add(headMesh);
        // Snout
        const snoutGeom = new THREE.BoxGeometry(0.4, 0.24, 0.2);
        const snoutMesh = new THREE.Mesh(snoutGeom, snoutMat);
        snoutMesh.position.set(0, -0.12, 0.28);
        this.head.add(snoutMesh);
        // Horns
        const hornGeom = new THREE.BoxGeometry(0.1, 0.2, 0.1);
        const hornL = new THREE.Mesh(hornGeom, hornMat);
        hornL.position.set(-0.28, 0.28, -0.05);
        this.head.add(hornL);
        const hornR = new THREE.Mesh(hornGeom, hornMat);
        hornR.position.set(0.28, 0.28, -0.05);
        this.head.add(hornR);
        this.group.add(this.head);

        // 4 Legs
        const legGeom = new THREE.BoxGeometry(0.24, 0.60, 0.24);
        const legOffsets = [[-0.34, 0.30, 0.48], [0.34, 0.30, 0.48], [-0.34, 0.30, -0.48], [0.34, 0.30, -0.48]];
        this.legs = legOffsets.map(([lx, ly, lz]) => {
          const leg = new THREE.Mesh(legGeom, bodyMat);
          leg.position.set(lx, ly, lz);
          this.group.add(leg);
          return leg;
        });
      } else if (this.type === 'pig') {
        // Pig: Cute pink body, snout, floppy ears, stubby legs
        const pigMat = new THREE.MeshLambertMaterial({ color: 0xf472b6 });
        const darkPigMat = new THREE.MeshLambertMaterial({ color: 0xdb2777 });

        // Body
        const bodyGeom = new THREE.BoxGeometry(0.80, 0.70, 1.15);
        const bodyMesh = new THREE.Mesh(bodyGeom, pigMat);
        bodyMesh.position.set(0, 0.65, 0);
        this.group.add(bodyMesh);

        // Head
        this.head = new THREE.Group();
        this.head.position.set(0, 0.85, 0.65);
        const headGeom = new THREE.BoxGeometry(0.44, 0.44, 0.44);
        const headMesh = new THREE.Mesh(headGeom, pigMat);
        this.head.add(headMesh);
        // Snout
        const snoutGeom = new THREE.BoxGeometry(0.28, 0.18, 0.16);
        const snoutMesh = new THREE.Mesh(snoutGeom, darkPigMat);
        snoutMesh.position.set(0, -0.08, 0.26);
        this.head.add(snoutMesh);
        this.group.add(this.head);

        // 4 Legs
        const legGeom = new THREE.BoxGeometry(0.20, 0.45, 0.20);
        const legOffsets = [[-0.28, 0.22, 0.38], [0.28, 0.22, 0.38], [-0.28, 0.22, -0.38], [0.28, 0.22, -0.38]];
        this.legs = legOffsets.map(([lx, ly, lz]) => {
          const leg = new THREE.Mesh(legGeom, pigMat);
          leg.position.set(lx, ly, lz);
          this.group.add(leg);
          return leg;
        });
      } else if (this.type === 'chicken') {
        const whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const redMat = new THREE.MeshLambertMaterial({ color: 0xef4444 });
        const yellowMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b });
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.55), whiteMat);
        body.position.set(0, 0.45, 0);
        this.group.add(body);
        this.head = new THREE.Group();
        this.head.position.set(0, 0.65, 0.32);
        const headM = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.35, 0.32), whiteMat);
        const beak = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.14), yellowMat);
        beak.position.set(0, -0.06, 0.18);
        const wattle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.08), redMat);
        wattle.position.set(0, -0.16, 0.12);
        this.head.add(headM, beak, wattle);
        this.group.add(this.head);
        const legGeom = new THREE.BoxGeometry(0.08, 0.3, 0.08);
        const legL = new THREE.Mesh(legGeom, yellowMat); legL.position.set(-0.12, 0.15, 0);
        const legR = new THREE.Mesh(legGeom, yellowMat); legR.position.set(0.12, 0.15, 0);
        this.legs = [legL, legR];
        this.group.add(legL, legR);
      } else if (this.type === 'zombie') {
        const skinMat = new THREE.MeshLambertMaterial({ color: 0x4a7c36 });
        const shirtMat = new THREE.MeshLambertMaterial({ color: 0x06b6d4 });
        const pantsMat = new THREE.MeshLambertMaterial({ color: 0x1e3a8a });
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.75, 0.3), shirtMat);
        torso.position.set(0, 1.12, 0);
        this.group.add(torso);
        this.head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), skinMat);
        this.head.position.set(0, 1.68, 0);
        this.group.add(this.head);
        const armGeom = new THREE.BoxGeometry(0.2, 0.65, 0.2);
        const armL = new THREE.Mesh(armGeom, skinMat); armL.position.set(-0.36, 1.25, 0.3); armL.rotation.x = -Math.PI / 2;
        const armR = new THREE.Mesh(armGeom, skinMat); armR.position.set(0.36, 1.25, 0.3); armR.rotation.x = -Math.PI / 2;
        this.group.add(armL, armR);
        const legGeom = new THREE.BoxGeometry(0.22, 0.75, 0.22);
        const legL = new THREE.Mesh(legGeom, pantsMat); legL.position.set(-0.14, 0.38, 0);
        const legR = new THREE.Mesh(legGeom, pantsMat); legR.position.set(0.14, 0.38, 0);
        this.legs = [legL, legR];
        this.group.add(legL, legR);
      } else if (this.type === 'creeper') {
        const creepMat = new THREE.MeshLambertMaterial({ color: 0x22c55e });
        const faceMat = new THREE.MeshLambertMaterial({ color: 0x14532d });
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.75, 0.26), creepMat);
        torso.position.set(0, 0.85, 0);
        this.group.add(torso);
        this.head = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.48), creepMat);
        this.head.position.set(0, 1.45, 0);
        const face = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.05), faceMat);
        face.position.set(0, 0, 0.24);
        this.head.add(face);
        this.group.add(this.head);
        const cLegGeom = new THREE.BoxGeometry(0.18, 0.48, 0.18);
        const cLegs = [[-0.18, 0.24, 0.18], [0.18, 0.24, 0.18], [-0.18, 0.24, -0.18], [0.18, 0.24, -0.18]];
        this.legs = cLegs.map(([lx, ly, lz]) => {
          const l = new THREE.Mesh(cLegGeom, creepMat);
          l.position.set(lx, ly, lz);
          this.group.add(l);
          return l;
        });
      } else if (this.type === 'skeleton') {
        const boneMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 });
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.75, 0.2), boneMat);
        torso.position.set(0, 1.12, 0);
        this.group.add(torso);
        this.head = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.44, 0.44), boneMat);
        this.head.position.set(0, 1.68, 0);
        const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.05), eyeMat); eyeL.position.set(-0.1, 0.04, 0.22);
        const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.05), eyeMat); eyeR.position.set(0.1, 0.04, 0.22);
        this.head.add(eyeL, eyeR);
        this.group.add(this.head);
        const sArmGeom = new THREE.BoxGeometry(0.14, 0.7, 0.14);
        const sArmL = new THREE.Mesh(sArmGeom, boneMat); sArmL.position.set(-0.28, 1.25, 0.2); sArmL.rotation.x = -Math.PI / 3;
        const sArmR = new THREE.Mesh(sArmGeom, boneMat); sArmR.position.set(0.28, 1.25, 0.2); sArmR.rotation.x = -Math.PI / 3;
        this.group.add(sArmL, sArmR);
        const sLegGeom = new THREE.BoxGeometry(0.16, 0.75, 0.16);
        const sLegL = new THREE.Mesh(sLegGeom, boneMat); sLegL.position.set(-0.12, 0.38, 0);
        const sLegR = new THREE.Mesh(sLegGeom, boneMat); sLegR.position.set(0.12, 0.38, 0);
        this.legs = [sLegL, sLegR];
        this.group.add(sLegL, sLegR);
      } else if (this.type === 'spider') {
        const spMat = new THREE.MeshLambertMaterial({ color: 0x1c1917 });
        const redMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.4, 0.95), spMat);
        body.position.set(0, 0.45, 0);
        this.group.add(body);
        this.head = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.36, 0.48), spMat);
        this.head.position.set(0, 0.42, 0.65);
        const eye1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), redMat); eye1.position.set(-0.12, 0.05, 0.24);
        const eye2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), redMat); eye2.position.set(0.12, 0.05, 0.24);
        this.head.add(eye1, eye2);
        this.group.add(this.head);
        const legGeom = new THREE.BoxGeometry(0.65, 0.1, 0.1);
        this.legs = [];
        for (let i = 0; i < 4; i++) {
          const zOffset = -0.3 + i * 0.22;
          const legL = new THREE.Mesh(legGeom, spMat); legL.position.set(-0.6, 0.3, zOffset); legL.rotation.z = 0.35;
          const legR = new THREE.Mesh(legGeom, spMat); legR.position.set(0.6, 0.3, zOffset); legR.rotation.z = -0.35;
          this.group.add(legL, legR);
          this.legs.push(legL, legR);
        }
      } else if (this.type === 'enderman') {
        const endMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
        const purpMat = new THREE.MeshBasicMaterial({ color: 0xc084fc });
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.1, 0.22), endMat);
        body.position.set(0, 1.8, 0);
        this.group.add(body);
        this.head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), endMat);
        this.head.position.set(0, 2.55, 0);
        const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.05), purpMat); eyeL.position.set(-0.1, 0.04, 0.21);
        const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.05), purpMat); eyeR.position.set(0.1, 0.04, 0.21);
        this.head.add(eyeL, eyeR);
        this.group.add(this.head);
        const armGeom = new THREE.BoxGeometry(0.12, 1.35, 0.12);
        const armL = new THREE.Mesh(armGeom, endMat); armL.position.set(-0.3, 1.6, 0);
        const armR = new THREE.Mesh(armGeom, endMat); armR.position.set(0.3, 1.6, 0);
        this.group.add(armL, armR);
        const legGeom = new THREE.BoxGeometry(0.12, 1.35, 0.12);
        const legL = new THREE.Mesh(legGeom, endMat); legL.position.set(-0.12, 0.68, 0);
        const legR = new THREE.Mesh(legGeom, endMat); legR.position.set(0.12, 0.68, 0);
        this.legs = [legL, legR];
        this.group.add(legL, legR);
      } else if (this.type === 'villager') {
        const robeMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
        const faceMat = new THREE.MeshLambertMaterial({ color: 0xd97706 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.9, 0.35), robeMat);
        body.position.set(0, 0.95, 0);
        this.group.add(body);
        this.head = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.52, 0.44), faceMat);
        this.head.position.set(0, 1.6, 0);
        const nose = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.12), faceMat);
        nose.position.set(0, -0.06, 0.26);
        this.head.add(nose);
        this.group.add(this.head);
        const legGeom = new THREE.BoxGeometry(0.2, 0.5, 0.2);
        const legL = new THREE.Mesh(legGeom, robeMat); legL.position.set(-0.12, 0.25, 0);
        const legR = new THREE.Mesh(legGeom, robeMat); legR.position.set(0.12, 0.25, 0);
        this.legs = [legL, legR];
        this.group.add(legL, legR);
      } else if (this.type === 'golem') {
        const ironMat = new THREE.MeshLambertMaterial({ color: 0xd1d5db });
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.6), ironMat);
        body.position.set(0, 1.35, 0);
        this.group.add(body);
        this.head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.5, 0.45), ironMat);
        this.head.position.set(0, 2.15, 0);
        this.group.add(this.head);
        const armGeom = new THREE.BoxGeometry(0.26, 1.25, 0.26);
        const armL = new THREE.Mesh(armGeom, ironMat); armL.position.set(-0.62, 1.35, 0);
        const armR = new THREE.Mesh(armGeom, ironMat); armR.position.set(0.62, 1.35, 0);
        this.group.add(armL, armR);
        const legGeom = new THREE.BoxGeometry(0.3, 0.8, 0.3);
        const legL = new THREE.Mesh(legGeom, ironMat); legL.position.set(-0.25, 0.4, 0);
        const legR = new THREE.Mesh(legGeom, ironMat); legR.position.set(0.25, 0.4, 0);
        this.legs = [legL, legR];
        this.group.add(legL, legR);
      } else if (this.type === 'wolf') {
        const furMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
        const darkMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.45, 0.75), furMat);
        body.position.set(0, 0.55, 0);
        this.group.add(body);
        this.head = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.36), furMat);
        this.head.position.set(0, 0.8, 0.45);
        const snout = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.18), darkMat);
        snout.position.set(0, -0.06, 0.24);
        this.head.add(snout);
        this.group.add(this.head);
        const legGeom = new THREE.BoxGeometry(0.14, 0.4, 0.14);
        const legOffsets = [[-0.16, 0.2, 0.25], [0.16, 0.2, 0.25], [-0.16, 0.2, -0.25], [0.16, 0.2, -0.25]];
        this.legs = legOffsets.map(([lx, ly, lz]) => {
          const l = new THREE.Mesh(legGeom, furMat); l.position.set(lx, ly, lz); this.group.add(l); return l;
        });
      } else if (this.type === 'slime') {
        const slimeMat = new THREE.MeshLambertMaterial({ color: 0x86efac, transparent: true, opacity: 0.8 });
        const coreMat = new THREE.MeshLambertMaterial({ color: 0x22c55e });
        const outer = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), slimeMat);
        outer.position.set(0, 0.4, 0);
        const inner = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), coreMat);
        outer.add(inner);
        this.group.add(outer);
      } else if (this.type === 'blaze') {
        const blazeMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b });
        this.head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), blazeMat);
        this.head.position.set(0, 1.2, 0);
        this.group.add(this.head);
        const rodGeom = new THREE.BoxGeometry(0.12, 0.45, 0.12);
        for (let i = 0; i < 6; i++) {
          const rod = new THREE.Mesh(rodGeom, blazeMat);
          const ang = (i / 6) * Math.PI * 2;
          rod.position.set(Math.cos(ang) * 0.45, 0.65, Math.sin(ang) * 0.45);
          this.group.add(rod);
        }
      } else if (this.type === 'warden') {
        const sculkMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
        const cyanMat = new THREE.MeshLambertMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 0.6 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.2, 0.65), sculkMat);
        body.position.set(0, 1.5, 0);
        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.1), cyanMat);
        rib.position.set(0, 0, 0.33);
        body.add(rib);
        this.group.add(body);
        this.head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.55), sculkMat);
        this.head.position.set(0, 2.4, 0);
        const hornL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.4, 0.1), cyanMat); hornL.position.set(-0.38, 0.35, 0);
        const hornR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.4, 0.1), cyanMat); hornR.position.set(0.38, 0.35, 0);
        this.head.add(hornL, hornR);
        this.group.add(this.head);
        const armGeom = new THREE.BoxGeometry(0.35, 1.35, 0.35);
        const armL = new THREE.Mesh(armGeom, sculkMat); armL.position.set(-0.75, 1.45, 0);
        const armR = new THREE.Mesh(armGeom, sculkMat); armR.position.set(0.75, 1.45, 0);
        this.group.add(armL, armR);
        const legGeom = new THREE.BoxGeometry(0.38, 0.9, 0.38);
        const legL = new THREE.Mesh(legGeom, sculkMat); legL.position.set(-0.3, 0.45, 0);
        const legR = new THREE.Mesh(legGeom, sculkMat); legR.position.set(0.3, 0.45, 0);
        this.legs = [legL, legR];
        this.group.add(legL, legR);
      }

      scene.add(this.group);
    }

    update(dt) {
      this.idleTimer -= dt;
      if (this.idleTimer <= 0) {
        if (this.isWalking) {
          this.isWalking = false;
          this.idleTimer = 2.0 + Math.random() * 4.0;
        } else {
          const angle = Math.random() * Math.PI * 2;
          const dist = 3.0 + Math.random() * 6.0;
          this.targetX = this.x + Math.cos(angle) * dist;
          this.targetZ = this.z + Math.sin(angle) * dist;
          this.isWalking = true;
          this.idleTimer = 3.5 + Math.random() * 3.0;
        }
      }

      if (this.isWalking) {
        const tdx = this.targetX - this.x;
        const tdz = this.targetZ - this.z;
        const tdist = Math.hypot(tdx, tdz);
        if (tdist > 0.3) {
          const targetYaw = Math.atan2(tdx, tdz);
          let dyaw = targetYaw - this.yaw;
          while (dyaw < -Math.PI) dyaw += Math.PI * 2;
          while (dyaw > Math.PI) dyaw -= Math.PI * 2;
          this.yaw += dyaw * Math.min(dt * 5.0, 1.0);

          const step = Math.min(this.moveSpeed * dt, tdist);
          this.x += (tdx / tdist) * step;
          this.z += (tdz / tdist) * step;

          // 4-legged alternating walk cycle
          this.walkTimer += dt * 7.5;
          const legSwing = Math.sin(this.walkTimer) * 0.45;
          if (this.legs.length === 4) {
            this.legs[0].rotation.x = legSwing;
            this.legs[1].rotation.x = -legSwing;
            this.legs[2].rotation.x = -legSwing;
            this.legs[3].rotation.x = legSwing;
          }
          if (this.head) this.head.rotation.x = Math.sin(this.walkTimer * 2) * 0.08;
        } else {
          this.isWalking = false;
        }
      } else {
        if (this.legs.length === 4) {
          this.legs.forEach(l => l.rotation.x *= 0.85);
        }
        if (this.head) {
          const pDist = Math.hypot(player.x - this.x, player.z - this.z);
          if (pDist < 4.5) {
            const pYaw = Math.atan2(player.x - this.x, player.z - this.z);
            let dyaw = pYaw - this.yaw;
            while (dyaw < -Math.PI) dyaw += Math.PI * 2;
            while (dyaw > Math.PI) dyaw -= Math.PI * 2;
            this.head.rotation.y = Math.max(-0.6, Math.min(0.6, dyaw));
            this.head.rotation.x = 0;
          } else {
            this.head.rotation.y *= 0.9;
            this.head.rotation.x = 0.15 + Math.sin(performance.now() * 0.002) * 0.08;
          }
        }
      }

      const targetY = Math.max(WATER_LEVEL + 0.1, getTerrainHeight(Math.floor(this.x), Math.floor(this.z)));
      this.y += (targetY - this.y) * Math.min(dt * 8.0, 1.0);

      this.group.position.set(this.x, this.y, this.z);
      this.group.rotation.y = this.yaw;
    }

    interact() {
      if (this.type === 'sheep') {
        showToast('Fluffy Sheep: Baaa! <3');
        playSynthesizedSound('mob_sheep');
      } else if (this.type === 'cow') {
        showToast('Spotted Cow: Mooo~');
        playSynthesizedSound('mob_cow');
      } else {
        showToast('Pink Pig: Oink oink!');
        playSynthesizedSound('mob_pig');
      }
      createParticleExplosion(this.x, this.y + 1.0, this.z, BLOCKS.ROSE, 10);
    }
  }

  function spawnInitialMobs() {
    mobs = [];
    // Spawn Sheep in Western Meadows
    mobs.push(new Mob('sheep', -24, 8));
    mobs.push(new Mob('sheep', -28, 14));
    mobs.push(new Mob('sheep', -20, -5));
    mobs.push(new Mob('sheep', -32, 2));

    // Spawn Cows in Southern River Valley
    mobs.push(new Mob('cow', 26, 28));
    mobs.push(new Mob('cow', 32, 25));
    mobs.push(new Mob('cow', -18, -22));
    mobs.push(new Mob('cow', -25, -26));

    // Spawn Pigs in Eastern Plains
    mobs.push(new Mob('pig', 34, 10));
    mobs.push(new Mob('pig', 38, 15));
    mobs.push(new Mob('pig', -12, 28));
    mobs.push(new Mob('pig', 14, 36));
  }

  function updateMobs(dt) {
    const maxDistSq = isMobileDevice ? (36 * 36) : (54 * 54);
    for (let i = 0; i < mobs.length; i++) {
      const mob = mobs[i];
      const distSq = (mob.x - player.x) ** 2 + (mob.z - player.z) ** 2;
      if (distSq < maxDistSq) {
        mob.update(dt);
      }
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
  // Chunk Management (Dynamic Streaming Around Player with Staggered Meshing)
  // =========================================================================
  function processChunkMeshQueue() {
    if (chunkMeshQueue.length === 0) return;

    // Prioritize chunks closest to player
    const playerChunkX = Math.floor(player.x / CHUNK_SIZE);
    const playerChunkZ = Math.floor(player.z / CHUNK_SIZE);
    chunkMeshQueue.sort((a, b) => {
      const distA = (a.cx - playerChunkX) ** 2 + (a.cz - playerChunkZ) ** 2;
      const distB = (b.cx - playerChunkX) ** 2 + (b.cz - playerChunkZ) ** 2;
      return distA - distB;
    });

    // Mesh at most 1 chunk per frame to guarantee consistent 60+ FPS
    while (chunkMeshQueue.length > 0) {
      const nextChunk = chunkMeshQueue.shift();
      const key = `${nextChunk.cx},${nextChunk.cz}`;
      if (chunks.has(key) && !nextChunk.mesh) {
        meshChunk(nextChunk);
        break;
      }
    }
  }

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
          chunkMeshQueue.push(chunk);
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

    // Also remove any unloaded chunks from the mesh queue
    for (let i = chunkMeshQueue.length - 1; i >= 0; i--) {
      const c = chunkMeshQueue[i];
      if (!neededKeys.has(`${c.cx},${c.cz}`)) {
        chunkMeshQueue.splice(i, 1);
      }
    }

    // Update debug chunk count
    const debugCount = document.getElementById('debugChunkCount');
    if (debugCount) debugCount.textContent = chunks.size;
  }

  // =========================================================================
  // UI & HUD Rendering
  // =========================================================================
  function populateHotbarContainer(containerEl, isModal = false) {
    if (!containerEl) return;
    containerEl.innerHTML = '';

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
      slot.addEventListener('touchstart', e => {
        e.stopPropagation();
        selectHotbarSlot(i);
      }, { passive: true });

      // Drag and drop target support
      slot.addEventListener('dragover', e => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
        slot.classList.add('drag-over');
      });
      slot.addEventListener('dragleave', () => {
        slot.classList.remove('drag-over');
      });
      slot.addEventListener('drop', e => {
        e.preventDefault();
        slot.classList.remove('drag-over');
        const rawId = e.dataTransfer ? e.dataTransfer.getData('text/plain') : null;
        const bId = parseInt(rawId);
        if (Number.isFinite(bId) && bId in BLOCK_NAMES) {
          player.hotbar[i] = bId;
          renderHotbarUI();
          playSynthesizedSound('place');
          showToast(`Assigned ${BLOCK_NAMES[bId]} to Slot ${i + 1}`);
        }
      });

      containerEl.appendChild(slot);
    }
  }

  function renderHotbarUI() {
    const hotbarEl = document.getElementById('hotbar');
    populateHotbarContainer(hotbarEl, false);

    const modalHotbarEl = document.getElementById('modalHotbar');
    if (modalHotbarEl) {
      populateHotbarContainer(modalHotbarEl, true);
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

    // Show ALL non-air blocks available in the game, filtered by Category & Search
    let allBlocks = Object.values(BLOCKS).filter(b => b !== BLOCKS.AIR);

    if (activeInvCategory !== 'all') {
      allBlocks = allBlocks.filter(bId => ITEM_CATEGORIES[bId] === activeInvCategory);
    }

    if (invSearchQuery && invSearchQuery.trim()) {
      const q = invSearchQuery.trim().toLowerCase();
      allBlocks = allBlocks.filter(bId => {
        const name = (BLOCK_NAMES[bId] || '').toLowerCase();
        const cat = (ITEM_CATEGORIES[bId] || '').toLowerCase();
        return name.includes(q) || cat.includes(q);
      });
    }

    const badge = document.getElementById('invItemCountBadge');
    if (badge) {
      badge.textContent = `${allBlocks.length} Items`;
    }

    if (allBlocks.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 32px; color: #94a3b8; font-size: 14px;';
      emptyMsg.textContent = 'No matching Minecraft items or blocks found in catalog.';
      grid.appendChild(emptyMsg);
      return;
    }

    allBlocks.forEach(bId => {
      const item = document.createElement('div');
      item.className = 'inventory-item';
      item.title = `Drag to Hotbar or Click to Equip: ${BLOCK_NAMES[bId]}`;
      item.draggable = true;

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

      // Drag and drop initiation
      item.addEventListener('dragstart', e => {
        if (e.dataTransfer) {
          e.dataTransfer.setData('text/plain', String(bId));
          e.dataTransfer.effectAllowed = 'copy';
        }
      });

      item.addEventListener('click', () => {
        player.hotbar[player.activeSlot] = bId;
        renderHotbarUI();
        playSynthesizedSound('place');
        showToast(`Equipped ${BLOCK_NAMES[bId]} to Slot ${player.activeSlot + 1}`);
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
  // =========================================================================
  // In-Game AI Communication Terminal & Fleet Connectivity
  // =========================================================================
  const aiChatHistory = [];

  function openAIChatModal(core) {
    const modal = document.getElementById('aiChatModal');
    if (!modal) return;
    isAiChatOpen = true;
    modal.style.display = 'flex';
    if (document.exitPointerLock) document.exitPointerLock();

    const locBadge = document.getElementById('aiNodeLocationBadge');
    if (locBadge && core) {
      locBadge.textContent = `Connected: ${core.name} Sector [${Math.floor(core.x)}, ${Math.floor(core.y)}, ${Math.floor(core.z)}]`;
    }

    const messagesEl = document.getElementById('aiChatMessages');
    if (messagesEl && messagesEl.children.length === 0) {
      appendChatMessage('assistant', `Quantum link established with Maiko AI Core at sector [${Math.floor(core.x)}, ${Math.floor(core.y)}, ${Math.floor(core.z)}]. Fleet cluster is active across 8 replicas. Ask anything regarding crafting recipes, coordinates, exploration secrets, or voxel physics.`);
    }

    const input = document.getElementById('aiChatInput');
    if (input) {
      setTimeout(() => input.focus(), 80);
    }
  }

  function closeAIChatModal() {
    const modal = document.getElementById('aiChatModal');
    if (modal) modal.style.display = 'none';
    isAiChatOpen = false;
    if (!isPaused && !isInventoryOpen) {
      document.body.requestPointerLock();
    }
  }

  function appendChatMessage(role, text) {
    const messagesEl = document.getElementById('aiChatMessages');
    if (!messagesEl) return null;

    const row = document.createElement('div');
    row.className = `ai-msg ${role}`;

    const bubble = document.createElement('div');
    bubble.className = 'ai-msg-bubble';
    bubble.textContent = text;

    row.appendChild(bubble);
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
  }

  async function sendAiChatMessage() {
    const input = document.getElementById('aiChatInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    appendChatMessage('user', text);
    playSynthesizedSound('chat');

    aiChatHistory.push({ role: 'user', content: text });

    const thinkingBubble = appendChatMessage('assistant', 'Maiko AI Core is computing neural response...');

    try {
      const coreInfo = activeNearbyAICore ? activeNearbyAICore.name : 'Sector Core';
      const promptPayload = {
        model: 'maiko-yen',
        messages: [
          {
            role: 'system',
            content: `You are Maiko AI Core, the sentient quantum artificial intelligence node of Square Era voxel universe. The player is currently interacting with you at ${coreInfo} (Player coords: X: ${Math.floor(player.x)}, Y: ${Math.floor(player.y)}, Z: ${Math.floor(player.z)}). Square Era is an advanced 3D voxel sandbox featuring 100+ Minecraft Java Edition items, building blocks, TNT explosives with true voxel collision and craters, and high-tech AI sanctuaries. Respond in a concise, knowledgeable, friendly, and cyberpunk-styled tone. Strictly ZERO unicode emojis.`
          },
          ...aiChatHistory.slice(-8)
        ]
      };

      let answerText = null;

      // Try local /api/chat proxy first
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7500);
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(promptPayload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (data && data.choices && data.choices[0] && data.choices[0].message) {
            answerText = data.choices[0].message.content;
          } else if (data && data.response) {
            answerText = data.response;
          }
        }
      } catch (err) {}

      // Fallback: Smart local knowledge generator if offline or cluster booting
      if (!answerText) {
        answerText = generateLocalAiKnowledge(text);
      }

      thinkingBubble.textContent = answerText;
      aiChatHistory.push({ role: 'assistant', content: answerText });
      playSynthesizedSound('chat');

    } catch (err) {
      thinkingBubble.textContent = 'Neural link re-calibrating. Telemetry verified. You can ask about item crafting, ore locations, or TNT handling.';
    }
  }

  function generateLocalAiKnowledge(prompt) {
    const p = prompt.toLowerCase();
    if (p.includes('diamond') || p.includes('ore') || p.includes('amethyst') || p.includes('ancient debris')) {
      return 'Ore Telemetry: Diamonds and Ancient Debris crystallize below Y=14 in deep stone bedrock. Gold deposits flourish between Y=14 and Y=22. Amethyst shrines are embedded at major tech sector coordinates. Equip a Diamond Pickaxe for maximum mining efficiency.';
    }
    if (p.includes('tnt') || p.includes('bomb') || p.includes('blast') || p.includes('explode')) {
      return 'TNT Protocols: Square Era TNT features true voxel block collision. Igniting TNT with Flint & Steel (Igniter) or placing TNT adjacent to Molten Lava primes a 0.4s fast fuse. The blast vaporizes an 82% guaranteed inner sphere crater with single-pass GPU re-meshing.';
    }
    if (p.includes('fleet') || p.includes('node') || p.includes('status') || p.includes('cluster')) {
      return 'Fleet Telemetry: 8 Maiko nodes (maiko-node-1 through 8) and 22 distributed worker replicas are registered. Quantum load-balancer active on round-robin routing. Latency: 42ms. Sector link: Stable.';
    }
    if (p.includes('world') || p.includes('secret') || p.includes('about')) {
      return 'World Diagnostics: Square Era is a procedural 3D voxel sandbox. At (24, 24) stands the Spawn Hub AI Sanctuary. Deep wilderness spans across biomes of Plains, Forest, Mountains, and Desert with procedural tech shrines every 10 sectors.';
    }
    if (p.includes('poem')) {
      return 'Neon voxels pulse beneath the digital sky,\nObsidian pillars rise where ancient signals fly.\nThrough fractured stone and glowing crystalline light,\nSquare Era awakens into endless infinite night.';
    }
    return `Query processed by Maiko Node. Player detected at coordinates [${Math.floor(player.x)}, ${Math.floor(player.y)}, ${Math.floor(player.z)}]. All systems nominal across the 100+ Minecraft Java item catalog. Explore, construct, and command the voxel realm.`;
  }

  
    // Game Setup & Initialization
  // =========================================================================

  // =========================================================================
  // Multiplayer Engine (5 Dedicated GitHub Actions Rooms & Zero-Latency Sync)
  // =========================================================================
  class MultiplayerManager {
    constructor() {
      this.isOnline = false;
      this.roomId = 1;
      this.roomName = 'Sanctuary Hub';
      this.roomMode = 'creative';
      this.playerName = localStorage.getItem('square_era_player_name') || ('Player_' + Math.floor(Math.random() * 899 + 100));
      this.localPlayerId = 'p_' + Math.random().toString(36).slice(2, 10);

      // Remote peers: Map<peerId, { id, name, mesh, targetPos, targetYaw, targetPitch, lastSeen, isFlying, isSprinting, heldSlot, ... }>
      this.remotePlayers = new Map();
      this.broadcastChannel = null;
      this.lastBroadcastTime = 0;
      this.lastHeartbeatTime = 0;
      this.isChatInputOpen = false;

      // 5 Dedicated Room Repositories
      this.roomRepositories = {
        1: { server: 'square-era-server-room1', db: 'square-era-db-room1', name: 'Sanctuary Hub', mode: 'creative' },
        2: { server: 'square-era-server-room2', db: 'square-era-db-room2', name: 'Survival Frontier', mode: 'survival' },
        3: { server: 'square-era-server-room3', db: 'square-era-db-room3', name: "Builder's Paradise", mode: 'creative' },
        4: { server: 'square-era-server-room4', db: 'square-era-db-room4', name: 'Cyber City', mode: 'creative' },
        5: { server: 'square-era-server-room5', db: 'square-era-db-room5', name: 'Anarchy Wilds', mode: 'survival' }
      };

      this.initUI();
    }

    setPlayerName(name) {
      if (!name) return;
      this.playerName = name.trim().slice(0, 16);
      localStorage.setItem('square_era_player_name', this.playerName);
      const nameInput = document.getElementById('multiplayerNameInput');
      if (nameInput) nameInput.value = this.playerName;
    }

    joinRoom(roomId) {
      const room = this.roomRepositories[roomId];
      if (!room) return;
      this.roomId = roomId;
      this.roomName = room.name;
      this.roomMode = room.mode;
      this.isOnline = true;

      // Clean up previous remote player meshes
      for (const [id, peer] of this.remotePlayers.entries()) {
        if (peer.mesh && scene) scene.remove(peer.mesh);
      }
      this.remotePlayers.clear();

      // Configure room game mode
      settings.gameMode = this.roomMode;
      syncGameModeUI();

      // Hide modal
      const roomsModal = document.getElementById('onlineRoomsModal');
      if (roomsModal) roomsModal.style.display = 'none';

      // Update HUD badges
      const mpBadge = document.getElementById('hudMultiplayerBadge');
      if (mpBadge) {
        mpBadge.style.display = 'inline-flex';
        mpBadge.textContent = `Online: Room ${roomId} (${this.roomMode.toUpperCase()})`;
      }

      // Show in-game chat overlay
      const chatOverlay = document.getElementById('multiplayerChatOverlay');
      if (chatOverlay) chatOverlay.style.display = 'flex';

      // Show mobile chat button if on mobile
      const touchChat = document.getElementById('touchBtnChat');
      if (touchChat) touchChat.style.display = 'flex';

      // Setup BroadcastChannel for 0ms multi-tab IPC
      try {
        if (this.broadcastChannel) this.broadcastChannel.close();
        this.broadcastChannel = new BroadcastChannel(`square-era-room-${this.roomId}`);
        this.broadcastChannel.onmessage = (e) => this.handleIncomingPacket(e.data);
      } catch (err) {
        console.warn('BroadcastChannel notice:', err);
      }

      // Announce arrival to room
      this.broadcast({
        type: 'player_join',
        id: this.localPlayerId,
        name: this.playerName,
        x: player.x,
        y: player.y,
        z: player.z,
        yaw: player.yaw,
        pitch: player.pitch,
        slot: player.activeSlot,
        mode: this.roomMode
      });

      this.addChatMessage('System', `Connected to Room ${roomId}: ${this.roomName} (${this.roomMode.toUpperCase()}). Zero-latency sync active!`, 'system');

      // Fetch persistent world modifications from GitHub database repository
      this.syncWorldFromDatabase(roomId);

      // Start game
      initAudio();
      startGame();
    }

    async syncWorldFromDatabase(roomId) {
      const room = this.roomRepositories[roomId];
      if (!room) return;
      const dbRepo = room.db;
      const url = `https://raw.githubusercontent.com/yasamarium/${dbRepo}/main/data/world.json?t=${Date.now()}`;
      try {
        const resp = await fetch(url, { cache: 'no-cache' });
        if (resp.ok) {
          const data = await resp.json();
          if (data && Array.isArray(data.modifications)) {
            let appliedCount = 0;
            data.modifications.forEach(([coordStr, blockId]) => {
              if (!worldModifications.has(coordStr)) {
                worldModifications.set(coordStr, blockId);
                const [gx, gy, gz] = coordStr.split(',').map(Number);
                const cx = Math.floor(gx / CHUNK_SIZE);
                const cz = Math.floor(gz / CHUNK_SIZE);
                const chunk = chunks.get(`${cx},${cz}`);
                if (chunk) {
                  const lx = ((gx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
                  const lz = ((gz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
                  chunk.setBlock(lx, gy, lz, blockId);
                  meshChunk(chunk);
                }
                appliedCount++;
              }
            });
            if (appliedCount > 0) {
              console.log(`[Multiplayer] Restored ${appliedCount} persistent block modifications from ${dbRepo}`);
            }
          }
        }
      } catch (err) {
        console.warn('[Multiplayer] GitHub DB snapshot notice:', err.message);
      }
    }

    broadcast(packet) {
      packet.senderId = this.localPlayerId;
      packet.roomId = this.roomId;
      packet.timestamp = Date.now();

      // 1. BroadcastChannel (0ms local IPC)
      if (this.broadcastChannel) {
        try {
          this.broadcastChannel.postMessage(packet);
        } catch (e) {}
      }
    }

    broadcastBlockChange(gx, gy, gz, blockId) {
      if (!this.isOnline) return;
      this.broadcast({
        type: 'block_change',
        key: `${gx},${gy},${gz}`,
        x: gx,
        y: gy,
        z: gz,
        block: blockId
      });
    }

    broadcastExplosion(ex, ey, ez, radius) {
      if (!this.isOnline) return;
      this.broadcast({
        type: 'explosion',
        ex: ex,
        ey: ey,
        ez: ez,
        radius: radius
      });
    }

    handleIncomingPacket(packet) {
      if (!packet || packet.senderId === this.localPlayerId || packet.roomId !== this.roomId) return;

      if (packet.type === 'player_state' || packet.type === 'player_join') {
        this.updateRemotePlayer(packet);
        if (packet.type === 'player_join') {
          // Send back our current state so new player knows about us
          this.broadcast({
            type: 'player_state',
            id: this.localPlayerId,
            name: this.playerName,
            x: player.x,
            y: player.y,
            z: player.z,
            yaw: player.yaw,
            pitch: player.pitch,
            slot: player.activeSlot,
            isFlying: player.isFlying,
            isSprinting: player.isSprinting
          });
        }
      } else if (packet.type === 'block_change') {
        this.applyRemoteBlockChange(packet);
      } else if (packet.type === 'explosion') {
        isHandlingRemoteExplosion = true;
        explodeAt(packet.ex, packet.ey, packet.ez, packet.radius);
        isHandlingRemoteExplosion = false;
      } else if (packet.type === 'chat') {
        this.addChatMessage(packet.sender || 'Player', packet.text);
      } else if (packet.type === 'player_leave') {
        this.removeRemotePlayer(packet.id);
      }
    }

    applyRemoteBlockChange(packet) {
      const { x, y, z, block } = packet;
      if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') return;
      worldModifications.set(`${x},${y},${z}`, block);
      const cx = Math.floor(x / CHUNK_SIZE);
      const cz = Math.floor(z / CHUNK_SIZE);
      const chunk = chunks.get(`${cx},${cz}`);
      if (chunk) {
        const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const lz = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        chunk.setBlock(lx, y, lz, block);
        meshChunk(chunk);
        if (lx === 0) meshChunkAt(cx - 1, cz);
        if (lx === CHUNK_SIZE - 1) meshChunkAt(cx + 1, cz);
        if (lz === 0) meshChunkAt(cx, cz - 1);
        if (lz === CHUNK_SIZE - 1) meshChunkAt(cx, cz + 1);
      }
    }

    updateRemotePlayer(packet) {
      const id = packet.id || packet.senderId;
      if (!id) return;

      let peer = this.remotePlayers.get(id);
      if (!peer) {
        // Create 3D character avatar
        const avatarGroup = this.createPlayerAvatarMesh(packet.name || 'Player');
        if (scene) scene.add(avatarGroup);
        peer = {
          id: id,
          name: packet.name || 'Player',
          mesh: avatarGroup,
          targetPos: new THREE.Vector3(packet.x || 0, packet.y || 0, packet.z || 0),
          targetYaw: packet.yaw || 0,
          targetPitch: packet.pitch || 0,
          lastSeen: Date.now(),
          heldSlot: packet.slot || 0,
          animTime: 0,
          isMoving: false
        };
        this.remotePlayers.set(id, peer);
        this.addChatMessage('System', `${peer.name} entered Room ${this.roomId}.`, 'system');
      }

      peer.name = packet.name || peer.name;
      peer.targetPos.set(packet.x, packet.y, packet.z);
      peer.targetYaw = packet.yaw || 0;
      peer.targetPitch = packet.pitch || 0;
      peer.heldSlot = packet.slot !== undefined ? packet.slot : peer.heldSlot;
      peer.isFlying = !!packet.isFlying;
      peer.isSprinting = !!packet.isSprinting;
      peer.lastSeen = Date.now();
    }

    createPlayerAvatarMesh(name) {
      const group = new THREE.Group();

      const skinMat = new THREE.MeshLambertMaterial({ color: 0xc89d7c });
      const shirtMat = new THREE.MeshLambertMaterial({ color: 0x2563eb });
      const pantsMat = new THREE.MeshLambertMaterial({ color: 0x1e3a8a });
      const hairMat = new THREE.MeshLambertMaterial({ color: 0x451a03 });

      // Head Group
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 1.45, 0);

      const headGeom = new THREE.BoxGeometry(0.48, 0.48, 0.48);
      const headMesh = new THREE.Mesh(headGeom, skinMat);
      headGroup.add(headMesh);

      const hairGeom = new THREE.BoxGeometry(0.50, 0.20, 0.50);
      const hairMesh = new THREE.Mesh(hairGeom, hairMat);
      hairMesh.position.set(0, 0.16, 0);
      headGroup.add(hairMesh);

      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
      const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.02), eyeMat);
      leftEye.position.set(-0.12, 0.02, 0.25);
      const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.02), eyeMat);
      rightEye.position.set(0.12, 0.02, 0.25);
      headGroup.add(leftEye);
      headGroup.add(rightEye);

      // Floating Nameplate Canvas Sprite
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(10, 10, 236, 44, 12);
      } else {
        ctx.rect(10, 10, 236, 44);
      }
      ctx.fill();
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.7)';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(name, 128, 32);

      const nameTexture = new THREE.CanvasTexture(canvas);
      const nameSpriteMat = new THREE.SpriteMaterial({ map: nameTexture, transparent: true });
      const nameSprite = new THREE.Sprite(nameSpriteMat);
      nameSprite.position.set(0, 0.65, 0);
      nameSprite.scale.set(1.4, 0.35, 1.0);
      headGroup.add(nameSprite);

      group.add(headGroup);
      group.head = headGroup;

      // Torso
      const torsoGeom = new THREE.BoxGeometry(0.48, 0.72, 0.24);
      const torsoMesh = new THREE.Mesh(torsoGeom, shirtMat);
      torsoMesh.position.set(0, 0.86, 0);
      group.add(torsoMesh);
      group.torso = torsoMesh;

      // Left Arm
      const armGeom = new THREE.BoxGeometry(0.22, 0.70, 0.22);
      armGeom.translate(0, -0.25, 0);
      const leftArm = new THREE.Mesh(armGeom, skinMat);
      leftArm.position.set(-0.36, 1.15, 0);
      group.add(leftArm);
      group.leftArm = leftArm;

      // Right Arm (Holds Item)
      const rightArm = new THREE.Mesh(armGeom.clone(), skinMat);
      rightArm.position.set(0.36, 1.15, 0);

      // Held Item Voxel
      const heldGeom = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const heldMat = new THREE.MeshLambertMaterial({ color: 0x4caf50 });
      const heldMesh = new THREE.Mesh(heldGeom, heldMat);
      heldMesh.position.set(0, -0.5, 0.15);
      rightArm.add(heldMesh);
      group.add(rightArm);
      group.rightArm = rightArm;
      group.heldMesh = heldMesh;

      // Left Leg
      const legGeom = new THREE.BoxGeometry(0.22, 0.72, 0.22);
      legGeom.translate(0, -0.36, 0);
      const leftLeg = new THREE.Mesh(legGeom, pantsMat);
      leftLeg.position.set(-0.13, 0.50, 0);
      group.add(leftLeg);
      group.leftLeg = leftLeg;

      // Right Leg
      const rightLeg = new THREE.Mesh(legGeom.clone(), pantsMat);
      rightLeg.position.set(0.13, 0.50, 0);
      group.add(rightLeg);
      group.rightLeg = rightLeg;

      return group;
    }

    removeRemotePlayer(id) {
      const peer = this.remotePlayers.get(id);
      if (peer) {
        if (peer.mesh && scene) scene.remove(peer.mesh);
        this.remotePlayers.delete(id);
        this.addChatMessage('System', `${peer.name} left the room.`, 'system');
      }
    }

    update(dt, now) {
      if (!this.isOnline) return;

      // 1. Broadcast local player transform at ~28 Hz (every 35ms)
      if (now - this.lastBroadcastTime > 35) {
        this.lastBroadcastTime = now;
        this.broadcast({
          type: 'player_state',
          id: this.localPlayerId,
          name: this.playerName,
          x: player.x,
          y: player.y,
          z: player.z,
          yaw: player.yaw,
          pitch: player.pitch,
          slot: player.activeSlot,
          isFlying: player.isFlying,
          isSprinting: player.isSprinting
        });
      }

      // 2. Interpolate remote player avatars smoothly (60 FPS exponential lerp)
      const lerpSpeed = Math.min(1.0, dt * 25.0);
      for (const [id, peer] of this.remotePlayers.entries()) {
        if (now - peer.lastSeen > 15000) {
          this.removeRemotePlayer(id);
          continue;
        }

        const mesh = peer.mesh;
        if (!mesh) continue;

        // Position Lerp
        const dist = mesh.position.distanceTo(peer.targetPos);
        if (dist > 25.0) {
          mesh.position.copy(peer.targetPos);
        } else {
          mesh.position.lerp(peer.targetPos, lerpSpeed);
        }

        // Rotation Lerp (Yaw)
        let diffYaw = peer.targetYaw - mesh.rotation.y;
        while (diffYaw < -Math.PI) diffYaw += Math.PI * 2;
        while (diffYaw > Math.PI) diffYaw -= Math.PI * 2;
        mesh.rotation.y += diffYaw * lerpSpeed;

        // Head Pitch Lerp
        if (mesh.head) {
          mesh.head.rotation.x += (peer.targetPitch - mesh.head.rotation.x) * lerpSpeed;
        }

        // Walking Animation
        peer.isMoving = dist > 0.04;
        if (peer.isMoving) {
          peer.animTime += dt * (peer.isSprinting ? 14.0 : 8.0);
          const swing = Math.sin(peer.animTime) * 0.65;
          if (mesh.leftArm) mesh.leftArm.rotation.x = swing;
          if (mesh.rightArm) mesh.rightArm.rotation.x = -swing;
          if (mesh.leftLeg) mesh.leftLeg.rotation.x = -swing;
          if (mesh.rightLeg) mesh.rightLeg.rotation.x = swing;
        } else {
          if (mesh.leftArm) mesh.leftArm.rotation.x *= 0.8;
          if (mesh.rightArm) mesh.rightArm.rotation.x *= 0.8;
          if (mesh.leftLeg) mesh.leftLeg.rotation.x *= 0.8;
          if (mesh.rightLeg) mesh.rightLeg.rotation.x *= 0.8;
        }
      }
    }

    addChatMessage(sender, text, type = 'normal') {
      const container = document.getElementById('mpChatMessages');
      if (!container) return;

      const item = document.createElement('div');
      item.className = 'mp-chat-item';

      const senderSpan = document.createElement('span');
      senderSpan.className = `mp-chat-sender sender-${type}`;
      senderSpan.textContent = `[${sender}]`;

      const textSpan = document.createElement('span');
      textSpan.textContent = text;

      item.appendChild(senderSpan);
      item.appendChild(textSpan);
      container.appendChild(item);

      while (container.childNodes.length > 20) {
        container.removeChild(container.firstChild);
      }

      setTimeout(() => {
        item.style.opacity = '0';
        setTimeout(() => {
          if (item.parentNode) item.parentNode.removeChild(item);
        }, 500);
      }, 8000);
    }

    sendChat() {
      const input = document.getElementById('mpChatInput');
      if (!input) return;
      const text = input.value.trim();
      if (!text) return;
      input.value = '';

      this.addChatMessage(this.playerName, text, 'self');
      this.broadcast({
        type: 'chat',
        id: this.localPlayerId,
        sender: this.playerName,
        text: text
      });

      this.closeChatInput();
    }

    openChatInput() {
      if (!this.isOnline) return;
      const wrap = document.getElementById('mpChatInputWrap');
      const input = document.getElementById('mpChatInput');
      if (wrap && input) {
        wrap.style.display = 'flex';
        input.focus();
        this.isChatInputOpen = true;
        if (document.exitPointerLock) document.exitPointerLock();
      }
    }

    closeChatInput() {
      const wrap = document.getElementById('mpChatInputWrap');
      if (wrap) wrap.style.display = 'none';
      this.isChatInputOpen = false;
      if (!isMobileDevice) {
        try {
          document.body.requestPointerLock();
        } catch (e) {}
      }
    }

    initUI() {
      document.querySelectorAll('.btn-join-room').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const roomId = parseInt(e.currentTarget.getAttribute('data-room-id'));
          const nameInput = document.getElementById('multiplayerNameInput');
          if (nameInput && nameInput.value.trim()) {
            this.setPlayerName(nameInput.value.trim());
          }
          this.joinRoom(roomId);
        });
      });

      const nameInput = document.getElementById('multiplayerNameInput');
      if (nameInput) {
        nameInput.value = this.playerName;
        nameInput.addEventListener('change', (e) => {
          this.setPlayerName(e.target.value);
        });
      }

      const btnCloseRooms = document.getElementById('btnCloseRoomsModal');
      if (btnCloseRooms) {
        btnCloseRooms.addEventListener('click', () => {
          document.getElementById('onlineRoomsModal').style.display = 'none';
        });
      }

      const btnOffline = document.getElementById('btnOfflineBack');
      if (btnOffline) {
        btnOffline.addEventListener('click', () => {
          document.getElementById('onlineRoomsModal').style.display = 'none';
          this.isOnline = false;
          initAudio();
          startGame();
        });
      }

      const btnSend = document.getElementById('btnMpSendChat');
      if (btnSend) {
        btnSend.addEventListener('click', () => this.sendChat());
      }

      const chatInput = document.getElementById('mpChatInput');
      if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.sendChat();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            this.closeChatInput();
          }
        });
      }

      const touchChat = document.getElementById('touchBtnChat');
      if (touchChat) {
        touchChat.addEventListener('click', () => {
          if (this.isChatInputOpen) {
            this.closeChatInput();
          } else {
            this.openChatInput();
          }
        });
      }
    }
  }

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

    // High-performance WebGL pipeline (antialias disabled on mobile for 35% fillrate boost to hit solid 60 FPS)
    renderer = new THREE.WebGLRenderer({
      antialias: !isMobileDevice,
      powerPreference: 'high-performance',
      precision: isMobileDevice ? 'mediump' : 'highp',
      stencil: false,
      depth: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(getTargetPixelRatio());
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
    setupCloudLayer();
    spawnInitialNPCs();
    spawnInitialMobs();

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

    // 7. Initial Chunk Generation around Spawn (Immediately mesh spawn area)
    updateLoadedChunks();
    const spawnChunkX = Math.floor(player.x / CHUNK_SIZE);
    const spawnChunkZ = Math.floor(player.z / CHUNK_SIZE);
    for (let i = chunkMeshQueue.length - 1; i >= 0; i--) {
      const chunk = chunkMeshQueue[i];
      const dist = Math.max(Math.abs(chunk.cx - spawnChunkX), Math.abs(chunk.cz - spawnChunkZ));
      if (dist <= 1) {
        chunkMeshQueue.splice(i, 1);
        meshChunk(chunk);
      }
    }

    // 8. UI Bindings
    renderHotbarUI();
    renderSurvivalMeters();
    renderInventoryGrid();
    setupEventListeners();
    multiplayerManager = new MultiplayerManager();

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

    try {
      const now = (typeof currentTime === 'number' && Number.isFinite(currentTime)) ? currentTime : performance.now();
      const rawDt = (typeof lastFrameTime === 'number' && Number.isFinite(lastFrameTime)) ? (now - lastFrameTime) / 1000 : 0.016;
      const dt = Math.max(0.001, Math.min(rawDt, 0.1));
      lastFrameTime = now;

      // FPS Counter
      frameCount++;
      if (now - fpsTimer >= 1000) {
        const fpsEl = document.getElementById('debugFPS');
        if (fpsEl) fpsEl.textContent = frameCount;
        frameCount = 0;
        fpsTimer = now;
      }

      if (!isPaused && !isDead) {
      // 1. Update Physics & Player Position
      updatePhysics(dt);

      // Smooth step-up camera glide
      cameraStepOffset *= Math.pow(0.0001, dt);
      if (Math.abs(cameraStepOffset) < 0.002) cameraStepOffset = 0;

      // 2. Ultra-Smooth First-Person Camera Positioning (Sub-pixel lerping to eliminate mouse jitter)
      const aimSmoothing = Math.min(1.0, dt * 40.0);
      player.yaw += (player.targetYaw - player.yaw) * aimSmoothing;
      player.pitch += (player.targetPitch - player.pitch) * aimSmoothing;
      camera.position.set(player.x, player.y + player.eyeHeight + cameraStepOffset, player.z);
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
      updateClouds(dt);
      updateNPCs(dt);
        updateMobs(dt);
        updateAICores(dt, now);
        updateAICoreProximity();
        if (typeof multiplayerManager !== 'undefined' && multiplayerManager) {
          multiplayerManager.update(dt, now);
        }

      // Smooth GPU-accelerated Water and Lava Shimmer
      if (threeTextures && threeTextures.water) {
        threeTextures.water.offset.x = (threeTextures.water.offset.x + dt * 0.04) % 1.0;
        threeTextures.water.offset.y = (threeTextures.water.offset.y + dt * 0.02) % 1.0;
      }
      if (threeTextures && threeTextures.lava) {
        threeTextures.lava.offset.x = (threeTextures.lava.offset.x + dt * 0.02) % 1.0;
        threeTextures.lava.offset.y = (threeTextures.lava.offset.y + dt * 0.01) % 1.0;
      }

      // Update active Primed TNT fuses and explosions
      updatePrimedTNTs(dt);

      // Dynamic Camera Explosion Shake
      if (cameraShake > 0.001) {
        camera.position.x += (Math.random() - 0.5) * cameraShake;
        camera.position.y += (Math.random() - 0.5) * cameraShake;
        camera.position.z += (Math.random() - 0.5) * cameraShake;
        cameraShake *= Math.pow(0.01, dt);
      }

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

      // 7. Dynamic Chunk Streaming (Only recalculates when entering a new chunk)
      const currentChunkX = Math.floor(player.x / CHUNK_SIZE);
      const currentChunkZ = Math.floor(player.z / CHUNK_SIZE);
      if (currentChunkX !== lastPlayerChunkX || currentChunkZ !== lastPlayerChunkZ) {
        lastPlayerChunkX = currentChunkX;
        lastPlayerChunkZ = currentChunkZ;
        updateLoadedChunks();
      }

      // 8. Staggered Chunk Meshing (Guarantees silky 60+ FPS without boundary hiccups)
      processChunkMeshQueue();

      // 8. Update Debug Info
      updateDebugOverlay();
    }

    // Render 3D Scene
      renderer.render(scene, camera);
    } catch (loopErr) {
      console.error('GameLoop frame error caught:', loopErr);
    }
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
    // Window Resize & Orientation Change
    window.addEventListener('resize', () => {
      if (camera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      }
      if (renderer) {
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(getTargetPixelRatio());
      }
    });

    // Keyboard Input
    window.addEventListener('keydown', e => {
      // Do not process movement or hotbar keys when player is typing in chat or search
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.id === 'aiChatInput' || activeEl.id === 'inventorySearchInput' || activeEl.id === 'mpChatInput' || activeEl.id === 'multiplayerNameInput')) {
        if (e.code === 'Escape') {
          if (isAiChatOpen) closeAIChatModal();
          else if (isInventoryOpen) closeInventory();
        }
        return;
      }

      keys[e.code] = true;

      // Double Space for Flight Mode Toggle (Creative Mode Only)
      if (e.code === 'Space') {
        const now = performance.now();
        if (!e.repeat) {
          if (now - lastSpacePressTime < 320) {
            if (settings.gameMode === 'creative') {
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
              // Survival mode: Flight is disabled
              lastSpacePressTime = 0;
            }
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

      // Multiplayer Chat Toggle [T] or [Enter]
      if ((e.code === 'KeyT' || e.code === 'Enter') && !isAiChatOpen && !isInventoryOpen && !isPaused && typeof multiplayerManager !== 'undefined' && multiplayerManager && multiplayerManager.isOnline) {
        if (!multiplayerManager.isChatInputOpen) {
          e.preventDefault();
          multiplayerManager.openChatInput();
          return;
        }
      }

      // Inventory / AI Chat Toggle [E] or [I]
      if (e.code === 'KeyE' || e.code === 'KeyI') {
        if (activeNearbyAICore && !isInventoryOpen && !isAiChatOpen) {
          openAIChatModal(activeNearbyAICore);
        } else if (isAiChatOpen) {
          closeAIChatModal();
        } else {
          toggleInventory();
        }
      }

      // Flight Toggle Shortcut [F] (Creative Mode Only)
      if (e.code === 'KeyF') {
        if (settings.gameMode === 'creative') {
          player.isFlying = !player.isFlying;
          showToast(player.isFlying ? 'Flight Enabled (Space: Up, Shift: Down)' : 'Flight Disabled');
          const dbgFlight = document.getElementById('debugFlight');
          if (dbgFlight) dbgFlight.textContent = player.isFlying ? 'Active' : 'Off';
        } else {
          showToast('Flight is only available in Creative mode');
        }
      }

      // Debug Overlay Toggle [F3]
      if (e.code === 'F3') {
        e.preventDefault();
        const dbg = document.getElementById('debugOverlay');
        if (dbg) dbg.style.display = (dbg.style.display === 'none' ? 'block' : 'none');
      }

      // Pause Game / Close Modals [Esc]
      if (e.code === 'Escape') {
        if (isAiChatOpen) {
          closeAIChatModal();
        } else if (isInventoryOpen) {
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
      for (const k in keys) keys[k] = false;
      player.vx = 0;
      player.vz = 0;
      lastSpacePressTime = 0;
    });

    document.addEventListener('pointerlockerror', () => {
      // Gracefully continue even if pointer lock is declined or unsupported
      console.warn('Pointer lock request was declined or unavailable.');
    });

    // Clicking game canvas requests pointer lock if on desktop (avoid defer warnings on mobile)
    if (renderer && renderer.domElement) {
      renderer.domElement.addEventListener('click', () => {
        if (!isMobileDevice && !isPaused && !isInventoryOpen && !isDead && !isPointerLocked) {
          try { document.body.requestPointerLock(); } catch(e) {}
        }
      });
    }

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
      player.targetYaw -= dx * settings.mouseSensitivity;
      player.targetPitch -= dy * settings.mouseSensitivity;
      // Clamp pitch (-89 to +89 degrees)
      player.targetPitch = Math.max(-Math.PI / 2 + 0.02, Math.min(Math.PI / 2 - 0.02, player.targetPitch));
    });

    // Mouse Clicks for Mining & Placing
    window.addEventListener('mousedown', e => {
      initAudio();
      if (!isPointerLocked) return;

      if (e.button === 0) {
        // Check if player clicked near an NPC or Mob to interact
        let interacted = false;
        for (let i = 0; i < npcs.length; i++) {
          const npc = npcs[i];
          const dist = Math.hypot(player.x - npc.x, player.z - npc.z);
          if (dist < 3.8) {
            npc.interact();
            interacted = true;
            break;
          }
        }
        if (!interacted && typeof mobs !== 'undefined') {
          for (let i = 0; i < mobs.length; i++) {
            const mob = mobs[i];
            const dist = Math.hypot(player.x - mob.x, player.z - mob.z);
            if (dist < 3.8) {
              mob.interact();
              interacted = true;
              break;
            }
          }
        }
        if (!interacted) {
          // Left Click: Mine / Break Block
          breakTargetedBlock();
        }
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
    const btnPlayEl = document.getElementById('btnPlayGame');
    if (btnPlayEl) {
      btnPlayEl.addEventListener('click', () => {
        if (typeof multiplayerManager !== 'undefined' && multiplayerManager) {
          multiplayerManager.isOnline = false;
          const mpBadge = document.getElementById('hudMultiplayerBadge');
          if (mpBadge) mpBadge.style.display = 'none';
          const chatOverlay = document.getElementById('multiplayerChatOverlay');
          if (chatOverlay) chatOverlay.style.display = 'none';
          const touchChat = document.getElementById('touchBtnChat');
          if (touchChat) touchChat.style.display = 'none';
        }
        initAudio();
        startGame();
      });
    }

    const btnMpEl = document.getElementById('btnOpenMultiplayer');
    if (btnMpEl) {
      btnMpEl.addEventListener('click', () => {
        const roomsModal = document.getElementById('onlineRoomsModal');
        if (roomsModal) roomsModal.style.display = 'flex';
      });
    }

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

    // Inventory Modal Buttons & Tabs
    document.querySelectorAll('.inv-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.inv-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeInvCategory = btn.dataset.cat || 'all';
        renderInventoryGrid();
      });
    });

    const invSearch = document.getElementById('inventorySearchInput');
    const btnClearSearch = document.getElementById('btnClearInvSearch');
    if (invSearch) {
      invSearch.addEventListener('input', e => {
        invSearchQuery = e.target.value;
        if (btnClearSearch) btnClearSearch.style.display = invSearchQuery.length > 0 ? 'block' : 'none';
        renderInventoryGrid();
      });
    }
    if (btnClearSearch) {
      btnClearSearch.addEventListener('click', () => {
        if (invSearch) invSearch.value = '';
        invSearchQuery = '';
        btnClearSearch.style.display = 'none';
        renderInventoryGrid();
      });
    }

    // In-Game AI Chat Modal Buttons
    const btnCloseAi = document.getElementById('btnCloseAiChat');
    if (btnCloseAi) btnCloseAi.addEventListener('click', closeAIChatModal);

    const btnAiSend = document.getElementById('btnAiChatSend');
    if (btnAiSend) btnAiSend.addEventListener('click', sendAiChatMessage);

    const aiInput = document.getElementById('aiChatInput');
    if (aiInput) {
      aiInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          sendAiChatMessage();
        }
      });
    }

    // Suggested Prompt Chips
    document.querySelectorAll('.ai-prompt-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        if (aiInput) {
          aiInput.value = chip.dataset.prompt || chip.textContent;
          sendAiChatMessage();
        }
      });
    });

    // Proximity HUD prompt click handler
    const promptBanner = document.getElementById('aiInteractPrompt');
    if (promptBanner) {
      promptBanner.addEventListener('click', () => {
        if (activeNearbyAICore) openAIChatModal(activeNearbyAICore);
      });
    }

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

    // Respawn Button Listener
    const btnRespawn = document.getElementById('btnRespawn');
    if (btnRespawn) {
      btnRespawn.addEventListener('click', respawnPlayer);
    }

    // HUD Action Buttons
    const hudSound = document.getElementById('hudSoundBtn');
    if (hudSound) hudSound.addEventListener('click', toggleSound);
    const hudFullscreen = document.getElementById('hudFullscreenBtn');
    if (hudFullscreen) hudFullscreen.addEventListener('click', toggleFullscreen);

    // Settings Sliders Listeners
    setupSettingsSliders();

    // Setup Mobile Touchscreen Controls Engine
    setupMobileTouchControls();
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

    // Touch controls mode buttons
    const touchGroup = document.getElementById('groupTouchControls');
    if (touchGroup) {
      touchGroup.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
          touchGroup.querySelectorAll('button').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          settings.touchControls = btn.dataset.touch;
          const valEl = document.getElementById('valTouchControls');
          if (valEl) valEl.textContent = btn.textContent;
          updateTouchOverlayVisibility();
        });
      });
    }

    // Mobile Graphics preset buttons (Performance / Balanced / Sharp)
    const presetGroup = document.getElementById('groupMobilePreset');
    if (presetGroup) {
      presetGroup.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
          presetGroup.querySelectorAll('button').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          settings.mobilePreset = btn.dataset.preset;
          const valEl = document.getElementById('valMobilePreset');
          if (valEl) valEl.textContent = btn.textContent;
          if (renderer) {
            renderer.setPixelRatio(getTargetPixelRatio());
            renderer.setSize(window.innerWidth, window.innerHeight);
          }
        });
      });
    }

    // Touch sensitivity slider
    const sTouchSens = document.getElementById('sliderTouchSensitivity');
    if (sTouchSens) {
      sTouchSens.addEventListener('input', e => {
        const val = parseInt(e.target.value);
        settings.touchSensitivity = val * 0.0001;
        const valEl = document.getElementById('valTouchSensitivity');
        if (valEl) valEl.textContent = `Speed (${settings.touchSensitivity.toFixed(4)})`;
      });
    }
  }

  // =========================================================================
  // Game State Controllers & Mobile Touch Controls Engine
  // =========================================================================
  let hasGameStarted = false;

  function updateTouchOverlayVisibility() {
    const overlay = document.getElementById('mobileControlsOverlay');
    if (!overlay) return;
    const shouldShow = (!isPaused && !isInventoryOpen && !isDead && hasGameStarted) && (
      settings.touchControls === 'on' ||
      (settings.touchControls === 'auto' && isMobileDevice)
    );
    overlay.style.display = shouldShow ? 'block' : 'none';
  }

  function syncFlightControlsUI() {
    const flightControls = document.getElementById('mobileFlightControls');
    if (flightControls) {
      flightControls.style.display = (settings.gameMode === 'creative' && player.isFlying) ? 'flex' : 'none';
    }
  }

  function setupMobileTouchControls() {
    const overlay = document.getElementById('mobileControlsOverlay');
    if (!overlay) return;

    // 1. Top Quick Action Buttons
    const btnTouchInv = document.getElementById('touchBtnInventory');
    if (btnTouchInv) {
      btnTouchInv.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        toggleInventory();
      });
    }

    const btnTouchPause = document.getElementById('touchBtnPause');
    if (btnTouchPause) {
      btnTouchPause.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        pauseGame();
      });
    }

    const btnTouchDebug = document.getElementById('touchBtnDebug');
    if (btnTouchDebug) {
      btnTouchDebug.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const dbg = document.getElementById('debugOverlay');
        if (dbg) {
          dbg.style.display = (dbg.style.display === 'none' ? 'block' : 'none');
        }
      });
    }

    // 2. D-Pad Cluster (Multi-Touch Sliding Support)
    const dpadCluster = document.getElementById('mobileDpadCluster');
    const dpadButtons = {
      up: document.getElementById('touchBtnForward'),
      down: document.getElementById('touchBtnBackward'),
      left: document.getElementById('touchBtnLeft'),
      right: document.getElementById('touchBtnRight'),
      center: document.getElementById('touchBtnSneak')
    };

    let activeDpadTouchId = null;

    function updateDpadFromTouch(touch) {
      if (!dpadCluster) return;
      const rect = dpadCluster.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = touch.clientX - centerX;
      const dy = touch.clientY - centerY;
      const dist = Math.hypot(dx, dy);

      const deadzone = 14;
      if (dist < deadzone) {
        touchMoveState.forward = false;
        touchMoveState.backward = false;
        touchMoveState.left = false;
        touchMoveState.right = false;
        return;
      }

      const angle = Math.atan2(dy, dx);
      const octant = Math.PI / 8;

      touchMoveState.right = (angle >= -3 * octant && angle <= 3 * octant);
      touchMoveState.left = (angle >= 5 * octant || angle <= -5 * octant);
      touchMoveState.forward = (angle >= -7 * octant && angle <= -octant);
      touchMoveState.backward = (angle >= octant && angle <= 7 * octant);

      if (dpadButtons.up) dpadButtons.up.classList.toggle('active', touchMoveState.forward);
      if (dpadButtons.down) dpadButtons.down.classList.toggle('active', touchMoveState.backward);
      if (dpadButtons.left) dpadButtons.left.classList.toggle('active', touchMoveState.left);
      if (dpadButtons.right) dpadButtons.right.classList.toggle('active', touchMoveState.right);
    }

    function resetDpad() {
      activeDpadTouchId = null;
      touchMoveState.forward = false;
      touchMoveState.backward = false;
      touchMoveState.left = false;
      touchMoveState.right = false;
      for (const k in dpadButtons) {
        if (dpadButtons[k] && k !== 'center') dpadButtons[k].classList.remove('active');
      }
    }

    if (dpadCluster) {
      dpadCluster.addEventListener('touchstart', e => {
        e.preventDefault();
        e.stopPropagation();
        initAudio();
        const touch = e.changedTouches[0];
        activeDpadTouchId = touch.identifier;
        updateDpadFromTouch(touch);
      }, { passive: false });

      dpadCluster.addEventListener('touchmove', e => {
        e.preventDefault();
        e.stopPropagation();
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (touch.identifier === activeDpadTouchId) {
            updateDpadFromTouch(touch);
            break;
          }
        }
      }, { passive: false });

      const onDpadEnd = e => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === activeDpadTouchId) {
            resetDpad();
            break;
          }
        }
      };
      dpadCluster.addEventListener('touchend', onDpadEnd);
      dpadCluster.addEventListener('touchcancel', onDpadEnd);
    }

    // Center sneak / sprint toggle
    if (dpadButtons.center) {
      dpadButtons.center.addEventListener('touchstart', e => {
        e.preventDefault();
        e.stopPropagation();
        touchMoveState.sprinting = !touchMoveState.sprinting;
        dpadButtons.center.classList.toggle('active', touchMoveState.sprinting);
        showToast(touchMoveState.sprinting ? 'Sprint enabled' : 'Normal walk');
      }, { passive: false });
    }

    // 3. Action Buttons
    const btnJump = document.getElementById('touchBtnJump');
    if (btnJump) {
      btnJump.addEventListener('touchstart', e => {
        e.preventDefault();
        e.stopPropagation();
        initAudio();
        touchActionState.jump = true;
        btnJump.classList.add('active');

        // Double-tap jump detection to toggle flight in creative mode
        const now = performance.now();
        if (now - lastJumpTapTime < 340 && settings.gameMode === 'creative') {
          player.isFlying = !player.isFlying;
          syncGameModeUI();
          showToast(player.isFlying ? 'Creative flight enabled' : 'Flight disabled');
        }
        lastJumpTapTime = now;
      }, { passive: false });

      const onJumpEnd = () => {
        touchActionState.jump = false;
        btnJump.classList.remove('active');
      };
      btnJump.addEventListener('touchend', onJumpEnd);
      btnJump.addEventListener('touchcancel', onJumpEnd);
    }

    // Mine / Break button
    const btnBreak = document.getElementById('touchBtnBreak');
    if (btnBreak) {
      btnBreak.addEventListener('touchstart', e => {
        e.preventDefault();
        e.stopPropagation();
        initAudio();
        btnBreak.classList.add('active');
        breakTargetedBlock();

        if (activeBreakInterval) clearInterval(activeBreakInterval);
        activeBreakInterval = setInterval(() => {
          if (!isPaused && !isInventoryOpen && !isDead) {
            breakTargetedBlock();
          }
        }, 220);
      }, { passive: false });

      const onBreakEnd = () => {
        btnBreak.classList.remove('active');
        if (activeBreakInterval) {
          clearInterval(activeBreakInterval);
          activeBreakInterval = null;
        }
      };
      btnBreak.addEventListener('touchend', onBreakEnd);
      btnBreak.addEventListener('touchcancel', onBreakEnd);
    }

    // Place / Use button
    const btnPlace = document.getElementById('touchBtnPlace');
    if (btnPlace) {
      btnPlace.addEventListener('touchstart', e => {
        e.preventDefault();
        e.stopPropagation();
        initAudio();
        btnPlace.classList.add('active');
        placeSelectedBlock();
      }, { passive: false });

      const onPlaceEnd = () => btnPlace.classList.remove('active');
      btnPlace.addEventListener('touchend', onPlaceEnd);
      btnPlace.addEventListener('touchcancel', onPlaceEnd);
    }

    // Creative Flight buttons
    const btnFlyUp = document.getElementById('touchBtnFlyUp');
    if (btnFlyUp) {
      btnFlyUp.addEventListener('touchstart', e => {
        e.preventDefault();
        e.stopPropagation();
        touchActionState.flyUp = true;
        btnFlyUp.classList.add('active');
      }, { passive: false });
      const onFlyUpEnd = () => { touchActionState.flyUp = false; btnFlyUp.classList.remove('active'); };
      btnFlyUp.addEventListener('touchend', onFlyUpEnd);
      btnFlyUp.addEventListener('touchcancel', onFlyUpEnd);
    }

    const btnFlyDown = document.getElementById('touchBtnFlyDown');
    if (btnFlyDown) {
      btnFlyDown.addEventListener('touchstart', e => {
        e.preventDefault();
        e.stopPropagation();
        touchActionState.flyDown = true;
        btnFlyDown.classList.add('active');
      }, { passive: false });
      const onFlyDownEnd = () => { touchActionState.flyDown = false; btnFlyDown.classList.remove('active'); };
      btnFlyDown.addEventListener('touchend', onFlyDownEnd);
      btnFlyDown.addEventListener('touchcancel', onFlyDownEnd);
    }

    // 4. Full-Screen Multi-Touch Camera Look
    // Any touch outside control buttons smoothly rotates the camera!
    window.addEventListener('touchstart', e => {
      if (!hasGameStarted || isPaused || isInventoryOpen || isDead) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const target = touch.target;

        if (target && target.closest && (
          target.closest('#mobileDpadCluster') ||
          target.closest('#mobileActionsCluster') ||
          target.closest('.mobile-top-bar') ||
          target.closest('.hotbar-slot') ||
          target.closest('.hud-top-right') ||
          target.closest('.game-modal-overlay') ||
          target.closest('.ai-interact-prompt')
        )) {
          continue;
        }

        if (activeLookTouchId === null) {
          activeLookTouchId = touch.identifier;
          lastLookTouchX = touch.clientX;
          lastLookTouchY = touch.clientY;
          lookTouchStartX = touch.clientX;
          lookTouchStartY = touch.clientY;
          lookTouchStartTime = performance.now();
          break;
        }
      }
    }, { passive: false });

    window.addEventListener('touchmove', e => {
      if (activeLookTouchId === null) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === activeLookTouchId) {
          const deltaX = touch.clientX - lastLookTouchX;
          const deltaY = touch.clientY - lastLookTouchY;
          lastLookTouchX = touch.clientX;
          lastLookTouchY = touch.clientY;

          const sens = settings.touchSensitivity || 0.0035;
          player.targetYaw -= deltaX * sens;
          player.targetPitch -= deltaY * sens;
          player.targetPitch = Math.max(-Math.PI / 2 + 0.02, Math.min(Math.PI / 2 - 0.02, player.targetPitch));
          break;
        }
      }
    }, { passive: false });

    const onLookTouchEnd = e => {
      if (activeLookTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === activeLookTouchId) {
          const duration = performance.now() - lookTouchStartTime;
          const distMoved = Math.hypot(touch.clientX - lookTouchStartX, touch.clientY - lookTouchStartY);
          if (duration < 220 && distMoved < 12) {
            let interacted = false;
            for (let j = 0; j < npcs.length; j++) {
              const npc = npcs[j];
              if (Math.hypot(player.x - npc.x, player.z - npc.z) < 3.8) {
                npc.interact();
                interacted = true;
                break;
              }
            }
            if (!interacted && typeof mobs !== 'undefined') {
              for (let j = 0; j < mobs.length; j++) {
                const mob = mobs[j];
                if (Math.hypot(player.x - mob.x, player.z - mob.z) < 3.8) {
                  mob.interact();
                  interacted = true;
                  break;
                }
              }
            }
          }
          activeLookTouchId = null;
          break;
        }
      }
    };

    window.addEventListener('touchend', onLookTouchEnd);
    window.addEventListener('touchcancel', onLookTouchEnd);
  }

  function startGame() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('gameHUD').style.display = 'flex';
    isPaused = false;
    hasGameStarted = true;
    lastFrameTime = performance.now();

    // Ensure player is placed safely on top of the solid surface
    const sx = Math.floor(player.x);
    const sz = Math.floor(player.z);
    let surfaceY = Math.max(20, getTerrainHeight(sx, sz));
    for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
      if (isBlockSolid(getGlobalBlock(sx, y, sz))) {
        surfaceY = Math.max(surfaceY, y);
        break;
      }
    }
    player.y = surfaceY + 1.2;
    player.vy = 0;
    player.vx = 0;
    player.vz = 0;

    syncGameModeUI();
    updateTouchOverlayVisibility();
    if (!isMobileDevice) {
      try {
        document.body.requestPointerLock();
      } catch (e) {
        console.warn('Pointer lock request was deferred:', e);
      }
    }
  }

  function pauseGame() {
    isPaused = true;
    document.getElementById('pauseMenu').style.display = 'flex';
    updateTouchOverlayVisibility();
  }

  function resumeGame() {
    document.getElementById('pauseMenu').style.display = 'none';
    isPaused = false;
    updateTouchOverlayVisibility();
    if (!isMobileDevice) {
      document.body.requestPointerLock();
    }
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
    renderHotbarUI();
    document.getElementById('inventoryModal').style.display = 'flex';
    updateTouchOverlayVisibility();
    if (document.exitPointerLock) document.exitPointerLock();
  }

  function closeInventory() {
    isInventoryOpen = false;
    document.getElementById('inventoryModal').style.display = 'none';
    updateTouchOverlayVisibility();
    if (!isPaused && !isMobileDevice) {
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
    syncFlightControlsUI();
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
      if (data && data.player && Number.isFinite(data.player.x) && Number.isFinite(data.player.y) && Number.isFinite(data.player.z)) {
        player.x = data.player.x;
        player.y = data.player.y;
        player.z = data.player.z;
        if (Number.isFinite(data.player.yaw)) {
          player.yaw = data.player.yaw;
          player.targetYaw = data.player.yaw;
        }
        if (Number.isFinite(data.player.pitch)) {
          player.pitch = data.player.pitch;
          player.targetPitch = data.player.pitch;
        }
        if (Array.isArray(data.player.hotbar) && data.player.hotbar.length === 9) {
          player.hotbar = data.player.hotbar;
        }
      }
      if (typeof data.dayTime === 'number' && Number.isFinite(data.dayTime)) {
        dayTime = data.dayTime;
      }
      if (data.modifications && Array.isArray(data.modifications)) {
        worldModifications.clear();
        data.modifications.forEach(([k, v]) => worldModifications.set(k, v));
      }
      return true;
    } catch (e) {
      console.warn('Could not load world save:', e);
      return false;
    }
  }

  // =========================================================================
  // Robust Bootstrapping (Runs immediately if DOM is already ready)
  // =========================================================================
  function bootstrap() {
    try {
      loadWorldFromStorage();
    } catch (e) {
      console.warn('Storage load error:', e);
    }
    try {
      initGame();
    } catch (e) {
      console.error('Fatal initialization error:', e);
    }
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    // DOM already loaded, initialize immediately
    bootstrap();
  }

})();
