/* ==========================================================================
   MAIN APP & CONTROLLER ENGINE (js/main.js)
   - TỰ ĐỘNG KHÔI PHỤC TRẬN ĐẤU (AUTO-RESUME COMBAT KHI F5 HOẶC SẬP SERVER)
   - TÍCH HỢP HỆ DI CHUYỂN TƯỚNG: ĐI BỘ (WALK) VS ĐI BAY (FLY - QUA NƯỚC)
   - HIỂN THỊ ẢNH CHÂN DUNG THẺ NHÂN VẬT NỬA THÂN Ở SẢNH CHÍNH (WUWA STYLE)
   - TÍNH NĂNG ĐẶT BẤT KỲ TƯỚNG NÀO LÀM NHÂN VẬT ĐẠI DIỆN SẢNH CHÍNH (ADJUTANT)
   - TỰ ĐỘNG PHÁT 4 CÂU THOẠI HẢO CẢM RIÊNG BIỆT CỦA TỪNG NHÂN VẬT TỪ DATABASE
   - HỖ TRỢ 2 DẠNG TÊN: TÊN ĐẦY ĐỦ (HỒ SƠ / GACHA) & TÊN NGẮN (COMBAT / MAP)
   - KHÓA CHẶT LOẠI VŨ KHÍ THEO TƯỚNG (VD: KAITO CHỈ DÙNG CUNG, KHÔNG DÙNG THƯƠNG/DAO)
   - TẦM ĐÁNH PHỤ THUỘC VÀO VŨ KHÍ: CẦM CUNG TẦM 2 Ô, CẦM CẬN CHIẾN TẦM 1 Ô
   - TỰ ĐỘNG ẨN THANH MENU TAB (SẢNH, TƯỚNG, GACHA, SỰ KIỆN) KHI VÀO COMBAT
   - CHẾ ĐỘ THÁP VÔ TẬN ROGUELITE: BẢO LƯU LEVEL, EXP & CHỈ SỐ SUỐT LƯỢT LEO THÁP
   - PHÁT NHẠC COMBAT BGM RIÊNG CHO TỪNG MAP HOẶC TỰ ĐỘNG RANDOM
   - HỖ TRỢ HIỂN THỊ ẢNH AVATAR TRỰC TIẾP TRÊN NỀN MÀU NHÂN VẬT
   - KHẮC PHỤC TRIỆT ĐỂ LỖI PHÁT ĐÈ NHẠC & KHÔNG TẮT NHẠC COMBAT KHI RÚT LUI
   - ĐỒNG BỘ TỌA ĐỘ VÀ ĐỘ ZOOM CUT-IN CRITICAL TỪ DATABASE
   - ĐỒNG BỘ 100% BẢN ĐỒ VÀ QUÁI VẬT GIỮA CHỦ PHÒNG VÀ KHÁCH TRONG CO-OP
   - BẢO VỆ NÚT TẠO PHÒNG / VÀO PHÒNG KHÔNG BỊ ĐƠ TRÊN MÁY BẠN BÈ
   ========================================================================== */

let currentUser = null;
let isLoginMode = true;
let HERO_CONSTELLATIONS_DATA = {}; 
let userWeaponsInventory = {}; 
let SKILLS_DATA = {};          
let ALL_UNITS_DATA = {}; 
let ALL_MAPS_DATA = [];

// BIẾN LƯU NHÂN VẬT ĐẠI DIỆN HIỆN TẠI (MẶC ĐỊNH LÀ ARIA HOẶC LẤY TỪ BỘ NHỚ LƯU)
let currentAdjutantId = localStorage.getItem('game_adjutant_id') || 'aria';

// BIẾN GHI NHẬN NGUỒN MỞ MODAL XUẤT TRẬN ('campaign_stage', 'endless', 'lobby_team')
let prepModalSource = null;

// BỘ NHỚ LƯU TIẾN TRÌNH CẤP ĐỘ & CHỈ SỐ SUỐT LƯỢT LEO THÁP VÔ TẬN
let endlessHeroRunData = {};
window.endlessHeroRunData = endlessHeroRunData;

// BẢN SAO TIẾN TRÌNH TƯỚNG TRƯỚC TRẬN ĐÁNH CHIẾN DỊCH (HỦY NẾU RÚT LUI HOẶC THUA)
let campaignHeroBackupProgress = null;
window.campaignHeroBackupProgress = campaignHeroBackupProgress;

const BUFF_LABELS = {
  stat_hp: '🟢 + Max HP', stat_str: '⚔️ + Str', stat_mag: '🔮 + Mag',
  stat_def: '🛡️ + Def', stat_res: '💠 + Res', stat_dex: '🎯 + Dex',
  stat_spd: '⚡ + Spd', stat_mov: '👟 + MP', crit_rate: '💥 +% Crit',
  weakness_dmg: '🎯 +% Weakness', first_strike_crit: '👑 Đòn Đầu 100% Crit',
  life_steal: '🩸 +% Life Steal', dmg_reduction: '🛡️ -% Giảm Dame'
};

const RARITY_STARS = {
  SSR: '★★★★★',
  SR: '★★★★',
  R: '★★★'
};

const AFFINITY_LABELS = {
  Physical: '⚔️ Physical',
  Magic: '🔮 Magic',
  Pierce: '🎯 Pierce'
};

const AFFINITY_COLORS = {
  Physical: 'var(--teal)',
  Magic: 'var(--rose)',
  Pierce: 'var(--gold)'
};

if (sessionStorage.getItem('game_entered') === 'true') {
  const landingInit = document.getElementById('landingScreen');
  if (landingInit) {
    landingInit.classList.add('fade-out');
    landingInit.style.display = 'none';
  }
}

// 1. TỰ ĐỘNG NẠP TƯỚNG & QUÁI VẬT TỪ DATABASE (ĐỒNG BỘ KIỂU DI CHUYỂN MOVE_TYPE)
async function loadUnitsFromDatabase() {
  try {
    const res = await fetch('api.php?action=get_units');
    const d = await res.json();
    if (d.success && Array.isArray(d.data)) {
      ALL_UNITS_DATA = {};
      d.data.forEach(u => {
        const allowedWpList = u.allowed_weapons 
          ? u.allowed_weapons.split(',').map(s => s.trim()) 
          : (HERO_TEMPLATES[u.id]?.allowed_weapons || ['Kiếm']);

        const shortNameVal = (u.short_name && u.short_name.trim() !== '') ? u.short_name.trim() : u.name;

        const unitObj = {
          id: u.id, 
          name: u.name,
          short_name: shortNameVal,
          cls: u.cls, symbol: u.symbol, team: u.team,
          allowed_weapons: allowedWpList,
          rarity: u.rarity || 'SSR',
          is_boss: parseInt(u.is_boss) || 0, color: u.color || 'var(--teal)',
          mov: parseInt(u.mov) || 4,
          move_type: u.move_type || 'walk',
          range: parseInt(u.range) || 1,
          type: u.type || 'Physical', weakness: u.weakness || 'Magic',
          hp: parseInt(u.hp) || 30, maxhp: parseInt(u.maxhp) || 30,
          str: parseInt(u.str) || 10, mag: parseInt(u.mag) || 10,
          dex: parseInt(u.dex) || 10, spd: parseInt(u.spd) || 10,
          def: parseInt(u.def) || 5, res: parseInt(u.res) || 5, lck: parseInt(u.lck) || 10,
          base_hp: parseInt(u.hp) || 30, base_maxhp: parseInt(u.maxhp) || 30,
          base_str: parseInt(u.str) || 10, base_mag: parseInt(u.mag) || 10,
          base_dex: parseInt(u.dex) || 10, base_spd: parseInt(u.spd) || 10,
          base_def: parseInt(u.def) || 5, base_res: parseInt(u.res) || 5, base_lck: parseInt(u.lck) || 10,
          avatar: u.avatar || '',
          profile_img: u.profile_img || '',
          cutin_img: u.cutin_img || '',
          cutin_audio: u.cutin_audio || '', cutin_volume: parseInt(u.cutin_volume) || 100,
          cutin_pos_x: u.cutin_pos_x !== undefined ? parseInt(u.cutin_pos_x) : 50,
          cutin_pos_y: u.cutin_pos_y !== undefined ? parseInt(u.cutin_pos_y) : 30,
          cutin_scale: u.cutin_scale !== undefined ? parseInt(u.cutin_scale) : 120,
          skill_cutin_img: u.skill_cutin_img || '',
          skill_cutin_audio: u.skill_cutin_audio || '',
          skill_cutin_volume: parseInt(u.skill_cutin_volume) || 100,
          critQuote: u.crit_quote || u.bio || "Hãy đón nhận nhát đòn này!",
          dialogue_lv1: u.dialogue_lv1 || '',
          dialogue_lv2: u.dialogue_lv2 || '',
          dialogue_lv3: u.dialogue_lv3 || '',
          dialogue_lv4: u.dialogue_lv4 || ''
        };

        ALL_UNITS_DATA[u.id] = unitObj;

        if (u.team === 'player') {
          HERO_TEMPLATES[u.id] = unitObj;
          if (!heroProgress[u.id]) {
            heroProgress[u.id] = { 
              level: 1, exp: 0, maxExp: 100, 
              equipped_weapon: null, constellation: 0, shards: 0,
              bonus_stats: { hp: 0, str: 0, mag: 0, dex: 0, spd: 0, def: 0, res: 0, lck: 0, history: {} }
            };
          }
        }
      });
    }
  } catch (err) { console.warn(err); }
}

// NẠP VŨ KHÍ TỪ MYSQL
async function loadWeaponsFromDatabase() {
  try {
    const res = await fetch('api.php?action=get_weapons');
    const d = await res.json();
    if (d.success && Array.isArray(d.data)) {
      d.data.forEach(w => {
        const wpType = w.type || 'Kiếm';
        const defaultRange = (wpType === 'Cung') ? 2 : 1;
        WEAPON_DATA[w.id] = {
          id: w.id, name: w.name, type: wpType,
          range: parseInt(w.range) || defaultRange,
          rarity: w.rarity || 'R', affinity: w.affinity || 'Physical',
          icon: w.icon || '⚔️', image: w.image || '',
          hp: parseInt(w.hp) || 0, str: parseInt(w.str) || 0, mag: parseInt(w.mag) || 0,
          dex: parseInt(w.dex) || 0, spd: parseInt(w.spd) || 0, def: parseInt(w.def) || 0,
          res: parseInt(w.res) || 0, lck: parseInt(w.lck) || 0, mov: parseInt(w.mov) || 0,
          desc: w.description || ''
        };
      });
    }
  } catch (e) { console.warn(e); }
}

// NẠP CUNG MỆNH
async function loadConstellationsData() {
  try {
    const res = await fetch('api.php?action=get_all_constellations');
    const d = await res.json();
    if (d.success && Array.isArray(d.data)) {
      HERO_CONSTELLATIONS_DATA = {};
      d.data.forEach(c => {
        const hid = c.hero_id, r = parseInt(c.rank);
        if (!HERO_CONSTELLATIONS_DATA[hid]) HERO_CONSTELLATIONS_DATA[hid] = {};
        HERO_CONSTELLATIONS_DATA[hid][r] = {
          name: c.name, desc: c.description,
          buff_type: c.buff_type || 'stat_hp', buff_val: parseInt(c.buff_val) || 0
        };
      });
    }
  } catch (e) { console.warn(e); }
}

// NẠP KỸ NĂNG
async function loadSkillsFromDatabase() {
  try {
    const res = await fetch('api.php?action=get_skills');
    const d = await res.json();
    if (d.success && Array.isArray(d.data)) {
      SKILLS_DATA = {};
      d.data.forEach(s => {
        if (!SKILLS_DATA[s.hero_id]) SKILLS_DATA[s.hero_id] = [];
        SKILLS_DATA[s.hero_id].push({
          id: s.id, hero_id: s.hero_id, name: s.name, icon: s.icon || '🔮',
          scope: s.scope || 'map', skill_type: s.skill_type || 'damage',
          target_shape: s.target_shape || 'single', range_min: parseInt(s.range_min) || 1,
          range_max: parseInt(s.range_max) || 3, power: parseInt(s.power) || 150,
          max_uses: parseInt(s.max_uses) || 2, buff_stat: s.buff_stat || '',
          buff_val: parseInt(s.buff_val) || 0, buff_turns: parseInt(s.buff_turns) || 0,
          desc: s.description || ''
        });
      });
    }
  } catch (err) { console.warn(err); }
}

// TẢI TẤT CẢ MAP
async function loadAllMapsFromDatabase() {
  try {
    const res = await fetch('api.php?action=get_maps');
    const d = await res.json();
    if (d.success && Array.isArray(d.data)) {
      ALL_MAPS_DATA = d.data;
    }
  } catch (e) { console.warn(e); }
}

