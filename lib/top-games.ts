import type { Game, SystemRequirements } from '@/lib/supabase';
import { officialSiteForSlug } from './game-official-sites';

type TopGameSeed = {
  title: string;
  appId: number;
  genre: string[];
  tags: string[];
  developer: string;
  publisher: string;
  releaseDate: string;
  price: number;
  discount: number;
  rating: number;
};

export const GAME_IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1400&q=80';

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function steamImage(appId: number, image: 'header' | 'cover' | 'capsule') {
  const name = image === 'cover' ? 'library_600x900.jpg' : image === 'capsule' ? 'capsule_616x353.jpg' : 'header.jpg';
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/${name}`;
}

function systemRequirements(genres: string[]): SystemRequirements {
  const isHeavy = genres.some(genre => ['Action', 'Shooter', 'RPG', 'Racing', 'Open World'].includes(genre));
  return {
    minimum: {
      os: 'Windows 10 64-bit',
      cpu: isHeavy ? 'Intel Core i5-8400 / Ryzen 5 2600' : 'Intel Core i3-6100 / Ryzen 3 1200',
      ram: isHeavy ? '12 GB' : '8 GB',
      gpu: isHeavy ? 'GTX 1060 / RX 580' : 'GTX 760 / RX 560',
      storage: isHeavy ? '70 GB available space' : '20 GB available space',
    },
    recommended: {
      os: 'Windows 11 64-bit',
      cpu: isHeavy ? 'Intel Core i7-12700 / Ryzen 7 5800X' : 'Intel Core i5-10400 / Ryzen 5 3600',
      ram: isHeavy ? '16 GB' : '12 GB',
      gpu: isHeavy ? 'RTX 3060 / RX 6700 XT' : 'GTX 1660 / RX 5600 XT',
      storage: isHeavy ? 'SSD, 90 GB available space' : 'SSD, 35 GB available space',
    },
  };
}

function describe(seed: TopGameSeed, rank: number, title = seed.title) {
  const leadGenre = seed.genre[0]?.toLowerCase() ?? 'game';
  return `${title} is a top-${rank} ${leadGenre} pick built for a premium game store catalog. Expect strong moment-to-moment gameplay, memorable worlds, polished progression, and a replayable loop that keeps players coming back. This card includes store-ready metadata, price, platform, download link, screenshots, tags, media, and system requirements.`;
}

const TOP_GAME_DATA: TopGameSeed[] = [
  { title: 'Counter-Strike 2', appId: 730, genre: ['Shooter', 'Competitive'], tags: ['Tactical', 'FPS', 'Esports'], developer: 'Valve', publisher: 'Valve', releaseDate: '2023-09-27', price: 0, discount: 0, rating: 4.8 },
  { title: 'Dota 2', appId: 570, genre: ['MOBA', 'Strategy'], tags: ['Competitive', 'Fantasy', 'Team-Based'], developer: 'Valve', publisher: 'Valve', releaseDate: '2013-07-09', price: 0, discount: 0, rating: 4.7 },
  { title: 'PUBG: BATTLEGROUNDS', appId: 578080, genre: ['Battle Royale', 'Shooter'], tags: ['Survival', 'Multiplayer', 'Tactical'], developer: 'KRAFTON', publisher: 'KRAFTON', releaseDate: '2017-12-21', price: 0, discount: 0, rating: 4.3 },
  { title: 'Apex Legends', appId: 1172470, genre: ['Battle Royale', 'Shooter'], tags: ['Hero Shooter', 'Movement', 'Squad'], developer: 'Respawn Entertainment', publisher: 'Electronic Arts', releaseDate: '2020-11-04', price: 0, discount: 0, rating: 4.4 },
  { title: 'Grand Theft Auto V Legacy', appId: 271590, genre: ['Open World', 'Action'], tags: ['Crime', 'Online', 'Sandbox'], developer: 'Rockstar North', publisher: 'Rockstar Games', releaseDate: '2015-04-14', price: 29.99, discount: 50, rating: 4.8 },
  { title: 'Rust', appId: 252490, genre: ['Survival', 'Open World'], tags: ['Crafting', 'PvP', 'Base Building'], developer: 'Facepunch Studios', publisher: 'Facepunch Studios', releaseDate: '2018-02-08', price: 39.99, discount: 20, rating: 4.5 },
  { title: 'Warframe', appId: 230410, genre: ['Action', 'RPG'], tags: ['Looter Shooter', 'Sci-Fi', 'Co-op'], developer: 'Digital Extremes', publisher: 'Digital Extremes', releaseDate: '2013-03-25', price: 0, discount: 0, rating: 4.6 },
  { title: 'Destiny 2', appId: 1085660, genre: ['Shooter', 'RPG'], tags: ['Looter Shooter', 'Space', 'Co-op'], developer: 'Bungie', publisher: 'Bungie', releaseDate: '2019-10-01', price: 0, discount: 0, rating: 4.3 },
  { title: 'Team Fortress 2', appId: 440, genre: ['Shooter', 'Comedy'], tags: ['Class-Based', 'Team-Based', 'Classic'], developer: 'Valve', publisher: 'Valve', releaseDate: '2007-10-10', price: 0, discount: 0, rating: 4.7 },
  { title: 'War Thunder', appId: 236390, genre: ['Simulation', 'Action'], tags: ['Military', 'Vehicles', 'Online'], developer: 'Gaijin Entertainment', publisher: 'Gaijin Network', releaseDate: '2013-08-15', price: 0, discount: 0, rating: 4.2 },
  { title: 'Baldur\'s Gate 3', appId: 1086940, genre: ['RPG', 'Adventure'], tags: ['Choices Matter', 'Fantasy', 'Co-op'], developer: 'Larian Studios', publisher: 'Larian Studios', releaseDate: '2023-08-03', price: 59.99, discount: 15, rating: 4.9 },
  { title: 'Elden Ring', appId: 1245620, genre: ['RPG', 'Open World'], tags: ['Soulslike', 'Dark Fantasy', 'Bosses'], developer: 'FromSoftware', publisher: 'Bandai Namco', releaseDate: '2022-02-24', price: 59.99, discount: 30, rating: 4.9 },
  { title: 'Cyberpunk 2077', appId: 1091500, genre: ['RPG', 'Open World'], tags: ['Cyberpunk', 'Story Rich', 'FPS'], developer: 'CD PROJEKT RED', publisher: 'CD PROJEKT RED', releaseDate: '2020-12-10', price: 59.99, discount: 50, rating: 4.7 },
  { title: 'Red Dead Redemption 2', appId: 1174180, genre: ['Open World', 'Adventure'], tags: ['Western', 'Story Rich', 'Cinematic'], developer: 'Rockstar Games', publisher: 'Rockstar Games', releaseDate: '2019-12-05', price: 59.99, discount: 60, rating: 4.8 },
  { title: 'The Witcher 3: Wild Hunt', appId: 292030, genre: ['RPG', 'Open World'], tags: ['Fantasy', 'Story Rich', 'Choices Matter'], developer: 'CD PROJEKT RED', publisher: 'CD PROJEKT RED', releaseDate: '2015-05-18', price: 39.99, discount: 70, rating: 4.9 },
  { title: 'Hogwarts Legacy', appId: 990080, genre: ['RPG', 'Adventure'], tags: ['Magic', 'Open World', 'Fantasy'], developer: 'Avalanche Software', publisher: 'Warner Bros. Games', releaseDate: '2023-02-10', price: 59.99, discount: 45, rating: 4.5 },
  { title: 'Palworld', appId: 1623730, genre: ['Survival', 'Open World'], tags: ['Creature Collector', 'Crafting', 'Co-op'], developer: 'Pocketpair', publisher: 'Pocketpair', releaseDate: '2024-01-19', price: 29.99, discount: 15, rating: 4.5 },
  { title: 'HELLDIVERS 2', appId: 553850, genre: ['Shooter', 'Action'], tags: ['Co-op', 'Sci-Fi', 'Extraction'], developer: 'Arrowhead Game Studios', publisher: 'PlayStation Publishing', releaseDate: '2024-02-08', price: 39.99, discount: 20, rating: 4.4 },
  { title: 'Black Myth: Wukong', appId: 2358720, genre: ['Action', 'RPG'], tags: ['Mythology', 'Bosses', 'Cinematic'], developer: 'Game Science', publisher: 'Game Science', releaseDate: '2024-08-20', price: 59.99, discount: 10, rating: 4.8 },
  { title: 'Monster Hunter: World', appId: 582010, genre: ['Action', 'RPG'], tags: ['Hunting', 'Co-op', 'Bosses'], developer: 'CAPCOM', publisher: 'CAPCOM', releaseDate: '2018-08-09', price: 29.99, discount: 67, rating: 4.7 },
  { title: 'Monster Hunter Rise', appId: 1446780, genre: ['Action', 'RPG'], tags: ['Hunting', 'Co-op', 'Fantasy'], developer: 'CAPCOM', publisher: 'CAPCOM', releaseDate: '2022-01-12', price: 39.99, discount: 60, rating: 4.5 },
  { title: 'Stardew Valley', appId: 413150, genre: ['Simulation', 'RPG'], tags: ['Farming', 'Cozy', 'Pixel Art'], developer: 'ConcernedApe', publisher: 'ConcernedApe', releaseDate: '2016-02-26', price: 14.99, discount: 20, rating: 4.9 },
  { title: 'Terraria', appId: 105600, genre: ['Sandbox', 'Adventure'], tags: ['Crafting', 'Pixel Art', 'Co-op'], developer: 'Re-Logic', publisher: 'Re-Logic', releaseDate: '2011-05-16', price: 9.99, discount: 50, rating: 4.9 },
  { title: 'Valheim', appId: 892970, genre: ['Survival', 'Open World'], tags: ['Vikings', 'Crafting', 'Co-op'], developer: 'Iron Gate AB', publisher: 'Coffee Stain Publishing', releaseDate: '2021-02-02', price: 19.99, discount: 35, rating: 4.7 },
  { title: 'Hades', appId: 1145360, genre: ['Roguelike', 'Action'], tags: ['Mythology', 'Fast-Paced', 'Story Rich'], developer: 'Supergiant Games', publisher: 'Supergiant Games', releaseDate: '2020-09-17', price: 24.99, discount: 50, rating: 4.9 },
  { title: 'Hades II', appId: 1145350, genre: ['Roguelike', 'Action'], tags: ['Mythology', 'Early Access', 'Fast-Paced'], developer: 'Supergiant Games', publisher: 'Supergiant Games', releaseDate: '2024-05-06', price: 29.99, discount: 0, rating: 4.8 },
  { title: 'Dead Cells', appId: 588650, genre: ['Roguelike', 'Action'], tags: ['Metroidvania', 'Pixel Art', 'Difficult'], developer: 'Motion Twin', publisher: 'Motion Twin', releaseDate: '2018-08-06', price: 24.99, discount: 50, rating: 4.8 },
  { title: 'Hollow Knight', appId: 367520, genre: ['Metroidvania', 'Adventure'], tags: ['Soulslike', 'Atmospheric', 'Hand-Drawn'], developer: 'Team Cherry', publisher: 'Team Cherry', releaseDate: '2017-02-24', price: 14.99, discount: 40, rating: 4.9 },
  { title: 'Cuphead', appId: 268910, genre: ['Action', 'Platformer'], tags: ['Hand-Drawn', 'Difficult', 'Co-op'], developer: 'Studio MDHR', publisher: 'Studio MDHR', releaseDate: '2017-09-29', price: 19.99, discount: 30, rating: 4.8 },
  { title: 'Celeste', appId: 504230, genre: ['Platformer', 'Adventure'], tags: ['Pixel Art', 'Difficult', 'Story Rich'], developer: 'Maddy Makes Games', publisher: 'Maddy Makes Games', releaseDate: '2018-01-25', price: 19.99, discount: 75, rating: 4.9 },
  { title: 'Slay the Spire', appId: 646570, genre: ['Card Battler', 'Roguelike'], tags: ['Deckbuilding', 'Strategy', 'Replayable'], developer: 'Mega Crit', publisher: 'Mega Crit', releaseDate: '2019-01-23', price: 24.99, discount: 60, rating: 4.9 },
  { title: 'Balatro', appId: 2379780, genre: ['Card Battler', 'Roguelike'], tags: ['Deckbuilding', 'Poker', 'Score Attack'], developer: 'LocalThunk', publisher: 'Playstack', releaseDate: '2024-02-20', price: 14.99, discount: 10, rating: 4.9 },
  { title: 'Vampire Survivors', appId: 1794680, genre: ['Action', 'Roguelike'], tags: ['Bullet Heaven', 'Pixel Art', 'Arcade'], developer: 'poncle', publisher: 'poncle', releaseDate: '2022-10-20', price: 4.99, discount: 20, rating: 4.8 },
  { title: 'Deep Rock Galactic', appId: 548430, genre: ['Shooter', 'Co-op'], tags: ['Mining', 'Sci-Fi', 'Procedural'], developer: 'Ghost Ship Games', publisher: 'Coffee Stain Publishing', releaseDate: '2020-05-13', price: 29.99, discount: 67, rating: 4.9 },
  { title: 'No Man\'s Sky', appId: 275850, genre: ['Open World', 'Survival'], tags: ['Space', 'Exploration', 'Base Building'], developer: 'Hello Games', publisher: 'Hello Games', releaseDate: '2016-08-12', price: 59.99, discount: 50, rating: 4.6 },
  { title: 'Sea of Thieves', appId: 1172620, genre: ['Adventure', 'Open World'], tags: ['Pirates', 'Co-op', 'PvP'], developer: 'Rare Ltd', publisher: 'Xbox Game Studios', releaseDate: '2020-06-03', price: 39.99, discount: 50, rating: 4.4 },
  { title: 'Forza Horizon 5', appId: 1551360, genre: ['Racing', 'Open World'], tags: ['Cars', 'Arcade', 'Multiplayer'], developer: 'Playground Games', publisher: 'Xbox Game Studios', releaseDate: '2021-11-08', price: 59.99, discount: 50, rating: 4.7 },
  { title: 'Microsoft Flight Simulator 40th Anniversary', appId: 1250410, genre: ['Simulation', 'Flight'], tags: ['Realistic', 'Open World', 'Relaxing'], developer: 'Asobo Studio', publisher: 'Xbox Game Studios', releaseDate: '2020-08-18', price: 59.99, discount: 35, rating: 4.4 },
  { title: 'Assetto Corsa', appId: 244210, genre: ['Racing', 'Simulation'], tags: ['Realistic', 'Cars', 'VR'], developer: 'Kunos Simulazioni', publisher: 'Kunos Simulazioni', releaseDate: '2014-12-19', price: 19.99, discount: 80, rating: 4.8 },
  { title: 'Euro Truck Simulator 2', appId: 227300, genre: ['Simulation', 'Driving'], tags: ['Relaxing', 'Management', 'Open World'], developer: 'SCS Software', publisher: 'SCS Software', releaseDate: '2012-10-12', price: 19.99, discount: 75, rating: 4.8 },
  { title: 'American Truck Simulator', appId: 270880, genre: ['Simulation', 'Driving'], tags: ['Relaxing', 'Open World', 'Management'], developer: 'SCS Software', publisher: 'SCS Software', releaseDate: '2016-02-02', price: 19.99, discount: 75, rating: 4.8 },
  { title: 'Cities: Skylines', appId: 255710, genre: ['Simulation', 'Strategy'], tags: ['City Builder', 'Management', 'Sandbox'], developer: 'Colossal Order', publisher: 'Paradox Interactive', releaseDate: '2015-03-10', price: 29.99, discount: 70, rating: 4.7 },
  { title: 'Cities: Skylines II', appId: 949230, genre: ['Simulation', 'Strategy'], tags: ['City Builder', 'Management', 'Sandbox'], developer: 'Colossal Order', publisher: 'Paradox Interactive', releaseDate: '2023-10-24', price: 49.99, discount: 25, rating: 3.8 },
  { title: 'Sid Meier\'s Civilization VI', appId: 289070, genre: ['Strategy', 'Simulation'], tags: ['4X', 'Turn-Based', 'Historical'], developer: 'Firaxis Games', publisher: '2K', releaseDate: '2016-10-20', price: 59.99, discount: 90, rating: 4.7 },
  { title: 'RimWorld', appId: 294100, genre: ['Simulation', 'Strategy'], tags: ['Colony Sim', 'Story Generator', 'Survival'], developer: 'Ludeon Studios', publisher: 'Ludeon Studios', releaseDate: '2018-10-17', price: 34.99, discount: 20, rating: 4.9 },
  { title: 'Factorio', appId: 427520, genre: ['Automation', 'Strategy'], tags: ['Base Building', 'Management', 'Engineering'], developer: 'Wube Software', publisher: 'Wube Software', releaseDate: '2020-08-14', price: 35.00, discount: 0, rating: 4.9 },
  { title: 'Satisfactory', appId: 526870, genre: ['Automation', 'Open World'], tags: ['Factory', 'Exploration', 'Co-op'], developer: 'Coffee Stain Studios', publisher: 'Coffee Stain Publishing', releaseDate: '2020-06-08', price: 39.99, discount: 35, rating: 4.8 },
  { title: 'Dyson Sphere Program', appId: 1366540, genre: ['Automation', 'Strategy'], tags: ['Space', 'Factory', 'Base Building'], developer: 'Youthcat Studio', publisher: 'Gamera Games', releaseDate: '2021-01-21', price: 19.99, discount: 20, rating: 4.8 },
  { title: 'Crusader Kings III', appId: 1158310, genre: ['Strategy', 'RPG'], tags: ['Grand Strategy', 'Medieval', 'Simulation'], developer: 'Paradox Development Studio', publisher: 'Paradox Interactive', releaseDate: '2020-09-01', price: 49.99, discount: 50, rating: 4.7 },
  { title: 'Hearts of Iron IV', appId: 394360, genre: ['Strategy', 'Simulation'], tags: ['Grand Strategy', 'War', 'Historical'], developer: 'Paradox Development Studio', publisher: 'Paradox Interactive', releaseDate: '2016-06-06', price: 49.99, discount: 70, rating: 4.6 },
  { title: 'Stellaris', appId: 281990, genre: ['Strategy', 'Simulation'], tags: ['Grand Strategy', 'Space', '4X'], developer: 'Paradox Development Studio', publisher: 'Paradox Interactive', releaseDate: '2016-05-09', price: 39.99, discount: 70, rating: 4.6 },
  { title: 'Total War: WARHAMMER III', appId: 1142710, genre: ['Strategy', 'Fantasy'], tags: ['Grand Strategy', 'Real-Time Tactics', 'Warhammer'], developer: 'Creative Assembly', publisher: 'SEGA', releaseDate: '2022-02-17', price: 59.99, discount: 50, rating: 4.2 },
  { title: 'Age of Empires IV: Anniversary Edition', appId: 1466860, genre: ['Strategy', 'RTS'], tags: ['Historical', 'Base Building', 'Multiplayer'], developer: 'Relic Entertainment', publisher: 'Xbox Game Studios', releaseDate: '2021-10-28', price: 39.99, discount: 40, rating: 4.5 },
  { title: 'Mount & Blade II: Bannerlord', appId: 261550, genre: ['RPG', 'Strategy'], tags: ['Medieval', 'Sandbox', 'War'], developer: 'TaleWorlds Entertainment', publisher: 'TaleWorlds Entertainment', releaseDate: '2022-10-25', price: 49.99, discount: 40, rating: 4.5 },
  { title: 'Project Zomboid', appId: 108600, genre: ['Survival', 'Simulation'], tags: ['Zombies', 'Sandbox', 'Co-op'], developer: 'The Indie Stone', publisher: 'The Indie Stone', releaseDate: '2013-11-08', price: 19.99, discount: 25, rating: 4.8 },
  { title: '7 Days to Die', appId: 251570, genre: ['Survival', 'Open World'], tags: ['Zombies', 'Crafting', 'Base Building'], developer: 'The Fun Pimps', publisher: 'The Fun Pimps', releaseDate: '2013-12-13', price: 44.99, discount: 30, rating: 4.5 },
  { title: 'The Forest', appId: 242760, genre: ['Survival', 'Horror'], tags: ['Crafting', 'Co-op', 'Open World'], developer: 'Endnight Games', publisher: 'Endnight Games', releaseDate: '2018-04-30', price: 19.99, discount: 60, rating: 4.7 },
  { title: 'Sons Of The Forest', appId: 1326470, genre: ['Survival', 'Horror'], tags: ['Crafting', 'Co-op', 'Open World'], developer: 'Endnight Games', publisher: 'Newnight', releaseDate: '2024-02-22', price: 29.99, discount: 25, rating: 4.3 },
  { title: 'Subnautica', appId: 264710, genre: ['Survival', 'Adventure'], tags: ['Underwater', 'Exploration', 'Crafting'], developer: 'Unknown Worlds Entertainment', publisher: 'Unknown Worlds Entertainment', releaseDate: '2018-01-23', price: 29.99, discount: 50, rating: 4.8 },
  { title: 'Subnautica: Below Zero', appId: 848450, genre: ['Survival', 'Adventure'], tags: ['Underwater', 'Exploration', 'Sci-Fi'], developer: 'Unknown Worlds Entertainment', publisher: 'Unknown Worlds Entertainment', releaseDate: '2021-05-13', price: 29.99, discount: 50, rating: 4.5 },
  { title: 'ARK: Survival Evolved', appId: 346110, genre: ['Survival', 'Open World'], tags: ['Dinosaurs', 'Crafting', 'Co-op'], developer: 'Studio Wildcard', publisher: 'Studio Wildcard', releaseDate: '2017-08-27', price: 19.99, discount: 75, rating: 4.2 },
  { title: 'Don\'t Starve Together', appId: 322330, genre: ['Survival', 'Adventure'], tags: ['Co-op', 'Crafting', 'Stylized'], developer: 'Klei Entertainment', publisher: 'Klei Entertainment', releaseDate: '2016-04-21', price: 14.99, discount: 60, rating: 4.8 },
  { title: 'Kenshi', appId: 233860, genre: ['RPG', 'Sandbox'], tags: ['Open World', 'Survival', 'Base Building'], developer: 'Lo-Fi Games', publisher: 'Lo-Fi Games', releaseDate: '2018-12-06', price: 29.99, discount: 45, rating: 4.8 },
  { title: 'DayZ', appId: 221100, genre: ['Survival', 'Shooter'], tags: ['Zombies', 'Open World', 'PvP'], developer: 'Bohemia Interactive', publisher: 'Bohemia Interactive', releaseDate: '2018-12-13', price: 49.99, discount: 35, rating: 4.0 },
  { title: 'Lethal Company', appId: 1966720, genre: ['Horror', 'Co-op'], tags: ['Comedy', 'Survival', 'Online'], developer: 'Zeekerss', publisher: 'Zeekerss', releaseDate: '2023-10-23', price: 9.99, discount: 20, rating: 4.8 },
  { title: 'Phasmophobia', appId: 739630, genre: ['Horror', 'Co-op'], tags: ['Ghosts', 'VR', 'Investigation'], developer: 'Kinetic Games', publisher: 'Kinetic Games', releaseDate: '2020-09-18', price: 19.99, discount: 20, rating: 4.7 },
  { title: 'Among Us', appId: 945360, genre: ['Social Deduction', 'Party'], tags: ['Multiplayer', 'Casual', 'Deception'], developer: 'Innersloth', publisher: 'Innersloth', releaseDate: '2018-11-16', price: 4.99, discount: 20, rating: 4.6 },
  { title: 'Fall Guys', appId: 1097150, genre: ['Party', 'Platformer'], tags: ['Battle Royale', 'Colorful', 'Multiplayer'], developer: 'Mediatonic', publisher: 'Epic Games', releaseDate: '2020-08-04', price: 0, discount: 0, rating: 4.3 },
  { title: 'Tom Clancy\'s Rainbow Six Siege', appId: 359550, genre: ['Shooter', 'Tactical'], tags: ['Competitive', 'Team-Based', 'Destruction'], developer: 'Ubisoft Montreal', publisher: 'Ubisoft', releaseDate: '2015-12-01', price: 19.99, discount: 70, rating: 4.5 },
  { title: 'THE FINALS', appId: 2073850, genre: ['Shooter', 'Action'], tags: ['Destruction', 'Competitive', 'Team-Based'], developer: 'Embark Studios', publisher: 'Embark Studios', releaseDate: '2023-12-07', price: 0, discount: 0, rating: 4.4 },
  { title: 'Overwatch 2', appId: 2357570, genre: ['Shooter', 'Action'], tags: ['Hero Shooter', 'Team-Based', 'Competitive'], developer: 'Blizzard Entertainment', publisher: 'Blizzard Entertainment', releaseDate: '2023-08-10', price: 0, discount: 0, rating: 3.7 },
  { title: 'Path of Exile', appId: 238960, genre: ['Action RPG', 'RPG'], tags: ['Loot', 'Dark Fantasy', 'Online'], developer: 'Grinding Gear Games', publisher: 'Grinding Gear Games', releaseDate: '2013-10-23', price: 0, discount: 0, rating: 4.6 },
  { title: 'Diablo IV', appId: 2344520, genre: ['Action RPG', 'RPG'], tags: ['Loot', 'Dark Fantasy', 'Co-op'], developer: 'Blizzard Entertainment', publisher: 'Blizzard Entertainment', releaseDate: '2023-10-17', price: 69.99, discount: 40, rating: 4.1 },
  { title: 'Lost Ark', appId: 1599340, genre: ['MMO', 'Action RPG'], tags: ['Online', 'Fantasy', 'Loot'], developer: 'Smilegate RPG', publisher: 'Amazon Games', releaseDate: '2022-02-11', price: 0, discount: 0, rating: 4.0 },
  { title: 'New World: Aeternum', appId: 1063730, genre: ['MMO', 'RPG'], tags: ['Open World', 'Fantasy', 'Crafting'], developer: 'Amazon Games', publisher: 'Amazon Games', releaseDate: '2021-09-28', price: 59.99, discount: 50, rating: 4.0 },
  { title: 'FINAL FANTASY XIV Online', appId: 39210, genre: ['MMO', 'RPG'], tags: ['Story Rich', 'Fantasy', 'Online'], developer: 'Square Enix', publisher: 'Square Enix', releaseDate: '2014-02-18', price: 19.99, discount: 50, rating: 4.6 },
  { title: 'The Elder Scrolls Online', appId: 306130, genre: ['MMO', 'RPG'], tags: ['Open World', 'Fantasy', 'Online'], developer: 'ZeniMax Online Studios', publisher: 'Bethesda Softworks', releaseDate: '2014-04-04', price: 19.99, discount: 70, rating: 4.4 },
  { title: 'Black Desert', appId: 582660, genre: ['MMO', 'RPG'], tags: ['Open World', 'Action Combat', 'Fantasy'], developer: 'Pearl Abyss', publisher: 'Pearl Abyss', releaseDate: '2017-05-24', price: 9.99, discount: 90, rating: 4.0 },
  { title: 'Guild Wars 2', appId: 1284210, genre: ['MMO', 'RPG'], tags: ['Fantasy', 'Open World', 'Online'], developer: 'ArenaNet', publisher: 'NCSOFT', releaseDate: '2022-08-23', price: 0, discount: 0, rating: 4.5 },
  { title: 'NARAKA: BLADEPOINT', appId: 1203220, genre: ['Battle Royale', 'Action'], tags: ['Martial Arts', 'Melee', 'Online'], developer: '24 Entertainment', publisher: 'NetEase Games', releaseDate: '2021-08-11', price: 0, discount: 0, rating: 4.1 },
  { title: 'Hunt: Showdown 1896', appId: 594650, genre: ['Shooter', 'Horror'], tags: ['Extraction', 'PvPvE', 'Atmospheric'], developer: 'Crytek', publisher: 'Crytek', releaseDate: '2019-08-27', price: 29.99, discount: 55, rating: 4.5 },
  { title: 'Dead by Daylight', appId: 381210, genre: ['Horror', 'Action'], tags: ['Asymmetric', 'Multiplayer', 'Survival'], developer: 'Behaviour Interactive', publisher: 'Behaviour Interactive', releaseDate: '2016-06-14', price: 19.99, discount: 60, rating: 4.3 },
  { title: 'Mortal Kombat 1', appId: 1971870, genre: ['Fighting', 'Action'], tags: ['Gore', 'Competitive', 'Story'], developer: 'NetherRealm Studios', publisher: 'Warner Bros. Games', releaseDate: '2023-09-19', price: 49.99, discount: 50, rating: 4.0 },
  { title: 'Street Fighter 6', appId: 1364780, genre: ['Fighting', 'Action'], tags: ['Competitive', 'Arcade', 'Multiplayer'], developer: 'CAPCOM', publisher: 'CAPCOM', releaseDate: '2023-06-02', price: 59.99, discount: 40, rating: 4.7 },
  { title: 'TEKKEN 8', appId: 1778820, genre: ['Fighting', 'Action'], tags: ['Competitive', 'Arcade', 'Cinematic'], developer: 'Bandai Namco Studios', publisher: 'Bandai Namco', releaseDate: '2024-01-25', price: 69.99, discount: 35, rating: 4.4 },
  { title: 'GUILTY GEAR -STRIVE-', appId: 1384160, genre: ['Fighting', 'Anime'], tags: ['Competitive', 'Stylized', 'Arcade'], developer: 'Arc System Works', publisher: 'Arc System Works', releaseDate: '2021-06-11', price: 39.99, discount: 50, rating: 4.7 },
  { title: 'Persona 5 Royal', appId: 1687950, genre: ['JRPG', 'RPG'], tags: ['Anime', 'Story Rich', 'Turn-Based'], developer: 'ATLUS', publisher: 'SEGA', releaseDate: '2022-10-20', price: 59.99, discount: 50, rating: 4.8 },
  { title: 'Persona 3 Reload', appId: 2161700, genre: ['JRPG', 'RPG'], tags: ['Anime', 'Turn-Based', 'Story Rich'], developer: 'ATLUS', publisher: 'SEGA', releaseDate: '2024-02-01', price: 69.99, discount: 35, rating: 4.7 },
  { title: 'Like a Dragon: Infinite Wealth', appId: 2072450, genre: ['JRPG', 'Adventure'], tags: ['Crime', 'Comedy', 'Turn-Based'], developer: 'Ryu Ga Gotoku Studio', publisher: 'SEGA', releaseDate: '2024-01-25', price: 69.99, discount: 40, rating: 4.8 },
  { title: 'Yakuza 0', appId: 638970, genre: ['Action', 'Adventure'], tags: ['Crime', 'Story Rich', 'Beat em up'], developer: 'Ryu Ga Gotoku Studio', publisher: 'SEGA', releaseDate: '2018-08-01', price: 19.99, discount: 75, rating: 4.9 },
  { title: 'NieR:Automata', appId: 524220, genre: ['Action', 'RPG'], tags: ['Story Rich', 'Philosophical', 'Hack and Slash'], developer: 'PlatinumGames', publisher: 'Square Enix', releaseDate: '2017-03-17', price: 39.99, discount: 50, rating: 4.8 },
  { title: 'FINAL FANTASY VII REMAKE INTERGRADE', appId: 1462040, genre: ['JRPG', 'Action'], tags: ['Story Rich', 'Fantasy', 'Cinematic'], developer: 'Square Enix', publisher: 'Square Enix', releaseDate: '2022-06-17', price: 69.99, discount: 50, rating: 4.6 },
  { title: 'Resident Evil 4', appId: 2050650, genre: ['Horror', 'Action'], tags: ['Survival Horror', 'Third-Person', 'Cinematic'], developer: 'CAPCOM', publisher: 'CAPCOM', releaseDate: '2023-03-24', price: 39.99, discount: 50, rating: 4.9 },
  { title: 'Resident Evil Village', appId: 1196590, genre: ['Horror', 'Action'], tags: ['Survival Horror', 'Atmospheric', 'Story Rich'], developer: 'CAPCOM', publisher: 'CAPCOM', releaseDate: '2021-05-06', price: 39.99, discount: 60, rating: 4.7 },
  { title: 'Resident Evil 2', appId: 883710, genre: ['Horror', 'Action'], tags: ['Survival Horror', 'Zombies', 'Remake'], developer: 'CAPCOM', publisher: 'CAPCOM', releaseDate: '2019-01-24', price: 39.99, discount: 75, rating: 4.8 },
  { title: 'SILENT HILL 2', appId: 2124490, genre: ['Horror', 'Adventure'], tags: ['Psychological Horror', 'Atmospheric', 'Story Rich'], developer: 'Bloober Team', publisher: 'KONAMI', releaseDate: '2024-10-08', price: 69.99, discount: 20, rating: 4.6 },
  { title: 'Control Ultimate Edition', appId: 870780, genre: ['Action', 'Adventure'], tags: ['Supernatural', 'Third-Person', 'Atmospheric'], developer: 'Remedy Entertainment', publisher: '505 Games', releaseDate: '2020-08-27', price: 39.99, discount: 75, rating: 4.7 },
  { title: 'DEATH STRANDING DIRECTOR\'S CUT', appId: 1850570, genre: ['Adventure', 'Open World'], tags: ['Cinematic', 'Atmospheric', 'Story Rich'], developer: 'KOJIMA PRODUCTIONS', publisher: '505 Games', releaseDate: '2022-03-30', price: 39.99, discount: 50, rating: 4.7 },
  { title: 'God of War', appId: 1593500, genre: ['Action', 'Adventure'], tags: ['Mythology', 'Story Rich', 'Cinematic'], developer: 'Santa Monica Studio', publisher: 'PlayStation Publishing', releaseDate: '2022-01-14', price: 49.99, discount: 40, rating: 4.8 },
  { title: 'Marvel\'s Spider-Man Remastered', appId: 1817070, genre: ['Action', 'Open World'], tags: ['Superhero', 'Cinematic', 'Traversal'], developer: 'Insomniac Games', publisher: 'PlayStation Publishing', releaseDate: '2022-08-12', price: 59.99, discount: 40, rating: 4.8 },
  { title: 'Marvel\'s Spider-Man: Miles Morales', appId: 1817190, genre: ['Action', 'Open World'], tags: ['Superhero', 'Cinematic', 'Traversal'], developer: 'Insomniac Games', publisher: 'PlayStation Publishing', releaseDate: '2022-11-18', price: 49.99, discount: 40, rating: 4.7 },
  { title: 'Horizon Zero Dawn Complete Edition', appId: 1151640, genre: ['Action', 'Open World'], tags: ['Sci-Fi', 'Robots', 'Adventure'], developer: 'Guerrilla', publisher: 'PlayStation Publishing', releaseDate: '2020-08-07', price: 49.99, discount: 50, rating: 4.6 },
  { title: 'Horizon Forbidden West Complete Edition', appId: 2420110, genre: ['Action', 'Open World'], tags: ['Sci-Fi', 'Robots', 'Adventure'], developer: 'Guerrilla', publisher: 'PlayStation Publishing', releaseDate: '2024-03-21', price: 59.99, discount: 30, rating: 4.7 },
  { title: 'Ghost of Tsushima DIRECTOR\'S CUT', appId: 2215430, genre: ['Action', 'Open World'], tags: ['Samurai', 'Cinematic', 'Stealth'], developer: 'Sucker Punch Productions', publisher: 'PlayStation Publishing', releaseDate: '2024-05-16', price: 59.99, discount: 25, rating: 4.8 },
  { title: 'The Last of Us Part I', appId: 1888930, genre: ['Action', 'Adventure'], tags: ['Story Rich', 'Post-Apocalyptic', 'Cinematic'], developer: 'Naughty Dog', publisher: 'PlayStation Publishing', releaseDate: '2023-03-28', price: 59.99, discount: 40, rating: 4.4 },
  { title: 'Starfield', appId: 1716740, genre: ['RPG', 'Open World'], tags: ['Space', 'Exploration', 'Sci-Fi'], developer: 'Bethesda Game Studios', publisher: 'Bethesda Softworks', releaseDate: '2023-09-06', price: 69.99, discount: 40, rating: 3.9 },
  { title: 'The Elder Scrolls V: Skyrim Special Edition', appId: 489830, genre: ['RPG', 'Open World'], tags: ['Fantasy', 'Moddable', 'Adventure'], developer: 'Bethesda Game Studios', publisher: 'Bethesda Softworks', releaseDate: '2016-10-27', price: 39.99, discount: 75, rating: 4.8 },
  { title: 'Fallout 4', appId: 377160, genre: ['RPG', 'Open World'], tags: ['Post-Apocalyptic', 'Moddable', 'Shooter'], developer: 'Bethesda Game Studios', publisher: 'Bethesda Softworks', releaseDate: '2015-11-09', price: 19.99, discount: 75, rating: 4.6 },
  { title: 'Mass Effect Legendary Edition', appId: 1328670, genre: ['RPG', 'Adventure'], tags: ['Sci-Fi', 'Story Rich', 'Choices Matter'], developer: 'BioWare', publisher: 'Electronic Arts', releaseDate: '2021-05-14', price: 59.99, discount: 85, rating: 4.8 },
  { title: 'DOOM Eternal', appId: 782330, genre: ['Shooter', 'Action'], tags: ['Fast-Paced', 'Demons', 'Metal'], developer: 'id Software', publisher: 'Bethesda Softworks', releaseDate: '2020-03-20', price: 39.99, discount: 75, rating: 4.7 },
  { title: 'Halo Infinite', appId: 1240440, genre: ['Shooter', 'Action'], tags: ['Sci-Fi', 'Multiplayer', 'Arena'], developer: '343 Industries', publisher: 'Xbox Game Studios', releaseDate: '2021-11-15', price: 0, discount: 0, rating: 4.0 },
  { title: 'Titanfall 2', appId: 1237970, genre: ['Shooter', 'Action'], tags: ['Mechs', 'Movement', 'Story Rich'], developer: 'Respawn Entertainment', publisher: 'Electronic Arts', releaseDate: '2020-06-18', price: 29.99, discount: 80, rating: 4.8 },
  { title: 'Battlefield 2042', appId: 1517290, genre: ['Shooter', 'Action'], tags: ['Military', 'Large-Scale', 'Multiplayer'], developer: 'DICE', publisher: 'Electronic Arts', releaseDate: '2021-11-19', price: 59.99, discount: 85, rating: 3.8 },
  { title: 'Call of Duty', appId: 1938090, genre: ['Shooter', 'Action'], tags: ['Military', 'Multiplayer', 'Battle Royale'], developer: 'Infinity Ward', publisher: 'Activision', releaseDate: '2022-10-27', price: 69.99, discount: 35, rating: 3.6 },
  { title: 'Ready or Not', appId: 1144200, genre: ['Shooter', 'Tactical'], tags: ['Police', 'Co-op', 'Realistic'], developer: 'VOID Interactive', publisher: 'VOID Interactive', releaseDate: '2023-12-13', price: 49.99, discount: 25, rating: 4.4 },
  { title: 'Insurgency: Sandstorm', appId: 581320, genre: ['Shooter', 'Tactical'], tags: ['Realistic', 'Military', 'Co-op'], developer: 'New World Interactive', publisher: 'Focus Entertainment', releaseDate: '2018-12-12', price: 29.99, discount: 60, rating: 4.5 },
  { title: 'Arma 3', appId: 107410, genre: ['Simulation', 'Shooter'], tags: ['Military', 'Sandbox', 'Realistic'], developer: 'Bohemia Interactive', publisher: 'Bohemia Interactive', releaseDate: '2013-09-12', price: 29.99, discount: 80, rating: 4.6 },
  { title: 'Squad', appId: 393380, genre: ['Shooter', 'Tactical'], tags: ['Military', 'Team-Based', 'Realistic'], developer: 'Offworld Industries', publisher: 'Offworld Industries', releaseDate: '2020-09-23', price: 49.99, discount: 35, rating: 4.4 },
];

const CATALOG_SIZE = 1000;

const EDITION_NAMES = [
  'Definitive Edition',
  'Ultimate Bundle',
  'Next-Gen Drop',
  'Night Ops',
  'Legends Pack',
  'Remastered Vault',
  'Arena Cut',
  'Collector Run',
  'Champion Circuit',
  'Launch Archive',
];

const TRAILER_FALLBACKS = [
  'https://www.youtube.com/watch?v=QkkoHAzjnUs',
  'https://www.youtube.com/watch?v=YE7VzlLtp-4',
  'https://www.youtube.com/watch?v=eRsGyueVLvS',
  'https://www.youtube.com/watch?v=_MXtbjwsz3A',
  'https://www.youtube.com/watch?v=RUR_kskFq0c',
  'https://www.youtube.com/watch?v=a4FIS360yQk',
  'https://www.youtube.com/watch?v=OPf0YbXqDm0',
  'https://www.youtube.com/watch?v=WhWc3lidSK8',
  'https://www.youtube.com/watch?v=Ztb2xb1Uh-4',
];

const GAME_VIDEO_OVERRIDES: Record<string, string[]> = {
  'grand-theft-auto-v-legacy': [
    'https://www.youtube.com/watch?v=QkkoHAzjnUs',
    'https://www.youtube.com/watch?v=hvoD7ehZPcM',
    'https://www.youtube.com/watch?v=N-xHcvug3WI',
  ],
  'counter-strike-2': [
    'https://www.youtube.com/watch?v=c80dVYcL69E',
    'https://www.youtube.com/watch?v=s6BNHro0vSg',
    'https://www.youtube.com/watch?v=ExZtISgOxEQ',
  ],
  'cyberpunk-2077': [
    'https://www.youtube.com/watch?v=8X2kIfS6fb8',
    'https://www.youtube.com/watch?v=qIcTM8WXFjk',
    'https://www.youtube.com/watch?v=LembwKDo1Dk',
  ],
  'elden-ring': [
    'https://www.youtube.com/watch?v=E3Huy2cdih0',
    'https://www.youtube.com/watch?v=K_03kFqWfqs',
    'https://www.youtube.com/watch?v=qqiC88f9ogU',
  ],
};

function rotated<T>(items: readonly T[], start: number, count: number): T[] {
  return Array.from({ length: count }, (_, i) => items[(start + i) % items.length]);
}

function youtubeSearchEmbed(query: string) {
  return `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}`;
}

function videoUrls(title: string, baseSlug: string, index: number) {
  const overrides = GAME_VIDEO_OVERRIDES[baseSlug];
  if (overrides?.length) return overrides;

  return [
    youtubeSearchEmbed(`${title} official trailer`),
    youtubeSearchEmbed(`${title} gameplay trailer`),
    rotated(TRAILER_FALLBACKS, index, 1)[0],
  ];
}

export const TOP_GAME_SEEDS: Game[] = Array.from({ length: CATALOG_SIZE }, (_, index) => {
    const seed = TOP_GAME_DATA[index % TOP_GAME_DATA.length];
    const rank = index + 1;
    const batch = Math.floor(index / TOP_GAME_DATA.length);
    const baseSlug = slugify(seed.title);
    const editionName = EDITION_NAMES[(batch - 1 + EDITION_NAMES.length) % EDITION_NAMES.length];
    const title = batch === 0 ? seed.title : `${seed.title}: ${editionName}`;
    const slug = batch === 0 ? baseSlug : `${baseSlug}-${slugify(editionName)}-${batch + 1}`;
    const reviewCount = Math.max(8500, 1800000 - index * 15500);
    const videos = videoUrls(seed.title, baseSlug, index);
    const downloadUrl = officialSiteForSlug(baseSlug) ?? `https://store.steampowered.com/app/${seed.appId}`;

    return {
      id: `seed-${slug}`,
      title,
      slug,
      description: describe(seed, rank, title),
      short_description: `Top ${rank} pick: ${seed.tags.slice(0, 3).join(', ')} gameplay with modern store-ready details.`,
      cover_image: steamImage(seed.appId, 'cover'),
      banner_image: steamImage(seed.appId, 'capsule'),
      screenshots: [
        steamImage(seed.appId, 'header'),
        steamImage(seed.appId, 'capsule'),
        steamImage(seed.appId, 'cover'),
        `https://cdn.cloudflare.steamstatic.com/steam/apps/${seed.appId}/library_hero.jpg`,
        `https://cdn.cloudflare.steamstatic.com/steam/apps/${seed.appId}/hero_capsule.jpg`,
        `https://cdn.cloudflare.steamstatic.com/steam/apps/${seed.appId}/page_bg_generated_v6b.jpg`,
      ],
      trailer_url: videos[0] ?? null,
      videos,
      genre: seed.genre,
      tags: [`Top ${rank}`, batch === 0 ? 'Original title' : editionName, ...seed.tags],
      developer: seed.developer,
      publisher: seed.publisher,
      release_date: seed.releaseDate,
      platform: ['Windows'],
      rating: Math.max(3.6, Number((seed.rating - batch * 0.03).toFixed(1))),
      review_count: reviewCount,
      price: seed.price,
      discount_percent: seed.discount,
      download_url: downloadUrl,
      system_requirements: systemRequirements(seed.genre),
      created_at: `2026-05-15T${String(Math.floor(index / 60)).padStart(2, '0')}:${String(index % 60).padStart(2, '0')}:00.000Z`,
      updated_at: `2026-05-15T${String(Math.floor(index / 60)).padStart(2, '0')}:${String(index % 60).padStart(2, '0')}:00.000Z`,
    };
});

