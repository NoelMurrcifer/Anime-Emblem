/* ==========================================================================
   GLOBAL GAME STATE (js/state.js) — HỆ THỐNG 8 CHỈ SỐ & BẢN ĐỒ ĐỘNG TỪ MYSQL
   - KHAI BÁO LOẠI VŨ KHÍ TƯƠNG THÍCH CHO TỪNG NHÂN VẬT (allowed_weapons)
   - TÍCH HỢP KIỂU DI CHUYỂN: ĐI BỘ (WALK) VS ĐI BAY (FLY)
   - TÍCH HỢP ĐỊA HÌNH Ô NƯỚC (A - AQUA / WATER) CHO TƯỚNG BAY
   - TÍCH HỢP QUẢN LÝ TIẾN TRÌNH THÁP VÔ TẬN (ENDLESS ROGUELIKE ENGINE)
   - KHO THẦN PHƯỚC 6 LÁ BÀI BUFF NGẪU NHIÊN SAU KHI HẠ BOSS
   - BẢO TỒN VŨ KHÍ & CUNG MỆNH, LEVEL QUAY VỀ 1 TRONG LƯỢT LEO THÁP
   ========================================================================== */

const COLORS = {
  teal: 'var(--teal)',
  rose: 'var(--rose)',
  gold: 'var(--gold)',
  red: 'var(--enemy-red)',
  purple: 'var(--enemy-purple)'
};

let playerGems = 1500;
let pityCounter = 0;

// CÁC BIẾN BẢN ĐỒ DẠNG ĐỘNG (SẼ TỰ ĐỘNG THAY ĐỔI THEO MAP BUILDER TRONG MYSQL)
let COLS = 10;
let ROWS = 7;
const TILE = 56;
let TERRAIN = [
  "PPPFPPPPPP",
  "PWPPPPFPPP",
  "PPPPWPPPWP",
  "FPPPPPPPPF",
  "PPWPPPWPPP",
  "PPPPPPPPPP",
  "PFPPPPPFPP"
];

// CHI PHÍ BƯỚC ĐI CƠ BẢN: P = Đồng bằng (1), F = Rừng (2), W = Tường (Vô cực), H = Cứ điểm (1), A = Nước (Vô cực với tướng bộ)
const COST = { P: 1, F: 2, W: Infinity, H: 1, A: Infinity };
const MAX_STACK = 4;
let currentMapData = null; // Lưu trữ thông tin ải hiện tại (tên ải, phần thưởng đá, exp...)

// ==========================================================================
// CÁC BIẾN TRẠNG THÁI CHẾ ĐỘ THÁP VÔ TẬN (ENDLESS TOWER ROGUELIKE)
// ==========================================================================
let isEndlessMode = false;         // true: đang trong lượt leo Tháp Vô Tận; false: Chiến dịch bình thường
let endlessCurrentFloor = 1;       // Tầng leo tháp hiện tại (1, 2, 3...)
let endlessBestFloor = 0;          // Kỷ lục tầng cao nhất người chơi từng đạt được
let selectedEndlessBuffCard = null;// Lá bài người chơi đang bấm chọn trong Modal

// Bộ chỉ số Buff cộng dồn từ các lá bài Thần Phước mà người chơi đã chọn trong lượt leo tháp
let endlessActiveBuffs = {
  atk_pct: 0,        // +% Sức mạnh vật lý & Ma lực phép
  def_pct: 0,        // +% Giáp vật lý & Kháng phép
  crit_rate: 0,      // +% Tỉ lệ đòn Chí Mạng
  mov: 0,            // + Bước đi (MP)
  life_steal: 0,     // +% Hút máu khi gây sát thương
  dmg_reduction: 0   // -% Giảm sát thương nhận vào
};