// TẢI MAP TỪ DATABASE
async function loadMapData(mapId = 'map_campaign_1', skipSpawn = false) {
  try {
    let m = ALL_MAPS_DATA.find(x => x.id === mapId);
    if (!m) {
      const res = await fetch(`api.php?action=get_map&id=${mapId}`);
      const d = await res.json();
      if (d.success && d.data) m = d.data;
    }

    if (m) {
      currentMapData = m;
      COLS = parseInt(m.cols) || 10;
      ROWS = parseInt(m.rows) || 7;

      const mapContainer = document.getElementById('map');
      if (mapContainer) {
        mapContainer.style.width = (COLS * TILE) + 'px';
        mapContainer.style.height = (ROWS * TILE) + 'px';
      }

      TERRAIN = JSON.parse(m.terrain || '[]');
      PLAYER_SPAWN_SLOTS = JSON.parse(m.player_spawns || '[]');

      // Chỉ nạp quái mặc định nếu không phải chế độ Co-op (Co-op do Host đồng bộ riêng)
      if (!NetworkManager || !NetworkManager.isCoopActive) {
        const rawEnemySpawns = JSON.parse(m.enemy_spawns || '[]');
        enemyUnits = [];
        rawEnemySpawns.forEach((sp, idx) => {
          const baseFoe = ALL_UNITS_DATA[sp.id] || HERO_TEMPLATES[sp.id];
          if (baseFoe) {
            const foe = JSON.parse(JSON.stringify(baseFoe));
            foe.baseId = sp.id;
            foe.id = `${sp.id}_map_${sp.col}_${sp.row}_${idx + 1}`;
            foe.short_name = baseFoe.short_name || baseFoe.name;
            foe.col = sp.col; foe.row = sp.row;
            foe.team = 'enemy'; foe.acted = false;
            foe.is_boss = (baseFoe.is_boss == 1 ? 1 : 0);
            foe.move_type = baseFoe.move_type || 'walk';
            enemyUnits.push(foe);
          }
        });
      }

      if (!skipSpawn) {
        spawnDeployedUnits();
        renderMap();
      }
      
      if (!isEndlessMode && !skipSpawn) {
        log(`🗺️ [CHIẾN DỊCH] Đã tải bản đồ [${m.name}] (${COLS}x${ROWS}) thành công!`, 'weak');
      }
    }
  } catch (e) { console.warn(e); }
}

// TÍNH BUFF CUNG MỆNH
function getHeroActiveBuffs(heroId) {
  const prog = heroProgress[heroId];
  const activeBuffs = {
    stat_hp: 0, stat_str: 0, stat_mag: 0, stat_def: 0, stat_res: 0, stat_dex: 0, stat_spd: 0, stat_mov: 0,
    crit_rate: 0, weakness_dmg: 0, first_strike_crit: 0, life_steal: 0, dmg_reduction: 0
  };
  if (!prog || !prog.constellation) return activeBuffs;

  const maxRank = prog.constellation;
  const heroConsts = HERO_CONSTELLATIONS_DATA[heroId] || {};

  for (let r = 1; r <= maxRank; r++) {
    const c = heroConsts[r];
    if (c && c.buff_type && activeBuffs[c.buff_type] !== undefined) {
      activeBuffs[c.buff_type] += (c.buff_val || 0);
    }
  }
  return activeBuffs;
}
window.getHeroActiveBuffs = getHeroActiveBuffs;

// KHỞI TẠO QUÂN XUẤT TRẬN
function spawnDeployedUnits() {
  const oldUnits = units || [];
  units = [];

  deployedHeroIds.forEach((id, idx) => {
    const tpl = HERO_TEMPLATES[id];
    if (tpl) {
      const slot = PLAYER_SPAWN_SLOTS[idx] || { col: 0, row: idx + 3 };
      const u = JSON.parse(JSON.stringify(tpl));
      u.short_name = tpl.short_name || tpl.name;
      u.col = slot.col; u.row = slot.row;
      u.moved = false; u.acted = false; u.bonusUsed = false;
      u.move_type = tpl.move_type || 'walk';

      if (isEndlessMode && oldUnits && oldUnits.length > 0) {
        const prev = oldUnits.find(x => x.id === id);
        if (prev && prev.hp !== undefined) {
          if (!endlessHeroRunData[id]) {
            endlessHeroRunData[id] = {
              level: prev.level || 1,
              exp: prev.exp || 0,
              currentHp: prev.hp,
              statGains: { hp: 0, str: 0, mag: 0, dex: 0, spd: 0, def: 0, res: 0, lck: 0 }
            };
          } else {
            endlessHeroRunData[id].currentHp = prev.hp;
            if (prev.level && prev.level > (endlessHeroRunData[id].level || 1)) {
              endlessHeroRunData[id].level = prev.level;
              endlessHeroRunData[id].exp = prev.exp || 0;
            }
          }
        }
      }

      if (isEndlessMode && endlessHeroRunData[id]) {
        const run = endlessHeroRunData[id];
        u.level = run.level || 1;
        u.exp = run.exp || 0;

        Object.entries(run.statGains || {}).forEach(([st, val]) => {
          if (st === 'hp') {
            u.maxhp += val;
            u.hp += val;
          } else {
            u[st] = (u[st] || 0) + val;
          }
        });

        if (run.currentHp !== null && run.currentHp !== undefined) {
          u.hp = Math.max(1, Math.min(u.maxhp, run.currentHp));
        }
      } else if (isEndlessMode) {
        u.level = 1;
        u.exp = 0;
      }

      const prog = heroProgress[id];
      if (prog && prog.equipped_weapon && WEAPON_DATA[prog.equipped_weapon]) {
        const wp = WEAPON_DATA[prog.equipped_weapon];
        u.maxhp += (wp.hp || 0); u.hp += (wp.hp || 0);
        u.str += (wp.str || 0); u.mag += (wp.mag || 0);
        u.dex += (wp.dex || 0); u.spd += (wp.spd || 0);
        u.def += (wp.def || 0); u.res += (wp.res || 0);
        u.lck += (wp.lck || 0); u.mov += (wp.mov || 0);
        u.range = wp.range || (wp.type === 'Cung' ? 2 : 1);
      } else {
        u.range = tpl.range || 1;
      }

      const cBuffs = getHeroActiveBuffs(id);
      u.maxhp += cBuffs.stat_hp; u.hp += cBuffs.stat_hp;
      u.str += cBuffs.stat_str; u.mag += cBuffs.stat_mag;
      u.dex += cBuffs.stat_dex; u.spd += cBuffs.stat_spd;
      u.def += cBuffs.stat_def; u.res += cBuffs.stat_res;
      u.mov += cBuffs.stat_mov;

      if (isEndlessMode && typeof endlessActiveBuffs !== 'undefined') {
        if (endlessActiveBuffs.atk_pct > 0) {
          u.str = Math.round(u.str * (1 + endlessActiveBuffs.atk_pct / 100));
          u.mag = Math.round(u.mag * (1 + endlessActiveBuffs.atk_pct / 100));
        }
        if (endlessActiveBuffs.def_pct > 0) {
          u.def = Math.round(u.def * (1 + endlessActiveBuffs.def_pct / 100));
          u.res = Math.round(u.def * (1 + endlessActiveBuffs.def_pct / 100));
        }
        if (endlessActiveBuffs.mov > 0) {
          u.mov += endlessActiveBuffs.mov;
        }
      }

      const oldUnit = oldUnits.find(x => x.id === id);
      u.skills = (SKILLS_DATA[id] || []).map(sk => {
        const prevSkill = oldUnit?.skills?.find(x => x.id === sk.id);
        return {
          ...sk,
          current_uses: prevSkill !== undefined ? prevSkill.current_uses : sk.max_uses
        };
      });

      units.push(u);
    }
  });

  enemyUnits.forEach(en => {
    units.push({ ...JSON.parse(JSON.stringify(en)), acted: false });
  });
}
window.spawnDeployedUnits = spawnDeployedUnits;

// ==========================================================================
// 8. ĐIỀU KHIỂN CHẾ ĐỘ THÁP VÔ TẬN (ENDLESS ROGUELIKE CONTROLLER)
// ==========================================================================

function startEndlessFromLobby() {
  if (typeof clearCombatState === 'function') clearCombatState();
  prepModalSource = 'endless';
  isEndlessMode = true;
  endlessCurrentFloor = 1;
  selectedEndlessBuffCard = null;
  endlessActiveBuffs = {
    atk_pct: 0, def_pct: 0, crit_rate: 0, mov: 0, life_steal: 0, dmg_reduction: 0
  };

  endlessHeroRunData = {};
  deployedHeroIds.forEach(id => {
    endlessHeroRunData[id] = {
      level: 1,
      exp: 0,
      currentHp: null,
      statGains: { hp: 0, str: 0, mag: 0, dex: 0, spd: 0, def: 0, res: 0, lck: 0 }
    };
  });
  window.endlessHeroRunData = endlessHeroRunData;

  switchMainTab('tacticsTab');

  const banner = document.getElementById('endlessFloorBanner');
  if (banner) banner.style.display = 'flex';

  updateEndlessFloorUI();
  loadEndlessFloor(1);
  openPrepModal('endless');

  log(`🏰 [THÁP VÔ TẬN] Khởi hành leo tháp! Toàn đội bắt đầu ở Cấp 1, giữ nguyên Cung Mệnh & Vũ Khí!`, 'weak');
}
window.startEndlessFromLobby = startEndlessFromLobby;

function updateEndlessFloorUI() {
  const titleEl = document.getElementById('endlessFloorTitle');
  const subEl = document.getElementById('endlessFloorSubtitle');
  const bestEl = document.getElementById('endlessBestFloorDisplay');

  const isBossFloor = (endlessCurrentFloor % 5 === 0);
  const isMajorBoss = (endlessCurrentFloor % 10 === 0);

  if (titleEl) {
    if (isMajorBoss) {
      titleEl.innerHTML = `🏰 THÁP VÔ TẬN — TẦNG ${endlessCurrentFloor} <span style="color:var(--danger); font-weight:900;">[👑 ĐẠI BOSS]</span>`;
    } else if (isBossFloor) {
      titleEl.innerHTML = `🏰 THÁP VÔ TẬN — TẦNG ${endlessCurrentFloor} <span style="color:var(--gold); font-weight:800;">[💀 TIỂU BOSS]</span>`;
    } else {
      titleEl.textContent = `🏰 THÁP VÔ TẬN — TẦNG ${endlessCurrentFloor}`;
    }
  }

  if (subEl) {
    if (isMajorBoss) subEl.textContent = `Trảm sát Đại Boss để nhận Thần Phước + Đá Quý & 🎟️ Vé Tẩy Cấp!`;
    else if (isBossFloor) subEl.textContent = `Tiêu diệt Tiểu Boss để rút 3 Thần Phước cường hóa toàn đội!`;
    else subEl.textContent = `Tầng quái thường · Diệt hết để tiến lên tầng kế tiếp`;
  }

  if (bestEl) bestEl.textContent = `${endlessBestFloor} Tầng`;
}
window.updateEndlessFloorUI = updateEndlessFloorUI;

async function loadEndlessFloor(floor) {
  updateEndlessFloorUI();

  let mapId = 'map_endless_arena';
  if (floor % 10 === 0) mapId = 'map_endless_colosseum';
  else if (floor % 5 === 0) mapId = 'map_endless_fortress';
  else if (floor >= 6) mapId = 'map_endless_forest';

  await loadMapData(mapId, true);

  // NẾU LÀ CO-OP: CHỈ CHỦ PHÒNG MỚI ĐƯỢC TẠO QUÁI VÀ ĐỒNG BỘ
  if (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive) {
    if (NetworkManager.isHost) {
      setupEndlessEnemiesForFloor(floor);
      spawnDeployedUnits();
      renderMap();
      NetworkManager.send({
        type: 'COOP_DEPLOY_MATCH',
        floor: floor,
        mapId: mapId,
        deployedHeroIds: deployedHeroIds,
        enemyUnits: enemyUnits,
        coopSquad: NetworkManager.coopSquad
      });
    }
  } else {
    setupEndlessEnemiesForFloor(floor);
    spawnDeployedUnits();
    renderMap();
  }
}
window.loadEndlessFloor = loadEndlessFloor;

function setupEndlessEnemiesForFloor(floor) {
  const statScale = 1 + (floor - 1) * 0.08;
  const isBossFloor = (floor % 5 === 0);
  const isMajorBoss = (floor % 10 === 0);

  const allEnemies = Object.values(ALL_UNITS_DATA).filter(u => u.team === 'enemy');

  let minionPool = allEnemies.filter(u => u.is_boss != 1).map(u => u.id);
  if (minionPool.length === 0) {
    minionPool = ['goblin_scout', 'frost_witch', 'iron_golem', 'shadow_assassin', 'shade_archer', 'wraith'];
  }

  let bossPool = [];
  if (isMajorBoss) {
    bossPool = (floor >= 20) ? ['demon_lord', 'abyssal_dragon'] : ['abyssal_dragon', 'demon_lord'];
  } else if (isBossFloor) {
    bossPool = (floor >= 15) ? ['blood_vampire', 'dullahan'] : ['dullahan', 'blood_vampire', 'shade'];
  } else {
    bossPool = ['dullahan', 'blood_vampire', 'shade', 'abyssal_dragon', 'demon_lord'];
  }

  const newEnemies = [];

  let rawSpawns = [];
  if (currentMapData && currentMapData.enemy_spawns) {
    try {
      rawSpawns = JSON.parse(currentMapData.enemy_spawns || '[]');
    } catch (e) {
      rawSpawns = [];
    }
  }

  if (rawSpawns.length > 0) {
    rawSpawns.forEach((sp, idx) => {
      const originalUnit = ALL_UNITS_DATA[sp.id] || HERO_TEMPLATES[sp.id];
      const isBossSlot = (originalUnit && originalUnit.is_boss == 1);

      let chosenId = '';
      if (isBossSlot) {
        chosenId = bossPool[Math.floor(Math.random() * bossPool.length)] || sp.id;
      } else {
        chosenId = minionPool[Math.floor(Math.random() * minionPool.length)] || sp.id;
      }

      newEnemies.push(createScaledEnemy(chosenId, statScale, sp.col, sp.row, idx + 1));
    });
  } else {
    const count = Math.min(4, 2 + Math.floor(floor / 3));
    for (let i = 0; i < count; i++) {
      const rCol = COLS - 2;
      const rRow = 1 + i;
      const chosenId = minionPool[Math.floor(Math.random() * minionPool.length)];
      newEnemies.push(createScaledEnemy(chosenId, statScale, rCol, rRow, i + 1));
    }
  }

  enemyUnits = newEnemies;
  spawnDeployedUnits();
}

