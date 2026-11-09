/* ==========================================================================
   ADVANCED MULTI-BANNER GACHA SYSTEM ENGINE (js/gacha.js)
   - TỰ ĐỘNG TẬP HỢP TOÀN BỘ VŨ KHÍ 3★ (R) VÀ 4★ (SR) VÀO MỌI LẦN QUAY
   - TỰ ĐỘNG GOM TOÀN BỘ TƯỚNG SR (4★) VÀO BỂ 4★ CỦA BANNER TƯỚNG
   - HỖ TRỢ PHÂN BIỆT RÕ RÀNG: BANNER NHÂN VẬT VS BANNER VŨ KHÍ 5★ (SSR)
   - Quay trúng Vũ Khí 5★ (SSR) sẽ cộng thẳng vào Kho Vũ Khí (x1, x2...)
   - Quay trúng Tướng trùng (cả SSR lẫn SR) tặng Tinh Hoa Đột Phá riêng
   - Cơ chế Soft Pity (từ lần 60) và Hard Pity (lần 80) chuẩn xác
   - HỖ TRỢ HIỂN THỊ ẢNH AVATAR TƯỚNG TRỰC TIẾP TRÊN THẺ KẾT QUẢ TRIỆU HỒI
   ========================================================================== */

   let activeBanners = [];
   let currentBannerIdx = 0;
   
   let bannerClaimed = false;
   let bannerResetTime = 0;
   let srPityCounter = 0;
   let countdownInterval = null;
   
   // 1. TẢI TẤT CẢ BANNER ĐANG KÍCH HOẠT TỪ MYSQL
   async function loadGachaBanners() {
     try {
       const res = await fetch('api.php?action=get_banners');
       const d = await res.json();
       if (d.success && Array.isArray(d.data) && d.data.length > 0) {
         activeBanners = d.data;
       } else {
         activeBanners = [{
           id: 'b_aria', name: 'Nguyện Ước Ánh Bạc — Aria (SSR)', type: 'hero', cost: 200,
           rate_up_id: 'aria', item_name: 'Aria', item_symbol: '剣', item_color: 'var(--teal)',
           pity_max: 80, pool_heroes: 'aria,yuzu,kaito,shirou,celeste', image: ''
         }];
       }
       renderBannerSwitcher();
       displaySelectedBanner();
     } catch (e) {
       console.warn("Lỗi tải banners:", e);
     }
   }
   
   // THANH CHUYỂN ĐỔI GIỮA CÁC BANNER (PHÂN BIỆT TƯỚNG VS VŨ KHÍ)
   function renderBannerSwitcher() {
     const tabsContainer = document.getElementById('gachaBannerTabs');
     if (!tabsContainer) return;
     tabsContainer.innerHTML = '';
   
     activeBanners.forEach((b, idx) => {
       const btn = document.createElement('button');
       btn.className = `gacha-banner-tab-btn ${idx === currentBannerIdx ? 'active' : ''}`;
       const icon = b.type === 'weapon' ? '⚔️' : (b.item_symbol || '👤');
       btn.innerHTML = `<span>${icon}</span> ${b.name.split('—')[0] || b.name}`;
       btn.onclick = () => {
         currentBannerIdx = idx;
         renderBannerSwitcher();
         displaySelectedBanner();
       };
       tabsContainer.appendChild(btn);
     });
   }
   
   // HIỂN THỊ BANNER ĐANG CHỌN
   function displaySelectedBanner() {
     const b = activeBanners[currentBannerIdx];
     if (!b) return;
   
     const isWeaponBanner = (b.type === 'weapon');
     const isStandardBanner = !b.rate_up_id;
     const itemName = b.item_name || b.rate_up_id || (isWeaponBanner ? 'Thần Binh 5★' : 'Tướng 5★');
     const cost = parseInt(b.cost) || 200;
     const cost10 = cost * 10;
   
     // Xử lý background Banner
     const bannerCard = document.getElementById('gachaBannerCard');
     if (bannerCard) {
       if (b.image && b.image.trim() !== '') {
         bannerCard.style.backgroundImage = `linear-gradient(90deg, rgba(18, 17, 27, 0.96) 0%, rgba(27, 25, 48, 0.78) 45%, rgba(18, 17, 27, 0.25) 100%), url('${b.image}')`;
         bannerCard.style.backgroundPosition = 'right center';
         bannerCard.style.backgroundSize = 'cover';
       } else {
         bannerCard.style.backgroundImage = isWeaponBanner 
           ? 'linear-gradient(135deg, #1b1930 0%, #3a2217 100%)'
           : 'linear-gradient(135deg, #1b1930 0%, #2f1d47 100%)';
       }
     }
   
     // Danh sách các mục 5★ (SSR) có trong bể
     let poolNamesText = "Toàn bộ";
     if (b.pool_heroes) {
       const ids = b.pool_heroes.split(',').map(s => s.trim());
       const names = ids.map(id => {
         if (isWeaponBanner) return WEAPON_DATA[id]?.name || id;
         return HERO_TEMPLATES[id]?.name || id;
       });
       if (names.length > 0) poolNamesText = names.join(', ');
     }
   
     document.getElementById('gBannerTitle').textContent = b.name;
   
     if (isStandardBanner) {
       document.getElementById('gBannerTag').textContent = 'BANNER TIÊU CHUẨN';
       document.getElementById('gBannerDesc').innerHTML = `
         Tất cả vật phẩm 5★ (SSR) có trong bể đều có tỉ lệ xuất hiện <strong>chia đều ngang nhau</strong>.<br>
         <span style="display:inline-block; margin-top:6px; color:var(--teal); font-size:12px;">
           🎯 <strong>Bể 5★ (SSR) gồm:</strong> [${poolNamesText}]
         </span>
       `;
     } else {
       document.getElementById('gBannerTag').textContent = isWeaponBanner ? '⚔️ THẦN BINH ĐẶC BIỆT' : '👤 RATE UP TƯỚNG';
       document.getElementById('gBannerDesc').innerHTML = `
         Định mệnh bảo hiểm: <strong>Chắc chắn 100% nhận [${itemName}]</strong> ở lần nổ bảo hiểm đầu tiên!<br>
         Sau đó, [${itemName}] chiếm 25% tỉ lệ trong pool SSR (các vật phẩm khác chiếm 75%).<br>
         <span style="display:inline-block; margin-top:6px; color:var(--teal); font-size:12px;">
           🎯 <strong>Bể 5★ (SSR) gồm:</strong> [${poolNamesText}]
         </span>
       `;
     }
   
     document.getElementById('gBannerPityMax').textContent = b.pity_max || 80;
   
     const actionBox = document.getElementById('gachaActionButtons');
     if (actionBox) {
       actionBox.innerHTML = `
         <button class="btn-summon btn-single" onclick="rollGacha(1)">Quay x1 (💎 ${cost})</button>
         <button class="btn-summon btn-multi" onclick="rollGacha(10)">Quay x10 (💎 ${cost10.toLocaleString()})</button>
       `;
     }
   
     updateGachaBannerUI();
     startBannerCountdown();
   }
   
   function updateGachaBannerUI() {
     const b = activeBanners[currentBannerIdx];
     const isStandardBanner = !b?.rate_up_id;
     const isWeaponBanner = (b?.type === 'weapon');
     const itemName = b?.item_name || b?.rate_up_id || (isWeaponBanner ? 'Vũ khí 5★' : 'Tướng 5★');
   
     const pityEl = document.getElementById('pityCount');
     if (pityEl) pityEl.textContent = pityCounter;
   
     const statusEl = document.getElementById('bannerStatusBadge');
     const timerEl = document.getElementById('bannerTimer');
   
     if (statusEl) {
       if (isStandardBanner) {
         statusEl.innerHTML = `<span style="color:var(--text-2); font-weight:700;">🎲 TẤT CẢ VẬT PHẨM 5★ CHIA ĐỀU TỈ LỆ</span>`;
       } else if (!bannerClaimed) {
         statusEl.innerHTML = `<span style="color:var(--teal); font-weight:800;">🎯 BẢO HIỂM 100% RA [${itemName.toUpperCase()}] Ở LẦN ${b?.pity_max || 80}</span>`;
       } else {
         statusEl.innerHTML = `<span style="color:var(--gold); font-weight:800;">⚠️ ĐÃ NHẬN (${itemName}: 25% | Khác: 75%)</span>`;
       }
     }
   
     if (timerEl) {
       if (isStandardBanner) {
         timerEl.innerHTML = `<span style="color:var(--text-3); font-weight:normal;">Không áp dụng (Banner vĩnh viễn)</span>`;
       } else if (!bannerClaimed || bannerResetTime === 0) {
         timerEl.innerHTML = `<span style="color:var(--text-3); font-weight:normal;">Chưa kích hoạt (Chỉ đếm ngược 4 ngày sau khi quay ra ${itemName})</span>`;
       }
     }
   }
   
   function startBannerCountdown() {
     if (countdownInterval) clearInterval(countdownInterval);
   
     countdownInterval = setInterval(() => {
       const timerEl = document.getElementById('bannerTimer');
       if (!timerEl) return;
       const b = activeBanners[currentBannerIdx];
       if (!b?.rate_up_id || !bannerClaimed || bannerResetTime === 0) return;
   
       const now = Math.floor(Date.now() / 1000);
       const diff = Math.max(0, bannerResetTime - now);
   
       if (diff <= 0) {
         timerEl.textContent = "Chu kỳ đã kết thúc! Đang hồi phục bảo hiểm 100%...";
         bannerClaimed = false;
         bannerResetTime = 0;
         updateGachaBannerUI();
         return;
       }
   
       const d = Math.floor(diff / 86400);
       const h = Math.floor((diff % 86400) / 3600);
       const m = Math.floor((diff % 3600) / 60);
       const s = diff % 60;
       timerEl.textContent = `${d} ngày ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
     }, 1000);
   }
   
   // ==========================================================================
   // 2. THUẬT TOÁN QUAY GACHA (ĐỒNG BỘ ẢNH AVATAR TƯỚNG & ẢNH VŨ KHÍ)
   // ==========================================================================
   async function rollGacha(times) {
     const curBanner = activeBanners[currentBannerIdx];
     const unitCost = curBanner ? (parseInt(curBanner.cost) || 200) : 200;
     const cost = times === 10 ? (unitCost * 10) : unitCost;
   
     if (playerGems < cost) {
       alert("❌ Bạn không đủ Đá Quý! Hãy nhập mã quà tặng hoặc nạp từ Admin Bar.");
       return;
     }
   
     playerGems -= cost;
     document.getElementById('userGems').textContent = playerGems.toLocaleString();
   
     const results = [];
     const isWeaponBanner = (curBanner?.type === 'weapon');
     const rateUpId = curBanner?.rate_up_id || '';
     const isStandard = (rateUpId === '');
   
     // 1. TỰ ĐỘNG TẬP HỢP TOÀN BỘ VŨ KHÍ 3★ (R) VÀ 4★ (SR) ĐANG CÓ TRONG GAME
     const allWeapons = (typeof WEAPON_DATA !== 'undefined') ? Object.values(WEAPON_DATA) : [];
     
     let dynamicSR = allWeapons.filter(w => w.rarity === 'SR').map(w => ({
       id: w.id, name: w.name, type: `Vũ khí 4★ (${w.type})`, symbol: w.icon || '⚔️', color: 'var(--sr)', rarity: 'SR', isWeapon: true, image: w.image || ''
     }));
     if (dynamicSR.length === 0) dynamicSR = GACHA_POOL.SR;
   
     // 2. TỰ ĐỘNG GOM TOÀN BỘ TƯỚNG SR (4★) ĐANG CÓ VÀO BỂ 4★ CỦA BANNER TƯỚNG
     const allSRHeroes = Object.values(HERO_TEMPLATES).filter(h => h.team === 'player' && h.rarity === 'SR').map(h => ({
       id: h.id, name: h.name, type: `Nhân vật 4★ (${h.cls})`, symbol: h.symbol, color: h.color || 'var(--sr)', rarity: 'SR', isWeapon: false, avatar: h.avatar || ''
     }));
   
     if (!isWeaponBanner && allSRHeroes.length > 0) {
       dynamicSR = [...dynamicSR, ...allSRHeroes];
     }
   
     let dynamicR = allWeapons.filter(w => w.rarity === 'R').map(w => ({
       id: w.id, name: w.name, type: `Vũ khí 3★ (${w.type})`, symbol: w.icon || '⚔️', color: 'var(--r)', rarity: 'R', isWeapon: true, image: w.image || ''
     }));
     if (dynamicR.length === 0) dynamicR = GACHA_POOL.R;
   
     // 3. TẠO BỂ 5★ (SSR) TÙY THEO LOẠI BANNER
     let bannerSSRItems = [];
     let allowedIds = curBanner?.pool_heroes ? curBanner.pool_heroes.split(',').map(s => s.trim()) : [];
   
     // A. BỂ 5★ VŨ KHÍ
     if (isWeaponBanner) {
       const allSSRWeapons = allWeapons.filter(w => w.rarity === 'SSR').map(w => ({
         id: w.id, name: w.name, type: `Thần Binh 5★ (${w.type})`, symbol: w.icon || '⚔️', color: 'var(--gold)', rarity: 'SSR', isWeapon: true, image: w.image || ''
       }));
       bannerSSRItems = allowedIds.length > 0 ? allSSRWeapons.filter(w => allowedIds.includes(w.id)) : allSSRWeapons;
       if (bannerSSRItems.length === 0) bannerSSRItems = allSSRWeapons;
     } 
     // B. BỂ 5★ NHÂN VẬT
     else {
       const allSSRHeroes = Object.values(HERO_TEMPLATES).filter(h => h.team === 'player' && (h.rarity === 'SSR' || !h.rarity)).map(h => ({
         id: h.id, name: h.name, type: `Nhân vật (${h.cls})`, symbol: h.symbol, color: h.color, rarity: 'SSR', isWeapon: false, avatar: h.avatar || ''
       }));
       bannerSSRItems = allowedIds.length > 0 ? allSSRHeroes.filter(h => allowedIds.includes(h.id)) : allSSRHeroes;
       if (bannerSSRItems.length === 0) bannerSSRItems = allSSRHeroes;
     }
   
     const rateUpItem = rateUpId ? bannerSSRItems.find(x => x.id === rateUpId) : null;
     const offRatePool = rateUpItem ? bannerSSRItems.filter(x => x.id !== rateUpItem.id) : bannerSSRItems;
     const hardPityCap = curBanner ? (parseInt(curBanner.pity_max) || 80) : 80;
   
     for (let i = 0; i < times; i++) {
       pityCounter++;
       srPityCounter++;
   
       let ssrRate = 0.018; // Base 1.8%
       if (pityCounter >= 60) ssrRate += (pityCounter - 59) * 0.045; // Soft pity
       if (pityCounter >= hardPityCap) ssrRate = 1.0; // Hard pity
   
       const roll = Math.random();
       let rarity = 'R';
       let item = null;
   
       // NỔ 5★ (SSR)
       if (roll < ssrRate) {
         rarity = 'SSR';
         pityCounter = 0;
         srPityCounter = 0;
   
         if (isStandard || !rateUpItem) {
           item = bannerSSRItems[Math.floor(Math.random() * bannerSSRItems.length)] || bannerSSRItems[0];
           log(`🌟 NỔ 5★: Triệu hồi thành công [${item.name}]!`, 'weak');
         } else {
           if (!bannerClaimed) {
             item = rateUpItem;
             bannerClaimed = true;
             bannerResetTime = Math.floor(Date.now() / 1000) + (4 * 86400);
             log(`👑 ĐỊNH MỆNH BANNER: Chúc mừng bạn đã trúng [${rateUpItem.name}] (100% Guaranteed)!`, 'weak');
           } else {
             if (Math.random() < 0.25 || offRatePool.length === 0) {
               item = rateUpItem;
               log(`✨ May mắn! Bạn tiếp tục quay trúng [${rateUpItem.name}] (25%)!`, 'weak');
             } else {
               item = offRatePool[Math.floor(Math.random() * offRatePool.length)];
               log(`🌟 Triệu hồi thành công 5★: [${item.name}]!`, 'weak');
             }
           }
         }
       } 
       // NỔ 4★ (SR)
       else if (roll < (ssrRate + 0.12) || srPityCounter >= 10 || (times === 10 && i === 9 && !results.some(r => r.rarity === 'SSR' || r.rarity === 'SR'))) {
         rarity = 'SR';
         srPityCounter = 0;
         item = dynamicSR[Math.floor(Math.random() * dynamicSR.length)];
         if (!item.isWeapon) {
           log(`✨ NỔ 4★: Triệu hồi thành công Tướng [${item.name}]!`, 'weak');
         }
       } 
       // NỔ 3★ (R)
       else {
         rarity = 'R';
         item = dynamicR[Math.floor(Math.random() * dynamicR.length)];
       }
   
       // XỬ LÝ LƯU KHO SAU KHI QUAY TRÚNG:
       let isDupe = false;
       
       if ((rarity === 'SSR' || rarity === 'SR') && !item.isWeapon && HERO_TEMPLATES[item.id]) {
         if (!heroProgress[item.id]) {
           heroProgress[item.id] = { level: 1, exp: 0, maxExp: 100, equipped_weapon: null, constellation: 0, shards: 0 };
         }
         if (ownedHeroes.includes(item.id)) {
           isDupe = true;
           heroProgress[item.id].shards = (heroProgress[item.id].shards || 0) + 1;
           log(`🔮 Nhận được 1 [Tinh Hoa ${item.name}]! Kích hoạt Cung Mệnh trong trang Nhân Vật.`, 'weak');
         } else {
           ownedHeroes.push(item.id);
           heroProgress[item.id].constellation = 0;
           heroProgress[item.id].shards = 0;
           log(`🎒 TƯỚNG MỚI (${rarity}): [${item.name}] gia nhập đội ngũ (C0)!`, 'weak');
         }
       }
   
       if (item.isWeapon || WEAPON_DATA[item.id]) {
         userWeaponsInventory[item.id] = (userWeaponsInventory[item.id] || 0) + 1;
         if (rarity === 'SSR') {
           log(`⚔️ KHO ĐỒ: Đã cất Thần Binh 5★ [${item.name}] vào Kho Trang Bị!`, 'weak');
         }
       }
   
       results.push({ ...item, rarity, isDupe });
     }
   
     updateGachaBannerUI();
     startBannerCountdown();
     showGachaModal(results);
   
     if (currentUser) {
       try {
         const form = new FormData();
         form.append('gems', playerGems);
         form.append('pity', pityCounter);
         form.append('banner_claimed', bannerClaimed ? 1 : 0);
         form.append('banner_reset_time', bannerResetTime);
         form.append('items', JSON.stringify(results));
         await fetch('api.php?action=save_gacha', { method: 'POST', body: form });
       } catch (e) {
         console.warn("Lỗi lưu gacha:", e);
       }
     }
   }
   
   // ==========================================================================
   // 3. BẢNG KẾT QUẢ TRIỆU HỒI (HỖ TRỢ HIỂN THỊ ẢNH AVATAR HOẶC VŨ KHÍ)
   // ==========================================================================
   function showGachaModal(results) {
     const modal = document.getElementById('gachaModal');
     const grid = document.getElementById('gachaResultsGrid');
     grid.innerHTML = '';
   
     results.forEach(res => {
       const card = document.createElement('div');
       card.className = `gacha-card ${res.rarity.toLowerCase()}`;
       const stars = res.rarity === 'SSR' ? '★★★★★' : (res.rarity === 'SR' ? '★★★★' : '★★★');
   
       // Kiểm tra xem có ảnh avatar (nếu là tướng) hoặc ảnh vũ khí (nếu là vũ khí)
       let iconHtml = res.symbol || '⚔️';
       const heroTpl = (typeof HERO_TEMPLATES !== 'undefined') ? HERO_TEMPLATES[res.id] : null;
       const weapData = (typeof WEAPON_DATA !== 'undefined') ? WEAPON_DATA[res.id] : null;
       
       const avatarSrc = res.avatar || heroTpl?.avatar || '';
       const weaponImgSrc = res.image || weapData?.image || '';

       if (!res.isWeapon && avatarSrc && avatarSrc.trim() !== '') {
         iconHtml = `<img src="${avatarSrc}" style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block; pointer-events:none;">`;
       } else if (res.isWeapon && weaponImgSrc && weaponImgSrc.trim() !== '') {
         iconHtml = `<img src="${weaponImgSrc}" style="width:100%; height:100%; object-fit:contain; display:block; pointer-events:none;">`;
       }

       card.innerHTML = `
         ${res.isDupe ? `<span class="gacha-dupe-tag">🔮 +1 TINH HOA ${res.name.toUpperCase()}</span>` : ''}
         <div class="gacha-rarity">${res.rarity} ${stars}</div>
         <div class="gacha-icon" style="background:${res.color || 'var(--panel-2)'}; color:#12111b; overflow:hidden;">${iconHtml}</div>
         <div class="gacha-name">${res.name}</div>
         <div class="gacha-type">${res.type}</div>
       `;
       grid.appendChild(card);
     });
   
     modal.classList.add('active');
   }
   
   function closeGachaModal() {
     document.getElementById('gachaModal').classList.remove('active');
   }
   
   loadGachaBanners();