// KHO BÀI THẦN PHƯỚC ROGUELIKE (RÚT NGẪU NHIÊN 3 LÁ SAU KHI HẠ BOSS)
const ENDLESS_BUFF_CARDS_POOL = [
  {
    id: 'buff_warrior_might',
    name: 'Chiến Ý Cuồng Nộ',
    icon: '🗡️',
    type: '⚔️ TẤN CÔNG',
    desc: '+15% Sức mạnh (Str) & Ma lực (Mag) cho toàn đội đến hết lượt leo tháp.',
    apply: () => { endlessActiveBuffs.atk_pct += 15; }
  },
  {
    id: 'buff_iron_bastion',
    name: 'Thiết Giáp Bất Hoại',
    icon: '🛡️',
    type: '🛡️ PHÒNG THỦ',
    desc: '+20% Giáp (Def) & Kháng phép (Res), đồng thời giảm 10% sát thương nhận vào.',
    apply: () => { endlessActiveBuffs.def_pct += 20; endlessActiveBuffs.dmg_reduction += 10; }
  },
  {
    id: 'buff_divine_blessing',
    name: 'Thần Ân Phục Hồi',
    icon: '💚',
    type: '🌿 HỒI SINH',
    desc: 'Hồi phục ngay lập tức 100% HP và hồi lại toàn bộ lượt dùng Kỹ Năng cho tất cả tướng!',
    apply: () => {
      units.filter(u => u.team === 'player' && u.hp > 0).forEach(u => {
        u.hp = u.maxhp;
        if (u.skills) u.skills.forEach(s => s.current_uses = s.max_uses);
      });
    }
  },
  {
    id: 'buff_swift_wind',
    name: 'Tật Phong Cuồng Lôi',
    icon: '⚡',
    type: '💨 TỐC ĐỘ',
    desc: '+15% Tỉ lệ Chí mạng (Crit Rate) và gia tăng +1 Bước di chuyển (MP) cho toàn đội.',
    apply: () => { endlessActiveBuffs.crit_rate += 15; endlessActiveBuffs.mov += 1; }
  },
  {
    id: 'buff_blood_drain',
    name: 'Huyết Dạ Hấp Thu',
    icon: '🩸',
    type: '🩸 HÚT MÁU',
    desc: 'Toàn đội nhận 25% Khả năng Hút Máu (chuyển 25% sát thương gây ra thành hồi máu).',
    apply: () => { endlessActiveBuffs.life_steal += 25; }
  },
  {
    id: 'buff_fatal_strike',
    name: 'Nhất Kích Trảm Mệnh',
    icon: '👑',
    type: '💥 CHÍ MẠNG',
    desc: '+25% Sát thương khi đánh trúng Điểm Yếu hoặc nổ đòn Chí Mạng.',
    apply: () => { endlessActiveBuffs.atk_pct += 10; endlessActiveBuffs.crit_rate += 10; }
  }
];