function createScaledEnemy(unitId, scale, col, row, uniqueIndex = 1) {
  const base = ALL_UNITS_DATA[unitId] || HERO_TEMPLATES[unitId];
  if (!base) return { id: `${unitId}_${col}_${row}_${uniqueIndex}`, name: 'Quái Vật', short_name: 'Quái', col, row, hp: 20, maxhp: 20, team: 'enemy', is_boss: 0, move_type: 'walk' };

  const scaled = JSON.parse(JSON.stringify(base));
  scaled.baseId = unitId;
  scaled.id = `${unitId}_${col}_${row}_${uniqueIndex}`;
  scaled.short_name = base.short_name || base.name;
  
  scaled.col = col;
  scaled.row = row;
  scaled.team = 'enemy';
  scaled.acted = false;
  scaled.is_boss = (base.is_boss == 1 ? 1 : 0);
  scaled.move_type = base.move_type || 'walk';
  scaled.maxhp = Math.round(scaled.maxhp * scale);
  scaled.hp = scaled.maxhp;
  scaled.str = Math.round(scaled.str * (1 + (scale - 1) * 0.7));
  scaled.mag = Math.round(scaled.mag * (1 + (scale - 1) * 0.7));
  scaled.def = Math.round(scaled.def * (1 + (scale - 1) * 0.5));
  scaled.res = Math.round(scaled.res * (1 + (scale - 1) * 0.5));
  return scaled;
}

function openEndlessBuffModal(awardGems, awardTickets) {
  const modal = document.getElementById('endlessBuffModal');
  const titleEl = document.getElementById('endlessBossTitle');
  const rewardEl = document.getElementById('endlessRewardText');
  const grid = document.getElementById('endlessCardsGrid');
  const btnConfirm = document.getElementById('btnConfirmBuffChoice');

  const isMajor = (endlessCurrentFloor % 10 === 0);
  if (titleEl) {
    titleEl.textContent = isMajor ? `HẠ GỤC ĐẠI BOSS TẦNG ${endlessCurrentFloor}!` : `HẠ GỤC TIỂU BOSS TẦNG ${endlessCurrentFloor}!`;
  }

  if (rewardEl) {
    if (awardTickets > 0) {
      rewardEl.innerHTML = `🎁 Nhận Thưởng: <strong style="color:var(--gold);">+${awardGems.toLocaleString()} 💎</strong> & <strong style="color:var(--teal);">+${awardTickets} 🎟️ Vé Tẩy Cấp</strong>!`;
    } else {
      rewardEl.innerHTML = `🎁 Nhận Thưởng: <strong style="color:var(--gold);">+${awardGems.toLocaleString()} 💎 Đá Quý</strong>!`;
    }
  }

  const shuffled = [...ENDLESS_BUFF_CARDS_POOL].sort(() => Math.random() - 0.5);
  const pickedThree = shuffled.slice(0, 3);

  grid.innerHTML = '';
  selectedEndlessBuffCard = null;
  if (btnConfirm) btnConfirm.disabled = true;

  pickedThree.forEach(card => {
    const cardEl = document.createElement('div');
    cardEl.className = 'endless-buff-card';
    cardEl.innerHTML = `
      <div class="endless-buff-icon">${card.icon}</div>
      <div style="font-size:11px; font-weight:800; color:var(--gold);">${card.type}</div>
      <div class="endless-buff-title">${card.name}</div>
      <div class="endless-buff-desc">${card.desc}</div>
    `;

    cardEl.onclick = () => {
      document.querySelectorAll('.endless-buff-card').forEach(c => c.classList.remove('selected'));
      cardEl.classList.add('selected');
      selectedEndlessBuffCard = card;
      if (btnConfirm) btnConfirm.disabled = false;
    };

    grid.appendChild(cardEl);
  });

  modal.classList.add('active');
}
window.openEndlessBuffModal = openEndlessBuffModal;

function confirmEndlessBuffChoice() {
  if (!selectedEndlessBuffCard) return;

  selectedEndlessBuffCard.apply();
  log(`🃏 [THẦN PHƯỚC] Đã kích hoạt [${selectedEndlessBuffCard.name}] cho toàn đội!`, 'weak');

  // ĐỒNG BỘ BUFF CHO CẢ PHÒNG CO-OP
  if (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive) {
    NetworkManager.send({ type: 'SYNC_BUFF_CHOICE', buffId: selectedEndlessBuffCard.id });
  }

  document.getElementById('endlessBuffModal').classList.remove('active');

  endlessCurrentFloor++;
  loadEndlessFloor(endlessCurrentFloor);

  log(`🏰 [THÁP VÔ TẬN] Tiến vào Tầng ${endlessCurrentFloor}!`, 'weak');
}
window.confirmEndlessBuffChoice = confirmEndlessBuffChoice;

async function quitEndlessRun() {
  if (!confirm(`Bạn có chắc chắn muốn RÚT LUI khỏi Tháp Vô Tận?\nLượt leo tháp hiện tại sẽ kết thúc và lưu lại kỷ lục Tầng ${endlessCurrentFloor - 1}!`)) return;

  if (typeof clearCombatState === 'function') clearCombatState();

  const reachedFloor = Math.max(0, endlessCurrentFloor - 1);
  if (currentUser) {
    try {
      const fd = new FormData();
      fd.append('floor', reachedFloor);
      const res = await fetch('api.php?action=endless_save_record', { method: 'POST', body: fd });
      const d = await res.json();
      if (d.success) endlessBestFloor = d.best_floor;
    } catch (e) {}
  }

  isEndlessMode = false;
  endlessHeroRunData = {};
  window.endlessHeroRunData = endlessHeroRunData;

  document.getElementById('endlessFloorBanner').style.display = 'none';

  alert(`🏆 Bạn đã hoàn thành lượt leo tháp! Thành tích: Tầng ${reachedFloor}.`);
  switchMainTab('homeTab');
  loadMapData('map_campaign_1');
}
window.quitEndlessRun = quitEndlessRun;

function adminJumpEndlessFloor() {
  const input = prompt("🏰 Nhập số tầng bạn muốn nhảy đến ngay lập tức (VD: 5 để test Tiểu Boss, 10 để test Đại Boss):", "5");
  if (!input) return;
  const target = parseInt(input);
  if (isNaN(target) || target < 1) return;

  if (typeof clearCombatState === 'function') clearCombatState();

  isEndlessMode = true;
  endlessCurrentFloor = target;
  
  if (!endlessHeroRunData || Object.keys(endlessHeroRunData).length === 0) {
    endlessHeroRunData = {};
    deployedHeroIds.forEach(id => {
      endlessHeroRunData[id] = {
        level: 1,
        exp: 0,
        currentHp: null,
        statGains: { hp: 0, str: 0, mag: 0, dex: 0, spd: 0, def: 0, res: 0, lck: 0 }
      };
    });
    window.endlessHeroRunData = endlessHeroRunData;
  }

  switchMainTab('tacticsTab');

  const banner = document.getElementById('endlessFloorBanner');
  if (banner) banner.style.display = 'flex';

  loadEndlessFloor(target);
  alert(`⚡ [ADMIN] Đã nhảy thẳng đến Tháp Vô Tận Tầng ${target}!`);
}
window.adminJumpEndlessFloor = adminJumpEndlessFloor;

// ==========================================================================
// ĐIỀU KHIỂN CHIẾN DỊCH, CHỌN MÀN CHƠI & RÚT LUI KHỎI BẢN ĐỒ
// ==========================================================================

function startCampaignFromLobby() {
  const modal = document.getElementById('campaignStageModal');
  if (modal) {
    modal.classList.add('active');
  } else {
    isEndlessMode = false;
    document.getElementById('endlessFloorBanner').style.display = 'none';
    switchMainTab('tacticsTab');
    loadMapData('map_campaign_1');
    openPrepModal('campaign_stage');
  }
}
window.startCampaignFromLobby = startCampaignFromLobby;

function closeCampaignStageModal() {
  document.getElementById('campaignStageModal')?.classList.remove('active');
}
window.closeCampaignStageModal = closeCampaignStageModal;

function selectCampaignStage(mapId, stageLabel) {
  closeCampaignStageModal();
  if (typeof clearCombatState === 'function') clearCombatState();

  prepModalSource = 'campaign_stage';
  isEndlessMode = false;
  
  const banner = document.getElementById('endlessFloorBanner');
  if (banner) banner.style.display = 'none';

  const endBanner = document.getElementById('endBanner');
  if (endBanner) {
    endBanner.style.display = 'none';
    endBanner.className = 'end-banner';
    endBanner.innerHTML = '';
  }

  mapOver = false;
  mapPhase = 'player';
  selectedMapId = null;
  menuUnitId = null;
  menuStage = null;
  menuTargets = [];
  activeMapSkill = null;

  campaignHeroBackupProgress = JSON.parse(JSON.stringify(heroProgress));
  window.campaignHeroBackupProgress = campaignHeroBackupProgress;

  switchMainTab('tacticsTab');
  loadMapData(mapId || 'map_campaign_1');
  openPrepModal('campaign_stage');
  log(`⚔️ [CHIẾN DỊCH] Chuẩn bị tiến nhập [${stageLabel || 'Ải 1-1'}]!`, 'weak');
}
window.selectCampaignStage = selectCampaignStage;

function finishCampaignAndReturnToLobby() {
  if (typeof clearCombatState === 'function') clearCombatState();
  const endBanner = document.getElementById('endBanner');
  if (endBanner) {
    endBanner.style.display = 'none';
    endBanner.className = 'end-banner';
    endBanner.innerHTML = '';
  }
  mapOver = false;
  selectedMapId = null;
  menuUnitId = null;
  menuStage = null;
  menuTargets = [];
  activeMapSkill = null;
  isEndlessMode = false;

  const endlessBanner = document.getElementById('endlessFloorBanner');
  if (endlessBanner) endlessBanner.style.display = 'none';

  if (typeof SoundManager !== 'undefined') SoundManager.stopAllBGM();
  switchMainTab('homeTab');
}
window.finishCampaignAndReturnToLobby = finishCampaignAndReturnToLobby;

function surrenderCampaignBattle() {
  if (confirm("⚠️ CẢNH BÁO: Rút lui ngay bây giờ bạn sẽ bị xử thua và toàn bộ EXP/Level cày được trong trận này sẽ BỊ HỦY BỎ!\nBạn có chắc chắn muốn rút lui về sảnh chính?")) {
    if (typeof clearCombatState === 'function') clearCombatState();

    if (campaignHeroBackupProgress) {
      heroProgress = JSON.parse(JSON.stringify(campaignHeroBackupProgress));
      campaignHeroBackupProgress = null;
      window.campaignHeroBackupProgress = null;
    }

    const endBanner = document.getElementById('endBanner');
    if (endBanner) {
      endBanner.style.display = 'none';
      endBanner.className = 'end-banner';
      endBanner.innerHTML = '';
    }
    mapOver = false;
    selectedMapId = null;
    menuUnitId = null;
    menuStage = null;
    menuTargets = [];
    activeMapSkill = null;

    log("🏳️ [RÚT LUI] Bạn đã đầu hàng và rời bỏ chiến trường. Không có tài nguyên nào được lưu.", "dmg");
    if (typeof SoundManager !== 'undefined') SoundManager.stopAllBGM();
    switchMainTab('homeTab');
  }
}
window.surrenderCampaignBattle = surrenderCampaignBattle;

// ==========================================================================
// CÁC HÀM TAB, MODAL, AUTH, WEAPON, RE-LEVEL
// ==========================================================================