export function isSeedGameId(id?: string | null) {
  return typeof id === 'string' && id.startsWith('seed-');
}

export function getTopGameById(id: string) {
  return TOP_GAME_SEEDS.find(game => game.id === id) ?? null;
}

export function getTopGameBySlug(slug: string) {
  return TOP_GAME_SEEDS.find(game => game.slug === slug) ?? null;
}

export type TopGameFilterOptions = {
  limit?: number;
  offset?: number;
  categoryIds?: string[];
  searchQuery?: string;
  sortBy?: 'featured' | 'newest' | 'rating' | 'price-low' | 'price-high';
  minPrice?: number;
  maxPrice?: number;
  onlyOnSale?: boolean;
};

export const TOP_GAME_CATEGORIES = Array.from(
  new Set(TOP_GAME_SEEDS.flatMap(game => game.genre ?? []))
)
  .sort((a, b) => a.localeCompare(b))
  .map((name, index) => ({
    id: slugify(name),
    name,
    slug: slugify(name),
    description: `${name} games`,
    icon: 'Gamepad2',
    color: '#38bdf8',
    sort_order: index,
    created_at: '2026-05-15T00:00:00.000Z',
  }));

export function filterTopGames(options: TopGameFilterOptions = {}): { games: Game[]; total: number } {
  let games = [...TOP_GAME_SEEDS];
  const q = options.searchQuery?.trim().toLowerCase();

  if (q) {
    games = games.filter(game => {
      const haystack = [
        game.title,
        game.developer,
        game.publisher,
        game.description,
        ...(game.genre ?? []),
        ...(game.tags ?? []),
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }

  if (options.onlyOnSale) {
    games = games.filter(game => game.discount_percent > 0);
  }

  if (options.categoryIds?.length) {
    const selected = new Set(options.categoryIds);
    games = games.filter(game => (game.genre ?? []).some(genre => selected.has(slugify(genre))));
  }

  if (options.minPrice !== undefined && Number.isFinite(options.minPrice)) {
    games = games.filter(game => game.price >= options.minPrice!);
  }

  if (options.maxPrice !== undefined && Number.isFinite(options.maxPrice)) {
    games = games.filter(game => game.price <= options.maxPrice!);
  }

  if (options.sortBy === 'newest') {
    games.sort((a, b) => b.release_date.localeCompare(a.release_date));
  } else if (options.sortBy === 'rating') {
    games.sort((a, b) => b.rating - a.rating);
  } else if (options.sortBy === 'price-low') {
    games.sort((a, b) => a.price - b.price);
  } else if (options.sortBy === 'price-high') {
    games.sort((a, b) => b.price - a.price);
  }

  const total = games.length;
  const offset = options.offset ?? 0;
  const limit = options.limit;

  return {
    games: limit ? games.slice(offset, offset + limit) : games.slice(offset),
    total,
  };
}