// ==========================================================================
// BỘ DỮ LIỆU TƯỚNG ĐẦY ĐỦ 8 CHỈ SỐ, PHẨM CẤP, VŨ KHÍ & KIỂU DI CHUYỂN
// ==========================================================================
const HERO_TEMPLATES = {
  aria: {
    id: 'aria', name: 'Aria', cls: 'Vanguard', rarity: 'SSR', symbol: '剣', team: 'player', color: COLORS.teal,
    allowed_weapons: ['Kiếm', 'Đao'],
    mov: 4, move_type: 'walk', range: 1, type: 'Physical', weakness: 'Magic',
    hp: 34, maxhp: 34, str: 14, mag: 2, dex: 12, spd: 11, lck: 10, def: 9, res: 3,
    critQuote: "Thanh kiếm này... sẽ chém đứt tất cả!"
  },
  yuzu: {
    id: 'yuzu', name: 'Yuzu', cls: 'Mystic', rarity: 'SSR', symbol: '呪', team: 'player', color: COLORS.rose,
    allowed_weapons: ['Trượng', 'Sách phép'],
    mov: 3, move_type: 'walk', range: 1, type: 'Magic', weakness: 'Pierce',
    hp: 24, maxhp: 24, str: 2, mag: 16, dex: 14, spd: 10, lck: 12, def: 3, res: 11,
    critQuote: "Ngươi không thể trốn khỏi lời nguyền!"
  },
  kaito: {
    id: 'kaito', name: 'Kaito', cls: 'Ranger', rarity: 'SSR', symbol: '弓', team: 'player', color: COLORS.gold,
    allowed_weapons: ['Cung'],
    mov: 4, move_type: 'walk', range: 2, type: 'Pierce', weakness: 'Physical',
    hp: 26, maxhp: 26, str: 12, mag: 3, dex: 17, spd: 14, lck: 11, def: 5, res: 4,
    critQuote: "Một phát... xuyên tâm!"
  },
  shirou: {
    id: 'shirou', name: 'Shirou', cls: 'Ronin', rarity: 'SSR', symbol: '刀', team: 'player', color: '#4cc9f0',
    allowed_weapons: ['Đao', 'Kiếm'],
    mov: 4, move_type: 'walk', range: 1, type: 'Physical', weakness: 'Magic',
    hp: 28, maxhp: 28, str: 16, mag: 1, dex: 16, spd: 15, lck: 8, def: 6, res: 2,
    critQuote: "Nhát kiếm này... trảm tuyệt hư vô!"
  },
  celeste: {
    id: 'celeste', name: 'Celeste', cls: 'Paladin', rarity: 'SSR', symbol: '聖', team: 'player', color: '#f72585',
    allowed_weapons: ['Kiếm', 'Thương'],
    mov: 4, move_type: 'walk', range: 1, type: 'Physical', weakness: 'Pierce',
    hp: 38, maxhp: 38, str: 13, mag: 5, dex: 10, spd: 7, lck: 14, def: 12, res: 8,
    critQuote: "Dưới ánh sáng thánh thần, hãy sám hối!"
  },
  ren: {
    id: 'ren', name: 'Ren', cls: 'Ninja', rarity: 'SR', symbol: '忍', team: 'player', color: '#9b59b6',
    allowed_weapons: ['Dao', 'Kiếm'],
    mov: 4, move_type: 'walk', range: 1, type: 'Pierce', weakness: 'Physical',
    hp: 26, maxhp: 26, str: 11, mag: 4, dex: 15, spd: 16, lck: 12, def: 4, res: 4,
    critQuote: "Bóng tối sẽ nuốt chửng ngươi!"
  }
};

let ownedHeroes = ['aria', 'yuzu', 'kaito'];
let deployedHeroIds = ['aria', 'yuzu', 'kaito'];

function getPairKey(id1, id2) {
  return [id1, id2].sort().join('___');
}

let supportBonds = {
  "aria___yuzu": 35,
  "aria___kaito": 15,
  "kaito___yuzu": 10
};

function getSupportRankInfo(pts = 0) {
  if (pts >= 250) return { rank: 'S', title: 'Kết Duyên 💍', color: 'var(--rose)', desc: 'Mối liên kết định mệnh vĩnh cửu' };
  if (pts >= 150) return { rank: 'A', title: 'Tri Kỷ (A)', color: 'var(--gold)', desc: 'Sẵn sàng hy sinh vì nhau' };
  if (pts >= 80) return { rank: 'B', title: 'Gắn Kết (B)', color: 'var(--teal)', desc: 'Hiểu rõ và tin tưởng nhau' };
  if (pts >= 30) return { rank: 'C', title: 'Đồng Đội (C)', color: '#4cc9f0', desc: 'Bắt đầu thân thiết' };
  return { rank: 'None', title: 'Người Lạ', color: 'var(--text-3)', desc: 'Chưa có nhiều tương tác' };
}