function switchMainTab(tabId, evt) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(tabId)?.classList.add('active');
  sessionStorage.setItem('last_active_tab', tabId);

  const navTabs = document.getElementById('mainNavTabs') || document.querySelector('.nav-tabs');
  if (tabId === 'tacticsTab') {
    if (navTabs) navTabs.style.display = 'none';
    const isPrepOpen = document.getElementById('prepModal')?.classList.contains('active');
    if (!isPrepOpen && typeof SoundManager !== 'undefined') {
      SoundManager.playBattleBGM(currentMapData?.bgm || 'random');
    }
  } else {
    if (navTabs) navTabs.style.display = 'flex';
  }

  if (tabId === 'homeTab') {
    document.getElementById('tabBtnHome')?.classList.add('active');
    if (typeof SoundManager !== 'undefined') SoundManager.playLobbyBGM();
    updateAdjutantLobbyUI();
  } else if (tabId === 'tacticsTab') {
    // Đã xử lý ở trên
  } else if (tabId === 'gachaTab') {
    document.getElementById('tabBtnGacha')?.classList.add('active');
    if (typeof SoundManager !== 'undefined') SoundManager.playGachaBGM();
  } else if (tabId === 'eventTab') {
    document.getElementById('tabBtnEvents')?.classList.add('active');
    fetchCheckinStatus();
  } else if (tabId === 'charTab') {
    document.getElementById('tabBtnChar')?.classList.add('active');
    if (typeof SoundManager !== 'undefined') SoundManager.playCharBGM();
    renderCharManagement();
  }
}

function handleStartGame() {
  if (currentUser) enterGameWorld();
  else openAuthModal();
}

function enterGameWorld() {
  sessionStorage.setItem('game_entered', 'true');
  const landing = document.getElementById('landingScreen');
  if (landing) {
    landing.classList.add('fade-out');
    setTimeout(() => { landing.style.display = 'none'; }, 600);
  }
  const savedTab = sessionStorage.getItem('last_active_tab') || 'homeTab';
  switchMainTab(savedTab);
}

function openPrepModal(source = null) {
  if (source) prepModalSource = source;
  renderPrepRoster();
  document.getElementById('prepModal').classList.add('active');
  if (typeof SoundManager !== 'undefined') {
    SoundManager.playPrepBGM();
  }
}
window.openPrepModal = openPrepModal;

function closePrepModal() {
  document.getElementById('prepModal').classList.remove('active');

  if (prepModalSource === 'campaign_stage' || prepModalSource === 'endless') {
    if (typeof clearCombatState === 'function') clearCombatState();

    if (isEndlessMode) {
      isEndlessMode = false;
      const banner = document.getElementById('endlessFloorBanner');
      if (banner) banner.style.display = 'none';
      endlessHeroRunData = {};
      window.endlessHeroRunData = endlessHeroRunData;
    }

    if (campaignHeroBackupProgress) {
      heroProgress = JSON.parse(JSON.stringify(campaignHeroBackupProgress));
      campaignHeroBackupProgress = null;
      window.campaignHeroBackupProgress = null;
    }

    mapOver = false;
    selectedMapId = null;
    menuUnitId = null;
    menuStage = null;
    menuTargets = [];
    activeMapSkill = null;

    log("↩ [HỦY BỎ] Đã hủy xuất trận và quay trở về Sảnh Chính.");
    if (typeof SoundManager !== 'undefined') SoundManager.stopAllBGM();
    switchMainTab('homeTab');
  }

  prepModalSource = null;
}
window.closePrepModal = closePrepModal;

// ==========================================================================
// RENDER ĐỘI HÌNH CO-OP: HUY HIỆU P1, P2, P3, P4 & NÚT SẴN SÀNG
// ==========================================================================

function renderPrepRoster() {
  const grid = document.getElementById('prepRosterGrid');
  const countEl = document.getElementById('prepDeployCount');
  const actionsContainer = document.querySelector('.prep-actions');
  if (!grid) return;
  grid.innerHTML = '';

  const isCoop = (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive);

  if (isCoop) {
    const totalPicked = Object.keys(NetworkManager.coopSquad).length;
    const myLimit = NetworkManager.getMyMaxPickCount();
    const myPicked = NetworkManager.getMyCurrentPickCount();
    countEl.innerHTML = `Đội hình: <strong style="color:var(--teal)">${totalPicked}/4</strong> (Bạn đã chọn: <strong style="color:var(--gold)">${myPicked}/${myLimit}</strong>)`;

    ownedHeroes.forEach(id => {
      const tpl = HERO_TEMPLATES[id]; if (!tpl) return;
      const pickedEntry = NetworkManager.coopSquad[id];
      const isChosenByMe = pickedEntry && pickedEntry.playerId === NetworkManager.myPlayerId;
      const isChosenByOther = pickedEntry && pickedEntry.playerId !== NetworkManager.myPlayerId;

      let statusBadgeHtml = '';
      if (isChosenByMe) {
        statusBadgeHtml = `<span class="prep-status-pill deployed" style="background:var(--teal); color:#12111b; font-weight:800;">👑 BẠN ĐÃ CHỌN (P${NetworkManager.mySlotIndex + 1})</span>`;
      } else if (isChosenByOther) {
        statusBadgeHtml = `<span class="prep-status-pill deployed" style="background:var(--rose); color:#fff; font-weight:800;">👤 P${pickedEntry.slotIndex + 1}: ${pickedEntry.playerName}</span>`;
      } else {
        statusBadgeHtml = `<span class="prep-status-pill bench">⏸️ DỰ BỊ</span>`;
      }

      const prepAvatarHtml = (tpl.avatar && tpl.avatar.trim() !== '')
        ? `<img src="${tpl.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block;">`
        : tpl.symbol;

      const card = document.createElement('div');
      card.className = `prep-card ${pickedEntry ? 'deployed' : 'bench'}`;
      if (isChosenByOther) card.style.opacity = '0.6';

      card.innerHTML = `
        ${statusBadgeHtml}
        <div class="prep-card-head">
          <div class="prep-badge" style="background:${tpl.color}; overflow:hidden;">${prepAvatarHtml}</div>
          <div>
            <div class="prep-name">${tpl.name}</div>
            <div class="prep-class">${tpl.cls} · ${tpl.type}</div>
          </div>
        </div>
        <div class="prep-stats">
          <div><span>HP Tối Đa:</span><strong>${tpl.maxhp}</strong></div>
          <div><span>${tpl.type === 'Magic' ? 'Mag' : 'Str'}:</span><strong>${tpl.type === 'Magic' ? tpl.mag : tpl.str}</strong></div>
          <div><span>Def / Res:</span><strong>${tpl.def} / ${tpl.res}</strong></div>
          <div><span>Dex / Spd:</span><strong>${tpl.dex} / ${tpl.spd}</strong></div>
        </div>
      `;

      card.addEventListener('click', () => toggleDeployHero(id));
      grid.appendChild(card);
    });

    if (actionsContainer) {
      if (NetworkManager.isHost) {
        const guests = NetworkManager.players.filter(p => !p.isHost);
        const allGuestsReady = guests.length > 0 && guests.every(g => NetworkManager.playerReadyStatus[g.id] === true);
        const isSquadFull = totalPicked === 4;

        actionsContainer.innerHTML = `
          <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
            <div style="font-size:12px; color:var(--gold); font-weight:700;">
              ${allGuestsReady ? '✨ Tất cả đồng đội đã SẴN SÀNG!' : '⏳ Đang chờ đồng đội bấm "SẴN SÀNG"...'}
            </div>
            <div style="display:flex; gap:12px;">
              <button class="btn-play-game" style="font-size:15px; padding:12px 36px;" onclick="confirmDeployment()" ${(!allGuestsReady || !isSquadFull) ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                ⚔️ XUẤT TRẬN (CHỦ PHÒNG) ⚔️
              </button>
              <button class="action-btn" onclick="closePrepModal()" style="padding:10px 20px;">Đóng</button>
            </div>
          </div>
        `;
      } else {
        const amIReady = NetworkManager.playerReadyStatus[NetworkManager.myPlayerId] === true;
        const myQuotaMet = myPicked === myLimit;

        actionsContainer.innerHTML = `
          <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
            <div style="display:flex; gap:12px;">
              <button class="btn-play-game" style="font-size:15px; padding:12px 36px; background:${amIReady ? 'var(--rose)' : 'linear-gradient(135deg, var(--teal), #2bbfa9)'};" onclick="toggleCoopReadyState()" ${(!myQuotaMet && !amIReady) ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                ${amIReady ? '❌ HỦY SẴN SÀNG' : '✅ SẴN SÀNG XUẤT TRẬN'}
              </button>
              <button class="action-btn" onclick="closePrepModal()" style="padding:10px 20px;">Đóng</button>
            </div>
          </div>
        `;
      }
    }
    return;
  }

  // Chế độ Solo bình thường
  countEl.textContent = deployedHeroIds.length;
  ownedHeroes.forEach(id => {
    const tpl = HERO_TEMPLATES[id]; if (!tpl) return;
    const isDeployed = deployedHeroIds.includes(id);

    const prepAvatarHtml = (tpl.avatar && tpl.avatar.trim() !== '')
      ? `<img src="${tpl.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block;">`
      : tpl.symbol;

    const card = document.createElement('div');
    card.className = `prep-card ${isDeployed ? 'deployed' : 'bench'}`;
    card.innerHTML = `
      <span class="prep-status-pill ${isDeployed ? 'deployed' : 'bench'}">
        ${isDeployed ? '✅ XUẤT TRẬN' : '⏸️ DỰ BỊ'}
      </span>
      <div class="prep-card-head">
        <div class="prep-badge" style="background:${tpl.color}; overflow:hidden;">${prepAvatarHtml}</div>
        <div>
          <div class="prep-name">${tpl.name}</div>
          <div class="prep-class">${tpl.cls} · ${tpl.type}</div>
        </div>
      </div>
      <div class="prep-stats">
        <div><span>HP Tối Đa:</span><strong>${tpl.maxhp}</strong></div>
        <div><span>${tpl.type === 'Magic' ? 'Mag' : 'Str'}:</span><strong>${tpl.type === 'Magic' ? tpl.mag : tpl.str}</strong></div>
        <div><span>Def / Res:</span><strong>${tpl.def} / ${tpl.res}</strong></div>
        <div><span>Dex / Spd:</span><strong>${tpl.dex} / ${tpl.spd}</strong></div>
      </div>
    `;
    card.addEventListener('click', () => toggleDeployHero(id));
    grid.appendChild(card);
  });
}

function toggleDeployHero(id) {
  if (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive) {
    const isReady = NetworkManager.playerReadyStatus[NetworkManager.myPlayerId] === true;
    if (isReady && !NetworkManager.isHost) {
      alert("⚠️ Bạn đang ở trạng thái 'SẴN SÀNG'! Vui lòng hủy sẵn sàng nếu muốn chọn lại tướng.");
      return;
    }

    const currentEntry = NetworkManager.coopSquad[id];
    if (currentEntry) {
      if (currentEntry.playerId !== NetworkManager.myPlayerId) {
        alert(`⚠️ Tướng này đã được chọn bởi ${currentEntry.playerName} (P${currentEntry.slotIndex + 1})!`);
        return;
      }
      if (NetworkManager.isHost) {
        delete NetworkManager.coopSquad[id];
        NetworkManager.broadcastSquadState();
        renderPrepRoster();
      } else {
        NetworkManager.send({
          type: 'COOP_PREP_UNPICK',
          heroId: id,
          playerId: NetworkManager.myPlayerId
        });
      }
    } else {
      const myLimit = NetworkManager.getMyMaxPickCount();
      const myPicked = NetworkManager.getMyCurrentPickCount();
      if (myPicked >= myLimit) {
        alert(`⚠️ Bạn chỉ được chọn tối đa ${myLimit} nhân vật!`);
        return;
      }

      const tpl = HERO_TEMPLATES[id];
      const pickData = {
        heroId: id,
        playerId: NetworkManager.myPlayerId,
        playerName: NetworkManager.myPlayerName,
        slotIndex: NetworkManager.mySlotIndex,
        heroData: tpl
      };

      if (NetworkManager.isHost) {
        NetworkManager.coopSquad[id] = pickData;
        NetworkManager.broadcastSquadState();
        renderPrepRoster();
      } else {
        NetworkManager.send({
          type: 'COOP_PREP_PICK',
          ...pickData
        });
      }
    }
    return;
  }

  const idx = deployedHeroIds.indexOf(id);
  if (idx !== -1) {
    if (deployedHeroIds.length <= 1) { alert("⚠️ Cần tối thiểu 1 nhân vật xuất trận!"); return; }
    deployedHeroIds.splice(idx, 1);
  } else {
    if (deployedHeroIds.length >= 4) { alert("⚠️ Đội hình tối đa 4 nhân vật!"); return; }
    deployedHeroIds.push(id);
  }
  renderPrepRoster();
}

function toggleCoopReadyState() {
  const current = NetworkManager.playerReadyStatus[NetworkManager.myPlayerId] === true;
  NetworkManager.send({
    type: 'COOP_GUEST_READY',
    playerId: NetworkManager.myPlayerId,
    isReady: !current
  });
  NetworkManager.playerReadyStatus[NetworkManager.myPlayerId] = !current;
  renderPrepRoster();
}
window.toggleCoopReadyState = toggleCoopReadyState;

// ==========================================================================
// ĐIỀU KHIỂN XUẤT TRẬN CO-OP: CHỦ PHÒNG TẢI MAP -> TẠO QUÁI -> ĐỒNG BỘ 100%
// ==========================================================================

