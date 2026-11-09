/* ==========================================================================
   COMBAT & MAP ENGINE (HỆ THỐNG CHIẾN ĐẤU FIRE EMBLEM HOÀN CHỈNH)
   - ĐỒNG BỘ "BỎ LƯỢT" (SYNC_COMBAT_SKIP_TURN): KHÔNG CÒN BỊ LẶP LƯỢT VÔ TẬN
   - TỰ ĐỘNG THOÁT VỀ MAP KHI 2 BÊN ĐÃ HOÀN TẤT 1 VÒNG TRAO ĐỔI CHIÊU THỨC
   - SỬA TRIỆT ĐỂ LỖI KẸT SÀN ĐẤU 4V4 KHI QUÁI CHƯA CHẾT
   - ĐỒNG BỘ ĐỘ MỜ ÊM MẮT (OPACITY 35%), BỎ HOÀN TOÀN BỘ LỌC XÁM (GRAYSCALE)
   - SỬA TRIỆT ĐỂ LỖI CẢ 2 MÁY CÙNG HIỆN PARRY: ĐÓNG DẤU DEFENDER_PLAYER_ID CHUẨN XÁC
   - SỬA TRIỆT ĐỂ LỖI TREO GAME SAU KHI PARRY: LOẠI BỎ RACE-CONDITION & BỔ SUNG WATCHDOG
   - ĐỒNG BỘ THOÁT COMBAT (SYNC_BATTLE_END): CẢ 2 CÙNG THOÁT RA MAP ĐỒNG LOẠT
   - ĐỒNG BỘ HỦY BƯỚC ĐI (UNIT_MOVE_CANCEL): TƯỚNG TỰ LÙI VỀ VỊ TRÍ CŨ TRÊN CẢ 2 MÁY
   - ĐỒNG BỘ MÁU TUYỆT ĐỐI (ABSOLUTE HP): CHỐNG LỖI TRỪ MÁU 2 LẦN
   - TÍNH NĂNG TỰ ĐỘNG LƯU TRẬN ĐẤU (AUTO-SAVE / RESUME KHI F5 HOẶC SẬP SERVER)
   - TÍCH HỢP HỆ DI CHUYỂN: ĐI BỘ (WALK) VS ĐI BAY (FLY - VƯỢT QUA & ĐỨNG TRÊN NƯỚC)
   - TẦM ĐÁNH PHỤ THUỘC VÀO VŨ KHÍ: CẦM CUNG TẦM 2 Ô, CẦM CẬN CHIẾN TẦM 1 Ô
   - KÉO RÊ 4 HƯỚNG TỰ DO (360° DRAG-TO-PAN CẢ NGANG LẪN DỌC)
   - TỰ ĐỘNG LIA CAMERA 2 CHIỀU CĂN GIỮA NHÂN VẬT (2D AUTO-CAMERA)
   ========================================================================== */
   const mapEl = document.getElementById('map');
   mapEl.style.width = (COLS * TILE) + 'px';
   mapEl.style.height = (ROWS * TILE) + 'px';
   
   let mapPhase = 'player';
   let selectedMapId = null;
   let mapReachable = new Map();
   let isUnitMoving = false;
   let mapOver = false;
   
   // BIẾN ĐIỀU KHIỂN MENU HÀNH ĐỘNG & KỸ NĂNG
   let menuUnitId = null;
   let menuStage = null; 
   let menuTargets = [];
   let activeMapSkill = null; 
   
   const tileDomMap = new Map();
   let mapInitiatorId = null;
   let unitsWhoAttackedInCombat = new Set();
   
   // BIẾN ĐIỀU KHIỂN KÉO RÊ BẢN ĐỒ 4 HƯỚNG (DRAG-TO-PAN 2D)
   let isMapPanning = false;
   let panStartX = 0;
   let panStartY = 0;
   let panScrollLeft = 0;
   let panScrollTop = 0;
   let hasMapDragged = false;
   
   // BIẾN QUẢN LÝ LƯỢT CON TRONG SÀN ĐẤU 4V4 (CO-OP COMBAT SUB-TURN)
   let combatSubTurnIndex = 0;
   window.combatSubTurnIndex = combatSubTurnIndex;
   
   function key(c, r) { return c + ',' + r; }
   function inBounds(c, r) { return c >= 0 && c < COLS && r >= 0 && r < ROWS; }
   function terrainAt(c, r) { return TERRAIN[r][c]; }
   function unitAt(c, r) { return units.find(u => u.hp > 0 && u.col === c && u.row === r); }
   function unitsAt(c, r) { return units.filter(u => u.hp > 0 && u.col === c && u.row === r); }
   
   // ==========================================================================
   // 🌊 HÀM TÍNH CHI PHÍ ĐỊA HÌNH THÔNG MINH CHO TƯỚNG BỘ VÀ TƯỚNG BAY
   // ==========================================================================
   function getMoveCost(unit, c, r) {
     const t = terrainAt(c, r);
     if (t === 'W') return Infinity;
     if (t === 'A') {
       return (unit && unit.move_type === 'fly') ? 1 : Infinity;
     }
     return COST[t] !== undefined ? COST[t] : 1;
   }
   
   // ==========================================================================
   // 🤝 BỘ ĐỒNG BỘ MULTIPLAYER CO-OP (SYNC RECEIVERS & AUTO-PASS TURNS)
   // ==========================================================================
   
   function updateCoopTurnIndicator() {
     const pill = document.getElementById('mapPhasePill');
     const btn = document.getElementById('endTurnBtn');
     if (!pill) return;
   
     if (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive) {
       if (btn) btn.style.display = 'none';
   
       const activePlayer = NetworkManager.players[NetworkManager.currentSubTurnIndex];
       const pName = activePlayer ? activePlayer.name : `P${NetworkManager.currentSubTurnIndex + 1}`;
       const isMyTurn = NetworkManager.isMyTurnNow();
   
       if (mapPhase === 'player') {
         pill.innerHTML = `Lượt: <strong style="color:var(--gold);">${pName}</strong> ${isMyTurn ? '<span style="color:var(--teal); font-weight:800;">(LƯỢT CỦA BẠN)</span>' : '<span style="color:var(--text-3);">(ĐANG CHỜ ĐỒNG ĐỘI)</span>'}`;
         pill.className = isMyTurn ? 'phase-pill player' : 'phase-pill battle';
       } else {
         pill.textContent = 'Enemy phase (Kẻ địch hành động)';
         pill.className = 'phase-pill enemy';
       }
     }
   }
   window.updateCoopTurnIndicator = updateCoopTurnIndicator;
   
   // TỰ ĐỘNG CHUYỂN LƯỢT TRÊN BẢN ĐỒ MAP
   function checkAutoPassCoopTurn() {
     if (typeof NetworkManager === 'undefined' || !NetworkManager.isCoopActive) return;
     if (mapPhase !== 'player' || mapOver) return;
   
     const aliveAllies = units.filter(u => u.team === 'player' && u.hp > 0);
     const allAlliesDone = aliveAllies.length > 0 && aliveAllies.every(u => u.acted === true);
   
     if (allAlliesDone) {
       log(`⚔️ [HẾT LƯỢT PHE TA] Toàn bộ nhân vật đã hoàn thành lượt. Kẻ địch bắt đầu hành động!`, 'weak');
       if (NetworkManager.isHost) {
         setTimeout(() => {
           endMapTurn();
         }, 500);
       } else {
         NetworkManager.send({ type: 'TRIGGER_ENEMY_PHASE' });
       }
       return;
     }
   
     if (NetworkManager.isMyTurnNow()) {
       const myUnits = aliveAllies.filter(u => NetworkManager.isMyUnit(u));
       const allMyUnitsDone = myUnits.length > 0 && myUnits.every(u => u.acted === true);
   
       if (allMyUnitsDone) {
         log(`✅ [XONG LƯỢT] Bạn đã hành động xong các nhân vật của mình. Tự động chuyển lượt...`, 'weak');
         setTimeout(() => {
           NetworkManager.passTurnToNextPlayer();
         }, 500);
       }
     }
   }
   window.checkAutoPassCoopTurn = checkAutoPassCoopTurn;
   
   // 🤝 TỰ ĐỘNG CHUYỂN LƯỢT HOẶC KẾT THÚC COMBAT TRẢ VỀ MAP CHUẨN XÁC
   function checkAutoPassCombatSubTurn() {
     if (typeof NetworkManager === 'undefined' || !NetworkManager.isCoopActive) {
       checkPlayerPhaseEnd();
       return;
     }
     if (battlePhase !== 'player') return;
   
     const aliveBattleParty = battleParty.filter(u => u.hp > 0);
     const allAlliesDone = aliveBattleParty.length > 0 && aliveBattleParty.every(u => u.combatActed === true);
   
     // 1. TẤT CẢ ĐỒNG ĐỘI TRONG COMBAT ĐÃ HÀNH ĐỘNG XONG (HOẶC ĐÃ BỎ LƯỢT)
     if (allAlliesDone) {
       // Nếu quái vật là bên mở màn tấn công trước (battleInitiator = 'enemy') -> HIỆP ĐẤU ĐÃ XONG -> QUAY VỀ MAP!
       if (battleInitiator === 'enemy') {
         log(`🏁 [HẾT HIỆP GIAO CHIẾN] Hai bên đã hoàn tất đòn đánh. Đang quay trở lại bản đồ...`, 'weak');
         if (NetworkManager.isHost) {
           setTimeout(() => endBattle(), 600);
         } else {
           NetworkManager.send({ type: 'REQ_COOP_END_BATTLE' });
         }
         return;
       } else {
         // Nếu phe ta mở màn đánh trước -> Quái vật phản công
         log(`⚔️ [HẾT LƯỢT COMBAT PHE TA] Toàn đội đã hành động xong. Kẻ địch bắt đầu phản công!`, 'weak');
         if (NetworkManager.isHost) {
           setTimeout(startBattleEnemyPhase, 500);
         } else {
           NetworkManager.send({ type: 'COOP_BATTLE_ENEMY_PHASE' });
         }
         return;
       }
     }
   
     // 2. NGƯỜI CHƠI HIỆN TẠI ĐÃ XONG TƯỚNG CỦA MÌNH -> TỰ ĐỘNG CHUYỂN SANG ĐỒNG ĐỘI TIẾP THEO
     if (NetworkManager.mySlotIndex === combatSubTurnIndex) {
       const myUnits = aliveBattleParty.filter(u => NetworkManager.isMyUnit(u));
       const myUnitsDone = myUnits.length > 0 && myUnits.every(u => u.combatActed === true);
   
       if (myUnitsDone) {
         let nextIdx = (combatSubTurnIndex + 1) % NetworkManager.players.length;
         let loops = 0;
         let foundNext = false;
         while (loops < NetworkManager.players.length) {
           const nextPlayerUnits = aliveBattleParty.filter(u => {
             const item = Object.values(NetworkManager.coopSquad).find(x => x.heroId === u.id);
             return item ? item.slotIndex === nextIdx : false;
           });
           if (nextPlayerUnits.some(u => !u.combatActed)) {
             foundNext = true;
             break;
           }
           nextIdx = (nextIdx + 1) % NetworkManager.players.length;
           loops++;
         }
   
         if (foundNext) {
           log(`✅ [XONG LƯỢT] Bạn đã hành động xong nhân vật. Tự động chuyển lượt...`, 'weak');
           combatSubTurnIndex = nextIdx;
           NetworkManager.send({
             type: 'SYNC_COMBAT_SUB_TURN',
             nextPlayerIndex: nextIdx
           });
           renderBattle();
         } else {
           checkAutoPassCombatSubTurn();
         }
       }
     }
   }
   window.checkAutoPassCombatSubTurn = checkAutoPassCombatSubTurn;
   
   // Đồng bộ di chuyển
   async function syncRemoteUnitMove(unitId, col, row) {
     const u = units.find(x => x.id === unitId);
     if (!u) return;
     const path = findPathBFS(u, col, row);
     isUnitMoving = true;
     await animateUnitSteps(u, path);
     isUnitMoving = false;
     u.col = col;
     u.row = row;
     u.moved = true;
     log(`🤝 [CO-OP] Đồng đội di chuyển [${u.short_name || u.name}] tới ô (${col + 1}, ${row + 1}).`);
     renderMap();
     centerCameraOnTile(col, row);
   }
   window.syncRemoteUnitMove = syncRemoteUnitMove;
   
   // Đồng bộ HỦY bước đi trên Map (tướng quay về ô cũ)
   function syncRemoteUnitMoveCancel(unitId, col, row) {
     const u = units.find(x => x.id === unitId);
     if (u) {
       u.col = col;
       u.row = row;
       u.moved = false;
       renderMap();
       centerCameraOnTile(col, row);
       log(`↩ [CO-OP] Đồng đội đã hủy bước đi, [${u.short_name || u.name}] quay về vị trí cũ.`);
     }
   }
   window.syncRemoteUnitMoveCancel = syncRemoteUnitMoveCancel;
   
   // Đồng bộ mờ tướng trên Map
   function syncRemoteUnitActed(unitId) {
     const u = units.find(x => x.id === unitId);
     if (u) {
       u.moved = true;
       u.acted = true;
       renderMap();
     }
     checkAutoPassCoopTurn();
   }
   window.syncRemoteUnitActed = syncRemoteUnitActed;
   
   // Đồng bộ mở sáng lại tướng khi sang vòng mới
   function syncRemotePlayerPhaseStart() {
     mapPhase = 'player';
     units.forEach(u => {
       if (u.team === 'player') {
         u.moved = false;
         u.acted = false;
         delete u.prevCol;
         delete u.prevRow;
       }
     });
     log('Lượt của phe ta bắt đầu.');
     if (typeof NetworkManager !== 'undefined') {
       NetworkManager.currentSubTurnIndex = 0;
       updateCoopTurnIndicator();
     }
     renderMap();
   }
   window.syncRemotePlayerPhaseStart = syncRemotePlayerPhaseStart;
   
   function syncRemoteBattleTrigger(packet) {
     const eng = units.filter(u => packet.unitIds.includes(u.id));
     if (eng.length > 0) {
       combatSubTurnIndex = 0;
       enterBattle(eng, null, packet.phase || 'player');
     }
   }
   window.syncRemoteBattleTrigger = syncRemoteBattleTrigger;
   
   // Đồng bộ máu tuyệt đối & làm mờ tướng tấn công
   function syncRemoteCombatAction(packet) {
     const target = units.find(u => u.id === packet.targetId);
     const actor = units.find(u => u.id === packet.actorId);
     if (!target) return;
   
     if (packet.targetHp !== undefined) {
       target.hp = Math.max(0, packet.targetHp);
     } else {
       target.hp = Math.max(0, target.hp - packet.damage);
     }
   
     if (actor) {
       actor.combatActed = true;
     }
   
     showFloatingText(target.col, target.row, `-${packet.damage} HP`, packet.isCrit ? 'crit' : 'dmg');
   
     if (actor) {
       log(`🤝 [CO-OP COMBAT] ${actor.short_name || actor.name} đánh ${target.short_name || target.name}! -${packet.damage} HP.`, 'dmg');
     }
   
     renderBattle();
   }
   window.syncRemoteCombatAction = syncRemoteCombatAction;
   
   // Đồng bộ thoát khỏi sàn đấu 4v4 về map
   function syncRemoteBattleEnd(packet) {
     if (packet && packet.unitsState) {
       packet.unitsState.forEach(st => {
         const u = units.find(x => x.id === st.id);
         if (u) {
           u.hp = st.hp;
           u.acted = st.acted;
           u.moved = st.moved;
         }
       });
     }
     endBattle(true);
   }
   window.syncRemoteBattleEnd = syncRemoteBattleEnd;
   
   function syncRemoteBuffChoice(buffId) {
     const buff = ENDLESS_BUFF_CARDS_POOL.find(b => b.id === buffId);
     if (buff) {
       buff.apply();
       log(`🃏 [CO-OP THẦN PHƯỚC] Đội đã kích hoạt [${buff.name}]!`, 'weak');
       document.getElementById('endlessBuffModal')?.classList.remove('active');
       endlessCurrentFloor++;
       loadEndlessFloor(endlessCurrentFloor);
     }
   }
   window.syncRemoteBuffChoice = syncRemoteBuffChoice;
   
   // ==========================================================================
   // 💾 BỘ ĐIỀU KHIỂN TỰ ĐỘNG LƯU & KHÔI PHỤC TRẬN ĐẤU (CRASH-PROOF PERSISTENCE)
   // ==========================================================================
   function saveCombatState() {
     if (mapOver || (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive)) {
       if (mapOver) clearCombatState();
       return;
     }
     try {
       const state = {
         timestamp: Date.now(),
         mapId: currentMapData?.id || 'map_campaign_1',
         isEndlessMode: isEndlessMode,
         endlessCurrentFloor: endlessCurrentFloor,
         endlessActiveBuffs: typeof endlessActiveBuffs !== 'undefined' ? endlessActiveBuffs : {},
         endlessHeroRunData: typeof endlessHeroRunData !== 'undefined' ? endlessHeroRunData : {},
         campaignHeroBackupProgress: typeof campaignHeroBackupProgress !== 'undefined' ? campaignHeroBackupProgress : null,
         mapPhase: mapPhase,
         selectedMapId: selectedMapId,
         mapInitiatorId: mapInitiatorId,
         unitsWhoAttackedInCombat: Array.from(unitsWhoAttackedInCombat || []),
         units: units.map(u => ({
           id: u.id,
           baseId: u.baseId || null,
           name: u.name,
           short_name: u.short_name,
           cls: u.cls,
           symbol: u.symbol,
           team: u.team,
           is_boss: u.is_boss,
           color: u.color,
           col: u.col,
           row: u.row,
           mov: u.mov,
           move_type: u.move_type || 'walk',
           range: u.range,
           hp: u.hp,
           maxhp: u.maxhp,
           str: u.str,
           mag: u.mag,
           dex: u.dex,
           spd: u.spd,
           def: u.def,
           res: u.res,
           lck: u.lck,
           type: u.type,
           weakness: u.weakness,
           avatar: u.avatar || '',
           cutin_pos_x: u.cutin_pos_x,
           cutin_pos_y: u.cutin_pos_y,
           cutin_scale: u.cutin_scale,
           moved: !!u.moved,
           acted: !!u.acted,
           bonusUsed: !!u.bonusUsed,
           combatActed: !!u.combatActed,
           firstStrikeUsed: !!u.firstStrikeUsed,
           level: u.level || 1,
           exp: u.exp || 0,
           skills: (u.skills || []).map(sk => ({
             id: sk.id,
             current_uses: sk.current_uses
           }))
         })),
         currentView: document.getElementById('battleView')?.style.display === 'block' ? 'battle' : 'map',
         battleState: {
           battlePartyIds: (battleParty || []).map(u => u.id),
           battleEnemyIds: (battleEnemies || []).map(u => u.id),
           battlePhase: battlePhase,
           battleInitiator: battleInitiator,
           bIconsTotal: bIconsTotal,
           bIconsLeft: bIconsLeft
         }
       };
       localStorage.setItem('anime_emblem_combat_save', JSON.stringify(state));
     } catch (e) {
       console.warn("Lỗi lưu trạng thái trận đấu:", e);
     }
   }
   window.saveCombatState = saveCombatState;
   
   function clearCombatState() {
     localStorage.removeItem('anime_emblem_combat_save');
   }
   window.clearCombatState = clearCombatState;
   
   function hasSavedCombat() {
     return !!localStorage.getItem('anime_emblem_combat_save');
   }
   window.hasSavedCombat = hasSavedCombat;
   
   function restoreCombatState() {
     const raw = localStorage.getItem('anime_emblem_combat_save');
     if (!raw) return false;
     try {
       const data = JSON.parse(raw);
       if (!data || !data.units || data.units.length === 0) return false;
   
       mapOver = false;
       isEndlessMode = !!data.isEndlessMode;
       endlessCurrentFloor = data.endlessCurrentFloor || 1;
       
       if (data.endlessActiveBuffs) endlessActiveBuffs = data.endlessActiveBuffs;
       if (data.endlessHeroRunData) {
         endlessHeroRunData = data.endlessHeroRunData;
         window.endlessHeroRunData = endlessHeroRunData;
       }
       if (data.campaignHeroBackupProgress) {
         campaignHeroBackupProgress = data.campaignHeroBackupProgress;
         window.campaignHeroBackupProgress = campaignHeroBackupProgress;
       }
   
       mapPhase = data.mapPhase || 'player';
       selectedMapId = null;
       mapInitiatorId = data.mapInitiatorId || null;
       unitsWhoAttackedInCombat = new Set(data.unitsWhoAttackedInCombat || []);
   
       units = data.units.map(savedU => {
         const tpl = (typeof HERO_TEMPLATES !== 'undefined' && HERO_TEMPLATES[savedU.id]) ? HERO_TEMPLATES[savedU.id] : null;
         const baseFoe = (typeof ALL_UNITS_DATA !== 'undefined' && ALL_UNITS_DATA[savedU.baseId || savedU.id]) ? ALL_UNITS_DATA[savedU.baseId || savedU.id] : null;
   
         const fullSkills = (SKILLS_DATA[savedU.id] || []).map(sk => {
           const foundSavedSk = savedU.skills?.find(s => s.id === sk.id);
           return {
             ...sk,
             current_uses: foundSavedSk !== undefined ? foundSavedSk.current_uses : sk.max_uses
           };
         });
   
         return {
           ...savedU,
           move_type: savedU.move_type || tpl?.move_type || baseFoe?.move_type || 'walk',
           skills: fullSkills,
           avatar: tpl?.avatar || baseFoe?.avatar || savedU.avatar || '',
           profile_img: tpl?.profile_img || baseFoe?.profile_img || '',
           cutin_img: tpl?.cutin_img || baseFoe?.cutin_img || '',
           cutin_audio: tpl?.cutin_audio || baseFoe?.cutin_audio || '',
           cutin_volume: tpl?.cutin_volume ?? baseFoe?.cutin_volume ?? 100,
           cutin_pos_x: savedU.cutin_pos_x ?? tpl?.cutin_pos_x ?? baseFoe?.cutin_pos_x ?? 50,
           cutin_pos_y: savedU.cutin_pos_y ?? tpl?.cutin_pos_y ?? baseFoe?.cutin_pos_y ?? 30,
           cutin_scale: savedU.cutin_scale ?? tpl?.cutin_scale ?? baseFoe?.cutin_scale ?? 120,
           skill_cutin_img: tpl?.skill_cutin_img || baseFoe?.skill_cutin_img || '',
           skill_cutin_audio: tpl?.skill_cutin_audio || baseFoe?.skill_cutin_audio || '',
           skill_cutin_volume: tpl?.skill_cutin_volume ?? baseFoe?.skill_cutin_volume ?? 100,
           critQuote: tpl?.critQuote || baseFoe?.critQuote || ''
         };
       });
   
       const banner = document.getElementById('endlessFloorBanner');
       if (banner) {
         banner.style.display = isEndlessMode ? 'flex' : 'none';
         if (isEndlessMode && typeof updateEndlessFloorUI === 'function') {
           updateEndlessFloorUI();
         }
       }
   
       if (data.currentView === 'battle' && data.battleState) {
         battleParty = units.filter(u => data.battleState.battlePartyIds?.includes(u.id));
         battleEnemies = units.filter(u => data.battleState.battleEnemyIds?.includes(u.id));
         battlePhase = data.battleState.battlePhase || 'player';
         battleInitiator = data.battleState.battleInitiator || 'player';
         bIconsTotal = data.battleState.bIconsTotal || battleParty.length;
         bIconsLeft = data.battleState.bIconsLeft !== undefined ? data.battleState.bIconsLeft : bIconsTotal;
   
         switchView('battle');
         renderBattle();
       } else {
         switchView('map');
         renderMap();
       }
   
       log(`💾 [TỰ ĐỘNG KHÔI PHỤC] Đã tiếp tục trận chiến từ phiên trước!`, 'weak');
       return true;
     } catch (e) {
       console.warn("Lỗi khôi phục trạng thái trận đấu:", e);
       clearCombatState();
       return false;
     }
   }
   window.restoreCombatState = restoreCombatState;
   
   function getUnitAttackRange(u) {
     if (u.team === 'player' && typeof heroProgress !== 'undefined') {
       const prog = heroProgress[u.id];
       if (prog && prog.equipped_weapon && typeof WEAPON_DATA !== 'undefined' && WEAPON_DATA[prog.equipped_weapon]) {
         const wp = WEAPON_DATA[prog.equipped_weapon];
         return wp.range || (wp.type === 'Cung' ? 2 : 1);
       }
     }
     return u.range || 1;
   }
   window.getUnitAttackRange = getUnitAttackRange;
   
   function canUnitAttack(attacker, target) {
     const dist = Math.abs(attacker.col - target.col) + Math.abs(attacker.row - target.row);
     const maxR = getUnitAttackRange(attacker);
     return dist >= 1 && dist <= maxR;
   }
   
   function isNearby4(a, b) {
     return (Math.abs(a.col - b.col) + Math.abs(a.row - b.row)) <= 1;
   }
   
   function isTileInRange(u, target, minR, maxR) {
     const dist = Math.abs(u.col - target.col) + Math.abs(u.row - target.row);
     return dist >= minR && dist <= maxR;
   }
   
   function switchView(mode) {
     document.getElementById('mapView').style.display = mode === 'map' ? 'block' : 'none';
     document.getElementById('battleView').style.display = mode === 'battle' ? 'block' : 'none';
   }
   
   function showFloatingText(col, row, text, type = 'dmg') {
     const el = document.createElement('div');
     el.className = `floating-text ${type}`;
     el.textContent = text;
     el.style.left = (col * TILE + TILE / 2) + 'px';
     el.style.top = (row * TILE + 8) + 'px';
     mapEl.appendChild(el);
     setTimeout(() => el.remove(), 1200);
   }
   
   function centerCameraOnTile(col, row) {
     const mapCard = document.querySelector('.map-card');
     if (!mapCard) return;
     const targetX = (col * TILE) + (TILE / 2) - (mapCard.clientWidth / 2);
     const targetY = (row * TILE) + (TILE / 2) - (mapCard.clientHeight / 2);
     mapCard.scrollTo({
       left: Math.max(0, targetX),
       top: Math.max(0, targetY),
       behavior: 'smooth'
     });
   }
   window.centerCameraOnTile = centerCameraOnTile;
   
   function triggerOneMoreAnimation(onFinish) {
     let overlay = document.getElementById('oneMoreOverlay');
     if (!overlay) {
       overlay = document.createElement('div');
       overlay.id = 'oneMoreOverlay';
       overlay.className = 'one-more-overlay';
       overlay.innerHTML = `
         <div class="one-more-img-wrap">
           <img src="img/1more.png" alt="1 MORE!" class="one-more-img">
         </div>
       `;
       document.body.appendChild(overlay);
     }
   
     if (typeof SoundManager !== 'undefined' && typeof SoundManager.playOneMore === 'function') {
       SoundManager.playOneMore();
     } else if (typeof SoundManager !== 'undefined') {
       SoundManager.playParry();
     }
   
     overlay.style.display = 'flex';
   
     setTimeout(() => {
       overlay.style.display = 'none';
       if (onFinish) onFinish();
     }, 900);
   }
   
   function cancelCurrentMenu() {
     if (menuUnitId) {
       const mUnit = units.find(x => x.id === menuUnitId);
       if (mUnit && !mUnit.acted) {
         if (mUnit.prevCol !== undefined && mUnit.prevRow !== undefined) {
           const revertCol = mUnit.prevCol;
           const revertRow = mUnit.prevRow;
           mUnit.col = revertCol;
           mUnit.row = revertRow;
           delete mUnit.prevCol;
           delete mUnit.prevRow;
   
           if (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive) {
             NetworkManager.send({
               type: 'UNIT_MOVE_CANCEL',
               unitId: mUnit.id,
               col: revertCol,
               row: revertRow
             });
           }
         }
         mUnit.moved = false;
       }
       menuUnitId = null;
       menuStage = null;
       menuTargets = [];
       activeMapSkill = null;
     }
   }
   
   function computeReachable(unit) {
     const dist = new Map();
     dist.set(key(unit.col, unit.row), 0);
     const frontier = [[unit.col, unit.row, 0]];
   
     while (frontier.length) {
       frontier.sort((a, b) => a[2] - b[2]);
       const [c, r, d] = frontier.shift();
   
       for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
         const nc = c + dc, nr = r + dr;
         if (!inBounds(nc, nr)) continue;
   
         const cost = getMoveCost(unit, nc, nr);
         if (!isFinite(cost)) continue;
   
         const occs = unitsAt(nc, nr).filter(o => o.id !== unit.id);
         const enemyBlock = occs.some(o => o.team !== unit.team);
         if (enemyBlock) continue;
   
         const nd = d + cost;
         if (nd > unit.mov) continue;
   
         const k = key(nc, nr);
         if (!dist.has(k) || dist.get(k) > nd) { 
           dist.set(k, nd); 
           frontier.push([nc, nr, nd]); 
         }
       }
     }
     return dist;
   }
   
   function findPathBFS(unit, targetCol, targetRow) {
     if (unit.col === targetCol && unit.row === targetRow) return [];
   
     const queue = [[unit.col, unit.row]];
     const cameFrom = new Map();
     const costSoFar = new Map();
   
     const startK = key(unit.col, unit.row);
     cameFrom.set(startK, null);
     costSoFar.set(startK, 0);
   
     while (queue.length > 0) {
       queue.sort((a, b) => costSoFar.get(key(a[0], a[1])) - costSoFar.get(key(b[0], b[1])));
       const [c, r] = queue.shift();
       const currK = key(c, r);
   
       if (c === targetCol && r === targetRow) {
         const fullPath = [];
         let step = [c, r];
         while (step) {
           fullPath.unshift(step);
           step = cameFrom.get(key(step[0], step[1]));
         }
         fullPath.shift();
         return fullPath;
       }
   
       for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
         const nc = c + dc, nr = r + dr;
         if (!inBounds(nc, nr)) continue;
   
         const tCost = getMoveCost(unit, nc, nr);
         if (!isFinite(tCost)) continue;
   
         const occs = unitsAt(nc, nr).filter(o => o.id !== unit.id);
         if (occs.some(o => o.team !== unit.team) && (nc !== targetCol || nr !== targetRow)) continue;
   
         const newCost = costSoFar.get(currK) + tCost;
         const nextK = key(nc, nr);
   
         if (!costSoFar.has(nextK) || newCost < costSoFar.get(nextK)) {
           costSoFar.set(nextK, newCost);
           cameFrom.set(nextK, [c, r]);
           queue.push([nc, nr]);
         }
       }
     }
   
     return [[targetCol, targetRow]];
   }
   
   async function animateUnitSteps(unit, path) {
     const unitEl = document.querySelector(`.unit[data-id="${unit.id}"]`);
     if (!unitEl || !path || path.length === 0) return;
   
     unitEl.classList.add('moving');
     void unitEl.offsetWidth;
   
     const stepTime = 140;
     for (let i = 0; i < path.length; i++) {
       const [pc, pr] = path[i];
       unitEl.style.left = (pc * TILE + TILE / 2 - 23) + 'px';
       unitEl.style.top = (pr * TILE + TILE / 2 - 22) + 'px';
       
       centerCameraOnTile(pc, pr);
   
       await new Promise(res => setTimeout(res, stepTime));
     }
   
     await new Promise(res => setTimeout(res, 30));
     unitEl.classList.remove('moving');
   }
   
   function getEnemyThreatZone(enemy) {
     const moveMap = computeReachable(enemy);
     const moveKeys = new Set(moveMap.keys());
     const attackKeys = new Set();
     const maxR = getUnitAttackRange(enemy);
   
     for (const mKey of moveKeys) {
       const [mc, mr] = mKey.split(',').map(Number);
       for (let dr = -maxR; dr <= maxR; dr++) {
         for (let dc = -maxR; dc <= maxR; dc++) {
           const dist = Math.abs(dc) + Math.abs(dr);
           if (dist >= 1 && dist <= maxR) {
             const nc = mc + dc, nr = mr + dr;
             if (inBounds(nc, nr)) {
               const t = terrainAt(nc, nr);
               const canPass = (t !== 'W') && (t !== 'A' || enemy.move_type === 'fly');
               if (canPass) {
                 const k = key(nc, nr);
                 if (!moveKeys.has(k)) attackKeys.add(k);
               }
             }
           }
         }
       }
     }
     return { moveKeys, attackKeys };
   }
   
   function showEnemyDangerZone(enemy) {
     clearEnemyDangerZone();
     const { moveKeys, attackKeys } = getEnemyThreatZone(enemy);
     for (const k of moveKeys) tileDomMap.get(k)?.classList.add('enemy-move');
     for (const k of attackKeys) tileDomMap.get(k)?.classList.add('enemy-attack');
   }
   
   function clearEnemyDangerZone() {
     tileDomMap.forEach(el => {
       el.classList.remove('enemy-move');
       el.classList.remove('enemy-attack');
       el.classList.remove('skill-attack-range');
       el.classList.remove('skill-heal-range');
       el.classList.remove('beam-highlight');
       el.classList.remove('player-attack-range');
     });
   }
   
   function renderMap() {
     if (mapOver) return;
     mapEl.innerHTML = '';
     tileDomMap.clear();
   
     const currentUnit = units.find(u => u.id === selectedMapId);
     const menuCaster = (menuUnitId && menuStage === 'skill_target' && activeMapSkill) 
       ? units.find(x => x.id === menuUnitId) 
       : null;
       
     const attackCaster = (menuUnitId && menuStage === 'target')
       ? units.find(x => x.id === menuUnitId)
       : null;
   
     for (let r = 0; r < ROWS; r++) {
       for (let c = 0; c < COLS; c++) {
         const t = terrainAt(c, r);
         const div = document.createElement('div');
   
         let tileClass = 'wall';
         if (t === 'P' || t === 'H') tileClass = 'plain';
         else if (t === 'F') tileClass = 'forest';
         else if (t === 'A') tileClass = 'water';
   
         div.className = 'tile ' + tileClass;
         div.style.left = (c * TILE) + 'px'; 
         div.style.top = (r * TILE) + 'px'; 
         div.style.width = TILE + 'px'; 
         div.style.height = TILE + 'px';
         
         const isCurrentUnitTile = (currentUnit && currentUnit.col === c && currentUnit.row === r);
         const isTileOccupied = units.some(o => o.hp > 0 && o.col === c && o.row === r);
   
         if (currentUnit && currentUnit.team === 'player' && !currentUnit.acted 
             && mapReachable.has(key(c, r)) 
             && !isCurrentUnitTile 
             && !isTileOccupied) {
           div.classList.add('in-range');
           div.addEventListener('click', () => tryMove(c, r));
         }
   
         if (attackCaster) {
           const dist = Math.abs(attackCaster.col - c) + Math.abs(attackCaster.row - r);
           const maxR = getUnitAttackRange(attackCaster);
           if (dist >= 1 && dist <= maxR) {
             div.classList.add('player-attack-range');
           }
         }
   
         if (menuCaster) {
           const dist = Math.abs(menuCaster.col - c) + Math.abs(menuCaster.row - r);
           if (dist >= activeMapSkill.range_min && dist <= activeMapSkill.range_max) {
             const isHeal = (activeMapSkill.skill_type === 'heal');
             div.classList.add(isHeal ? 'skill-heal-range' : 'skill-attack-range');
           }
         }
   
         mapEl.appendChild(div);
         tileDomMap.set(key(c, r), div);
       }
     }
   
     // RENDER QUÂN CỜ TRÊN MAP (MỜ 35% ÊM MẮT KHI ĐÃ ĐI)
     units.filter(u => u.hp > 0).forEach(u => {
       const div = document.createElement('div');
       const isExhausted = (u.acted === true);
       const isBoss = (u.is_boss == 1);
   
       div.className = 'unit' + 
         (u.id === selectedMapId ? ' selected' : '') + 
         (isExhausted ? ' moved' : '') + 
         (isBoss ? ' is-boss' : '');
   
       div.dataset.id = u.id;
       div.style.left = (u.col * TILE + TILE / 2 - 23) + 'px';
       div.style.top = (u.row * TILE + TILE / 2 - 22) + 'px';
       div.style.width = '46px';
       
       if (isExhausted) {
         div.style.opacity = '0.35';
       } else {
         div.style.opacity = '1';
       }
   
       const displayName = u.short_name || u.name;
       const badgeContent = (u.avatar && u.avatar.trim() !== '')
         ? `<img src="${u.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block;">`
         : (u.symbol || u.name[0]);
   
       div.innerHTML = `<div class="badge" style="background:${u.color}; overflow:hidden;">${badgeContent}</div><div class="tag">${displayName}</div>`;
       
       if (u.team === 'enemy') {
         div.addEventListener('mouseenter', () => {
           if (mapPhase === 'player' && !menuUnitId && !isUnitMoving) showEnemyDangerZone(u);
         });
         div.addEventListener('mouseleave', () => {
           if (!menuUnitId) clearEnemyDangerZone();
         });
       }
   
       div.addEventListener('click', e => { 
         e.stopPropagation(); 
         onMapUnitClick(u); 
       });
   
       mapEl.appendChild(div);
     });
   
     renderMapUnitInfo();
     
     if (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive) {
       updateCoopTurnIndicator();
     } else {
       const pill = document.getElementById('mapPhasePill');
       const btn = document.getElementById('endTurnBtn');
       if (mapPhase === 'player') { 
         pill.textContent = 'Player phase'; 
         pill.className = 'phase-pill player'; 
         if (btn) {
           btn.style.display = 'inline-block';
           btn.textContent = 'Kết thúc lượt';
           btn.disabled = false; 
         }
       } else { 
         pill.textContent = 'Enemy phase'; 
         pill.className = 'phase-pill enemy'; 
         if (btn) {
           btn.style.display = 'inline-block';
           btn.textContent = 'Lượt của địch';
           btn.disabled = true; 
         }
       }
     }
   
     const cSurrenderBtn = document.getElementById('campaignSurrenderBtn');
     if (cSurrenderBtn) {
       cSurrenderBtn.style.display = isEndlessMode ? 'none' : 'inline-block';
     }
   }
   
   function renderMapUnitInfo() {
     const el = document.getElementById('unitInfo');
     
     if (menuUnitId) {
       const u = units.find(x => x.id === menuUnitId);
       if (!u) { 
         menuUnitId = null; menuStage = null; 
         el.innerHTML = '<p class="empty">Bấm vào 1 nhân vật trên bản đồ để xem chỉ số.</p>'; 
         return; 
       }
   
       const menuBadge = (u.avatar && u.avatar.trim() !== '')
         ? `<img src="${u.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block;">`
         : (u.symbol || u.name[0]);
   
       el.innerHTML = `
         <div class="name-row">
           <div class="mini-badge" style="background:${u.color}; overflow:hidden;">${menuBadge}</div>
           <div>
             <div class="name">${u.name}</div>
             <div class="class" style="color:var(--gold); font-weight:700;">
               ${menuStage === 'target' ? 'Chọn mục tiêu đánh' : (menuStage?.startsWith('skill') ? 'Thi triển Kỹ Năng' : 'Chọn hành động')}
             </div>
           </div>
         </div>
       `;
   
       const wrap = document.createElement('div');
       wrap.style.cssText = 'display:flex; flex-direction:column; gap:8px; margin-top:8px;';
   
       const uRange = getUnitAttackRange(u);
   
       if (menuStage === 'action') {
         if (menuTargets.some(en => en.hp > 0)) {
           const atk = document.createElement('button');
           atk.className = 'action-btn'; 
           atk.textContent = uRange > 1 ? '🏹 Bắn cung (Tầm xa)' : '⚔ Tấn công (Cận chiến)';
           atk.onclick = () => { menuStage = 'target'; renderMap(); };
           wrap.appendChild(atk);
         }
   
         const mapSkills = (u.skills || []).filter(s => s.scope === 'map' && s.current_uses > 0);
         if (mapSkills.length > 0) {
           const skBtn = document.createElement('button');
           skBtn.className = 'action-btn btn-skill-map';
           skBtn.innerHTML = `🔮 Kỹ Năng Bản Đồ (${mapSkills.length})`;
           skBtn.onclick = () => { menuStage = 'skill_list'; renderMap(); };
           wrap.appendChild(skBtn);
         }
   
         const wait = document.createElement('button');
         wait.className = 'action-btn'; wait.textContent = 'Chờ (Kết thúc lượt)';
         wait.onclick = () => {
           u.moved = true; 
           u.acted = true;
           log(`${u.short_name || u.name} kết thúc lượt.`);
           closeMenu();
   
           if (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive) {
             NetworkManager.send({
               type: 'UNIT_ACTED',
               unitId: u.id
             });
           }
   
           saveCombatState();
           checkAutoPassCoopTurn();
         };
         wrap.appendChild(wait);
   
         const cancelBtn = document.createElement('button');
         cancelBtn.className = 'action-btn'; cancelBtn.textContent = '↩ Hủy bỏ (Chọn lại)';
         cancelBtn.onclick = () => {
           cancelCurrentMenu();
           selectedMapId = u.id;
           mapReachable = computeReachable(u);
           renderMap();
         };
         wrap.appendChild(cancelBtn);
   
       } else if (menuStage === 'skill_list') {
         const mapSkills = (u.skills || []).filter(s => s.scope === 'map');
         
         mapSkills.forEach(sk => {
           const hasCharges = sk.current_uses > 0;
           const b = document.createElement('button');
           b.className = 'action-btn';
           b.style.cssText = 'text-align:left; display:flex; flex-direction:column; gap:2px; padding:8px 10px;';
           if (!hasCharges) {
             b.disabled = true;
             b.style.opacity = '0.4';
             b.style.cursor = 'not-allowed';
           } else {
             b.style.borderColor = 'var(--gold)';
           }
   
           b.innerHTML = `
             <div style="display:flex; justify-content:space-between; align-items:center;">
               <strong style="color:var(--gold); font-size:13px;">${sk.icon} ${sk.name}</strong>
               <span style="font-size:10px; font-weight:800; color:${hasCharges ? 'var(--teal)' : 'var(--danger)'}">
                 ${sk.current_uses} / ${sk.max_uses} Lượt
               </span>
             </div>
             <div style="font-size:11px; color:var(--text-3);">${sk.desc}</div>
           `;
   
           if (hasCharges) b.onclick = () => selectMapSkillToCast(u, sk);
           wrap.appendChild(b);
         });
   
         const backBtn = document.createElement('button');
         backBtn.className = 'action-btn'; backBtn.textContent = 'Quay lại';
         backBtn.onclick = () => { menuStage = 'action'; renderMap(); };
         wrap.appendChild(backBtn);
   
       } else if (menuStage === 'target') {
         menuTargets.filter(en => en.hp > 0).forEach(en => {
           const dist = Math.abs(u.col - en.col) + Math.abs(u.row - en.row);
           const b = document.createElement('button');
           b.className = 'action-btn target'; 
           b.textContent = `${en.short_name || en.name} (${dist} ô)`;
           b.onclick = () => confirmAttack(u, en);
           wrap.appendChild(b);
         });
   
         const back = document.createElement('button');
         back.className = 'action-btn'; back.textContent = 'Quay lại';
         back.onclick = () => { 
           clearEnemyDangerZone();
           menuStage = 'action'; 
           renderMap(); 
         };
         wrap.appendChild(back);
   
       } else if (menuStage === 'skill_line') {
         const directions = [
           { label: '⬆️ Hướng Lên Trên', dc: 0, dr: -1 },
           { label: '⬇️ Hướng Xuống Dưới', dc: 0, dr: 1 },
           { label: '⬅️ Hướng Bên Trái', dc: -1, dr: 0 },
           { label: '➡️ Hướng Bên Phải', dc: 1, dr: 0 }
         ];
   
         directions.forEach(dir => {
           const b = document.createElement('button');
           b.className = 'action-btn';
           b.style.borderColor = 'var(--teal)';
           b.style.color = '#fff';
           b.textContent = dir.label;
   
           b.onmouseenter = () => highlightExcaliburBeam(u, dir.dc, dir.dr, activeMapSkill.range_max);
           b.onmouseleave = () => clearEnemyDangerZone();
   
           b.onclick = () => executeExcaliburLine(u, activeMapSkill, dir.dc, dir.dr);
           wrap.appendChild(b);
         });
   
         const back = document.createElement('button');
         back.className = 'action-btn'; back.textContent = 'Quay lại Kỹ Năng';
         back.onclick = () => { 
           clearEnemyDangerZone();
           menuStage = 'skill_list'; 
           renderMap(); 
         };
         wrap.appendChild(back);
   
       } else if (menuStage === 'skill_target') {
         const isHeal = (activeMapSkill.skill_type === 'heal');
         const validTargets = isHeal 
           ? units.filter(a => a.team === 'player' && a.hp > 0 && isTileInRange(u, a, activeMapSkill.range_min, activeMapSkill.range_max))
           : units.filter(e => e.team === 'enemy' && e.hp > 0 && isTileInRange(u, e, activeMapSkill.range_min, activeMapSkill.range_max));
   
         if (validTargets.length === 0) {
           wrap.innerHTML += `<div style="font-size:12px; color:var(--danger); padding:6px 0;">Không có mục tiêu nào trong tầm ${activeMapSkill.range_min}-${activeMapSkill.range_max} ô!</div>`;
         } else {
           validTargets.forEach(tgt => {
             const b = document.createElement('button');
             b.className = `action-btn ${isHeal ? '' : 'target'}`;
             if (isHeal) b.style.borderColor = 'var(--teal)';
             b.textContent = `${tgt.short_name || tgt.name} (${Math.abs(u.col - tgt.col) + Math.abs(u.row - tgt.row)} ô) — HP: ${tgt.hp}/${tgt.maxhp}`;
             b.onclick = () => executeTargetedMapSkill(u, activeMapSkill, tgt);
             wrap.appendChild(b);
           });
         }
   
         const back = document.createElement('button');
         back.className = 'action-btn'; back.textContent = 'Quay lại';
         back.onclick = () => { 
           clearEnemyDangerZone();
           menuStage = 'skill_list'; 
           renderMap(); 
         };
         wrap.appendChild(back);
       }
   
       el.appendChild(wrap);
       return;
     }
   
     if (!selectedMapId) {
       el.innerHTML = '<p class="empty">Bấm vào 1 nhân vật trên bản đồ để xem chỉ số.</p>';
       return;
     }
   
     const u = units.find(x => x.id === selectedMapId);
     if (!u) {
       el.innerHTML = '<p class="empty">Bấm vào 1 nhân vật trên bản đồ để xem chỉ số.</p>';
       return;
     }
   
     const uAttackRange = getUnitAttackRange(u);
   
     if (u.team === 'enemy') {
       const isBoss = (u.is_boss == 1);
       const headerTitle = isBoss ? '👑 THÔNG TIN THỦ LĨNH (BOSS TRẬN CHIẾN)' : '⚠️ THÔNG TIN KẺ ĐỊCH';
       const headerColor = isBoss ? 'var(--gold)' : 'var(--enemy-red)';
       const enemyBadge = (u.avatar && u.avatar.trim() !== '')
         ? `<img src="${u.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block;">`
         : (u.symbol || u.name[0]);
   
       el.innerHTML = `
         <div style="font-size:11px; font-weight:800; color:${headerColor}; letter-spacing:0.05em; margin-bottom:6px;">${headerTitle}</div>
         <div class="name-row">
           <div class="mini-badge" style="background:${u.color}; overflow:hidden;">${enemyBadge}</div>
           <div><div class="name">${u.name} ${isBoss ? '<span style="color:var(--gold); font-size:11px;">[BOSS]</span>' : ''}</div><div class="class">${u.cls} · ${u.type}</div></div>
         </div>
         <div class="stat-row"><span>HP</span><span>${u.hp} / ${u.maxhp}</span></div>
         <div class="hp-bar"><div class="fill" style="width:${u.hp / u.maxhp * 100}%; background:${isBoss ? 'linear-gradient(90deg, var(--danger), var(--gold))' : 'var(--enemy-red)'}"></div></div>
         <div class="fe-stats-grid">
           <div><span>Str:</span><strong>${u.str}</strong></div>
           <div><span>Mag:</span><strong>${u.mag}</strong></div>
           <div><span>Dex:</span><strong>${u.dex}</strong></div>
           <div><span>Spd:</span><strong>${u.spd}</strong></div>
           <div><span>Def:</span><strong>${u.def}</strong></div>
           <div><span>Res:</span><strong>${u.res}</strong></div>
           <div><span>Lck:</span><strong>${u.lck}</strong></div>
           <div><span>Tầm:</span><strong style="color:var(--gold);">${uAttackRange > 1 ? '1 - 2 ô (Tầm xa)' : '1 ô (Cận chiến)'}</strong></div>
           <div><span>Di Chuyển:</span><strong style="color:${u.move_type === 'fly' ? '#48cae4' : 'var(--text)'};">${u.move_type === 'fly' ? 'Bay' : 'Bình thường'} (${u.mov} MP)</strong></div>
         </div>
       `;
       return;
     }
   
     const isMyUnitInCoop = (typeof NetworkManager === 'undefined' || !NetworkManager.isCoopActive || NetworkManager.isMyUnit(u));
     const ownerNote = (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive) 
       ? (isMyUnitInCoop ? ' <span style="color:var(--teal); font-weight:800;">[BẠN ĐIỀU KHIỂN]</span>' : ' <span style="color:var(--rose); font-weight:800;">[ĐỒNG ĐỘI ĐIỀU KHIỂN]</span>') 
       : '';
   
     const inRangeEnemies = units.filter(en => en.team === 'enemy' && en.hp > 0 && canUnitAttack(u, en));
     const isDoneText = u.acted ? ' <span style="color:var(--text-3);">(Đã xong lượt)</span>' : '';
     const prog = (typeof heroProgress !== 'undefined') ? heroProgress[u.id] : null;
     const lvDisplay = isEndlessMode ? `Lv. ${u.level || 1} (Tháp)` : (prog ? `Lv. ${prog.level}` : 'Lv. 1');
     const playerBadge = (u.avatar && u.avatar.trim() !== '')
       ? `<img src="${u.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block;">`
       : u.symbol;
   
     el.innerHTML = `
       <div style="font-size:11px; font-weight:800; color:var(--teal); letter-spacing:0.05em; margin-bottom:6px;">
         🛡️ ĐỒNG MINH XUẤT TRẬN (${lvDisplay}) ${isDoneText}${ownerNote}
       </div>
       <div class="name-row">
         <div class="mini-badge" style="background:${u.color}; overflow:hidden;">${playerBadge}</div>
         <div><div class="name">${u.name}</div><div class="class">${u.cls} · ${u.type}</div></div>
       </div>
       <div class="stat-row"><span>HP</span><span>${u.hp} / ${u.maxhp}</span></div>
       <div class="hp-bar"><div class="fill" style="width:${u.hp / u.maxhp * 100}%"></div></div>
       
       <div class="fe-stats-grid">
         <div><span>Str:</span><strong>${u.str}</strong></div>
         <div><span>Mag:</span><strong>${u.mag}</strong></div>
         <div><span>Dex:</span><strong>${u.dex}</strong></div>
         <div><span>Spd:</span><strong>${u.spd}</strong></div>
         <div><span>Def:</span><strong>${u.def}</strong></div>
         <div><span>Res:</span><strong>${u.res}</strong></div>
         <div><span>Lck:</span><strong>${u.lck}</strong></div>
         <div><span>Tầm:</span><strong style="color:var(--gold);">${uAttackRange > 1 ? '1 - 2 ô (Tầm xa / Cung)' : '1 ô (Cận chiến)'}</strong></div>
         <div><span>Di Chuyển:</span><strong style="color:${u.move_type === 'fly' ? '#48cae4' : 'var(--text)'};">${u.move_type === 'fly' ? 'Bay' : 'Bình thường'} (${u.mov} MP)</strong></div>
       </div>
     `;
   
     if (isMyUnitInCoop && (typeof NetworkManager === 'undefined' || !NetworkManager.isCoopActive || NetworkManager.isMyTurnNow())) {
       if (!u.acted && !u.moved) {
         const actNowBtn = document.createElement('button');
         actNowBtn.className = 'action-btn btn-skill-map';
         actNowBtn.style.marginTop = '10px';
         actNowBtn.textContent = '⚡ HÀNH ĐỘNG / KỸ NĂNG (ĐỨNG YÊN)';
         actNowBtn.onclick = () => {
           u.prevCol = u.col;
           u.prevRow = u.row;
           u.moved = true;
           selectedMapId = null;
           mapReachable = new Map();
           menuUnitId = u.id;
           menuStage = 'action';
           menuTargets = inRangeEnemies;
           renderMap();
         };
         el.appendChild(actNowBtn);
       }
     }
   }
   
   function selectMapSkillToCast(u, skill) {
     activeMapSkill = skill;
     clearEnemyDangerZone();
     menuStage = (skill.target_shape === 'line') ? 'skill_line' : 'skill_target';
     renderMap();
   }
   
   function highlightExcaliburBeam(u, dc, dr, maxRange) {
     clearEnemyDangerZone();
     for (let step = 1; step <= maxRange; step++) {
       const nc = u.col + (dc * step);
       const nr = u.row + (dr * step);
       if (inBounds(nc, nr)) {
         tileDomMap.get(key(nc, nr))?.classList.add('beam-highlight');
       }
     }
   }
   
   // ==========================================================================
   // HOẠT ẢNH & VOICE KỸ NĂNG PERSONA 4 ARENA CUT-IN (SLIDE TỪ TRÁI SANG)
   // ==========================================================================
   function triggerSkillCutIn(unit, skillName, onFinish) {
     const overlay = document.getElementById('skillCutIn');
     const imgEl = document.getElementById('skillCutInImg');
     const charNameEl = document.getElementById('skillCutInCharName');
     const skillNameEl = document.getElementById('skillCutInSkillName');
   
     if (!overlay) {
       if (onFinish) onFinish();
       return;
     }
   
     const tpl = (typeof HERO_TEMPLATES !== 'undefined' && HERO_TEMPLATES[unit.id]) ? HERO_TEMPLATES[unit.id] : unit;
     
     const artwork = tpl.skill_cutin_img || tpl.profile_img || tpl.cutin_img || unit.profile_img || unit.avatar || '';
     const voice = tpl.skill_cutin_audio || tpl.cutin_audio || unit.cutin_audio || '';
     const volPct = tpl.skill_cutin_volume !== undefined ? tpl.skill_cutin_volume : (tpl.cutin_volume || 100);
   
     if (!artwork && !voice) {
       if (onFinish) onFinish();
       return;
     }
   
     if (imgEl && artwork) {
       imgEl.src = artwork;
       imgEl.style.display = 'block';
     } else if (imgEl) {
       imgEl.style.display = 'none';
     }
   
     if (charNameEl) charNameEl.textContent = (unit.short_name || unit.name).toUpperCase();
     if (skillNameEl) skillNameEl.textContent = skillName.toUpperCase();
   
     if (voice && voice.trim() !== '') {
       try {
         const audio = new Audio(voice);
         const masterFactor = typeof SoundManager !== 'undefined' ? SoundManager.masterVolume : 0.5;
         const charFactor = Math.max(0, Math.min(200, volPct)) / 100;
         audio.volume = Math.min(1.0, Math.max(0.0, masterFactor * charFactor));
         audio.currentTime = 0;
         audio.play().catch(e => console.warn("Lỗi phát voice skill:", e));
       } catch (e) {}
     }
   
     overlay.style.display = 'flex';
   
     setTimeout(() => {
       overlay.style.display = 'none';
       if (onFinish) onFinish();
     }, 850);
   }
   window.triggerSkillCutIn = triggerSkillCutIn;
   
   async function executeExcaliburLine(u, skill, dc, dr) {
     triggerSkillCutIn(u, skill.name, async () => {
       skill.current_uses--;
       highlightExcaliburBeam(u, dc, dr, skill.range_max);
     
       if (typeof SoundManager !== 'undefined') SoundManager.playCrit();
       log(`🗡️ [EXCALIBUR] ${u.short_name || u.name} giải phóng vệt kiếm quang xé toạc không gian!`, 'weak');
     
       const hitEnemies = [];
       for (let step = 1; step <= skill.range_max; step++) {
         const nc = u.col + (dc * step);
         const nr = u.row + (dr * step);
         if (!inBounds(nc, nr)) break;
     
         const foe = units.find(o => o.team === 'enemy' && o.hp > 0 && o.col === nc && o.row === nr);
         if (foe) hitEnemies.push(foe);
       }
     
       await new Promise(r => setTimeout(r, 450));
       clearEnemyDangerZone();
     
       if (hitEnemies.length === 0) {
         log(`Tia Excalibur phóng thẳng về phía trước nhưng không trúng kẻ địch nào!`);
       } else {
         hitEnemies.forEach(foe => {
           const baseStat = (u.type === 'Magic' ? u.mag : u.str);
           const rawDmg = Math.max(1, Math.round(baseStat * (skill.power / 100)) - foe.def);
           const isWeak = (u.type === foe.weakness);
           const finalDmg = isWeak ? Math.round(rawDmg * 1.4) : rawDmg;
     
           foe.hp = Math.max(0, foe.hp - finalDmg);
           showFloatingText(foe.col, foe.row, `-${finalDmg} HP`, 'crit');
           log(`⚡ Excalibur chém trúng ${foe.short_name || foe.name}! Gây -${finalDmg} HP!`, 'dmg');
     
           if (foe.hp <= 0) {
             log(`💀 ${foe.short_name || foe.name} đã bị Excalibur nghiền nát tan biến!`, 'weak');
             gainHeroExp(u.id, 50);
           }
         });
       }
     
       u.moved = true;
       u.acted = true;
       closeMenu();
   
       if (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive) {
         NetworkManager.send({
           type: 'UNIT_ACTED',
           unitId: u.id
         });
       }
   
       saveCombatState();
       checkAutoPassCoopTurn();
     
       if (checkBattleOverMap()) return;
       renderMap();
     });
   }
   
   async function executeTargetedMapSkill(u, skill, target) {
     triggerSkillCutIn(u, skill.name, async () => {
       skill.current_uses--;
       clearEnemyDangerZone();
     
       if (skill.skill_type === 'heal') {
         const healAmt = (skill.power >= 50) 
           ? Math.round(u.mag * (skill.power / 100)) 
           : Math.round(u.mag + skill.power);
   
         const oldHp = target.hp;
         target.hp = Math.min(target.maxhp, target.hp + healAmt);
         const actualHeal = target.hp - oldHp;
     
         if (isEndlessMode && typeof endlessHeroRunData !== 'undefined' && endlessHeroRunData[target.id]) {
           endlessHeroRunData[target.id].currentHp = target.hp;
         }
     
         if (typeof SoundManager !== 'undefined') SoundManager.playParry();
         showFloatingText(target.col, target.row, `+${actualHeal} HP`, 'heal');
         log(`💚 [TRỊ LIỆU] ${u.short_name || u.name} niệm chú hồi phục +${actualHeal} HP cho ${target.short_name || target.name}! (Scale theo ${u.mag} Mag)`, 'weak');
         gainHeroExp(u.id, 30);
       } else {
         const baseStat = (u.type === 'Magic' ? u.mag : u.str);
         const rawDmg = Math.max(1, Math.round(baseStat * (skill.power / 100)) - (u.type === 'Magic' ? target.res : target.def));
         const isWeak = (u.type === target.weakness);
         const finalDmg = isWeak ? Math.round(rawDmg * 1.4) : rawDmg;
     
         if (typeof SoundManager !== 'undefined') SoundManager.playCrit();
         target.hp = Math.max(0, target.hp - finalDmg);
         showFloatingText(target.col, target.row, `-${finalDmg} HP`, 'dmg');
         log(`🏹 [BẮN TỈA TỪ XA] ${u.short_name || u.name} tung chiêu [${skill.name}] bắn gục ${target.short_name || target.name}! -${finalDmg} HP.`, 'dmg');
     
         if (target.hp <= 0) {
           log(`💀 ${target.short_name || target.name} đã gục ngã dưới mũi tên tầm xa của ${u.short_name || u.name}!`, 'weak');
           gainHeroExp(u.id, 55);
         }
       }
     
       u.moved = true;
       u.acted = true;
       closeMenu();
   
       if (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive) {
         NetworkManager.send({
           type: 'UNIT_ACTED',
           unitId: u.id
         });
       }
   
       saveCombatState();
       checkAutoPassCoopTurn();
     
       if (checkBattleOverMap()) return;
       renderMap();
     });
   }
   
   function checkBattleOverMap() {
     const aliveEnemies = units.filter(u => u.team === 'enemy' && u.hp > 0);
     if (aliveEnemies.length === 0) {
       mapGameOver(true);
       return true;
     }
     return false;
   }
   
   function onMapUnitClick(u) {
     if (mapPhase !== 'player' || mapOver || isUnitMoving) return;
   
     if (menuUnitId && menuStage === 'target') {
       return;
     }
   
     if (menuUnitId && menuStage === 'skill_target' && activeMapSkill) {
       const caster = units.find(x => x.id === menuUnitId);
       const isHeal = (activeMapSkill.skill_type === 'heal');
       const isValid = isHeal 
         ? (u.team === 'player' && isTileInRange(caster, u, activeMapSkill.range_min, activeMapSkill.range_max))
         : (u.team === 'enemy' && isTileInRange(caster, u, activeMapSkill.range_min, activeMapSkill.range_max));
       if (caster && isValid) {
         executeTargetedMapSkill(caster, activeMapSkill, u);
         return;
       }
     }
   
     if (menuUnitId && menuUnitId !== u.id) {
       cancelCurrentMenu();
     }
   
     if (u.team === 'enemy' && u.hp > 0) {
       selectedMapId = (selectedMapId === u.id) ? null : u.id;
       mapReachable = new Map();
       renderMap();
       centerCameraOnTile(u.col, u.row);
       return;
     }
   
     if (u.team === 'player' && u.hp > 0) {
       clearEnemyDangerZone();
   
       if (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive) {
         if (!NetworkManager.isMyUnit(u)) {
           selectedMapId = u.id;
           mapReachable = new Map();
           renderMap();
           centerCameraOnTile(u.col, u.row);
           return;
         }
         if (!NetworkManager.isMyTurnNow()) {
           log(`⏳ Chưa tới lượt của bạn! Đang là lượt của đồng đội.`, 'weak');
           selectedMapId = u.id;
           mapReachable = new Map();
           renderMap();
           centerCameraOnTile(u.col, u.row);
           return;
         }
       }
   
       if (u.acted) {
         selectedMapId = u.id;
         mapReachable = new Map();
         renderMap();
         centerCameraOnTile(u.col, u.row);
         return;
       }
   
       if (!u.moved) {
         if (selectedMapId === u.id) {
           selectedMapId = null;
           mapReachable = new Map();
         } else {
           selectedMapId = u.id;
           mapReachable = computeReachable(u);
         }
       } else {
         const inRangeEnemies = units.filter(en => en.team === 'enemy' && en.hp > 0 && canUnitAttack(u, en));
         menuUnitId = u.id;
         menuStage = 'action';
         menuTargets = inRangeEnemies;
       }
       centerCameraOnTile(u.col, u.row);
     } else {
       selectedMapId = null;
       mapReachable = new Map();
       clearEnemyDangerZone();
     }
   
     renderMap();
   }
   
   async function tryMove(c, r) {
     if (isUnitMoving) return;
     clearEnemyDangerZone();
     
     const u = units.find(x => x.id === selectedMapId);
     if (!u || u.acted) return;
   
     if (u.col === c && u.row === r) {
       selectedMapId = null;
       mapReachable = new Map();
       renderMap();
       return;
     }
   
     const isOccupied = units.some(o => o.hp > 0 && o.id !== u.id && o.col === c && o.row === r);
     if (isOccupied) return;
   
     const path = findPathBFS(u, c, r);
     
     u.prevCol = u.col;
     u.prevRow = u.row;
   
     selectedMapId = null;
     mapReachable = new Map();
     document.querySelectorAll('.tile.in-range').forEach(el => el.classList.remove('in-range'));
   
     isUnitMoving = true;
     await animateUnitSteps(u, path);
     isUnitMoving = false;
   
     u.col = c; 
     u.row = r; 
     u.moved = true;
     log(`${u.short_name || u.name} di chuyển tới ô (${c + 1}, ${r + 1}).`);
   
     if (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive) {
       NetworkManager.send({
         type: 'UNIT_MOVE',
         unitId: u.id,
         col: c,
         row: r
       });
     }
   
     const inRangeEnemies = units.filter(en => en.team === 'enemy' && en.hp > 0 && canUnitAttack(u, en));
     menuUnitId = u.id; 
     menuStage = 'action'; 
     menuTargets = inRangeEnemies;
   
     renderMap();
     centerCameraOnTile(u.col, u.row);
     saveCombatState();
   }
   
   function closeMenu() {
     menuUnitId = null; menuStage = null; menuTargets = []; activeMapSkill = null;
     clearEnemyDangerZone();
     renderMap();
   }
   
   function confirmAttack(u, enemy) {
     clearEnemyDangerZone();
     menuUnitId = null; menuStage = null; menuTargets = [];
   
     mapInitiatorId = u.id;
     u.moved = true;
   
     const eng = findEngagement(u, enemy);
     if (eng) {
       if (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive) {
         NetworkManager.send({
           type: 'SYNC_COMBAT_TRIGGER',
           unitIds: eng.map(x => x.id),
           initiatorId: u.id,
           phase: 'player'
         });
       }
       combatSubTurnIndex = 0;
       enterBattle(eng, null, 'player');
     } else { 
       log('Mục tiêu không còn trong tầm.'); 
       renderMap(); 
     }
   }
   
   function endMapTurn() {
     if (isUnitMoving) return;
     cancelCurrentMenu();
     clearEnemyDangerZone();
     if (mapPhase !== 'player' || mapOver) return;
   
     mapPhase = 'enemy'; 
     selectedMapId = null; 
     mapReachable = new Map(); 
   
     const enemyList = units.filter(u => u.team === 'enemy' && u.hp > 0);
     enemyList.forEach(e => { e.acted = false; e.moved = false; });
     renderMap();
     saveCombatState();
   
     setTimeout(() => {
       runEnemyStep(enemyList, 0);
     }, 400);
   }
   
   async function runEnemyStep(list, i) {
     if (mapOver) return;
   
     if (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive && !NetworkManager.isHost) {
       return;
     }
   
     if (i >= list.length) {
       mapPhase = 'player';
       units.forEach(u => {
         if (u.team === 'player') {
           u.moved = false;
           u.acted = false;
           delete u.prevCol;
           delete u.prevRow;
         }
       });
       log('Lượt của phe ta bắt đầu.');
   
       if (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive && NetworkManager.isHost) {
         NetworkManager.currentSubTurnIndex = 0;
         NetworkManager.send({
           type: 'PLAYER_PHASE_START'
         });
         updateCoopTurnIndicator();
       }
   
       renderMap();
       saveCombatState();
       return;
     }
   
     const enemy = list[i];
     if (enemy.hp <= 0 || enemy.acted) {
       runEnemyStep(list, i + 1); 
       return; 
     }
   
     const range = computeReachable(enemy);
     const targets = alive(units.filter(u => u.team === 'player'));
     let best = null, bestDist = Infinity;
     const maxR = getUnitAttackRange(enemy);
   
     for (const [k] of range) {
       const [c, r] = k.split(',').map(Number);
       if (unitAt(c, r)) continue;
   
       const d = Math.min(...targets.map(p => {
         const dist = Math.abs(p.col - c) + Math.abs(p.row - r);
         return Math.abs(dist - maxR);
       }));
       if (d < bestDist) { bestDist = d; best = [c, r]; }
     }
   
     if (best && (best[0] !== enemy.col || best[1] !== enemy.row)) {
       const enemyPath = findPathBFS(enemy, best[0], best[1]);
       await animateUnitSteps(enemy, enemyPath);
       enemy.col = best[0]; 
       enemy.row = best[1];
       enemy.moved = true;
       log(`${enemy.short_name || enemy.name} di chuyển tới ô (${best[0] + 1}, ${best[1] + 1}).`);
   
       if (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive && NetworkManager.isHost) {
         NetworkManager.send({
           type: 'UNIT_MOVE',
           unitId: enemy.id,
           col: best[0],
           row: best[1]
         });
       }
   
       await new Promise(r => setTimeout(r, 650));
     } else {
       log(`${enemy.short_name || enemy.name} giữ nguyên vị trí.`);
     }
     renderMap();
     centerCameraOnTile(enemy.col, enemy.row);
   
     const targetInRange = targets.find(p => canUnitAttack(enemy, p));
     if (targetInRange) {
       const eng = findEngagement(enemy, targetInRange);
       if (eng) {
         mapInitiatorId = enemy.id;
         enemy.moved = true;
   
         if (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive && NetworkManager.isHost) {
           NetworkManager.send({
             type: 'SYNC_COMBAT_TRIGGER',
             unitIds: eng.map(x => x.id),
             initiatorId: enemy.id,
             phase: 'enemy'
           });
         }
   
         enterBattle(eng, () => runEnemyStep(list, i + 1), 'enemy');
         return;
       }
     }
   
     enemy.acted = true;
     renderMap();
     saveCombatState();
     setTimeout(() => runEnemyStep(list, i + 1), 500);
   }
   
   mapEl.addEventListener('click', e => { 
     if (isUnitMoving || hasMapDragged) return;
     if (e.target === mapEl) { 
       cancelCurrentMenu();
       selectedMapId = null; 
       mapReachable = new Map(); 
       clearEnemyDangerZone();
       renderMap(); 
     } 
   });
   document.getElementById('endTurnBtn')?.addEventListener('click', endMapTurn);
   
   function findEngagement(attacker, target) {
     const group = new Set([attacker]);
     if (target) group.add(target);
   
     units.filter(u => u.hp > 0 && u.team === attacker.team).forEach(ally => {
       if (isNearby4(ally, attacker)) group.add(ally);
     });
   
     if (target) {
       units.filter(u => u.hp > 0 && u.team === target.team).forEach(foe => {
         if (isNearby4(foe, target)) group.add(foe);
       });
     }
   
     const groupArr = Array.from(group);
     const players = groupArr.filter(u => u.team === 'player').slice(0, 4);
     const enemies = groupArr.filter(u => u.team === 'enemy').slice(0, 4);
     if (players.length === 0 || enemies.length === 0) return null;
     return [...players, ...enemies];
   }
   
   // ==========================================================================
   // BATTLE ARENA (4VS4 SQUAD ARENA)
   // ==========================================================================
   let battleParty = [], battleEnemies = [];
   let battlePhase = 'player';
   let battleInitiator = 'player';
   let bIconsTotal = 0, bIconsLeft = 0;
   let bSelectedId = null, bPendingSkill = null;
   let bPendingSkillObj = null;
   let battleOnEnd = null;
   
   function getSupportCombatBonuses(unit, party) {
     const bonuses = { hit: 0, avoid: 0, atk: 0, crit: 0, dmgRed: 0 };
     if (!party || party.length < 2) return bonuses;
   
     party.forEach(partner => {
       if (partner.id !== unit.id) {
         const pKey = getPairKey(unit.id, partner.id);
         const pts = supportBonds[pKey] || 0;
         const rankInfo = getSupportRankInfo(pts);
   
         if (rankInfo.rank === 'C') { bonuses.hit += 5; }
         else if (rankInfo.rank === 'B') { bonuses.hit += 5; bonuses.avoid += 10; }
         else if (rankInfo.rank === 'A') { bonuses.hit += 10; bonuses.avoid += 10; bonuses.atk += 2; }
         else if (rankInfo.rank === 'S') { bonuses.hit += 15; bonuses.avoid += 15; bonuses.atk += 3; bonuses.crit += 15; bonuses.dmgRed += 15; }
       }
     });
   
     return bonuses;
   }
   
   function enterBattle(group, onEnd, initiator) {
     battleParty = group.filter(u => u.team === 'player').slice(0, 4);
     battleEnemies = group.filter(u => u.team === 'enemy').slice(0, 4);
   
     unitsWhoAttackedInCombat = new Set();
     battleEnemies.forEach(e => { e.combatActed = false; });
     battleParty.forEach(u => { 
       u.combatActed = false; 
       u.bonusUsed = false;
       if (u.firstStrikeUsed === undefined) u.firstStrikeUsed = false;
     });
   
     bIconsTotal = battleParty.length; 
     bIconsLeft = bIconsTotal;
     bSelectedId = null; 
     bPendingSkill = null; 
     bPendingSkillObj = null;
     battleOnEnd = onEnd;
     battleInitiator = initiator === 'enemy' ? 'enemy' : 'player';
     battlePhase = battleInitiator;
     combatSubTurnIndex = 0;
   
     log(`⚔️ [GIAO CHIẾN TỔ ĐỘI] Phe bạn (${battleParty.map(p => p.short_name || p.name).join(', ')}) VS Phe địch (${battleEnemies.map(e => e.short_name || e.name).join(', ')}).`, 'weak');
     
     switchView('battle');
     renderBattle();
     saveCombatState();
     if (battlePhase === 'enemy') {
       setTimeout(startBattleEnemyPhase, 600);
     }
   }
   
   function renderBattle() {
     const pill = document.getElementById('bPhasePill');
   
     if (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive && battlePhase === 'player') {
       const activePlayer = NetworkManager.players[combatSubTurnIndex];
       const isMyTurnInCombat = (NetworkManager.mySlotIndex === combatSubTurnIndex);
       pill.innerHTML = `Battle — Lượt: <strong style="color:var(--gold);">${activePlayer?.name || 'Đồng đội'}</strong> ${isMyTurnInCombat ? '<span style="color:var(--teal); font-weight:800;">(LƯỢT CỦA BẠN)</span>' : '<span style="color:var(--text-3);">(ĐANG CHỜ ĐỒNG ĐỘI)</span>'}`;
       pill.className = isMyTurnInCombat ? 'phase-pill player' : 'phase-pill battle';
     } else {
       pill.textContent = battlePhase === 'player' ? 'Battle — player phase' : 'Battle — enemy phase';
       pill.className = 'phase-pill battle';
     }
   
     const iconsEl = document.getElementById('bIcons');
     iconsEl.innerHTML = '';
     for (let i = 0; i < bIconsTotal; i++) {
       const d = document.createElement('div');
       d.className = 'icon' + (i < bIconsLeft ? ' on' : '');
       iconsEl.appendChild(d);
     }
     const pEl = document.getElementById('bPlayerSide');
     const eEl = document.getElementById('bEnemySide');
     pEl.innerHTML = ''; eEl.innerHTML = '';
   
     // RENDER PHE BẠN (TƯỚNG CỦA NGƯỜI ĐANG CÓ LƯỢT SÁNG 100% TRÊN CẢ 2 MÁY)
     battleParty.forEach(u => {
       const card = document.createElement('div');
       const isSelected = (u.id === bSelectedId);
       
       const isMyUnitInCoop = (typeof NetworkManager === 'undefined' || !NetworkManager.isCoopActive || NetworkManager.isMyUnit(u));
       const isMyTurnInCombat = (typeof NetworkManager === 'undefined' || !NetworkManager.isCoopActive || NetworkManager.mySlotIndex === combatSubTurnIndex);
       const canActNow = (battlePhase === 'player' && u.hp > 0 && !u.combatActed && bIconsLeft > 0 && isMyUnitInCoop && isMyTurnInCombat);
   
       card.className = 'b-unit-card' + (u.hp <= 0 ? ' down' : '') + (u.combatActed ? ' down' : '') + (canActNow ? ' selectable' : '') + (isSelected ? ' selected' : '');
       
       // Kiểm tra xem tướng này có thuộc về người chơi ĐANG CÓ LƯỢT ĐI không
       let isBelongToActivePlayer = true;
       if (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive) {
         const activePlayerObj = NetworkManager.players[combatSubTurnIndex];
         const entry = Object.values(NetworkManager.coopSquad).find(x => x.heroId === u.id);
         if (entry && activePlayerObj) {
           isBelongToActivePlayer = (entry.playerId === activePlayerObj.id);
         }
       }
   
       if (u.combatActed || u.hp <= 0) {
         card.style.opacity = '0.35';
         card.style.filter = 'none';
       } else if (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive && battlePhase === 'player' && !isBelongToActivePlayer) {
         // Tướng thuộc về người chơi CHƯA TỚI LƯỢT -> mờ nhẹ 55%
         card.style.opacity = '0.55';
         card.style.filter = 'none';
       } else {
         // Tướng của người chơi ĐANG CÓ LƯỢT -> Sáng 100% trên cả 2 màn hình!
         card.style.opacity = '1';
         card.style.filter = 'none';
       }
   
       const prog = (typeof heroProgress !== 'undefined') ? heroProgress[u.id] : null;
       const constRank = prog ? prog.constellation : 0;
       const constBadge = constRank > 0 ? `<span style="font-size:10px; color:var(--gold); font-weight:800; margin-left:4px;">[C${constRank}]</span>` : '';
   
       const uAttackRange = getUnitAttackRange(u);
       const displayName = u.short_name || u.name;
       const pAvatar = (u.avatar && u.avatar.trim() !== '')
         ? `<img src="${u.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block;">`
         : (u.symbol || u.name[0]);
   
       const coopRoleTag = (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive) 
         ? (isMyUnitInCoop ? ' · <strong style="color:var(--teal)">Bạn</strong>' : ' · <span style="color:var(--rose)">Đồng đội</span>') 
         : '';
   
       card.innerHTML = `
         <div class="b-unit-head"><div class="b-badge" style="background:${u.color}; overflow:hidden;">${pAvatar}</div>
           <div><div class="b-unit-name">${displayName} ${constBadge}</div><div class="b-unit-class">${u.cls} · ${u.type}${coopRoleTag}</div></div></div>
         <div class="b-hp-row"><span>HP</span><span>${Math.max(u.hp, 0)}/${u.maxhp}</span></div>
         <div class="b-hp-bar"><div class="fill" style="width:${Math.max(u.hp, 0) / u.maxhp * 100}%; background:${u.color}"></div></div>
         <div style="display:flex; justify-content:space-between; font-size:10px; color:var(--text-3); margin-top:4px;">
           <span>Atk: ${u.type === 'Magic' ? u.mag : u.str}</span>
           <span>Def: ${u.def} | Res: ${u.res}</span>
           <span>Spd: ${u.spd}</span>
         </div>
         <div class="b-weak-tag">Điểm yếu: ${u.weakness}${u.combatActed && u.hp > 0 ? ' · Đã hành động' : ''}</div>
       `;
   
       if (canActNow && isSelected) {
         const actBox = document.createElement('div');
         actBox.className = 'b-card-actions';
   
         if (!bPendingSkill && !bPendingSkillObj) {
           const atkBtn = document.createElement('button');
           atkBtn.className = 'action-btn';
           atkBtn.style.borderColor = 'var(--teal)';
           atkBtn.style.color = 'var(--teal)';
           atkBtn.textContent = uAttackRange > 1 ? `🏹 Bắn thường` : `⚔️ Đánh thường`;
           atkBtn.onclick = (e) => {
             e.stopPropagation();
             bPendingSkill = u.type;
             bPendingSkillObj = null;
             renderBattle();
           };
           actBox.appendChild(atkBtn);
   
           const combatSkills = (u.skills || []).filter(s => s.scope === 'combat' && s.current_uses > 0);
           combatSkills.forEach(sk => {
             const skBtn = document.createElement('button');
             skBtn.className = 'action-btn';
             skBtn.style.borderColor = 'var(--gold)';
             skBtn.style.color = 'var(--gold)';
             skBtn.innerHTML = `${sk.icon} ${sk.name} <span style="font-size:10px; opacity:0.8;">(${sk.current_uses}/${sk.max_uses})</span>`;
             skBtn.onclick = (e) => {
               e.stopPropagation();
               if (sk.skill_type === 'buff' && sk.target_shape === 'ally_all') {
                 executeCombatSkillPersona(u, sk, null);
               } else {
                 bPendingSkillObj = sk;
                 bPendingSkill = null;
                 renderBattle();
               }
             };
             actBox.appendChild(skBtn);
           });
   
           const skipBtn = document.createElement('button');
           skipBtn.className = 'action-btn';
           skipBtn.textContent = 'Bỏ lượt';
           skipBtn.onclick = (e) => {
             e.stopPropagation();
             battleSkipTurn(u);
           };
           actBox.appendChild(skipBtn);
   
           const cancelBtn = document.createElement('button');
           cancelBtn.className = 'action-btn';
           cancelBtn.textContent = 'Hủy';
           cancelBtn.onclick = (e) => {
             e.stopPropagation();
             bSelectedId = null;
             bPendingSkill = null;
             bPendingSkillObj = null;
             renderBattle();
           };
           actBox.appendChild(cancelBtn);
   
         } else {
           const hint = document.createElement('span');
           hint.style.cssText = 'font-size:11px; color:var(--gold); width:100%; margin-bottom:2px; font-weight:700;';
           hint.textContent = bPendingSkillObj ? `Chọn mục tiêu cho [${bPendingSkillObj.name}]:` : 'Chọn mục tiêu:';
           actBox.appendChild(hint);
   
           alive(battleEnemies).forEach(en => {
             const targetBtn = document.createElement('button');
             targetBtn.className = 'action-btn target';
             targetBtn.textContent = `🎯 ${en.short_name || en.name}`;
             targetBtn.onclick = (e) => {
               e.stopPropagation();
               if (bPendingSkillObj) {
                 executeCombatSkillPersona(u, bPendingSkillObj, en);
               } else {
                 resolveBattlePlayerAttack(u, en);
               }
             };
             actBox.appendChild(targetBtn);
           });
   
           const backBtn = document.createElement('button');
           backBtn.className = 'action-btn';
           backBtn.textContent = 'Quay lại';
           backBtn.onclick = (e) => {
             e.stopPropagation();
             bPendingSkill = null;
             bPendingSkillObj = null;
             renderBattle();
           };
           actBox.appendChild(backBtn);
         }
   
         card.appendChild(actBox);
       }
   
       if (canActNow) {
         card.addEventListener('click', () => selectBattleUnit(u.id));
       }
       pEl.appendChild(card);
     });
   
     // RENDER PHE ĐỊCH (MỜ 35% KHI ĐÃ HÀNH ĐỘNG, BỎ GRAYSCALE)
     battleEnemies.forEach(u => {
       const card = document.createElement('div');
       const isBoss = (u.is_boss == 1);
       
       card.className = 'b-unit-card' + 
         (u.hp <= 0 ? ' down' : '') + 
         (u.combatActed ? ' down' : '') + 
         (isBoss ? ' boss-card' : '');
       
       if (u.combatActed || u.hp <= 0) {
         card.style.opacity = '0.35';
         card.style.filter = 'none';
       } else {
         card.style.opacity = '1';
         card.style.filter = 'none';
       }
   
       const bossTag = isBoss ? '<span style="color:var(--gold); font-weight:800; font-size:11px; margin-left:4px;">[BOSS]</span>' : '';
       const hpFillBg = isBoss ? 'linear-gradient(90deg, var(--danger), var(--gold))' : u.color;
       const eSymbolText = u.symbol || u.name[0];
       const displayName = u.short_name || u.name;
       const eAvatar = (u.avatar && u.avatar.trim() !== '')
         ? `<img src="${u.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block;">`
         : eSymbolText;
   
       card.innerHTML = `
         <div class="b-unit-head"><div class="b-badge" style="background:${u.color}; overflow:hidden;">${eAvatar}</div>
           <div><div class="b-unit-name">${displayName} ${bossTag}</div><div class="b-unit-class">${u.cls}</div></div></div>
         <div class="b-hp-row"><span>HP</span><span>${Math.max(u.hp, 0)}/${u.maxhp}</span></div>
         <div class="b-hp-bar"><div class="fill" style="width:${Math.max(u.hp, 0) / u.maxhp * 100}%; background:${hpFillBg}"></div></div>
         <div style="display:flex; justify-content:space-between; font-size:10px; color:var(--text-3); margin-top:4px;">
           <span>Atk: ${u.type === 'Magic' ? u.mag : u.str}</span>
           <span>Def: ${u.def} | Res: ${u.res}</span>
           <span>Spd: ${u.spd}</span>
         </div>
         <div class="b-weak-tag">Điểm yếu: ${u.weakness}${u.combatActed && u.hp > 0 ? ' · Đã hành động' : ''}</div>
       `;
       eEl.appendChild(card);
     });
   }
   
   function selectBattleUnit(id) {
     bSelectedId = (bSelectedId === id) ? null : id;
     bPendingSkill = null;
     bPendingSkillObj = null;
     renderBattle();
   }
   
   function checkPlayerPhaseEnd() {
     const canContinue = bIconsLeft > 0 && battleParty.some(u => u.hp > 0 && !u.combatActed);
     if (canContinue) return;
     if (battleInitiator === 'enemy') {
       log('Hết lượt giao tranh vòng này. Quay lại bản đồ.', 'weak');
       setTimeout(endBattle, 500);
     } else {
       log('Không còn nhân vật nào để hành động. Chuyển sang lượt địch.');
       setTimeout(startBattleEnemyPhase, 600);
     }
   }
   
   // 🤝 BỎ LƯỢT COMBAT: ĐỒNG BỘ SANG MÁY BẠN BÈ ĐỂ KHÔNG BỊ TRẢ NGƯỢC LƯỢT
   function battleSkipTurn(unit) {
     log(`${unit.short_name || unit.name} bỏ lượt trong trận giao tranh.`);
     bIconsLeft = Math.max(0, bIconsLeft - 1);
     unit.combatActed = true; 
     bSelectedId = null; 
     bPendingSkill = null;
     bPendingSkillObj = null;
   
     // Bắn gói tin cho máy đối phương làm mờ nhân vật này ngay lập tức
     if (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive) {
       NetworkManager.send({
         type: 'SYNC_COMBAT_SKIP_TURN',
         unitId: unit.id
       });
     }
   
     renderBattle();
     saveCombatState();
     if (checkBattleOver()) return;
     checkAutoPassCombatSubTurn();
   }
   
   // TÍNH TOÁN ĐÒN ĐÁNH CỦA PHE TA & ĐỒNG BỘ MÁU TUYỆT ĐỐI
   function resolveBattlePlayerAttack(unit, enemy) {
     unitsWhoAttackedInCombat.add(unit.id);
     const buffs = (typeof getHeroActiveBuffs === 'function') ? getHeroActiveBuffs(unit.id) : {};
     const supportBonuses = getSupportCombatBonuses(unit, battleParty);
   
     const endlessCritBonus = (isEndlessMode && typeof endlessActiveBuffs !== 'undefined') ? (endlessActiveBuffs.crit_rate || 0) : 0;
   
     const hitRate = Math.min(100, Math.max(15, 75 + (unit.dex * 2) + unit.lck - (enemy.spd * 2) - enemy.lck + supportBonuses.hit));
     const isHit = (Math.random() * 100) < hitRate;
   
     const uName = unit.short_name || unit.name;
     const eName = enemy.short_name || enemy.name;
   
     if (!isHit) {
       log(`${uName} tấn công ${eName} nhưng bị né đòn!`, 'dmg');
       bIconsLeft = Math.max(0, bIconsLeft - 1);
       unit.combatActed = true; 
       bSelectedId = null; 
       bPendingSkill = null;
   
       if (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive) {
         NetworkManager.send({
           type: 'SYNC_COMBAT_SKIP_TURN',
           unitId: unit.id
         });
       }
   
       renderBattle();
       saveCombatState();
       if (checkBattleOver()) return;
       checkAutoPassCombatSubTurn();
       return;
     }
   
     const bonusAtk = supportBonuses.atk || 0;
     let rawDmg = (unit.type === 'Magic') ? Math.max(1, (unit.mag + bonusAtk) - enemy.res) : Math.max(1, (unit.str + bonusAtk) - enemy.def);
     
     if (isEndlessMode && typeof endlessActiveBuffs !== 'undefined' && endlessActiveBuffs.atk_pct > 0) {
       rawDmg = Math.round(rawDmg * (1 + endlessActiveBuffs.atk_pct / 100));
     }
   
     const isWeak = (unit.type === enemy.weakness);
     if (isWeak) {
       const weakMultiplier = 1.4 + ((buffs.weakness_dmg || 0) / 100);
       rawDmg = Math.round(rawDmg * weakMultiplier);
     }
   
     let critRate = Math.min(75, Math.max(0, unit.dex + Math.round(unit.lck * 0.5) - enemy.lck + (buffs.crit_rate || 0) + supportBonuses.crit + endlessCritBonus));
     let isCrit = (Math.random() * 100) < critRate;
   
     if (buffs.first_strike_crit > 0 && !unit.firstStrikeUsed) {
       isCrit = true;
       unit.firstStrikeUsed = true;
     }
   
     const finalDmg = Math.max(1, (isCrit ? Math.round(rawDmg * 2.5) : rawDmg) + rand(-1, 1));
   
     const applyDamage = () => {
       const isEnemyKilled = (enemy.hp - finalDmg) <= 0;
       enemy.hp = Math.max(0, enemy.hp - finalDmg);
   
       if (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive) {
         NetworkManager.send({
           type: 'SYNC_COMBAT_ACTION',
           actorId: unit.id,
           targetId: enemy.id,
           targetHp: enemy.hp,
           damage: finalDmg,
           isCrit: isCrit
         });
       }
   
       if (isEndlessMode && typeof endlessActiveBuffs !== 'undefined' && endlessActiveBuffs.life_steal > 0) {
         const stealAmt = Math.round(finalDmg * (endlessActiveBuffs.life_steal / 100));
         if (stealAmt > 0 && unit.hp < unit.maxhp) {
           unit.hp = Math.min(unit.maxhp, unit.hp + stealAmt);
           showFloatingText(unit.col, unit.row, `+${stealAmt} HP`, 'heal');
           log(`🩸 [HÚT MÁU] ${uName} hồi phục +${stealAmt} HP từ đòn đánh!`, 'weak');
         }
       }
   
       let extraTurn = false;
       if (isWeak && !unit.bonusUsed) {
         unit.bonusUsed = true;
         extraTurn = true;
       }
   
       if (isCrit) {
         if (extraTurn) {
           log(`⚡ CHÍ MẠNG & 1 MORE! ${uName} đánh trúng điểm yếu của ${eName}! -${finalDmg} HP. Nhận thêm 1 lượt đánh nữa!`, 'weak');
         } else {
           log(`⚡ CHÍ MẠNG! ${uName} giáng đòn sấm sét vào ${eName}! -${finalDmg} HP!`, 'weak');
         }
       } else if (isWeak) {
         if (extraTurn) {
           log(`🎯 1 MORE! ${uName} đánh trúng điểm yếu của ${eName}! -${finalDmg} HP. Nhận thêm 1 lượt đánh nữa!`, 'weak');
         } else {
           log(`🎯 ${uName} đánh trúng điểm yếu của ${eName}! -${finalDmg} HP.`, 'weak');
         }
       } else {
         log(`${uName} tấn công ${eName}. -${finalDmg} HP.`, 'dmg');
       }
   
       gainHeroExp(unit.id, isEnemyKilled ? 55 : (isWeak || isCrit ? 30 : 25));
   
       const finalizeTurn = () => {
         if (!extraTurn) {
           bIconsLeft = Math.max(0, bIconsLeft - 1);
           unit.combatActed = true;
           bSelectedId = null;
         } else {
           bSelectedId = unit.id;
         }
   
         bPendingSkill = null;
         bPendingSkillObj = null;
         renderBattle();
         saveCombatState();
         if (checkBattleOver()) return;
         checkAutoPassCombatSubTurn();
       };
   
       if (extraTurn) {
         triggerOneMoreAnimation(finalizeTurn);
       } else {
         finalizeTurn();
       }
     };
   
     if (isCrit) triggerCriticalCutIn(unit, applyDamage);
     else applyDamage();
   }
   
   // THI TRIỂN SKILL TRONG SÀN ĐẤU 4V4
   function executeCombatSkillPersona(unit, skill, target) {
     triggerSkillCutIn(unit, skill.name, () => {
       skill.current_uses--;
       unitsWhoAttackedInCombat.add(unit.id);
       const uName = unit.short_name || unit.name;
   
       if (skill.skill_type === 'buff') {
         battleParty.filter(p => p.hp > 0).forEach(ally => {
           if (skill.buff_stat === 'str') ally.str += skill.buff_val;
           else if (skill.buff_stat === 'mag') ally.mag += skill.buff_val;
           else if (skill.buff_stat === 'def') ally.def += skill.buff_val;
         });
   
         if (typeof SoundManager !== 'undefined') SoundManager.playLevelUp();
         log(`🔮 [PERSONA BUFF] ${uName} kích hoạt [${skill.name}]! Toàn đội tăng +${skill.buff_val} ${skill.buff_stat.toUpperCase()}!`, 'weak');
   
         bIconsLeft = Math.max(0, bIconsLeft - 1);
         unit.combatActed = true;
         bSelectedId = null; 
         bPendingSkillObj = null;
   
         if (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive) {
           NetworkManager.send({
             type: 'SYNC_COMBAT_SKIP_TURN',
             unitId: unit.id
           });
         }
   
         renderBattle();
         saveCombatState();
         if (checkBattleOver()) return;
         checkAutoPassCombatSubTurn();
         return;
       }
   
       const tName = target.short_name || target.name;
       const baseStat = (unit.type === 'Magic' ? unit.mag : unit.str);
       let rawDmg = Math.max(1, Math.round(baseStat * (skill.power / 100)) - (unit.type === 'Magic' ? target.res : target.def));
       
       if (isEndlessMode && typeof endlessActiveBuffs !== 'undefined' && endlessActiveBuffs.atk_pct > 0) {
         rawDmg = Math.round(rawDmg * (1 + endlessActiveBuffs.atk_pct / 100));
       }
   
       const isWeak = (unit.type === target.weakness);
       const finalDmg = isWeak ? Math.round(rawDmg * 1.5) : rawDmg;
   
       target.hp = Math.max(0, target.hp - finalDmg);
   
       if (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive) {
         NetworkManager.send({
           type: 'SYNC_COMBAT_ACTION',
           actorId: unit.id,
           targetId: target.id,
           targetHp: target.hp,
           damage: finalDmg,
           isCrit: false
         });
       }
   
       if (isEndlessMode && typeof endlessActiveBuffs !== 'undefined' && endlessActiveBuffs.life_steal > 0) {
         const stealAmt = Math.round(finalDmg * (endlessActiveBuffs.life_steal / 100));
         if (stealAmt > 0 && unit.hp < unit.maxhp) {
           unit.hp = Math.min(unit.maxhp, unit.hp + stealAmt);
           showFloatingText(unit.col, unit.row, `+${stealAmt} HP`, 'heal');
         }
       }
   
       let extraTurn = false;
       if (isWeak && !unit.bonusUsed) {
         unit.bonusUsed = true;
         extraTurn = true;
       }
   
       if (extraTurn) {
         log(`⚡ [PERSONA SKILL & 1 MORE!] ${uName} tung chiêu [${skill.name}] trúng điểm yếu ${tName}! -${finalDmg} HP. Nhận thêm 1 lượt đánh nữa!`, 'weak');
       } else {
         log(`⚡ [PERSONA SKILL] ${uName} thi triển [${skill.name}] vào ${tName}! -${finalDmg} HP!`, 'weak');
       }
   
       gainHeroExp(unit.id, target.hp <= 0 ? 60 : 35);
   
       const finalizeSkillTurn = () => {
         if (!extraTurn) {
           bIconsLeft = Math.max(0, bIconsLeft - 1);
           unit.combatActed = true;
           bSelectedId = null;
         } else {
           bSelectedId = unit.id;
         }
   
         bPendingSkill = null;
         bPendingSkillObj = null;
         renderBattle();
         saveCombatState();
         if (checkBattleOver()) return;
         checkAutoPassCombatSubTurn();
       };
   
       if (extraTurn) {
         triggerOneMoreAnimation(finalizeSkillTurn);
       } else {
         finalizeSkillTurn();
       }
     });
   }
   
   // ==========================================================================
   // HOẠT ẢNH CRITICAL HIT CUT-IN
   // ==========================================================================
   function triggerCriticalCutIn(unit, onFinish) {
     const overlay = document.getElementById('critCutIn');
     const fullFaceWrap = document.getElementById('critFullFaceWrap');
     const fullFaceImg = document.getElementById('critFullFaceImg');
     const defaultWrap = document.getElementById('critDefaultWrap');
   
     const badge = document.getElementById('critBadge');
     const quote = document.getElementById('critQuote');
     const name = document.getElementById('critName');
   
     if (!overlay) {
       if (onFinish) onFinish();
       return;
     }
   
     const tpl = (typeof HERO_TEMPLATES !== 'undefined' && HERO_TEMPLATES[unit.id]) ? HERO_TEMPLATES[unit.id] : unit;
     const cutinImage = tpl?.cutin_img || unit.cutin_img || '';
     const cutinVoice = tpl?.cutin_audio || unit.cutin_audio || '';
   
     if (cutinImage && cutinImage.trim() !== '') {
       if (fullFaceImg) {
         fullFaceImg.src = cutinImage;
   
         const posX = tpl?.cutin_pos_x !== undefined ? tpl.cutin_pos_x : (unit.cutin_pos_x ?? 50);
         const posY = tpl?.cutin_pos_y !== undefined ? tpl.cutin_pos_y : (unit.cutin_pos_y ?? 30);
         const scale = (tpl?.cutin_scale !== undefined ? tpl.cutin_scale : (unit.cutin_scale ?? 120)) / 100;
   
         fullFaceImg.style.objectPosition = `${posX}% ${posY}%`;
         fullFaceImg.style.transform = `skewX(14deg) scale(${scale})`;
       }
       if (fullFaceWrap) fullFaceWrap.style.display = 'block';
       if (defaultWrap) defaultWrap.style.display = 'none';
     } else {
       if (fullFaceWrap) fullFaceWrap.style.display = 'none';
       if (defaultWrap) defaultWrap.style.display = 'flex';
   
       if (badge) {
         if (unit.avatar && unit.avatar.trim() !== '') {
           badge.innerHTML = `<img src="${unit.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block;">`;
           badge.style.overflow = 'hidden';
         } else {
           badge.textContent = unit.symbol || unit.name[0];
         }
         badge.style.background = unit.color || 'var(--teal)';
       }
       if (quote) {
         quote.textContent = `"${tpl?.critQuote || unit.critQuote || 'Hãy đón nhận nhát đòn này!'}"`;
       }
       if (name) {
         name.textContent = `${(unit.short_name || unit.name).toUpperCase()} — ${unit.cls.toUpperCase()}`;
       }
     }
   
     if (typeof SoundManager !== 'undefined') {
       if (typeof SoundManager.playCrit === 'function') SoundManager.playCrit();
       else SoundManager.playParry();
     }
   
     if (cutinVoice && cutinVoice.trim() !== '') {
       try {
         const voiceAudio = new Audio(cutinVoice);
         const charVolPct = tpl?.cutin_volume !== undefined ? tpl.cutin_volume : (unit.cutin_volume !== undefined ? unit.cutin_volume : 100);
         const charFactor = Math.max(0, Math.min(200, charVolPct)) / 100;
   
         if (typeof SoundManager !== 'undefined') {
           voiceAudio.volume = Math.min(1.0, Math.max(0.0, SoundManager.masterVolume * charFactor));
         } else {
           voiceAudio.volume = Math.min(1.0, Math.max(0.0, charFactor));
         }
   
         voiceAudio.currentTime = 0;
         voiceAudio.play().catch(e => console.warn("Lỗi phát voice:", e));
       } catch (err) {
         console.warn("Lỗi tải file voice audio:", err);
       }
     }
   
     overlay.style.display = 'flex';
     setTimeout(() => {
       overlay.style.display = 'none';
       if (onFinish) onFinish();
     }, 950);
   }
   
   function testCritCutIn() {
     let hero = null;
   
     if (typeof selectedMapId !== 'undefined' && selectedMapId) {
       hero = units.find(u => u.id === selectedMapId);
     }
   
     if (!hero && typeof selectedCharProfileId !== 'undefined' && selectedCharProfileId) {
       hero = (typeof units !== 'undefined' ? units.find(u => u.id === selectedCharProfileId) : null) 
              || HERO_TEMPLATES[selectedCharProfileId] 
              || ALL_UNITS_DATA[selectedCharProfileId];
     }
   
     if (!hero && typeof currentAdjutantId !== 'undefined' && currentAdjutantId) {
       hero = (typeof units !== 'undefined' ? units.find(u => u.id === currentAdjutantId) : null) 
              || HERO_TEMPLATES[currentAdjutantId] 
              || ALL_UNITS_DATA[currentAdjutantId];
     }
   
     if (!hero) {
       hero = (typeof units !== 'undefined' ? units.find(u => u.team === 'player') : null) || HERO_TEMPLATES['aria'];
     }
   
     triggerCriticalCutIn(hero);
   }
   window.testCritCutIn = testCritCutIn;
   
   function testSkillCutIn() {
     let hero = null;
     if (typeof selectedMapId !== 'undefined' && selectedMapId) {
       hero = units.find(u => u.id === selectedMapId);
     }
     if (!hero && typeof selectedCharProfileId !== 'undefined' && selectedCharProfileId) {
       hero = (typeof units !== 'undefined' ? units.find(u => u.id === selectedCharProfileId) : null) 
              || HERO_TEMPLATES[selectedCharProfileId] 
              || ALL_UNITS_DATA[selectedCharProfileId];
     }
     if (!hero && typeof currentAdjutantId !== 'undefined' && currentAdjutantId) {
       hero = (typeof units !== 'undefined' ? units.find(u => u.id === currentAdjutantId) : null) 
              || HERO_TEMPLATES[currentAdjutantId] 
              || ALL_UNITS_DATA[currentAdjutantId];
     }
     if (!hero) {
       hero = (typeof units !== 'undefined' ? units.find(u => u.team === 'player') : null) || HERO_TEMPLATES['aria'];
     }
   
     triggerSkillCutIn(hero, "PERSONA!");
   }
   window.testSkillCutIn = testSkillCutIn;
   
   // EXP & STAT RANDOM KHI LEVEL UP
   async function gainHeroExp(heroId, amount) {
     const activeUnit = units.find(u => u.id === heroId);
     const tpl = (typeof HERO_TEMPLATES !== 'undefined' && HERO_TEMPLATES[heroId]) ? HERO_TEMPLATES[heroId] : null;
     if (!activeUnit || !tpl) return;
     const uDisplayName = activeUnit.short_name || activeUnit.name;
   
     if (isEndlessMode) {
       if ((activeUnit.level || 1) >= 80) return;
       activeUnit.exp = (activeUnit.exp || 0) + amount;
       log(`📈 [EXP THÁP] ${uDisplayName} nhận +${amount} EXP (${activeUnit.exp}/100)!`);
   
       if (typeof endlessHeroRunData !== 'undefined' && endlessHeroRunData[heroId]) {
         endlessHeroRunData[heroId].exp = activeUnit.exp;
         endlessHeroRunData[heroId].currentHp = activeUnit.hp;
       }
   
       while (activeUnit.exp >= 100 && (activeUnit.level || 1) < 80) {
         activeUnit.level = (activeUnit.level || 1) + 1;
         activeUnit.exp -= 100;
   
         if (typeof endlessHeroRunData !== 'undefined' && endlessHeroRunData[heroId]) {
           endlessHeroRunData[heroId].level = activeUnit.level;
           endlessHeroRunData[heroId].exp = activeUnit.exp;
         }
   
         const STAT_DICT = { hp: 'HP', str: 'Str', mag: 'Mag', dex: 'Dex', spd: 'Spd', def: 'Def', res: 'Res', lck: 'Lck' };
         const statKeys = Object.keys(STAT_DICT);
         const shuffled = [...statKeys].sort(() => Math.random() - 0.5);
         const pickedStats = shuffled.slice(0, 3);
   
         const statLogDetails = [];
         let hpGainThisLevel = 0;
   
         pickedStats.forEach(st => {
           const isLucky = Math.random() < 0.35;
           const gain = isLucky ? 2 : 1;
   
           if (st === 'hp') {
             activeUnit.maxhp += gain;
             activeUnit.hp += gain;
             hpGainThisLevel += gain;
           } else {
             activeUnit[st] += gain;
           }
   
           if (typeof endlessHeroRunData !== 'undefined' && endlessHeroRunData[heroId]) {
             if (!endlessHeroRunData[heroId].statGains) endlessHeroRunData[heroId].statGains = {};
             endlessHeroRunData[heroId].statGains[st] = (endlessHeroRunData[heroId].statGains[st] || 0) + gain;
             endlessHeroRunData[heroId].currentHp = activeUnit.hp;
           }
   
           statLogDetails.push(`${isLucky ? '✨ ' : ''}+${gain} ${STAT_DICT[st]}`);
         });
   
         log(`🎉 [THÁP LEO CẤP!] ${uDisplayName} đạt Cấp ${activeUnit.level}! Nhận: [${statLogDetails.join(', ')}]!`, 'weak');
         if (typeof SoundManager !== 'undefined') SoundManager.playLevelUp();
       }
       saveCombatState();
       return;
     }
   
     const prog = (typeof heroProgress !== 'undefined') ? heroProgress[heroId] : null;
     if (!prog || (prog.level || 1) >= 80) return;
   
     if (!prog.bonus_stats) prog.bonus_stats = { hp: 0, str: 0, mag: 0, dex: 0, spd: 0, def: 0, res: 0, lck: 0, history: {} };
     if (!prog.bonus_stats.history) prog.bonus_stats.history = {};
   
     prog.exp = (prog.exp || 0) + amount;
     log(`📈 [EXP] ${tpl.name} nhận +${amount} EXP (${prog.exp}/100)!`);
   
     while (prog.exp >= 100 && (prog.level || 1) < 80) {
       prog.level = (prog.level || 1) + 1;
       prog.exp -= 100;
   
       const STAT_DICT = { hp: 'HP', str: 'Str', mag: 'Mag', dex: 'Dex', spd: 'Spd', def: 'Def', res: 'Res', lck: 'Lck' };
       const statKeys = Object.keys(STAT_DICT);
       const shuffled = [...statKeys].sort(() => Math.random() - 0.5);
       const pickedStats = shuffled.slice(0, 3);
   
       const statLogDetails = [];
       const thisLevelRoll = {};
       let hpGainThisLevel = 0;
   
       pickedStats.forEach(st => {
         const isLucky = Math.random() < 0.30;
         const gain = isLucky ? 2 : 1;
         thisLevelRoll[st] = gain;
         prog.bonus_stats[st] = (prog.bonus_stats[st] || 0) + gain;
   
         if (st === 'hp') { 
           tpl.maxhp += gain; 
           tpl.hp += gain; 
           hpGainThisLevel += gain;
         } else {
           tpl[st] += gain;
         }
   
         statLogDetails.push(`${isLucky ? '✨ ' : ''}+${gain} ${STAT_DICT[st]}`);
       });
   
       prog.bonus_stats.history[prog.level] = thisLevelRoll;
   
       activeUnit.maxhp = tpl.maxhp;
       activeUnit.hp = Math.min(activeUnit.maxhp, activeUnit.hp + hpGainThisLevel);
       activeUnit.str = tpl.str;
       activeUnit.mag = tpl.mag;
       activeUnit.dex = tpl.dex;
       activeUnit.spd = tpl.spd;
       activeUnit.def = tpl.def;
       activeUnit.res = tpl.res;
   
       log(`🎉 [LEVEL UP!] ${tpl.name} đạt Cấp ${prog.level}! Nhận: [${statLogDetails.join(', ')}]!`, 'weak');
       if (typeof SoundManager !== 'undefined') SoundManager.playLevelUp();
     }
     saveCombatState();
   }
   
   function startBattleEnemyPhase() {
     if (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive && !NetworkManager.isHost) {
       return;
     }
   
     battlePhase = 'enemy';
     renderBattle();
     saveCombatState();
   
     if (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive && NetworkManager.isHost) {
       NetworkManager.send({
         type: 'SYNC_BATTLE_PHASE',
         phase: 'enemy'
       });
     }
   
     runBattleEnemyStep(alive(battleEnemies), 0);
   }
   
   // 🤝 CHỦ PHÒNG QUYẾT ĐỊNH BƯỚC ĐÁNH CỦA QUÁI VÀ ĐIỀU PHỐI QTE
   function runBattleEnemyStep(list, i) {
     if (i >= list.length) {
       if (battleInitiator === 'enemy') {
         // Quái đã đánh xong -> Chuyển sang Player Phase để phe ta đánh trả!
         battlePhase = 'player';
         combatSubTurnIndex = 0;
         battleParty.forEach(u => { u.combatActed = false; });
         log('Lượt phản công của phe ta bắt đầu!');
         renderBattle();
         saveCombatState();
   
         if (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive && NetworkManager.isHost) {
           NetworkManager.send({
             type: 'SYNC_BATTLE_PHASE',
             phase: 'player',
             subTurnIndex: 0
           });
         }
       } else {
         // Phe ta mở màn, quái đánh trả xong -> HẾT HIỆP ĐẤU -> QUAY VỀ MAP!
         log('Hết lượt giao tranh vòng này. Quay lại bản đồ.', 'weak');
         endBattle();
       }
       return;
     }
     const enemy = list[i];
     if (enemy.hp <= 0) { runBattleEnemyStep(list, i + 1); return; }
     const targets = alive(battleParty);
     if (targets.length === 0) { checkBattleOver(); return; }
   
     // Chủ phòng chọn mục tiêu tấn công duy nhất
     const target = targets[rand(0, targets.length - 1)];
     unitsWhoAttackedInCombat.add(enemy.id);
   
     log(`${enemy.short_name || enemy.name} chuẩn bị tung đòn liên hoàn vào ${target.short_name || target.name}...`);
   
     const onStepFinished = () => {
       enemy.combatActed = true;
       renderBattle();
       saveCombatState();
       if (checkBattleOver()) return;
       setTimeout(() => runBattleEnemyStep(list, i + 1), 600);
     };
   
     if (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive) {
       window.pendingCoopEnemyStepDone = onStepFinished;
   
       if (window.coopWatchdogTimer) clearTimeout(window.coopWatchdogTimer);
       window.coopWatchdogTimer = setTimeout(() => {
         if (window.pendingCoopEnemyStepDone) {
           console.warn("Watchdog: tự động giải phóng bước đánh của quái để chống treo");
           const cb = window.pendingCoopEnemyStepDone;
           window.pendingCoopEnemyStepDone = null;
           cb();
         }
       }, 8000);
   
       let targetOwnerId = NetworkManager.myPlayerId;
       const item = Object.values(NetworkManager.coopSquad).find(x => x.heroId === target.id);
       if (item && item.playerId) {
         targetOwnerId = item.playerId;
       }
   
       NetworkManager.send({
         type: 'BATTLE_ENEMY_ATTACK_TARGET',
         enemyId: enemy.id,
         targetId: target.id,
         defenderPlayerId: targetOwnerId
       });
   
       if (targetOwnerId === NetworkManager.myPlayerId) {
         startQTE(enemy, target, onStepFinished);
       } else {
         log(`🛡️ [ĐỒNG ĐỘI ĐANG PARRY] Đang chờ ${target.short_name || target.name} đỡ đòn...`, 'weak');
       }
     } else {
       startQTE(enemy, target, onStepFinished);
     }
   }
   
   function startQTE(enemy, target, onDone) {
     const wrap = document.getElementById('qteWrap');
     const label = document.getElementById('qteLabel');
     const zone = document.getElementById('qteZone');
     const marker = document.getElementById('qteMarker');
     const btn = document.getElementById('qteBtn');
   
     const eName = enemy.short_name || enemy.name;
     const tName = target.short_name || target.name;
   
     wrap.style.display = 'block';
     const totalStrikes = rand(2, 3);
     let currentStrike = 1, pos = 0, done = false, raf = null;
     let zoneStartPct = 0, zoneWidthPct = 14;
   
     function runStrike() {
       pos = 0;
       marker.style.left = '0%';
       zoneStartPct = rand(15, 75);
       zone.style.left = zoneStartPct + '%';
       zone.style.width = zoneWidthPct + '%';
       const strikeSpeed = 1.35 + (currentStrike - 1) * 0.28;
   
       label.innerHTML = `⚔️ ${eName} combo! [Nhịp ${currentStrike}/${totalStrikes}] — Bấm [Space] hoặc click!`;
       btn.innerHTML = `🛡️ Parry [Space] (${currentStrike}/${totalStrikes})`;
   
       function frame() {
         if (done) return;
         pos += strikeSpeed;
         if (pos >= 100) { finish(false); return; }
         marker.style.left = pos + '%';
         raf = requestAnimationFrame(frame);
       }
       raf = requestAnimationFrame(frame);
     }
   
     function onActionTrigger() {
       if (done) return;
       const inZone = pos >= zoneStartPct && pos <= (zoneStartPct + zoneWidthPct);
       if (inZone) {
         if (typeof SoundManager !== 'undefined') SoundManager.playParry();
         cancelAnimationFrame(raf);
         if (currentStrike < totalStrikes) { currentStrike++; runStrike(); }
         else finish(true);
       } else {
         cancelAnimationFrame(raf);
         finish(false);
       }
     }
   
     function onKeyDown(e) {
       if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); onActionTrigger(); }
     }
   
     window.addEventListener('keydown', onKeyDown);
     btn.addEventListener('click', onActionTrigger);
   
     function finish(success) {
       if (done) return;
       done = true;
       cancelAnimationFrame(raf);
       window.removeEventListener('keydown', onKeyDown);
       btn.removeEventListener('click', onActionTrigger);
       wrap.style.display = 'none';
   
       let rawDmg = (enemy.type === 'Magic') ? Math.max(1, enemy.mag - target.res) : Math.max(1, enemy.str - target.def);
       
       if (isEndlessMode && typeof endlessActiveBuffs !== 'undefined' && endlessActiveBuffs.dmg_reduction > 0) {
         rawDmg = Math.max(1, Math.round(rawDmg * (1 - endlessActiveBuffs.dmg_reduction / 100)));
       }
   
       let finalDmg = Math.max(1, rawDmg + rand(-1, 1));
       let counter = Math.max(3, Math.round((target.type === 'Magic' ? target.mag : target.str) * 0.5));
   
       if (success) {
         log(`🌟 HOÀN HẢO! ${tName} parry trúng toàn bộ combo! Phản đòn ${counter} HP!`, 'weak');
         enemy.hp = Math.max(0, enemy.hp - counter);
       } else {
         target.hp = Math.max(0, target.hp - finalDmg);
         log(`💥 ${tName} không parry kịp nhịp ${currentStrike}/${totalStrikes}. -${finalDmg} HP.`, 'dmg');
       }
   
       enemy.combatActed = true;
   
       // 🤝 ĐỒNG BỘ MÁU TUYỆT ĐỐI SANG CHO MÁY ĐỒNG ĐỘI
       if (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive) {
         NetworkManager.send({
           type: 'SYNC_BATTLE_QTE_FINISH',
           enemyId: enemy.id,
           enemyHp: enemy.hp,
           targetId: target.id,
           targetHp: target.hp,
           finalDmg: success ? 0 : finalDmg,
           counter: success ? counter : 0,
           success: success
         });
       }
   
       renderBattle();
       saveCombatState();
   
       if (checkBattleOver()) return;
       if (onDone) setTimeout(onDone, 500);
     }
   
     runStrike();
   }
   
   function checkBattleOver() {
     if (battleEnemies.every(u => u.hp <= 0)) { log('Toán địch bị đánh bại. Quay lại bản đồ.', 'weak'); endBattle(); return true; }
     if (battleParty.every(u => u.hp <= 0)) { log('Toán của bạn gục ngã trong trận giao tranh này.', 'dmg'); endBattle(); return true; }
     return false;
   }
   
   // 🤝 KẾT THÚC COMBAT: ĐỒNG BỘ THOÁT CHO CẢ 2 MÁY CÙNG LÚC
   function endBattle(isRemoteTrigger = false) {
     document.getElementById('qteWrap').style.display = 'none';
     const cb = battleOnEnd; battleOnEnd = null;
     menuUnitId = null; menuStage = null; menuTargets = []; activeMapSkill = null;
     selectedMapId = null; mapReachable = new Map(); clearEnemyDangerZone();
   
     if (isEndlessMode && typeof endlessHeroRunData !== 'undefined') {
       battleParty.forEach(p => {
         if (endlessHeroRunData[p.id]) {
           endlessHeroRunData[p.id].currentHp = p.hp;
         }
       });
     }
   
     if (battleInitiator === 'player') {
       battleParty.forEach(u => {
         if (u.id === mapInitiatorId || unitsWhoAttackedInCombat.has(u.id)) {
           u.moved = true; 
           u.acted = true;
   
           if (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive) {
             NetworkManager.send({
               type: 'UNIT_ACTED',
               unitId: u.id
             });
           }
         } else {
           u.acted = false; u.moved = false;
         }
       });
     } 
     else if (battleInitiator === 'enemy') {
       battleEnemies.forEach(e => {
         if (e.id === mapInitiatorId || unitsWhoAttackedInCombat.has(e.id)) {
           e.moved = true; e.acted = true;
         }
       });
       log(`⚔️ [CÂN BẰNG] Các kẻ địch tham chiến đã hoàn thành lượt trên bản đồ.`, 'weak');
     }
   
     // BÁO CHO MÁY ĐỒNG ĐỘI CÙNG THOÁT KHỎI SÀN ĐẤU VỀ MAP
     if (!isRemoteTrigger && typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive) {
       NetworkManager.send({
         type: 'SYNC_BATTLE_END',
         unitsState: [...battleParty, ...battleEnemies].map(u => ({
           id: u.id,
           hp: u.hp,
           acted: u.acted,
           moved: u.moved
         }))
       });
     }
   
     mapInitiatorId = null;
     unitsWhoAttackedInCombat.clear();
   
     setTimeout(() => {
       switchView('map');
       renderMap();
       saveCombatState();
   
       checkAutoPassCoopTurn();
   
       const playersLeft = alive(units.filter(u => u.team === 'player')).length;
       const enemiesLeft = alive(units.filter(u => u.team === 'enemy')).length;
       if (playersLeft === 0) { mapGameOver(false); return; }
       if (enemiesLeft === 0) { mapGameOver(true); return; }
       if (cb) setTimeout(cb, 300);
     }, 500);
   }
   
   // XỬ LÝ KẾT THÚC TRẬN ĐẤU
   async function mapGameOver(won) {
     mapOver = true;
     clearCombatState();
     const el = document.getElementById('endBanner');
   
     if (isEndlessMode) {
       if (won) {
         const isBossFloor = (endlessCurrentFloor % 5 === 0);
         const isMajorBoss = (endlessCurrentFloor % 10 === 0);
   
         const expReward = 100 + endlessCurrentFloor * 25;
         alive(units.filter(u => u.team === 'player')).forEach(u => gainHeroExp(u.id, expReward));
   
         if (isBossFloor) {
           let awardGems = 300;
           let awardTickets = 0;
   
           if (isMajorBoss) {
             awardGems = 600 + Math.floor((endlessCurrentFloor - 10) / 10) * 400;
             awardTickets = Math.floor(endlessCurrentFloor / 10);
           } else {
             awardGems = 300 + Math.floor((endlessCurrentFloor - 5) / 10) * 200;
           }
   
           if (currentUser) {
             try {
               const fd = new FormData();
               fd.append('floor', endlessCurrentFloor);
               fd.append('gems', awardGems);
               fd.append('tickets', awardTickets);
               const res = await fetch('api.php?action=endless_claim_reward', { method: 'POST', body: fd });
               const d = await res.json();
               if (d.success) {
                 playerGems = d.new_gems;
                 document.getElementById('userGems').textContent = playerGems.toLocaleString();
                 if (document.getElementById('relevelTicketCount')) {
                   document.getElementById('relevelTicketCount').textContent = d.new_tickets;
                 }
                 endlessBestFloor = d.best_floor;
                 if (document.getElementById('endlessBestFloorDisplay')) {
                   document.getElementById('endlessBestFloorDisplay').textContent = `${endlessBestFloor} Tầng`;
                 }
               }
             } catch (e) {}
           } else {
             playerGems += awardGems;
             document.getElementById('userGems').textContent = playerGems.toLocaleString();
           }
   
           if (typeof SoundManager !== 'undefined') SoundManager.playLevelUp();
           mapOver = false;
   
           if (typeof NetworkManager !== 'undefined' && NetworkManager.isCoopActive) {
             if (NetworkManager.isHost && typeof openEndlessBuffModal === 'function') {
               openEndlessBuffModal(awardGems, awardTickets);
             } else {
               log(`🃏 [CHỜ CHỦ PHÒNG] Đang chờ Chủ phòng rút bài Thần Phước tăng sức mạnh toàn đội...`, 'weak');
             }
           } else {
             if (typeof openEndlessBuffModal === 'function') {
               openEndlessBuffModal(awardGems, awardTickets);
             }
           }
           return;
         }
   
         log(`🎉 [VƯỢT TẦNG THÀNH CÔNG] Đã quét sạch Tầng ${endlessCurrentFloor}! Đang tiến lên Tầng ${endlessCurrentFloor + 1}...`, 'weak');
         if (typeof SoundManager !== 'undefined') SoundManager.playLevelUp();
   
         el.className = 'end-banner win';
         el.style.display = 'block';
         el.innerHTML = `
           🏆 <strong>VƯỢT QUA TẦNG ${endlessCurrentFloor}!</strong><br>
           <span style="font-size:13px; font-weight:normal; color:#fff;">Đang chuẩn bị chiến trường Tầng ${endlessCurrentFloor + 1}...</span>
         `;
   
         setTimeout(() => {
           el.style.display = 'none';
           mapOver = false;
           endlessCurrentFloor++;
           if (typeof loadEndlessFloor === 'function') {
             loadEndlessFloor(endlessCurrentFloor);
           }
         }, 1200);
   
       } else {
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
   
         el.className = 'end-banner lose';
         el.style.display = 'block';
         el.innerHTML = `
           💀 <strong>TOÀN ĐỘI BÃI TRẬN TẠI TẦNG ${endlessCurrentFloor}...</strong><br>
           <span style="font-size:13px; font-weight:normal; color:var(--text-2);">
             Kỷ lục lượt leo tháp này: <strong>${reachedFloor} Tầng</strong>! Hãy củng cố đội hình trước khi thử lại.
           </span><br>
           <div style="display:flex; justify-content:center; gap:10px; margin-top:12px;">
             <button class="restart-btn" onclick="startEndlessFromLobby()" style="background:var(--rose); color:#fff; border-color:var(--rose); font-weight:700;">🔄 Thử Lại Từ Tầng 1</button>
             <button class="restart-btn" onclick="finishCampaignAndReturnToLobby()">🏠 Về Sảnh Chính</button>
           </div>
         `;
       }
       return;
     }
   
     el.className = 'end-banner ' + (won ? 'win' : 'lose');
     el.style.display = 'block';
   
     if (won) {
       const awardGems = currentMapData?.reward_gems || 200;
       const awardExp = currentMapData?.reward_exp || 50;
   
       playerGems += awardGems;
       document.getElementById('userGems').textContent = playerGems.toLocaleString();
       alive(units.filter(u => u.team === 'player')).forEach(u => gainHeroExp(u.id, awardExp));
   
       if (currentUser) {
         deployedHeroIds.forEach(async (hId) => {
           const p = heroProgress[hId];
           if (p) {
             const fd = new FormData();
             fd.append('hero_id', hId);
             fd.append('level', p.level);
             fd.append('exp', p.exp);
             fd.append('bonus_stats', JSON.stringify(p.bonus_stats));
             await fetch('api.php?action=save_hero_level_exp', { method: 'POST', body: fd });
           }
         });
   
         const fdGems = new FormData();
         fdGems.append('amount', awardGems);
         fetch('api.php?action=admin_add_gems', { method: 'POST', body: fdGems });
       }
   
       campaignHeroBackupProgress = null;
       if (typeof window.campaignHeroBackupProgress !== 'undefined') window.campaignHeroBackupProgress = null;
   
       el.innerHTML = `
         🏆 <strong>CHIẾN THẮNG HUY HOÀNG!</strong><br>
         <span style="font-size:14px; font-weight:normal; color:#fff;">
           Đã quét sạch toàn bộ lực lượng địch!<br>
           🎁 Phần thưởng: <strong>+${awardGems} 💎 Đá Quý</strong> & <strong>+${awardExp} EXP</strong>!<br>
           ✨ Toàn bộ tiến trình đã được lưu an toàn vào tài khoản!
         </span><br>
         <button class="restart-btn" onclick="finishCampaignAndReturnToLobby()" style="background:var(--gold); color:#12111b; font-weight:800; border:none; padding:10px 24px; margin-top:12px;">Về Sảnh Chính</button>
       `;
     } else {
       if (typeof campaignHeroBackupProgress !== 'undefined' && campaignHeroBackupProgress) {
         heroProgress = JSON.parse(JSON.stringify(campaignHeroBackupProgress));
         campaignHeroBackupProgress = null;
         if (typeof window.campaignHeroBackupProgress !== 'undefined') window.campaignHeroBackupProgress = null;
       }
   
       el.innerHTML = `
         💀 <strong>TOÀN ĐỘI BÃI TRẬN...</strong><br>
         <span style="font-size:13px; font-weight:normal; color:var(--text-2);">
           Trận đánh thất bại. Toàn bộ EXP cày trong trận này đã bị hủy bỏ!<br>
           Hãy cường hóa trang bị trước khi thử lại.
         </span><br>
         <button class="restart-btn" onclick="finishCampaignAndReturnToLobby()" style="margin-top:10px;">Về Sảnh Chính</button>
       `;
     }
   }
   
   function adminInstantWin() {
     if (mapOver) return;
     units.filter(u => u.team === 'enemy').forEach(e => { e.hp = 0; });
     if (typeof battleEnemies !== 'undefined') battleEnemies.forEach(e => { e.hp = 0; });
     log("⚡ [ADMIN] Thắng Trận Ngay!", "weak");
     switchView('map');
     mapGameOver(true);
   }
   window.adminInstantWin = adminInstantWin;
   
   // ==========================================================================
   // 🖱️ BỘ ĐIỀU KHIỂN KÉO RÊ 4 HƯỚNG TỰ DO (360° DRAG-TO-PAN CONTROLLER)
   // ==========================================================================
   function initMapDragPan() {
     const mapCard = document.querySelector('.map-card');
     if (!mapCard) return;
   
     mapCard.addEventListener('mousedown', (e) => {
       if (e.target.closest('button')) return;
   
       isMapPanning = true;
       hasMapDragged = false;
       mapCard.classList.add('is-dragging');
       
       panStartX = e.pageX - mapCard.offsetLeft;
       panStartY = e.pageY - mapCard.offsetTop;
       panScrollLeft = mapCard.scrollLeft;
       panScrollTop = mapCard.scrollTop;
     });
   
     window.addEventListener('mouseup', () => {
       if (isMapPanning) {
         isMapPanning = false;
         mapCard.classList.remove('is-dragging');
         setTimeout(() => {
           hasMapDragged = false;
         }, 50);
       }
     });
   
     mapCard.addEventListener('mousemove', (e) => {
       if (!isMapPanning) return;
       e.preventDefault();
       
       const x = e.pageX - mapCard.offsetLeft;
       const y = e.pageY - mapCard.offsetTop;
       const walkX = (x - panStartX) * 1.2;
       const walkY = (y - panStartY) * 1.2;
       
       if (Math.abs(x - panStartX) > 6 || Math.abs(y - panStartY) > 6) {
         hasMapDragged = true;
       }
       
       mapCard.scrollLeft = panScrollLeft - walkX;
       mapCard.scrollTop = panScrollTop - walkY;
     });
   
     mapCard.addEventListener('click', (e) => {
       if (hasMapDragged) {
         e.stopPropagation();
         e.preventDefault();
         hasMapDragged = false;
       }
     }, true);
   
     let startTouchX = 0, startTouchY = 0;
     let touchScrollLeft = 0, touchScrollTop = 0;
   
     mapCard.addEventListener('touchstart', (e) => {
       if (e.touches.length === 1) {
         startTouchX = e.touches[0].pageX;
         startTouchY = e.touches[0].pageY;
         touchScrollLeft = mapCard.scrollLeft;
         touchScrollTop = mapCard.scrollTop;
         hasMapDragged = false;
       }
     }, { passive: true });
   
     mapCard.addEventListener('touchmove', (e) => {
       if (e.touches.length === 1) {
         const walkX = (e.touches[0].pageX - startTouchX) * 1.2;
         const walkY = (e.touches[0].pageY - startTouchY) * 1.2;
         
         if (Math.abs(walkX) > 6 || Math.abs(walkY) > 6) {
           hasMapDragged = true;
         }
         
         mapCard.scrollLeft = touchScrollLeft - walkX;
         mapCard.scrollTop = touchScrollTop - walkY;
       }
     }, { passive: true });
   }
   
   setTimeout(initMapDragPan, 200);
   
   // ==========================================================================
   // 🤝 HOOK TIẾP NHẬN GÓI TIN COMBAT CO-OP TỪ NETWORK MANAGER
   // ==========================================================================
   function handleCombatNetworkPackets(packet) {
     switch (packet.type) {
       case 'UNIT_MOVE_CANCEL':
         if (typeof syncRemoteUnitMoveCancel === 'function') {
           syncRemoteUnitMoveCancel(packet.unitId, packet.col, packet.row);
         }
         break;
   
       case 'SYNC_COMBAT_SKIP_TURN':
         // 🤝 ĐỒNG BỘ BỎ LƯỢT COMBAT TỪ MÁY ĐỐI PHƯƠNG
         const skipUnit = units.find(u => u.id === packet.unitId);
         if (skipUnit) {
           skipUnit.combatActed = true;
           bIconsLeft = Math.max(0, bIconsLeft - 1);
           log(`${skipUnit.short_name || skipUnit.name} bỏ lượt trong trận giao tranh.`);
           renderBattle();
         }
         break;
   
       case 'SYNC_COMBAT_SUB_TURN':
         combatSubTurnIndex = packet.nextPlayerIndex;
         renderBattle();
         break;
   
       case 'SYNC_BATTLE_PHASE':
         battlePhase = packet.phase;
         if (packet.subTurnIndex !== undefined) {
           combatSubTurnIndex = packet.subTurnIndex;
         }
         // Chỉ làm mới cờ hành động của phe ta, GIỮ NGUYÊN trạng thái của kẻ địch đã đánh
         if (packet.phase === 'player') {
           battleParty.forEach(u => { u.combatActed = false; });
         }
         renderBattle();
         break;
   
       case 'COOP_BATTLE_ENEMY_PHASE':
         if (typeof NetworkManager !== 'undefined' && NetworkManager.isHost) {
           setTimeout(startBattleEnemyPhase, 400);
         }
         break;
   
       case 'REQ_COOP_END_BATTLE':
         // Khách yêu cầu kết thúc trận 4v4 -> Chủ phòng ra lệnh thoát cho cả phòng
         if (typeof NetworkManager !== 'undefined' && NetworkManager.isHost) {
           setTimeout(() => endBattle(), 400);
         }
         break;
   
       case 'BATTLE_ENEMY_ATTACK_TARGET':
         const foe = units.find(u => u.id === packet.enemyId);
         const tgt = units.find(u => u.id === packet.targetId);
         if (foe && tgt) {
           log(`${foe.short_name || foe.name} chuẩn bị tung đòn liên hoàn vào ${tgt.short_name || tgt.name}...`);
           
           // CHỈ MỞ QTE CHO NGƯỜI SỞ HỮU ĐÍCH DANH (DEFENDER_PLAYER_ID)
           const isMeDefender = (packet.defenderPlayerId === NetworkManager.myPlayerId);
   
           if (isMeDefender) {
             startQTE(foe, tgt, () => {
               // Hoàn thành nhịp đỡ đòn
             });
           } else {
             // Người xem chỉ hiển thị dòng thông báo chờ đồng đội đỡ đòn
             log(`🛡️ [ĐỒNG ĐỘI ĐANG PARRY] Đang chờ ${tgt.short_name || tgt.name} đỡ đòn...`, 'weak');
           }
         }
         break;
   
       case 'SYNC_BATTLE_QTE_FINISH':
         if (window.coopWatchdogTimer) clearTimeout(window.coopWatchdogTimer);
   
         const eUnit = units.find(u => u.id === packet.enemyId);
         const tUnit = units.find(u => u.id === packet.targetId);
   
         // ĐỒNG BỘ MÁU TUYỆT ĐỐI & MỜ QUÁI VẬT (35% OPACITY)
         if (tUnit) tUnit.hp = Math.max(0, packet.targetHp);
         if (eUnit) {
           eUnit.hp = Math.max(0, packet.enemyHp);
           eUnit.combatActed = true;
         }
   
         if (packet.success) {
           log(`🌟 [CO-OP PARRY] ${tUnit?.short_name || 'Đồng đội'} đã parry xuất sắc! Phản đòn ${packet.counter} HP!`, 'weak');
         } else {
           log(`💥 [CO-OP] ${tUnit?.short_name || 'Đồng đội'} bị đánh trúng! -${packet.finalDmg} HP.`, 'dmg');
         }
   
         renderBattle();
   
         // Chủ phòng kích hoạt tiếp bước đánh của quái tiếp theo
         if (typeof NetworkManager !== 'undefined' && NetworkManager.isHost && typeof window.pendingCoopEnemyStepDone === 'function') {
           const nextDone = window.pendingCoopEnemyStepDone;
           window.pendingCoopEnemyStepDone = null;
           setTimeout(nextDone, 500);
         }
         break;
   
       case 'SYNC_BATTLE_END':
         // Cả 2 máy cùng thoát khỏi sàn đấu về map
         syncRemoteBattleEnd(packet);
         break;
     }
   }
   window.handleCombatNetworkPackets = handleCombatNetworkPackets;