let userRomance = { aria: 20, yuzu: 15, kaito: 10, shirou: 0, celeste: 0, ren: 0 };
function getRomanceLevelInfo(points = 0) {
  if (points >= 150) return { level: 4, title: "Định Mệnh ❤️", color: "var(--rose)", dialogue: "Dù là chân trời góc bể, thanh kiếm này của tôi chỉ hướng về một mình người thôi, Chỉ huy ❤️" };
  if (points >= 80) return { level: 3, title: "Tri Kỷ", color: "var(--gold)", dialogue: "Chỉ huy này... sau trận đánh hôm nay, người có rảnh đi dạo cùng tôi một lát không?" };
  if (points >= 30) return { level: 2, title: "Thân Thiết", color: "var(--teal)", dialogue: "Được kề vai chiến đấu cùng người khiến tôi cảm thấy rất an tâm!" };
  return { level: 1, title: "Đồng Đội", color: "var(--text-2)", dialogue: "Báo cáo Chỉ huy! Toàn đội đã sẵn sàng nhận lệnh xuất kích." };
}

// CÁC VỊ TRÍ XUẤT QUÂN SẼ ĐƯỢC LOAD TỪ MAP BUILDER
let PLAYER_SPAWN_SLOTS = [
  { col: 1, row: 5 },
  { col: 2, row: 6 },
  { col: 0, row: 6 },
  { col: 0, row: 5 }
];

// DANH SÁCH QUÁI VẬT SẼ ĐƯỢC LOAD TỪ MAP BUILDER HOẶC SINH NGẪU NHIÊN THEO TẦNG
let enemyUnits = [];
let units = [];

const GACHA_POOL = {
  SSR: [
    { id: 'aria', name: 'Aria', type: 'Nhân vật (Vanguard)', symbol: '剣', color: 'var(--teal)' },
    { id: 'yuzu', name: 'Yuzu', type: 'Nhân vật (Mystic)', symbol: '呪', color: 'var(--rose)' },
    { id: 'kaito', name: 'Kaito', type: 'Nhân vật (Ranger)', symbol: '弓', color: 'var(--gold)' },
    { id: 'shirou', name: 'Shirou', type: 'Nhân vật (Ronin)', symbol: '刀', color: '#4cc9f0' },
    { id: 'celeste', name: 'Celeste', type: 'Nhân vật (Paladin)', symbol: '聖', color: '#f72585' }
  ],
  SR: [
    { id: 'ren', name: 'Ren', type: 'Nhân vật (Ninja)', symbol: '忍', color: '#9b59b6' }
  ],
  R: []
};

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function alive(list) { return list.filter(u => u.hp > 0); }
function isNearby8(a, b) { return Math.max(Math.abs(a.col - b.col), Math.abs(a.row - b.row)) <= 1; }

function log(msg, cls) {
  const el = document.getElementById('log');
  if (!el) return;
  const line = document.createElement('div');
  if (cls) line.className = cls;
  line.textContent = msg;
  el.prepend(line);
  while (el.children.length > 16) el.removeChild(el.lastChild);
}

// THÔNG SỐ VŨ KHÍ TỰ ĐỘNG ĐỒNG BỘ TỪ MYSQL
const WEAPON_DATA = {};

// TIẾN TRÌNH TƯỚNG (NGOÀI SẢNH CHÍNH)
let heroProgress = {
  aria: { level: 1, exp: 0, maxExp: 100, equipped_weapon: 'r_iron_sword', constellation: 0, shards: 0 },
  yuzu: { level: 1, exp: 0, maxExp: 100, equipped_weapon: 'r_oak_staff', constellation: 0, shards: 0 },
  kaito: { level: 1, exp: 0, maxExp: 100, equipped_weapon: 'r_short_bow', constellation: 0, shards: 0 },
  shirou: { level: 1, exp: 0, maxExp: 100, equipped_weapon: null, constellation: 0, shards: 0 },
  celeste: { level: 1, exp: 0, maxExp: 100, equipped_weapon: null, constellation: 0, shards: 0 },
  ren: { level: 1, exp: 0, maxExp: 100, equipped_weapon: null, constellation: 0, shards: 0 }
};