function hostLaunchCoopEndless() {
  if (typeof NetworkManager !== 'undefined' && !NetworkManager.isHost) return;
  if (typeof NetworkManager !== 'undefined') {
    NetworkManager.isCoopActive = true;
    NetworkManager.coopSquad = {};
    NetworkManager.playerReadyStatus = { [NetworkManager.myPlayerId]: true };
    
    // Báo cho toàn bộ khách mở bảng Chọn Tướng
    NetworkManager.send({ type: 'COOP_OPEN_PREP' });
  }
  closeCoopModal();
  coopOpenPrepScreen();
}
window.hostLaunchCoopEndless = hostLaunchCoopEndless;

function coopOpenPrepScreen() {
  if (typeof clearCombatState === 'function') clearCombatState();
  prepModalSource = 'endless';
  isEndlessMode = true;
  endlessCurrentFloor = 1;
  selectedEndlessBuffCard = null;
  endlessActiveBuffs = { atk_pct: 0, def_pct: 0, crit_rate: 0, mov: 0, life_steal: 0, dmg_reduction: 0 };
  endlessHeroRunData = {};

  switchMainTab('tacticsTab');

  const banner = document.getElementById('endlessFloorBanner');
  if (banner) banner.style.display = 'flex';
  updateEndlessFloorUI();

  // Mở bảng chọn tướng cho cả 2 máy cùng lúc
  openPrepModal('endless');
}
window.coopOpenPrepScreen = coopOpenPrepScreen;

async function confirmDeployment() {
  if (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive) {
    if (!NetworkManager.isHost) return;

    const finalSquadIds = Object.keys(NetworkManager.coopSquad);
    if (finalSquadIds.length === 0) {
      alert("⚠️ Chưa chọn đủ tướng xuất trận!");
      return;
    }
    deployedHeroIds = finalSquadIds;

    // 1. CHỦ PHÒNG TẢI MAP ĐẤU TRƯỜNG THÁP VÔ TẬN (8x6)
    const mapId = 'map_endless_arena';
    await loadMapData(mapId, true);

    // 2. CHỦ PHÒNG TẠO QUÁI VẬT TẦNG 1
    setupEndlessEnemiesForFloor(1);

    // 3. Khởi tạo hero run data
    deployedHeroIds.forEach(id => {
      endlessHeroRunData[id] = {
        level: 1, exp: 0, currentHp: null,
        statGains: { hp: 0, str: 0, mag: 0, dex: 0, spd: 0, def: 0, res: 0, lck: 0 }
      };
    });

    // 4. Vẽ bàn cờ trên máy Chủ phòng
    document.getElementById('prepModal').classList.remove('active');
    spawnDeployedUnits();
    renderMap();

    // 5. GỬI TOÀN BỘ MAP_ID, QUÁI VẬT VÀ ĐỘI HÌNH SANG MÁY KHÁCH
    NetworkManager.send({
      type: 'COOP_DEPLOY_MATCH',
      floor: 1,
      mapId: mapId,
      deployedHeroIds: deployedHeroIds,
      enemyUnits: enemyUnits,
      coopSquad: NetworkManager.coopSquad
    });

    if (typeof SoundManager !== 'undefined') {
      SoundManager.playBattleBGM(currentMapData?.bgm || 'random');
    }
    log(`⚔️ [CO-OP XUẤT TRẬN] Toàn đội xuất kích: ${deployedHeroIds.map(id => HERO_TEMPLATES[id]?.name || id).join(', ')}!`, 'weak');
    return;
  }

  // Chế độ Solo
  prepModalSource = null;
  document.getElementById('prepModal').classList.remove('active');
  spawnDeployedUnits();
  renderMap();
  if (typeof SoundManager !== 'undefined') {
    SoundManager.playBattleBGM(currentMapData?.bgm || 'random');
  }
}
window.confirmDeployment = confirmDeployment;

async function syncStartCoopMatchFromHost(packet) {
  deployedHeroIds = packet.deployedHeroIds;
  NetworkManager.coopSquad = packet.coopSquad;
  endlessCurrentFloor = packet.floor;

  endlessHeroRunData = {};
  deployedHeroIds.forEach(id => {
    endlessHeroRunData[id] = {
      level: 1, exp: 0, currentHp: null,
      statGains: { hp: 0, str: 0, mag: 0, dex: 0, spd: 0, def: 0, res: 0, lck: 0 }
    };
  });

  // 1. KHÁCH TẢI ĐÚNG BẢN ĐỒ TỪ CHỦ PHÒNG GỬI SANG
  await loadMapData(packet.mapId || 'map_endless_arena', true);

  // 2. GÁN 100% QUÁI VẬT TỪ CHỦ PHÒNG (KHÔNG ĐỂ BỊ GHI ĐÈ)
  enemyUnits = packet.enemyUnits;

  // 3. Đóng modal và vẽ bàn cờ
  document.getElementById('prepModal')?.classList.remove('active');
  spawnDeployedUnits();
  renderMap();

  if (typeof SoundManager !== 'undefined') {
    SoundManager.playBattleBGM(currentMapData?.bgm || 'random');
  }
  log(`⚔️ [CO-OP XUẤT TRẬN] Chủ phòng đã ra lệnh xuất kích toàn đội!`, 'weak');
}
window.syncStartCoopMatchFromHost = syncStartCoopMatchFromHost;

// TÀI KHOẢN
function openAuthModal() {
  if (currentUser) { if (confirm("Bạn có muốn đăng xuất không?")) logout(); return; }
  document.getElementById('authModal').classList.add('active');
}
function closeAuthModal() { document.getElementById('authModal').classList.remove('active'); }
function switchAuthMode() {
  isLoginMode = !isLoginMode;
  document.getElementById('authModalTitle').textContent = isLoginMode ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ';
  document.getElementById('authSubmitBtn').textContent = isLoginMode ? 'Đăng Nhập' : 'Tạo Tài Khoản';
}

async function submitAuth() {
  const u = document.getElementById('authUsername').value.trim();
  const p = document.getElementById('authPassword').value.trim();
  if (!u || !p) return;
  const act = isLoginMode ? 'login' : 'register';
  const fd = new FormData(); fd.append('username', u); fd.append('password', p);
  try {
    const res = await fetch(`api.php?action=${act}`, { method: 'POST', body: fd });
    const data = await res.json();
    if (data.success) {
      closeAuthModal();
      await applyUserData(data.user);
      enterGameWorld();
    } else alert(data.error);
  } catch (e) { alert("Lỗi kết nối!"); }
}

async function logout() {
  if (typeof clearCombatState === 'function') clearCombatState();
  sessionStorage.removeItem('game_entered');
  sessionStorage.removeItem('last_active_tab');
  await fetch('api.php?action=logout');
  location.reload();
}

async function applyUserData(user) {
  currentUser = user; playerGems = user.gems; pityCounter = user.pity;
  endlessBestFloor = parseInt(user.endless_max_floor) || 0;

  document.getElementById('userGems').textContent = playerGems.toLocaleString();
  document.getElementById('pityCount').textContent = pityCounter;

  const bestEl = document.getElementById('endlessBestFloorDisplay');
  if (bestEl) bestEl.textContent = `${endlessBestFloor} Tầng`;

  const nameDisp = document.getElementById('userNameDisplay');
  const btnAuth = document.getElementById('authActionBtn');
  const cheatBar = document.getElementById('adminCheatBar');

  if (user.role === 'admin') {
    nameDisp.innerHTML = `👑 <strong>${user.username} (Admin)</strong>`;
    cheatBar.style.display = 'flex';
  } else {
    nameDisp.innerHTML = `👤 <strong>${user.username}</strong>`;
    cheatBar.style.display = 'none';
  }
  btnAuth.textContent = 'Đăng xuất';

  const landingStatus = document.getElementById('landingUserStatus');
  if (landingStatus) {
    landingStatus.innerHTML = `Đã đăng nhập: <strong style="color:var(--gold);">${user.username}</strong>${user.role === 'admin' ? ' 👑 (Admin)' : ''}`;
  }

  try {
    const res = await fetch('api.php?action=get_inventory');
    const inv = await res.json();
    userWeaponsInventory = {};
    if (inv.success && Array.isArray(inv.data)) {
      inv.data.forEach(item => {
        if (HERO_TEMPLATES[item.item_id] && !ownedHeroes.includes(item.item_id)) ownedHeroes.push(item.item_id);
        if (WEAPON_DATA[item.item_id]) userWeaponsInventory[item.item_id] = parseInt(item.amount) || 1;
      });
    }
  } catch (e) { console.warn(e); }

  bannerClaimed = (user.banner_claimed == 1);
  bannerResetTime = parseInt(user.banner_reset_time) || 0;
  updateGachaBannerUI();
  startBannerCountdown();

  try {
    const resRom = await fetch('api.php?action=get_romance');
    const romData = await resRom.json();
    if (romData.success && Array.isArray(romData.data)) {
      romData.data.forEach(r => { userRomance[r.hero_id] = parseInt(r.points) || 0; });
    }
    const resSup = await fetch('api.php?action=get_supports');
    const supData = await resSup.json();
    if (supData.success && Array.isArray(supData.data)) {
      supData.data.forEach(s => { supportBonds[getPairKey(s.char_a, s.char_b)] = parseInt(s.points) || 0; });
    }
  } catch (e) { console.warn(e); }
  updateAdjutantLobbyUI();

  try {
    const resProg = await fetch('api.php?action=get_hero_progress');
    const progData = await resProg.json();
    if (progData.success && Array.isArray(progData.data)) {
      progData.data.forEach(p => {
        let bStats = { hp: 0, str: 0, mag: 0, dex: 0, spd: 0, def: 0, res: 0, lck: 0, history: {} };
        try { if (p.bonus_stats) bStats = JSON.parse(p.bonus_stats); } catch (err) {}

        heroProgress[p.hero_id] = {
          level: parseInt(p.level) || 1, exp: parseInt(p.exp) || 0, maxExp: 100,
          equipped_weapon: p.equipped_weapon || null, constellation: parseInt(p.constellation) || 0,
          shards: parseInt(p.constellation_shards) || 0, bonus_stats: bStats
        };

        if (p.equipped_weapon && (!userWeaponsInventory[p.equipped_weapon] || userWeaponsInventory[p.equipped_weapon] < 1)) {
          userWeaponsInventory[p.equipped_weapon] = 1;
        }

        const tpl = HERO_TEMPLATES[p.hero_id];
        if (tpl) {
          tpl.maxhp = (tpl.base_maxhp || tpl.maxhp) + (bStats.hp || 0);
          tpl.hp = tpl.maxhp;
          tpl.str = (tpl.base_str || tpl.str) + (bStats.str || 0);
          tpl.mag = (tpl.base_mag || tpl.mag) + (bStats.mag || 0);
          tpl.dex = (tpl.base_dex || tpl.dex) + (bStats.dex || 0);
          tpl.spd = (tpl.base_spd || tpl.spd) + (bStats.spd || 0);
          tpl.def = (tpl.base_def || tpl.def) + (bStats.def || 0);
          tpl.res = (tpl.base_res || tpl.res) + (bStats.res || 0);
          tpl.lck = (tpl.base_lck || tpl.lck) + (bStats.lck || 0);
        }
      });
    }
  } catch (e) { console.warn(e); }

  spawnDeployedUnits();
  renderMap();
}

async function checkLogin() {
  const landingStatus = document.getElementById('landingUserStatus');
  try {
    const res = await fetch('api.php?action=get_me');
    const data = await res.json();
    if (data.success && data.logged_in) {
      await applyUserData(data.user);
      if (sessionStorage.getItem('game_entered') === 'true') {
        const landing = document.getElementById('landingScreen');
        if (landing) { landing.classList.add('fade-out'); landing.style.display = 'none'; }
        
        if (typeof hasSavedCombat !== 'function' || !hasSavedCombat()) {
          switchMainTab(sessionStorage.getItem('last_active_tab') || 'homeTab');
        }
      }
    } else {
      if (landingStatus) {
        landingStatus.innerHTML = `<span style="color:var(--text-3);">Chưa đăng nhập — Bấm nút để bắt đầu</span>`;
      }
    }
  } catch (e) { 
    console.warn(e);
    if (landingStatus) {
      landingStatus.innerHTML = `<span style="color:var(--text-3);">Chưa đăng nhập — Bấm nút để bắt đầu</span>`;
    }
  }
}

// ==========================================================================
// QUẢN LÝ NHÂN VẬT ĐẠI DIỆN SẢNH (ADJUTANT CONTROLLER)
// ==========================================================================
function setHeroAsAdjutant(heroId) {
  if (!ownedHeroes.includes(heroId)) {
    alert("⚠️ Bạn chưa sở hữu nhân vật này!");
    return;
  }
  currentAdjutantId = heroId;
  localStorage.setItem('game_adjutant_id', heroId);

  updateAdjutantLobbyUI();
  renderCharManagement();

  const hero = HERO_TEMPLATES[heroId];
  alert(`🎉 Đã đặt [${hero?.name || heroId}] làm Nhân Vật Đại Diện ở Sảnh Chính!`);
}
window.setHeroAsAdjutant = setHeroAsAdjutant;

function updateAdjutantLobbyUI() {
  const hero = HERO_TEMPLATES[currentAdjutantId] || HERO_TEMPLATES['aria'];
  if (!hero) return;

  const pts = userRomance[hero.id] || 0;
  const info = getRomanceLevelInfo(pts);

  let customDialogue = "";
  if (info.level === 4 && hero.dialogue_lv4 && hero.dialogue_lv4.trim() !== '') customDialogue = hero.dialogue_lv4;
  else if (info.level === 3 && hero.dialogue_lv3 && hero.dialogue_lv3.trim() !== '') customDialogue = hero.dialogue_lv3;
  else if (info.level === 2 && hero.dialogue_lv2 && hero.dialogue_lv2.trim() !== '') customDialogue = hero.dialogue_lv2;
  else if (hero.dialogue_lv1 && hero.dialogue_lv1.trim() !== '') customDialogue = hero.dialogue_lv1;
  else customDialogue = info.dialogue;

  const dialogueEl = document.getElementById('adjutantDialogue');
  const nameEl = document.getElementById('adjutantName');
  const rankEl = document.getElementById('adjutantRomanceRank');
  const ptsEl = document.getElementById('adjutantRomancePts');
  const fillEl = document.getElementById('adjutantRomanceFill');
  const badgeEl = document.getElementById('adjutantBadge');
  const pImgEl = document.getElementById('adjutantPortraitImg');

  if (dialogueEl) dialogueEl.textContent = `"${customDialogue}"`;
  if (nameEl) nameEl.textContent = `${hero.name} — ${hero.cls} (${hero.rarity || 'SSR'})`;
  if (rankEl) { rankEl.textContent = `Cấp ${info.level} — [${info.title}]`; rankEl.style.color = info.color; }
  if (ptsEl) ptsEl.textContent = `${pts} Pts`;
  if (fillEl) fillEl.style.width = Math.min(100, Math.round((pts / 150) * 100)) + '%';

  const heroImgSrc = hero.profile_img || hero.avatar || '';
  if (heroImgSrc && heroImgSrc.trim() !== '' && pImgEl) {
    pImgEl.src = heroImgSrc;
    pImgEl.style.display = 'block';
    if (badgeEl) badgeEl.style.display = 'none';
  } else {
    if (pImgEl) pImgEl.style.display = 'none';
    if (badgeEl) {
      badgeEl.style.display = 'flex';
      badgeEl.style.overflow = 'hidden';
      if (hero.avatar && hero.avatar.trim() !== '') {
        badgeEl.innerHTML = `<img src="${hero.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block;">`;
      } else {
        badgeEl.textContent = hero.symbol || '剣';
      }
      badgeEl.style.background = hero.color || 'var(--teal)';
    }
  }
}

function openSupportModal() { renderSupportList(); document.getElementById('supportModal').classList.add('active'); }
function closeSupportModal() { document.getElementById('supportModal').classList.remove('active'); }

function renderSupportList() {
  const container = document.getElementById('supportListGrid'); container.innerHTML = '';
  const pairs = [];
  for (let i = 0; i < ownedHeroes.length; i++) {
    for (let j = i + 1; j < ownedHeroes.length; j++) pairs.push([ownedHeroes[i], ownedHeroes[j]]);
  }

  pairs.forEach(([idA, idB]) => {
    const tplA = HERO_TEMPLATES[idA], tplB = HERO_TEMPLATES[idB]; if (!tplA || !tplB) return;
    const pts = supportBonds[getPairKey(idA, idB)] || 0;
    const rankInfo = getSupportRankInfo(pts);

    const item = document.createElement('div');
    item.style.cssText = 'background:var(--panel-2); border:1px solid var(--line); border-radius:12px; padding:12px 16px; display:flex; align-items:center; justify-content:space-between;';
    item.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px;">
        <div style="width:34px; height:34px; border-radius:50%; background:${tplA.color}; color:#12111b; display:flex; align-items:center; justify-content:center; font-weight:800; overflow:hidden;">
          ${(tplA.avatar && tplA.avatar.trim() !== '') ? `<img src="${tplA.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block;">` : tplA.symbol}
        </div>
        <span style="font-weight:700;">${tplA.name}</span><span style="color:var(--rose);">💖</span><span style="font-weight:700;">${tplB.name}</span>
        <div style="width:34px; height:34px; border-radius:50%; background:${tplB.color}; color:#12111b; display:flex; align-items:center; justify-content:center; font-weight:800; overflow:hidden;">
          ${(tplB.avatar && tplB.avatar.trim() !== '') ? `<img src="${tplB.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block;">` : tplB.symbol}
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-weight:800; color:${rankInfo.color};">${rankInfo.title}</div>
        <div style="font-size:11px; color:var(--text-3);">${pts} Pts</div>
      </div>
    `;
    container.appendChild(item);
  });
}

const CHECKIN_REWARDS = [
  { day: 1, gems: 200, icon: '💎' }, { day: 2, gems: 300, icon: '💎' },
  { day: 3, gems: 400, icon: '💎' }, { day: 4, gems: 500, icon: '💎' },
  { day: 5, gems: 600, icon: '💎' }, { day: 6, gems: 800, icon: '💎' },
  { day: 7, gems: 1200, icon: '👑' }
];

async function fetchCheckinStatus() {
  const grid = document.getElementById('checkinDaysGrid');
  const btn = document.getElementById('btnClaimDaily'); if (!grid) return;
  try {
    const res = await fetch('api.php?action=get_checkin_status');
    const data = await res.json(); if (!data.success) return;
    const streak = data.streak || 0, claimedToday = data.claimed_today;
    grid.innerHTML = '';
    CHECKIN_REWARDS.forEach(r => {
      const card = document.createElement('div');
      let statusCls = r.day <= streak ? 'claimed' : (r.day === streak + 1 && !claimedToday ? 'ready' : '');
      card.className = `checkin-day-card ${statusCls}`;
      card.innerHTML = `<div class="day-title">NGÀY ${r.day}</div><div class="day-icon">${r.icon}</div><div class="day-reward">+${r.gems.toLocaleString()} 💎</div>`;
      grid.appendChild(card);
    });
    if (btn) {
      btn.disabled = claimedToday;
      btn.textContent = claimedToday ? '✅ ĐÃ ĐIỂM DANH HÔM NAY' : `🎁 ĐIỂM DANH HÔM NAY`;
      btn.style.opacity = claimedToday ? '0.5' : '1';
    }
  } catch (e) { console.warn(e); }
}

async function claimDailyCheckin() {
  try {
    const res = await fetch('api.php?action=claim_daily_checkin');
    const data = await res.json();
    if (data.success) {
      playerGems = data.new_gems;
      document.getElementById('userGems').textContent = playerGems.toLocaleString();
      alert(`🎉 Điểm danh thành công Ngày ${data.streak}!`);
      fetchCheckinStatus();
    } else alert(data.error);
  } catch (e) { alert("Lỗi kết nối!"); }
}

async function submitGiftcode() {
  const input = document.getElementById('giftcodeInput');
  const code = input.value.trim().toUpperCase(); if (!code) return;
  const fd = new FormData(); fd.append('code', code);
  try {
    const res = await fetch('api.php?action=redeem_giftcode', { method: 'POST', body: fd });
    const data = await res.json();
    const msgEl = document.getElementById('giftcodeResultMsg');
    msgEl.style.display = 'block';

    if (data.success) {
      playerGems = data.new_gems;
      document.getElementById('userGems').textContent = playerGems.toLocaleString();

      if (data.new_tickets !== undefined) {
        userRelevelTickets = data.new_tickets;
        const tickEl = document.getElementById('relevelTicketCount');
        if (tickEl) tickEl.textContent = userRelevelTickets;
      }

      const rewardsAwarded = [];
      if (data.award_gems > 0) rewardsAwarded.push(`<strong>+${data.award_gems.toLocaleString()} 💎</strong>`);
      if (data.award_tickets > 0) rewardsAwarded.push(`<strong>+${data.award_tickets.toLocaleString()} 🎟️ Vé Tẩy Cấp</strong>`);
      const rewardText = rewardsAwarded.length > 0 ? rewardsAwarded.join(' & ') : 'Quà tặng';

      input.value = '';
      msgEl.style.color = 'var(--teal)';
      msgEl.innerHTML = `🎉 Nhận thành công: <strong>${data.title}</strong> (${rewardText})!`;
    } else {
      msgEl.style.color = 'var(--danger)'; 
      msgEl.textContent = `❌ ${data.error}`;
    }
  } catch (e) { alert("Lỗi kết nối!"); }
}

// ==========================================================================
// 9. QUẢN LÝ NHÂN VẬT & KHO VŨ KHÍ (HIỂN THỊ KIỂU DI CHUYỂN MOVE_TYPE)
// ==========================================================================
let selectedCharProfileId = 'aria';
let activeCharSubTab = 'attr';

function switchCharSubTab(tab) {
  activeCharSubTab = tab;
  document.querySelectorAll('.char-sub-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.char-sub-content').forEach(c => c.classList.remove('active'));
  document.getElementById(`btnSub${tab.charAt(0).toUpperCase() + tab.slice(1)}`)?.classList.add('active');
  document.getElementById(`subView${tab.charAt(0).toUpperCase() + tab.slice(1)}`)?.classList.add('active');
}

function renderCharManagement() {
  const rosterContainer = document.getElementById('charRosterList'); if (!rosterContainer) return;
  rosterContainer.innerHTML = '';
  ownedHeroes.forEach(id => {
    const tpl = HERO_TEMPLATES[id]; if (!tpl) return;
    const item = document.createElement('div');
    item.className = `char-nav-item ${id === selectedCharProfileId ? 'active' : ''}`;
    
    const rTag = (tpl.rarity === 'SR')
      ? '<span style="color:var(--sr); font-size:10px; font-weight:800; margin-left:4px;">[SR]</span>'
      : '<span style="color:var(--gold); font-size:10px; font-weight:800; margin-left:4px;">[SSR]</span>';

    const moveTag = (tpl.move_type === 'fly')
      ? '<span style="color:#48cae4; font-size:10px; font-weight:800; margin-left:3px;"></span>'
      : '';

    const navAvatar = (tpl.avatar && tpl.avatar.trim() !== '')
      ? `<img src="${tpl.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block;">`
      : tpl.symbol;

    item.innerHTML = `<div class="char-nav-badge" style="background:${tpl.color}; overflow:hidden;">${navAvatar}</div><div><div style="font-weight:700; color:#fff;">${tpl.name} ${rTag}${moveTag}</div><div style="font-size:11px; color:var(--text-3);">${tpl.cls} · ${tpl.type}</div></div>`;
    item.onclick = () => { selectedCharProfileId = id; renderCharManagement(); };
    rosterContainer.appendChild(item);
  });

  const hero = HERO_TEMPLATES[selectedCharProfileId]; if (!hero) return;
  const prog = heroProgress[selectedCharProfileId] || { level: 1, exp: 0, maxExp: 100 };

  const cHeroBadge = document.getElementById('cHeroBadge');
  if (cHeroBadge) {
    cHeroBadge.style.background = hero.color;
    cHeroBadge.style.overflow = 'hidden';
    if (hero.avatar && hero.avatar.trim() !== '') {
      cHeroBadge.innerHTML = `<img src="${hero.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block;">`;
    } else {
      cHeroBadge.textContent = hero.symbol;
    }
  }
  document.getElementById('cHeroName').textContent = hero.name;

  const starText = (hero.rarity === 'SR') ? '⭐⭐⭐⭐ SR' : '⭐⭐⭐⭐⭐ SSR';
  const heroMoveBadge = (hero.move_type === 'fly') ? '<span style="color:#48cae4; font-weight:800; margin-left:6px;"></span>' : '';
  document.getElementById('cHeroType').innerHTML = `<span style="color:${hero.rarity === 'SR' ? 'var(--sr)' : 'var(--gold)'}; font-weight:800; margin-right:6px;">[${starText}]</span> ${hero.cls} · ${hero.type}${heroMoveBadge}`;

  document.getElementById('cHeroLevel').textContent = `Lv. ${prog.level} / 80`;
  document.getElementById('cHeroExpText').textContent = `${prog.exp} / ${prog.maxExp} EXP`;
  document.getElementById('cHeroExpFill').style.width = Math.min(100, (prog.exp / prog.maxExp) * 100) + '%';

  const btnAdjutant = document.getElementById('btnSetAdjutant');
  if (btnAdjutant) {
    const isCurrentAdjutant = (selectedCharProfileId === currentAdjutantId);
    if (isCurrentAdjutant) {
      btnAdjutant.textContent = '✅ Đang Làm Đại Diện';
      btnAdjutant.style.borderColor = 'var(--teal)';
      btnAdjutant.style.color = 'var(--teal)';
      btnAdjutant.disabled = true;
      btnAdjutant.style.opacity = '0.7';
    } else {
      btnAdjutant.textContent = '💖 Đặt Làm Đại Diện';
      btnAdjutant.style.borderColor = 'var(--rose)';
      btnAdjutant.style.color = 'var(--rose)';
      btnAdjutant.disabled = false;
      btnAdjutant.style.opacity = '1';
    }
  }

  const pCard = document.getElementById('cHeroRightCard');
  const pImg = document.getElementById('cHeroPortraitImg');
  const pFallback = document.getElementById('cHeroPortraitFallback');
  const pImgSrc = hero.profile_img || hero.avatar || '';

  if (pImgSrc && pImgSrc.trim() !== '') {
    if (pImg) {
      pImg.src = pImgSrc;
      pImg.style.display = 'block';
    }
    if (pFallback) pFallback.style.display = 'none';
  } else {
    if (pImg) pImg.style.display = 'none';
    if (pFallback) {
      pFallback.style.display = 'flex';
      const fBadge = document.getElementById('cFallbackBadge');
      if (fBadge) {
        fBadge.style.background = hero.color;
        fBadge.style.overflow = 'hidden';
        if (hero.avatar && hero.avatar.trim() !== '') {
          fBadge.innerHTML = `<img src="${hero.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block;">`;
        } else {
          fBadge.textContent = hero.symbol;
        }
      }
    }
  }

  const weap = WEAPON_DATA[prog.equipped_weapon];
  const wHp = weap?.hp || 0, wStr = weap?.str || 0, wMag = weap?.mag || 0, wDef = weap?.def || 0;
  const wRes = weap?.res || 0, wDex = weap?.dex || 0, wSpd = weap?.spd || 0, wLck = weap?.lck || 0, wMov = weap?.mov || 0;
  const cBuffs = getHeroActiveBuffs(selectedCharProfileId);

  const currentHeroRange = weap?.range || (weap?.type === 'Cung' ? 2 : (hero.range || 1));

  const statsEl = document.getElementById('cStatsDetailed');
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="stat-box-row"><span>HP Tối Đa:</span><strong>${hero.maxhp + wHp + cBuffs.stat_hp} ${wHp ? `<span style="color:var(--teal)">(+${wHp})</span>` : ''}</strong></div>
      <div class="stat-box-row"><span>Sức Mạnh (Str):</span><strong>${hero.str + wStr + cBuffs.stat_str} ${wStr ? `<span style="color:var(--teal)">(+${wStr})</span>` : ''}</strong></div>
      <div class="stat-box-row"><span>Ma Lực (Mag):</span><strong>${hero.mag + wMag + cBuffs.stat_mag} ${wMag ? `<span style="color:var(--teal)">(+${wMag})</span>` : ''}</strong></div>
      <div class="stat-box-row"><span>Kỹ Năng (Dex):</span><strong>${hero.dex + wDex + cBuffs.stat_dex} ${wDex ? `<span style="color:var(--teal)">(+${wDex})</span>` : ''}</strong></div>
      <div class="stat-box-row"><span>Tốc Độ (Spd):</span><strong>${hero.spd + wSpd + cBuffs.stat_spd} ${wSpd ? `<span style="color:var(--teal)">(+${wSpd})</span>` : ''}</strong></div>
      <div class="stat-box-row"><span>Phòng Thủ (Def):</span><strong>${hero.def + wDef + cBuffs.stat_def} ${wDef ? `<span style="color:var(--teal)">(+${wDef})</span>` : ''}</strong></div>
      <div class="stat-box-row"><span>Kháng Phép (Res):</span><strong>${hero.res + wRes + cBuffs.stat_res} ${wRes ? `<span style="color:var(--teal)">(+${wRes})</span>` : ''}</strong></div>
      <div class="stat-box-row"><span>May Mắn (Lck):</span><strong>${hero.lck + wLck}</strong></div>
      <div class="stat-box-row"><span>Tầm Di Chuyển:</span><strong>${hero.mov + wMov + cBuffs.stat_mov} MP ${wMov ? `<span style="color:var(--teal)">(+${wMov})</span>` : ''}</strong></div>
      <div class="stat-box-row"><span>Kiểu Di Chuyển:</span><strong style="color:${hero.move_type === 'fly' ? '#48cae4' : '#fff'};">${hero.move_type === 'fly' ? 'Bay' : 'Bình thường'}</strong></div>
      <div class="stat-box-row"><span>Tầm Đánh:</span><strong style="color:var(--gold);">${currentHeroRange > 1 ? '1 - 2 ô (Tầm xa / Cung)' : '1 ô (Cận chiến)'}</strong></div>
    `;
  }

  const curWeapEl = document.getElementById('cCurrentWeaponCard');
  if (curWeapEl) {
    if (weap) {
      const imgHtml = (weap.image && weap.image.trim() !== '') ? `<img src="${weap.image}" style="width:52px; height:52px; object-fit:contain; border-radius:8px; border:2px solid var(--gold);">` : `<div style="font-size:36px;">${weap.icon || '⚔️'}</div>`;
      let rarityColor = weap.rarity === 'SSR' ? 'var(--gold)' : (weap.rarity === 'SR' ? 'var(--sr)' : 'var(--r)');
      const curStars = RARITY_STARS[weap.rarity] || '★★★';
      const affBadge = `<span style="color:${AFFINITY_COLORS[weap.affinity] || 'var(--teal)'}; font-weight:800; font-size:11px; margin-left:6px;">[${AFFINITY_LABELS[weap.affinity] || weap.affinity}]</span>`;
      const rangeBadge = `<span style="color:var(--gold); font-size:10px; font-weight:800; margin-left:6px;">[🎯 Tầm ${weap.range || (weap.type === 'Cung' ? 2 : 1)} ô]</span>`;

      curWeapEl.innerHTML = `${imgHtml}<div style="flex:1;"><div style="font-size:11px; font-weight:800; color:${rarityColor};">${weap.rarity} ${curStars} ${affBadge} ${rangeBadge}</div><h3 style="color:#fff; margin:2px 0;">${weap.name} (${weap.type})</h3><div style="font-size:12px; color:var(--teal);">${weap.desc}</div></div>`;
    } else curWeapEl.innerHTML = `<div style="color:var(--text-3); font-size:13px; padding:10px;">Chưa trang bị vũ khí. Hãy chọn vũ khí tương thích bên dưới!</div>`;
  }

  const availWeapEl = document.getElementById('cAvailableWeapons');
  if (availWeapEl) {
    availWeapEl.innerHTML = '';
    const ownedWeapIds = Object.keys(userWeaponsInventory).filter(id => (userWeaponsInventory[id] || 0) > 0);

    const heroAllowedWeapons = hero.allowed_weapons || (HERO_TEMPLATES[selectedCharProfileId]?.allowed_weapons) || ['Kiếm'];

    ownedWeapIds.forEach(wId => {
      const w = WEAPON_DATA[wId]; if (!w) return;
      const totalOwned = userWeaponsInventory[wId] || 0;
      const equippedHeroes = Object.entries(heroProgress).filter(([hId, p]) => p.equipped_weapon === wId).map(([hId]) => hId);
      const isCurEquip = (prog.equipped_weapon === wId);
      const availableCount = totalOwned - equippedHeroes.filter(hId => hId !== selectedCharProfileId).length;

      const heroSystem = hero.type || 'Physical';
      const weapSystem = w.affinity || 'Physical';
      const isSystemCompatible = (heroSystem === weapSystem);
      const isTypeCompatible = heroAllowedWeapons.includes(w.type);
      const isFullyCompatible = isSystemCompatible && isTypeCompatible;

      let btnHtml = '';
      if (isCurEquip) {
        btnHtml = `<button class="action-btn" style="margin-top:8px; background:var(--teal); color:#12111b; font-weight:800;" disabled>✅ ĐANG DÙNG</button>`;
      } else if (!isSystemCompatible) {
        btnHtml = `<button class="action-btn" style="margin-top:8px; border-color:#555; color:#777; opacity:0.6; cursor:not-allowed;" disabled title="${hero.name} thuộc hệ ${heroSystem}, không thể trang bị vũ khí hệ ${weapSystem}!">🔒 KHÁC HỆ (${weapSystem})</button>`;
      } else if (!isTypeCompatible) {
        btnHtml = `<button class="action-btn" style="margin-top:8px; border-color:var(--danger); color:var(--danger); opacity:0.75; cursor:not-allowed;" disabled title="${hero.name} chỉ dùng được loại: [${heroAllowedWeapons.join(', ')}]!">🔒 KHÁC LOẠI (Chỉ dùng ${heroAllowedWeapons.join(', ')})</button>`;
      } else if (availableCount <= 0) {
        btnHtml = `<button class="action-btn" style="margin-top:8px; border-color:var(--danger); color:var(--danger);" disabled>🔒 ĐÃ GIAO</button>`;
      } else {
        btnHtml = `<button class="action-btn" style="margin-top:8px; border-color:var(--gold); color:var(--gold);" onclick="equipWeaponToHero('${w.id}')">Trang Bị</button>`;
      }

      const imgHtml = (w.image && w.image.trim() !== '') ? `<img src="${w.image}" style="width:38px; height:38px; object-fit:contain; margin:4px auto; display:block;">` : `<div style="font-size:26px;">${w.icon || '⚔️'}</div>`;
      let rColor = w.rarity === 'SSR' ? 'var(--gold)' : (w.rarity === 'SR' ? 'var(--sr)' : 'var(--r)');
      const itemStars = RARITY_STARS[w.rarity] || '★★★';
      const affTag = `<span style="color:${AFFINITY_COLORS[weapSystem] || 'var(--teal)'}; font-size:10px; font-weight:800;">[${AFFINITY_LABELS[weapSystem] || weapSystem}]</span>`;
      const wpRangeTag = (w.range == 2 || w.type === 'Cung')
        ? `<span style="color:var(--gold); font-size:10px; font-weight:800;">🎯 2 ô</span>`
        : `<span style="color:var(--text-3); font-size:10px;">🎯 1 ô</span>`;

      const card = document.createElement('div');
      card.className = 'weap-choice-item';
      card.style.position = 'relative';
      if (!isFullyCompatible) card.style.opacity = '0.5';

      card.innerHTML = `
        <div style="position:absolute; top:8px; right:8px; background:var(--panel); border:1px solid var(--line); border-radius:6px; font-size:10px; font-weight:800; padding:2px 6px; color:var(--teal);">x${totalOwned}</div>
        <div style="font-weight:800; font-size:11px; color:${rColor}; display:flex; justify-content:space-between; align-items:center; padding:0 2px;">
          <span>${w.rarity} ${itemStars}</span>
          ${affTag}
        </div>
        ${imgHtml}
        <div style="font-weight:700; font-size:13px; color:#fff; margin:4px 0;">${w.name} <span style="font-size:11px; color:var(--text-3);">(${w.type})</span></div>
        <div style="font-size:10px; margin-bottom:4px;">${wpRangeTag}</div>
        <div style="font-size:11px; color:var(--text-2);">${w.desc}</div>
        <div style="font-size:10px; color:${availableCount > 0 ? 'var(--text-3)' : 'var(--danger)'}; margin-top:4px;">Khả dụng: <strong>${Math.max(0, availableCount)} / ${totalOwned}</strong></div>
        ${btnHtml}
      `;
      availWeapEl.appendChild(card);
    });
  }
  renderConstellationView();
}

function equipWeaponToHero(weaponId) {
  const hero = HERO_TEMPLATES[selectedCharProfileId];
  const weap = WEAPON_DATA[weaponId];
  if (!hero || !weap) return;

  const heroSystem = hero.type || 'Physical';
  const weapSystem = weap.affinity || 'Physical';
  if (heroSystem !== weapSystem) {
    alert(`❌ [${hero.name}] thuộc hệ ${heroSystem}, không thể trang bị vũ khí hệ ${weapSystem}!\nHãy chọn vũ khí tương thích.`);
    return;
  }

  const heroAllowedWeapons = hero.allowed_weapons || (HERO_TEMPLATES[selectedCharProfileId]?.allowed_weapons) || ['Kiếm'];
  if (!heroAllowedWeapons.includes(weap.type)) {
    alert(`❌ [${hero.name}] chỉ có thể trang bị các loại vũ khí: [${heroAllowedWeapons.join(', ')}]!\nKhông thể sử dụng [${weap.name}] (${weap.type}).`);
    return;
  }

  const totalOwned = userWeaponsInventory[weaponId] || 0;
  const othersEquipping = Object.entries(heroProgress).filter(([hId, p]) => hId !== selectedCharProfileId && p.equipped_weapon === weaponId);
  const availableCount = totalOwned - othersEquipping.length;

  if (availableCount <= 0) {
    alert(`❌ Toàn bộ bản sao của vũ khí này đang được trang bị cho tướng khác!`);
    return;
  }

  if (!heroProgress[selectedCharProfileId]) heroProgress[selectedCharProfileId] = { level: 1, exp: 0, maxExp: 100 };
  heroProgress[selectedCharProfileId].equipped_weapon = weaponId;

  spawnDeployedUnits();
  renderMap();
  renderCharManagement();

  const newRange = weap.range || (weap.type === 'Cung' ? 2 : 1);
  alert(`🎉 Đã trang bị thành công [${weap.name}] cho ${hero.name}!\n🎯 Tầm đánh hiện tại: ${newRange > 1 ? '1 - 2 ô (Tầm xa / Cung)' : '1 ô (Cận chiến)'}.`);

  if (currentUser) {
    const fd = new FormData(); fd.append('hero_id', selectedCharProfileId); fd.append('weapon_id', weaponId);
    fetch('api.php?action=equip_weapon', { method: 'POST', body: fd });
  }
}

function renderConstellationView() {
  const container = document.getElementById('cConstellationList');
  const countEl = document.getElementById('cConstCount'); if (!container) return;
  const hero = HERO_TEMPLATES[selectedCharProfileId];
  const prog = heroProgress[selectedCharProfileId] || { constellation: 0, shards: 0 };
  const currentConst = prog.constellation || 0;

  if (countEl) countEl.innerHTML = `<span style="color:var(--gold); font-weight:800;">Cấp: C${currentConst} / 6 | Tinh Hoa: ${prog.shards || 0} viên</span>`;
  container.innerHTML = '';
  const heroConsts = HERO_CONSTELLATIONS_DATA[selectedCharProfileId] || {};

  for (let r = 1; r <= 6; r++) {
    const c = heroConsts[r] || { name: `Tầng ${r}`, desc: '', buff_type: 'stat_hp', buff_val: 5 };
    const isUnlocked = (r <= currentConst);
    const canUnlock = (r === currentConst + 1 && (prog.shards || 0) > 0);

    const node = document.createElement('div');
    node.className = `const-node ${isUnlocked ? 'unlocked' : (canUnlock ? 'can-unlock' : 'locked')}`;
    let btnHtml = isUnlocked ? `<span style="color:var(--teal); font-weight:800;">🌟 ĐÃ MỞ</span>` : (canUnlock ? `<button class="action-btn" onclick="activateHeroConstellation('${selectedCharProfileId}')" style="background:var(--gold); color:#12111b; font-weight:800;">🔮 MỞ C${r}</button>` : `<span style="color:var(--text-3);">🔒 KHÓA</span>`);

    node.innerHTML = `
      <div class="const-icon">${isUnlocked ? '🌟' : '🔒'}</div>
      <div style="flex:1;"><h4 style="color:${isUnlocked ? 'var(--gold)' : '#fff'}; font-size:14px;">${c.name}</h4><p style="font-size:12px; color:var(--text-2);">${c.desc}</p></div>
      <div>${btnHtml}</div>
    `;
    container.appendChild(node);
  }
}

async function activateHeroConstellation(heroId) {
  const prog = heroProgress[heroId];
  if (!prog || (prog.shards || 0) <= 0) return;
  prog.shards--; prog.constellation = (prog.constellation || 0) + 1;
  spawnDeployedUnits(); renderMap(); renderCharManagement();
  if (currentUser) {
    const fd = new FormData(); fd.append('hero_id', heroId);
    fetch('api.php?action=unlock_constellation', { method: 'POST', body: fd });
  }
}

// ADMIN SHORTCUTS
async function adminAddGems(amt) {
  const fd = new FormData(); fd.append('amount', amt);
  const res = await fetch('api.php?action=admin_add_gems', { method: 'POST', body: fd });
  const d = await res.json();
  if (d.success) { playerGems = d.new_gems; document.getElementById('userGems').textContent = playerGems.toLocaleString(); }
}
async function adminSetPity(p) {
  const fd = new FormData(); fd.append('pity', p);
  const res = await fetch('api.php?action=admin_set_pity', { method: 'POST', body: fd });
  const d = await res.json();
  if (d.success) { pityCounter = d.new_pity; document.getElementById('pityCount').textContent = pityCounter; }
}
async function adminResetCycle() {
  const res = await fetch('api.php?action=admin_reset_cycle');
  const d = await res.json();
  if (d.success) { bannerClaimed = false; bannerResetTime = 0; updateGachaBannerUI(); startBannerCountdown(); alert("Đã reset bảo hiểm!"); }
}
async function adminAddRomance(amt = 30) {
  const targetHeroId = currentAdjutantId || 'aria';
  userRomance[targetHeroId] = (userRomance[targetHeroId] || 0) + amt; 
  updateAdjutantLobbyUI();
  if (currentUser) {
    const fd = new FormData(); 
    fd.append('heroes', JSON.stringify([targetHeroId])); 
    fd.append('points', amt);
    fetch('api.php?action=add_romance_batch', { method: 'POST', body: fd });
  }
}
async function adminAddBreakthroughShard() {
  if (!heroProgress[selectedCharProfileId]) heroProgress[selectedCharProfileId] = { level: 1, exp: 0, shards: 0 };
  heroProgress[selectedCharProfileId].shards = (heroProgress[selectedCharProfileId].shards || 0) + 1;
  renderCharManagement();
  if (currentUser) {
    const fd = new FormData(); fd.append('hero_id', selectedCharProfileId);
    fetch('api.php?action=admin_add_shard', { method: 'POST', body: fd });
  }
}
async function adminAddTickets(amt = 5) {
  const fd = new FormData(); fd.append('amount', amt);
  await fetch('api.php?action=admin_add_tickets', { method: 'POST', body: fd });
  fetchRelevelTickets();
}

// RE-LEVEL
let currentRelevelMode = 1, userRelevelTickets = 0;
async function fetchRelevelTickets() {
  try {
    const res = await fetch('api.php?action=get_relevel_tickets');
    const d = await res.json();
    userRelevelTickets = d.tickets || 0;
    document.getElementById('relevelTicketCount').textContent = userRelevelTickets;
    document.getElementById('relevelGemsDisplay').textContent = playerGems.toLocaleString();
  } catch (e) {}
}
function openRelevelModal() {
  const prog = heroProgress[selectedCharProfileId];
  if (!prog || (prog.level || 1) < 20) { alert("⚠️ Cần đạt Cấp 20 trở lên để Tẩy Cấp!"); return; }
  fetchRelevelTickets();
  document.getElementById('relevelChoiceSection').style.display = 'block';
  document.getElementById('relevelCompareSection').style.display = 'none';
  selectRelevelMode(1);
  document.getElementById('relevelModal').classList.add('active');
}
function closeRelevelModal() { document.getElementById('relevelModal').classList.remove('active'); }
function selectRelevelMode(mode) {
  currentRelevelMode = mode;
  document.getElementById('optRelevel1')?.classList.toggle('active', mode === 1);
  document.getElementById('optRelevel5')?.classList.toggle('active', mode === 5);
}
async function executeRelevelRoll() {
  const costGems = currentRelevelMode === 5 ? 1000 : 200, costTickets = currentRelevelMode === 5 ? 5 : 1;
  if (playerGems < costGems || userRelevelTickets < costTickets) { alert("❌ Không đủ Đá hoặc Vé!"); return; }

  const fd = new FormData(); fd.append('hero_id', selectedCharProfileId); fd.append('mode', currentRelevelMode);
  const res = await fetch('api.php?action=relevel_roll', { method: 'POST', body: fd });
  const d = await res.json();
  if (d.success) {
    playerGems = d.new_gems; userRelevelTickets = d.new_tickets;
    document.getElementById('userGems').textContent = playerGems.toLocaleString();
    document.getElementById('relevelTicketCount').textContent = userRelevelTickets;

    const oldBox = document.getElementById('relevelOldStatsList'), newBox = document.getElementById('relevelNewStatsList');
    oldBox.innerHTML = ''; newBox.innerHTML = '';
    Object.entries(d.old_stats).forEach(([st, val]) => { if (val > 0) oldBox.innerHTML += `<div>+${val} ${st.toUpperCase()}</div>`; });
    Object.entries(d.new_stats).forEach(([st, val]) => { if (val > 0) newBox.innerHTML += `<div>+${val} ${st.toUpperCase()}</div>`; });

    document.getElementById('relevelChoiceSection').style.display = 'none';
    document.getElementById('relevelCompareSection').style.display = 'block';
  } else alert("Lỗi: " + d.error);
}
async function confirmRelevelChoice(choice) {
  const fd = new FormData(); fd.append('choice', choice);
  const res = await fetch('api.php?action=relevel_confirm', { method: 'POST', body: fd });
  const d = await res.json();
  if (d.success) {
    if (d.action === 'replaced') {
      const tpl = HERO_TEMPLATES[selectedCharProfileId], b = d.updated_bonus_stats;
      heroProgress[selectedCharProfileId].bonus_stats = b;
      tpl.maxhp = (tpl.base_maxhp || tpl.maxhp) + (b.hp || 0); tpl.hp = tpl.maxhp;
      tpl.str = (tpl.base_str || tpl.str) + (b.str || 0); tpl.mag = (tpl.base_mag || tpl.mag) + (b.mag || 0);
      tpl.dex = (tpl.base_dex || tpl.dex) + (b.dex || 0); tpl.spd = (tpl.base_spd || tpl.spd) + (b.spd || 0);
      tpl.def = (tpl.base_def || tpl.def) + (b.def || 0); tpl.res = (tpl.base_res || tpl.res) + (b.res || 0);
      tpl.lck = (tpl.base_lck || tpl.lck) + (b.lck || 0);
      spawnDeployedUnits(); renderMap(); renderCharManagement();
    }
    closeRelevelModal();
  }
}

// ==========================================================================
// ĐIỀU KHIỂN PHÒNG CHỜ CO-OP MULTIPLAYER (BỌC TRY-CATCH CHỐNG ĐƠ NÚT)
// ==========================================================================
let selectedCoopNetworkMode = 'webrtc';

function openCoopModal() {
  document.getElementById('coopSetupSection').style.display = 'block';
  document.getElementById('coopLobbySection').style.display = 'none';
  document.getElementById('coopModal').classList.add('active');
}
window.openCoopModal = openCoopModal;

function closeCoopModal() {
  document.getElementById('coopModal').classList.remove('active');
}
window.closeCoopModal = closeCoopModal;

function selectNetworkMode(mode) {
  selectedCoopNetworkMode = mode;
  document.getElementById('btnNetWebRTC').style.borderColor = (mode === 'webrtc') ? 'var(--teal)' : 'var(--line)';
  document.getElementById('btnNetWebRTC').style.color = (mode === 'webrtc') ? 'var(--teal)' : 'var(--text-2)';
  document.getElementById('btnNetWS').style.borderColor = (mode === 'websocket') ? 'var(--teal)' : 'var(--line)';
  document.getElementById('btnNetWS').style.color = (mode === 'websocket') ? 'var(--teal)' : 'var(--text-2)';
}
window.selectNetworkMode = selectNetworkMode;

function startHostRoom() {
  try {
    if (typeof NetworkManager === 'undefined') {
      alert('⚠️ Chưa tải được file js/network.js! Vui lòng F5 tải lại trang.');
      return;
    }
    const ok = NetworkManager.createRoom(selectedCoopNetworkMode);
    if (ok !== false) {
      document.getElementById('coopSetupSection').style.display = 'none';
      document.getElementById('coopLobbySection').style.display = 'block';
    }
  } catch (err) {
    console.error('Lỗi khởi tạo phòng:', err);
    alert('❌ Không thể khởi tạo phòng: ' + err.message);
  }
}
window.startHostRoom = startHostRoom;

function joinGuestRoom() {
  try {
    const code = document.getElementById('coopJoinCodeInput').value.trim();
    if (!code) { alert('Vui lòng nhập mã phòng!'); return; }
    if (typeof NetworkManager === 'undefined') {
      alert('⚠️ Chưa tải được file js/network.js! Vui lòng F5 tải lại trang.');
      return;
    }
    const ok = NetworkManager.joinRoom(selectedCoopNetworkMode, code);
    if (ok !== false) {
      document.getElementById('coopSetupSection').style.display = 'none';
      document.getElementById('coopLobbySection').style.display = 'block';
    }
  } catch (err) {
    console.error('Lỗi tham gia phòng:', err);
    alert('❌ Không thể tham gia phòng: ' + err.message);
  }
}
window.joinGuestRoom = joinGuestRoom;

function leaveCoopRoom() {
  if (typeof NetworkManager !== 'undefined') {
    NetworkManager.reset();
  }
  document.getElementById('coopSetupSection').style.display = 'block';
  document.getElementById('coopLobbySection').style.display = 'none';
}
window.leaveCoopRoom = leaveCoopRoom;

function startCoopGameClient(packet) {
  // Dự phòng tương thích
}
window.startCoopGameClient = startCoopGameClient;

// ==========================================================================
// KHỞI CHẠY HỆ THỐNG
// ==========================================================================
async function initGame() {
  await loadUnitsFromDatabase();
  await loadWeaponsFromDatabase();
  await loadConstellationsData();
  await loadSkillsFromDatabase();
  await loadAllMapsFromDatabase();
  await checkLogin();

  if (typeof hasSavedCombat === 'function' && hasSavedCombat()) {
    try {
      const raw = localStorage.getItem('anime_emblem_combat_save');
      const saveData = JSON.parse(raw);
      const mapIdToLoad = saveData?.mapId || 'map_campaign_1';

      await loadMapData(mapIdToLoad, true);

      const restored = restoreCombatState();
      if (restored) {
        sessionStorage.setItem('game_entered', 'true');
        const landing = document.getElementById('landingScreen');
        if (landing) {
          landing.classList.add('fade-out');
          landing.style.display = 'none';
        }
        switchMainTab('tacticsTab');
        return;
      }
    } catch (err) {
      console.warn("Lỗi khi khôi phục trận đấu tự động:", err);
    }
  }

  await loadMapData('map_campaign_1');
  switchView('map');
}

initGame();