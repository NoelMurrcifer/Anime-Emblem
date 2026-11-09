<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Anime Emblem — JRPG Tactics</title>
<link rel="stylesheet" href="css/style.css?v=<?= time(); ?>">
</head>
<body>

<!-- MÀN HÌNH CHÀO MỪNG (TITLE SCREEN) -->
<div id="landingScreen" class="landing-screen">
  <div class="landing-backdrop"></div>
  <div class="landing-content">
    <div class="landing-badge">TACTICAL JRPG & GACHA</div>
    <div class="landing-logo-wrap">
      <img src="img/logo.png" alt="Anime Emblem Logo" class="landing-logo-img">
    </div>
    <p class="landing-desc">Hành trình bảo vệ vương quyền — Định mệnh hộidhkasldklasj ngộ</p>
    
    <button class="btn-play-game" id="btnStartGame" onclick="handleStartGame()">
      <span class="btn-shine"></span>
      ⚔️ BẮT ĐẦU PHIÊU LƯU ⚔️
    </button>

    <div class="landing-user-status" id="landingUserStatus">Đang kiểm tra tài khoản...</div>
  </div>
</div>

<div class="wrap">
  <!-- THANH CÔNG CỤ TEST ADMIN CONSOLE -->
  <div id="adminCheatBar" class="admin-cheat-bar" style="display:none;">
    <span>⚡ <strong>ADMIN CONSOLE:</strong></span>
    <a href="admin.php" class="admin-btn highlight" style="text-decoration:none; display:inline-flex; align-items:center; gap:4px;">
      🛠️ MỞ ADMIN PANEL
    </a>
    <button class="admin-btn" onclick="adminAddGems(5000)">+5,000 💎</button>
    <button class="admin-btn" onclick="adminAddGems(50000)">+50,000 💎</button>
    <button class="admin-btn" onclick="adminSetPity(59)">🎯 Set Pity 59 (Soft Pity)</button>
    <button class="admin-btn highlight" onclick="adminSetPity(79)">🎯 Set Pity 79 (Nổ SSR)</button>
    <button class="admin-btn" onclick="adminResetCycle()">🔄 Reset Chu Kỳ 4 Ngày</button>
    <button class="admin-btn highlight" onclick="adminAddRomance(30)">💖 +30 Hảo Cảm</button>
    <button class="admin-btn" style="border-color:var(--rose); color:var(--rose);" onclick="testCritCutIn()">⚡ Test Cut-in</button>
    <button class="admin-btn" style="border-color:#3a86ff; color:#3a86ff;" onclick="testSkillCutIn()">🔥 Test Skill Cut-in</button>
    <button class="admin-btn highlight" onclick="adminAddBreakthroughShard()">🔮 +1 Tinh Hoa Đột Phá</button>
    <button class="admin-btn" style="background:var(--gold); color:#12111b; font-weight:800; border-color:var(--gold);" onclick="adminInstantWin()">🏆 Thắng Trận Ngay</button>
    <button class="admin-btn highlight" onclick="adminAddTickets(5)">🎟️ +5 Vé Tẩy Cấp</button>
    <button class="admin-btn" style="border-color:var(--rose); color:var(--rose); font-weight:700;" onclick="adminJumpEndlessFloor()">🏰 Nhảy Tầng Tháp</button>
  </div>

  <header class="main-header">
    <div class="brand">
    <img src="img/logo.png" alt="Anime Emblem Logo" class="brand-logo">
    </div>
    <div class="header-right">
      <!-- THANH KÉO ÂM LƯỢNG -->
      <div class="volume-pill">
        <span id="volumeIcon" style="cursor:pointer;" onclick="SoundManager.toggleQuickMute()" title="Bấm để tắt/bật nhanh">🔊</span>
        <input type="range" id="volumeSlider" min="0" max="100" value="50" class="volume-range" oninput="SoundManager.setMasterVolume(this.value)">
        <span id="volumePercent" class="volume-text">50%</span>
      </div>
      
      <div class="currency-pill">💎 <span id="userGems">0</span> Đá</div>
      <div id="userAccountSection" class="user-account-pill">
        <span id="userNameDisplay">Đang tải...</span>
        <button class="auth-btn-small" id="authActionBtn" onclick="openAuthModal()">Đăng nhập</button>
      </div>

      <!-- CÁC TAB ĐIỀU HƯỚNG CHÍNH -->
      <nav class="nav-tabs" id="mainNavTabs">
        <button class="tab-btn active" id="tabBtnHome" onclick="switchMainTab('homeTab', event)">🏠 Sảnh Chính</button>
        <button class="tab-btn" id="tabBtnChar" onclick="switchMainTab('charTab', event)">👤 Nhân Vật</button>
        <button class="tab-btn" id="tabBtnGacha" onclick="switchMainTab('gachaTab', event)">🎰 Triệu Hồi (Gacha)</button>
        <button class="tab-btn" id="tabBtnEvents" onclick="switchMainTab('eventTab', event)">🎁 Sự Kiện</button>
      </nav>
    </div>
  </header>

  <!-- ==================== TAB 0: MENU SẢNH CHÍNH (MAIN LOBBY) ==================== -->
  <div id="homeTab" class="tab-content active">
    <div class="lobby-container">
      
      <!-- CỘT TRÁI: NHÂN VẬT ĐẠI DIỆN SẢNH (ADJUTANT) -->
      <div class="lobby-adjutant-card">
        <div class="adjutant-speech-bubble" id="adjutantDialogue">
          "Báo cáo Chỉ huy! Toàn đội đã sẵn sàng nhận lệnh xuất kích."
        </div>
        
        <div class="adjutant-visual">
          <div class="adjutant-avatar-halo"></div>
          
          <!-- KHUNG CHÂN DUNG ĐẠI DIỆN SẢNH (HIỆN ẢNH THẺ HOẶC BADGE NẾU CHƯA CÓ ẢNH) -->
          <div class="adjutant-portrait-wrap" id="adjutantPortraitWrap">
            <img src="" alt="Adjutant Portrait" id="adjutantPortraitImg" class="adjutant-portrait-img" style="display:none;">
            <div class="adjutant-badge-big" id="adjutantBadge">剣</div>
          </div>

          <div class="adjutant-name-tag">
            <span class="adjutant-role">NHÂN VẬT ĐẠI DIỆN</span>
            <h3 id="adjutantName">Aria — Vanguard (SSR)</h3>
            
            <div class="romance-bar-wrap" style="margin-top:8px;">
              <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:3px;">
                <span>💖 Quan Hệ: <strong id="adjutantRomanceRank" style="color:var(--teal)">Đồng Đội</strong></span>
                <span id="adjutantRomancePts">20 Pts</span>
              </div>
              <div style="height:6px; background:var(--line); border-radius:3px; overflow:hidden;">
                <div id="adjutantRomanceFill" style="height:100%; width:20%; background:linear-gradient(90deg, var(--teal), var(--rose)); transition:width 0.4s;"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="adjutant-actions">
          <button class="action-btn" onclick="openPrepModal()">👥 Đội Hình</button>
          <button class="action-btn" onclick="switchMainTab('charTab')">👤 Nhân Vật</button>
          <button class="action-btn" onclick="openSupportModal()">📖 Sổ Tay Quan Hệ</button>
          <button class="action-btn" onclick="switchMainTab('eventTab')">🎁 Nhận Quà</button>
        </div>
      </div>

      <!-- CỘT PHẢI: TRUNG TÂM CÁC CHẾ ĐỘ CHƠI (OPERATION HUB) -->
      <div class="lobby-modes-hub">
        <div class="hub-header">
          <h3>🎯 TRUNG TÂM TÁC CHIẾN (OPERATIONS)</h3>
          <span class="hub-subtitle">Chọn chế độ để tham gia chiến đấu</span>
        </div>

        <!-- 1. CHIẾN DỊCH CHÍNH (BẤM VÀO ĐỂ CHỌN ẢI) -->
        <div class="mode-card primary" onclick="startCampaignFromLobby()">
          <span class="mode-tag active">BETA</span>
          <div class="mode-icon">⚔️</div>
          <div class="mode-info">
            <h4 class="mode-title">CHIẾN DỊCH CHÍNH (CAMPAIGN)</h4>
            <p class="mode-desc">Bản đồ chiến thuật bàn cờ theo lượt. Tiến đánh các cứ điểm tiêu diệt Shade Knight.</p>
            <span class="mode-btn-text">Chọn Màn Chơi ➔</span>
          </div>
        </div>

        <!-- 2. THÁP VÔ TẬN (ENDLESS TOWER) -->
        <div class="mode-card primary" style="border-color:var(--rose); background:linear-gradient(135deg, #1b1930 0%, #35172b 100%);" onclick="startEndlessFromLobby()">
          <span class="mode-tag active" style="background:var(--rose); color:#fff;">BETA</span>
          <div class="mode-icon" style="background:rgba(232,86,124,0.18); border-color:var(--rose);">💀</div>
          <div class="mode-info">
            <h4 class="mode-title" style="color:var(--rose);">THÁP VÔ TẬN (ENDLESS TOWER)</h4>
            <p class="mode-desc">Thử thách Roguelite: Bắt đầu từ Lv.1, bảo tồn Cung mệnh & Vũ khí. Diệt Boss mỗi 5 tầng rút Bài Buff, săn Đá Quý & Vé Tẩy Cấp!</p>
            <span class="mode-btn-text" style="color:var(--rose);">Bắt Đầu Leo Tháp ➔</span>
          </div>
        </div>

        <!-- 3. LIÊN MINH CO-OP (ĐÃ MỞ KHÓA) -->
        <div class="mode-card primary" style="border-color:#3a86ff; background:linear-gradient(135deg, #1b1930 0%, #152542 100%);" onclick="openCoopModal()">
          <span class="mode-tag active" style="background:#3a86ff; color:#fff;">ONLINE / LAN</span>
          <div class="mode-icon" style="background:rgba(58,134,255,0.18); border-color:#3a86ff;">🤝</div>
          <div class="mode-info">
            <h4 class="mode-title" style="color:#3a86ff;">LIÊN MINH HỢP TÁC (CO-OP MULTIPLAYER)</h4>
            <p class="mode-desc">Tổ đội 2 - 4 người cùng leo Tháp Vô Tận. Chia nhau điều khiển 4 nhân vật, phối hợp vượt ải theo lượt!</p>
            <span class="mode-btn-text" style="color:#3a86ff;">Tạo / Vào Phòng Co-op ➔</span>
          </div>
        </div>
      </div>

    </div>
  </div>

  <!-- ==================== TAB NHÂN VẬT (GENSHIN / WUWA STYLE) ==================== -->
  <div id="charTab" class="tab-content">
    <div class="char-screen-layout">
      
      <!-- CỘT 1: DANH SÁCH TƯỚNG SỞ HỮU -->
      <div class="char-roster-sidebar" id="charRosterList"></div>

      <!-- CỘT 2: KHU VỰC HIỂN THỊ CHI TIẾT -->
      <div class="char-main-panel">
        
        <!-- HEADER THÔNG TIN CHÍNH -->
        <div class="char-top-summary">
          <div class="char-hero-left">
            <div class="char-hero-badge" id="cHeroBadge">剣</div>
            <div class="char-hero-title">
              <div class="char-hero-type" id="cHeroType">Vanguard · Physical</div>
              <h2 class="char-hero-name" id="cHeroName">Aria</h2>
              <div class="char-level-box">
                <span class="char-lv-tag" id="cHeroLevel">Lv. 1 / 80</span>
                <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
                  <button class="action-btn relevel-btn" onclick="openRelevelModal()" style="border-color:var(--gold); color:var(--gold); font-weight:800; display:inline-flex; align-items:center; gap:6px;">
                    🔄 Tẩy Cấp (Re-Level)
                  </button>
                  <button class="action-btn" id="btnSetAdjutant" onclick="setHeroAsAdjutant(selectedCharProfileId)" style="border-color:var(--rose); color:var(--rose); font-weight:800; display:inline-flex; align-items:center; gap:6px;">
                    💖 Đặt Làm Đại Diện
                  </button>
                </div>
                <div class="char-exp-bar"><div class="fill" id="cHeroExpFill" style="width: 20%;"></div></div>
                <span class="char-exp-text" id="cHeroExpText">20 / 100 EXP (Tăng cấp qua chiến đấu)</span>
              </div>
            </div>
          </div>

          <!-- THẺ CARD ẢNH NHÂN VẬT -->
          <div class="char-hero-right-card" id="cHeroRightCard">
            <img src="" alt="Hero Portrait" id="cHeroPortraitImg" class="char-portrait-img">
            <div class="char-portrait-overlay"></div>
            <div class="char-portrait-fallback" id="cHeroPortraitFallback">
              <div class="fallback-badge" id="cFallbackBadge">剣</div>
              <span>Chưa có ảnh Card</span>
            </div>
          </div>
        </div>

        <!-- 3 SUB-TABS ĐIỀU HƯỚNG -->
        <div class="char-sub-nav">
          <button class="char-sub-btn active" id="btnSubAttr" onclick="switchCharSubTab('attr')">📊 Thuộc Tính</button>
          <button class="char-sub-btn" id="btnSubWeap" onclick="switchCharSubTab('weap')">⚔️ Vũ Khí</button>
          <button class="char-sub-btn" id="btnSubConst" onclick="switchCharSubTab('const')">🌟 Cung Mệnh (Đột Phá)</button>
        </div>

        <!-- 1. SUB-VIEW: THUỘC TÍNH 8 CHỈ SỐ -->
        <div class="char-sub-content active" id="subViewAttr">
          <div class="char-stats-detailed" id="cStatsDetailed"></div>
        </div>

        <!-- 2. SUB-VIEW: TRANG BỊ VŨ KHÍ -->
        <div class="char-sub-content" id="subViewWeap">
          <div class="char-weapon-panel">
            <div class="current-weapon-card" id="cCurrentWeaponCard"></div>
            <h4 style="font-size:13px; color:var(--gold); margin:16px 0 10px;">🎒 KHO VŨ KHÍ CÓ THỂ TRANG BỊ:</h4>
            <div class="available-weapons-grid" id="cAvailableWeapons"></div>
          </div>
        </div>

        <!-- 3. SUB-VIEW: CUNG MỆNH (6 TẦNG) -->
        <div class="char-sub-content" id="subViewConst">
          <div class="constellation-header" style="margin-bottom:12px;">
            <span style="font-size:13px; color:var(--text-2);">Tiến độ đột phá từ Gacha: <strong id="cConstCount" style="color:var(--gold);">Tầng 0 / 6</strong></span>
          </div>
          <div class="constellation-tree" id="cConstellationList"></div>
        </div>

      </div>

    </div>
  </div>

  <!-- ==================== TAB 1: CHIẾN TRƯỜNG & COMBAT ==================== -->
  <div id="tacticsTab" class="tab-content">
    <p class="subtitle">Đồng đội và kẻ địch đứng trong phạm vi 4 ô chữ thập xung quanh đều sẽ cùng tham chiến (Tối đa 4vs4)!</p>

    <!-- THANH THEO DÕI TẦNG THÁP VÔ TẬN -->
    <div id="endlessFloorBanner" style="display:none; background:linear-gradient(90deg, rgba(232,86,124,0.18), rgba(27,25,48,0.85)); border:1px solid var(--rose); border-radius:10px; padding:10px 16px; margin-bottom:12px; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="font-size:22px;">🏰</span>
        <div>
          <strong style="color:var(--rose); font-size:15px;" id="endlessFloorTitle">THÁP VÔ TẬN — TẦNG 1</strong>
          <div style="font-size:11px; color:var(--text-3);" id="endlessFloorSubtitle">Tiêu diệt toàn bộ kẻ địch để tiến lên tầng kế tiếp</div>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:14px; font-size:12px;">
        <span>🏆 Kỷ lục: <strong id="endlessBestFloorDisplay" style="color:var(--gold);">0 Tầng</strong></span>
        <button class="action-btn" onclick="quitEndlessRun()" style="padding:5px 12px; font-size:11px; border-color:var(--danger); color:var(--danger);">🏳️ Rút Lui Khỏi Tháp</button>
      </div>
    </div>

    <div id="endBanner" class="end-banner"></div>

    <div id="mapView">
      <div class="phase-banner">
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="phase-pill player" id="mapPhasePill">Player phase</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <button class="end-turn" id="endTurnBtn">Kết thúc lượt</button>
          <button class="action-btn" id="campaignSurrenderBtn" onclick="surrenderCampaignBattle()" style="border-color:var(--danger); color:var(--danger); padding:8px 14px; font-weight:700;">🏳️ Rút Lui</button>
        </div>
      </div>
      <div class="layout">
        <div class="card map-card">
          <div class="map" id="map"></div>
          <div class="legend">
            <span><i style="background:var(--tile-plain)"></i>Đồng bằng (1 MP)</span>
            <span><i style="background:var(--tile-forest)"></i>Rừng (2 MP)</span>
            <span><i style="background:var(--tile-wall)"></i>Chướng ngại</span>
            <span><i style="background:#143659; border:1px solid #1e4e79;"></i>Nước</span>
            <span><i style="background:var(--range-fill);border:1px solid var(--range-border)"></i>Tầm di chuyển</span>
          </div>
        </div>
        <div class="sidebar">
          <div class="card unit-info">
            <h3>NHÂN VẬT ĐANG CHỌN</h3>
            <div id="unitInfo"><p class="empty">Bấm vào 1 nhân vật trên bản đồ để xem chỉ số.</p></div>
          </div>
        </div>
      </div>
    </div>

    <div id="battleView">
      <div class="phase-banner">
        <span class="phase-pill battle" id="bPhasePill">Battle — player phase</span>
        <div class="icons" id="bIcons"></div>
      </div>
      <div class="b-arena">
        <div class="b-side"><h4>PHE BẠN (TỐI ĐA 4)</h4><div id="bPlayerSide"></div></div>
        <div class="b-side"><h4>ĐỊCH (TỐI ĐA 4)</h4><div id="bEnemySide"></div></div>
      </div>
      <div class="b-action-panel" id="bActionPanel"><span class="hint">Bấm vào 1 nhân vật phe bạn để chọn hành động.</span></div>
      <div class="qte-wrap" id="qteWrap" style="display:none;">
        <div class="qte-label" id="qteLabel"></div>
        <div class="qte-track"><div class="qte-zone" id="qteZone"></div><div class="qte-marker" id="qteMarker"></div></div>
        <button class="qte-btn" id="qteBtn">Parry!</button>
      </div>
    </div>

    <div class="card log" id="log"></div>
  </div>

  <!-- ==================== TAB 2: GIAO DIỆN GACHA ==================== -->
  <div id="gachaTab" class="tab-content">
    <div class="gacha-container">
      
      <!-- THANH CHUYỂN ĐỔI BANNER -->
      <div class="gacha-banner-switcher" id="gachaBannerTabs"></div>

      <!-- BANNER ĐANG CHỌN -->
      <div class="gacha-banner-card" id="gachaBannerCard">
        <span class="banner-tag" id="gBannerTag">RATE UP ĐẶC BIỆT</span>
        <h2 class="banner-title" id="gBannerTitle">Đang tải banner...</h2>
        <p class="banner-desc" id="gBannerDesc">Đang tải mô tả...</p>
        
        <div class="pity-status" style="display:flex; flex-direction:column; align-items:flex-start; gap:8px;">
          <div>🎯 Bảo hiểm SSR: <strong id="pityCount">0</strong> / <span id="gBannerPityMax">80</span> lần (Tăng dần tỉ lệ từ lần 60 — Soft Pity)</div>
          <div id="bannerStatusBadge">Đang kiểm tra bảo hiểm...</div>
          <div style="font-size:12px; color:var(--text-3);">⏳ Chu kỳ Reset Bảo hiểm Banner còn: <strong id="bannerTimer" style="color:var(--teal)">Đang tải...</strong></div>
        </div>

        <div class="gacha-actions" id="gachaActionButtons">
          <button class="btn-summon btn-single" onclick="rollGacha(1)">Quay x1 (💎 200)</button>
          <button class="btn-summon btn-multi" onclick="rollGacha(10)">Quay x10 (💎 2,000)</button>
        </div>
      </div>

      <div class="card">
        <h3 style="font-size:14px; color:var(--text-2); margin-bottom:10px;">📋 BẢNG TỈ LỆ & CƠ CHẾ BẢO HIỂM</h3>
        <p style="font-size:13px; color:var(--text-3); line-height:1.7;">
          ⭐ <strong>SSR 5★ (1.8%)</strong>: Tỉ lệ base 1.8%. Từ lần quay thứ 60, tỉ lệ tăng mạnh (Soft Pity) và đạt 100% ở lần 80.<br>
          ⭐ <strong>SR 4★ (12.0%)</strong>: Tướng 4★ & Vũ khí Cao Cấp. Chắc chắn nhận tối thiểu 1 SR trong mỗi 10 lần quay.<br>
          ⭐ <strong>R 3★ (86.2%)</strong>: Vũ khí Tiêu Chuẩn phong phú.<br>
          📌 <em>Quy tắc Banner:</em> Lần đầu nổ bảo hiểm 100% ra Tướng của Banner đang chọn. Sau đó tướng Rate-up chiếm 25% pool SSR!
        </p>
      </div>
    </div>
  </div>

  <!-- ==================== TAB 3: TRANG SỰ KIỆN & GIFTCODE ==================== -->
  <div id="eventTab" class="tab-content">
    <div class="events-hub-wrap">
      
      <!-- SỰ KIỆN 1: ĐIỂM DANH 7 NGÀY -->
      <div class="event-card">
        <div class="event-card-header">
          <span class="banner-tag" style="position:static;">HOẠT ĐỘNG HÀNG NGÀY</span>
          <h2 style="color:var(--gold); font-size:22px; margin-top:8px;">📅 ĐIỂM DANH 7 NGÀY NHẬN ĐÁ QUÝ</h2>
          <p style="font-size:13px; color:var(--text-2); margin-top:4px;">
            Đăng nhập mỗi ngày để tích lũy Đá Quý chiêu mộ tướng. Điểm danh ngày thứ 7 để nhận Đại Thưởng <strong>1,200 💎</strong>!
          </p>
        </div>

        <div class="checkin-grid" id="checkinDaysGrid"></div>

        <div style="display:flex; justify-content:center; margin-top:16px;">
          <button class="btn-play-game" id="btnClaimDaily" onclick="claimDailyCheckin()" style="padding:12px 36px; font-size:15px;">
            🎁 ĐIỂM DANH NGAY
          </button>
        </div>
      </div>

      <!-- SỰ KIỆN 2: NHẬP GIFTCODE ĐỔI QUÀ -->
      <div class="event-card">
        <h3 style="color:var(--teal); font-size:18px; margin-bottom:8px;">🎫 ĐỔI MÃ GIFTCODE TÂN THỦ</h3>
        <p style="font-size:13px; color:var(--text-2); margin-bottom:16px;">
          Nhập mã quà tặng của nhà phát hành để nhận ngay Đá Quý & Vé Tẩy Cấp miễn phí. Mỗi mã chỉ sử dụng được 1 lần cho mỗi tài khoản.
        </p>

        <div class="giftcode-input-group">
          <input type="text" id="giftcodeInput" placeholder="Nhập mã code (VD: ANIMEEMBLEM, PARRYGOD)..." autocomplete="off">
          <button class="btn-summon btn-multi" onclick="submitGiftcode()" style="padding:10px 24px;">ĐỔI QUÀ</button>
        </div>
        <div id="giftcodeResultMsg" style="font-size:13px; margin-top:10px; display:none;"></div>

        <div style="background:var(--panel-2); border:1px solid var(--line); border-radius:10px; padding:12px 16px; margin-top:16px;">
          <strong style="color:var(--gold); font-size:12px;">💡 GỢI Ý MÃ GIFTCODE CÓ SẴN:</strong>
          <ul style="font-size:12px; color:var(--text-2); margin-left:18px; margin-top:6px; line-height:1.6;">
            <li><code>ANIMEEMBLEM</code> — Quà ra mắt game: Nhận <strong>1,000 💎 & 5 🎟️ Vé Tẩy Cấp</strong></li>
            <li><code>PARRYGOD</code> — Quà cao thủ phản đòn: Nhận <strong>500 💎 & 2 🎟️ Vé Tẩy Cấp</strong></li>
          </ul>
        </div>
      </div>

    </div>
  </div>

</div>

<!-- MODAL CHỌN MÀN CHƠI CHIẾN DỊCH (STAGE SELECT 1-1, 1-2...) -->
<div class="prep-modal" id="campaignStageModal">
  <div class="prep-modal-box" style="max-width:760px;">
    <div class="prep-header">
      <div>
        <h2 style="color:var(--gold); font-size:22px; margin-bottom:4px;">🗺️ CHIẾN DỊCH CHÍNH — CHƯƠNG 1</h2>
        <p style="font-size:13px; color:var(--text-2);">Chọn màn chơi để tiến hành chuẩn bị đội hình và xuất trận.</p>
      </div>
      <button class="action-btn" onclick="closeCampaignStageModal()" style="padding:6px 14px;">Đóng</button>
    </div>

    <div class="campaign-stages-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:14px; margin:20px 0;">
      
      <!-- ẢI 1-1 -->
      <div class="stage-card unlocked" onclick="selectCampaignStage('map_campaign_1', 'Ải 1-1: Cửa Ải Shade Knight')">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <span class="stage-code">ẢI 1-1</span>
          <span class="stage-status active">ĐANG MỞ</span>
        </div>
        <h3 class="stage-title">Cửa Ải Shade Knight</h3>
        <p class="stage-desc">Đánh tan đội tuần tra tiên phong của kỵ sĩ vong linh Shade Knight.</p>
        <div class="stage-rewards">
          <span>🎁 Thưởng: <strong>200 💎</strong> + <strong>50 EXP</strong></span>
        </div>
        <button class="btn-play-game" style="font-size:12px; padding:8px 18px; margin-top:10px; width:100%;">⚔️ XUẤT KÍCH</button>
      </div>

      <!-- ẢI 1-2 -->
      <div class="stage-card locked" onclick="alert('🔒 Hãy vượt qua Ải 1-1 trước!')">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <span class="stage-code">ẢI 1-2</span>
          <span class="stage-status locked">KHÓA 🔒</span>
        </div>
        <h3 class="stage-title">Phục Kích Rừng Sâu</h3>
        <p class="stage-desc">Thử thách địa hình cây cối hiểm trở, kẻ địch phục kích trong sương mù.</p>
        <div class="stage-rewards">
          <span>🎁 Thưởng: <strong>300 💎</strong> + <strong>80 EXP</strong></span>
        </div>
        <div style="font-size:11px; color:var(--text-3); margin-top:10px; text-align:center;">(Cần hoàn thành Ải 1-1)</div>
      </div>

    </div>
  </div>
</div>

<!-- MODAL CHUẨN BỊ XUẤT TRẬN -->
<div class="prep-modal" id="prepModal">
  <div class="prep-modal-box">
    <div class="prep-header">
      <div>
        <h2 style="color:var(--gold); font-size:22px; margin-bottom:4px;">📋 CHUẨN BỊ XUẤT TRẬN</h2>
        <p style="font-size:13px; color:var(--text-2);">Nhấp vào thẻ tướng để chọn <strong>Xuất trận</strong> hoặc cho về <strong>Dự bị</strong> (Tối đa 4 nhân vật).</p>
      </div>
      <div class="prep-counter">
        Đã chọn: <strong id="prepDeployCount" style="color:var(--teal); font-size:20px;">3</strong> / 4
      </div>
    </div>

    <div class="prep-roster-grid" id="prepRosterGrid"></div>

    <div class="prep-actions">
      <button class="btn-play-game" style="font-size:15px; padding:12px 36px;" onclick="confirmDeployment()">
        ⚔️ XÁC NHẬN XUẤT TRẬN ⚔️
      </button>
      <button class="action-btn" onclick="closePrepModal()" style="padding:10px 20px;">Đóng</button>
    </div>
  </div>
</div>

<!-- MODAL ĐĂNG NHẬP / ĐĂNG KÝ -->
<div class="auth-modal" id="authModal">
  <div class="auth-modal-box">
    <h2 id="authModalTitle" style="color:var(--gold); margin-bottom:12px;">ĐĂNG NHẬP</h2>
    <p style="font-size:13px; color:var(--text-2); margin-bottom:16px;">Đăng nhập để lưu Kim Cương & nhân vật vĩnh viễn</p>
    <div class="auth-inputs">
      <input type="text" id="authUsername" placeholder="Tên tài khoản" autocomplete="off">
      <input type="password" id="authPassword" placeholder="Mật khẩu">
    </div>
    <div id="authErrorMsg" style="color:var(--danger); font-size:12px; margin-bottom:10px; display:none;"></div>
    <div style="display:flex; gap:10px; justify-content:center; margin-bottom:14px;">
      <button class="action-btn" id="authSubmitBtn" onclick="submitAuth()" style="background:var(--teal); color:#12111b; font-weight:700;">Đăng Nhập</button>
      <button class="action-btn" onclick="closeAuthModal()">Hủy</button>
    </div>
    <p style="font-size:12px; color:var(--text-3); cursor:pointer;" id="authSwitchModeLink" onclick="switchAuthMode()">Chưa có tài khoản? Bấm để Đăng ký</p>
  </div>
</div>

<!-- MODAL KẾT QUẢ GACHA -->
<div class="gacha-modal" id="gachaModal">
  <div class="gacha-modal-box">
    <h2 style="font-size:24px; color:var(--gold); margin-bottom:6px;" id="gachaModalTitle">KẾT QUẢ TRIỆU HỒI</h2>
    <p style="font-size:13px; color:var(--text-2);">Những phần thưởng định mệnh bạn đã nhận được:</p>
    <div class="gacha-grid" id="gachaResultsGrid"></div>
    <button class="action-btn" onclick="closeGachaModal()" style="padding:10px 24px; font-size:14px;">Xác Nhận & Đóng</button>
  </div>
</div>

<!-- MODAL SỔ TAY QUAN HỆ CẶP ĐÔI -->
<div class="prep-modal" id="supportModal">
  <div class="prep-modal-box" style="max-width:700px;">
    <div class="prep-header">
      <div>
        <h2 style="color:var(--rose); font-size:22px; margin-bottom:4px;">📖 SỔ TAY QUAN HỆ ĐỒNG ĐỘI</h2>
        <p style="font-size:13px; color:var(--text-2);">Mối liên kết giữa các nhân vật khi cùng kề vai chiến đấu. Đạt Rank S 💍 để mở khóa cốt truyện định mệnh.</p>
      </div>
    </div>

    <div class="support-list-grid" id="supportListGrid" style="display:flex; flex-direction:column; gap:10px; max-height:400px; overflow-y:auto; margin-bottom:20px;"></div>

    <div style="display:flex; justify-content:center;">
      <button class="action-btn" onclick="closeSupportModal()" style="padding:10px 24px;">Đóng</button>
    </div>
  </div>
</div>

<!-- MODAL TẨY CẤP & GACHA LẠI CHỈ SỐ (RE-LEVEL) -->
<div class="prep-modal" id="relevelModal">
  <div class="prep-modal-box" style="max-width:580px;">
    <div class="prep-header">
      <div>
        <h2 style="color:var(--gold); font-size:22px; margin-bottom:4px;">🔄 TẨY CẤP & ROLL LẠI CHỈ SỐ</h2>
        <p style="font-size:12px; color:var(--text-2);">Gacha lại các lần nhảy chỉ số của cấp trước. Giữ nguyên Level, an toàn tuyệt đối!</p>
      </div>
    </div>

    <div id="relevelChoiceSection">
      <div style="background:var(--panel-2); border:1px solid var(--line); border-radius:12px; padding:12px 16px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:13px; color:var(--text-2);">🎟️ Vé Tẩy Cấp đang có: <strong id="relevelTicketCount" style="color:var(--teal); font-size:16px;">0</strong> vé</span>
        <span style="font-size:13px; color:var(--text-2);">💎 Đá Quý: <strong id="relevelGemsDisplay" style="color:var(--gold); font-size:16px;">0</strong></span>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:20px;">
        <div class="relevel-option-card active" id="optRelevel1" onclick="selectRelevelMode(1)">
          <div style="font-weight:800; font-size:15px; color:var(--gold); margin-bottom:4px;">TẨY 1 CẤP</div>
          <div style="font-size:11px; color:var(--text-2); margin-bottom:10px;">Roll lại 3 chỉ số của cấp gần nhất</div>
          <div style="font-size:12px; font-weight:700; color:var(--teal);">💎 200 Đá + 🎟️ 1 Vé</div>
        </div>

        <div class="relevel-option-card" id="optRelevel5" onclick="selectRelevelMode(5)">
          <div style="font-weight:800; font-size:15px; color:var(--gold); margin-bottom:4px;">TẨY 5 CẤP</div>
          <div style="font-size:11px; color:var(--text-2); margin-bottom:10px;">Roll lại trọn bộ 15 lần nhảy chỉ số</div>
          <div style="font-size:12px; font-weight:700; color:var(--teal);">💎 1,000 Đá + 🎟️ 5 Vé</div>
        </div>
      </div>

      <div style="display:flex; justify-content:center; gap:12px;">
        <button class="btn-play-game" style="font-size:14px; padding:10px 28px;" onclick="executeRelevelRoll()">🎲 BẮT ĐẦU TẨY ĐIỂM</button>
        <button class="action-btn" onclick="closeRelevelModal()">Đóng</button>
      </div>
    </div>

    <div id="relevelCompareSection" style="display:none;">
      <h3 style="text-align:center; color:var(--teal); font-size:16px; margin-bottom:14px;">🎲 KẾT QUẢ ROLL LẠI CHỈ SỐ</h3>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:14px; margin-bottom:20px;">
        <div style="background:var(--panel-2); border:1px solid var(--line); border-radius:12px; padding:14px; text-align:center;">
          <h4 style="color:var(--text-3); font-size:13px; margin-bottom:8px;">🛡️ CHỈ SỐ HIỆN TẠI (CŨ)</h4>
          <div id="relevelOldStatsList" style="font-size:13px; line-height:1.8; color:var(--text-2);"></div>
        </div>
        <div style="background:var(--panel-2); border:2px solid var(--gold); border-radius:12px; padding:14px; text-align:center; box-shadow:0 0 20px rgba(232,178,61,0.25);">
          <h4 style="color:var(--gold); font-size:13px; margin-bottom:8px;">✨ CHỈ SỐ MỚI (VỪA ROLL)</h4>
          <div id="relevelNewStatsList" style="font-size:13px; line-height:1.8; font-weight:700; color:#fff;"></div>
        </div>
      </div>

      <div style="display:flex; justify-content:center; gap:14px;">
        <button class="action-btn" style="padding:10px 20px;" onclick="confirmRelevelChoice('keep')">🛡️ GIỮ LẠI CHỈ SỐ CŨ</button>
        <button class="btn-summon btn-multi" style="padding:10px 24px;" onclick="confirmRelevelChoice('replace')">⚡ NHẬN CHỈ SỐ MỚI</button>
      </div>
    </div>
  </div>
</div>

<!-- ==================== MODAL RÚT BÀI BUFF THÁP VÔ TẬN (ROGUELIKE 3 CARDS) ==================== -->
<div class="prep-modal" id="endlessBuffModal">
  <div class="prep-modal-box" style="max-width:760px; text-align:center;">
    <div class="prep-header" style="text-align:center; justify-content:center; flex-direction:column; gap:4px;">
      <span class="banner-tag" style="position:static; display:inline-block; background:var(--rose); color:#fff;">👑 CHIẾN TÍCH DIỆT BOSS THÁP VÔ TẬN</span>
      <h2 style="color:var(--gold); font-size:24px; margin-top:6px;" id="endlessBossTitle">HẠ GỤC BOSS THÀNH CÔNG!</h2>
      <p style="font-size:13px; color:var(--teal); font-weight:700;" id="endlessRewardText">Nhận thưởng: +300 💎 Đá Quý</p>
    </div>

    <h3 style="text-align:center; color:#fff; font-size:15px; margin:16px 0 12px;">🃏 CHỌN 1 TRONG 3 THẦN PHƯỚC CƯỜNG HÓA TOÀN ĐỘI:</h3>
    
    <div class="endless-cards-grid" id="endlessCardsGrid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:14px; margin-bottom:20px;">
      <!-- 3 lá bài được render tự động qua JS -->
    </div>

    <div style="text-align:center;">
      <button class="btn-play-game" style="font-size:14px; padding:12px 36px;" id="btnConfirmBuffChoice" onclick="confirmEndlessBuffChoice()" disabled>
        ⚡ TIẾP TỤC LEO TẦNG KẾ TIẾP ➔
      </button>
    </div>
  </div>
</div>

<!-- ==================== MODAL PHÒNG CHỜ CO-OP MULTIPLAYER ==================== -->
<div class="prep-modal" id="coopModal">
  <div class="prep-modal-box" style="max-width:620px;">
    
    <!-- GIAI ĐOẠN 1: CHỌN CHẾ ĐỘ & TẠO/VÀO PHÒNG -->
    <div id="coopSetupSection">
      <div class="prep-header">
        <div>
          <h2 style="color:#3a86ff; font-size:22px; margin-bottom:4px;">🤝 LIÊN MINH CO-OP MULTIPLAYER</h2>
          <p style="font-size:13px; color:var(--text-2);">Chơi cùng bạn bè qua mạng Online (WebRTC) hoặc WebSocket (Public Broker / LAN).</p>
        </div>
        <button class="action-btn" onclick="closeCoopModal()">Đóng</button>
      </div>

      <div style="background:var(--panel-2); border:1px solid var(--line); border-radius:12px; padding:14px; margin-bottom:16px;">
        <label style="font-size:12px; font-weight:800; color:var(--gold); display:block; margin-bottom:8px;">🌐 HÌNH THỨC KẾT NỐI:</label>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
          <button type="button" class="action-btn active" id="btnNetWebRTC" onclick="selectNetworkMode('webrtc')" style="border-color:var(--teal); color:var(--teal); font-weight:700;">
            🌐 WebRTC (P2P Online)
          </button>
          <button type="button" class="action-btn" id="btnNetWS" onclick="selectNetworkMode('websocket')" style="border-color:var(--line); color:var(--text-2); font-weight:700;">
            ⚡ WebSocket (Broker / LAN)
          </button>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:14px; margin-bottom:18px;">
        <div style="background:var(--panel-2); border:2px solid #3a86ff; border-radius:12px; padding:16px; text-align:center;">
          <h3 style="color:#fff; font-size:16px; margin-bottom:6px;">👑 TẠO PHÒNG MỚI</h3>
          <p style="font-size:11px; color:var(--text-3); margin-bottom:14px;">Làm Chủ phòng, nhận mã phòng để mời bạn bè.</p>
          <button class="btn-play-game" style="font-size:13px; padding:10px 20px; width:100%;" onclick="startHostRoom()">TẠO PHÒNG</button>
        </div>

        <div style="background:var(--panel-2); border:1px solid var(--line); border-radius:12px; padding:16px; text-align:center;">
          <h3 style="color:#fff; font-size:16px; margin-bottom:6px;">🚪 VÀO PHÒNG BẠN BÈ</h3>
          <p style="font-size:11px; color:var(--text-3); margin-bottom:10px;">Nhập mã phòng 4 số của chủ phòng:</p>
          <input type="text" id="coopJoinCodeInput" placeholder="VD: 5820" maxlength="6" style="width:100%; text-align:center; font-size:18px; font-weight:900; letter-spacing:0.2em; background:var(--panel); border:1px solid var(--teal); color:#fff; padding:8px; border-radius:8px; outline:none; margin-bottom:10px; text-transform:uppercase;">
          <button class="action-btn" style="border-color:var(--teal); color:var(--teal); font-weight:700; width:100%; padding:10px;" onclick="joinGuestRoom()">THAM GIA PHÒNG</button>
        </div>
      </div>
    </div>

    <!-- GIAI ĐOẠN 2: PHÒNG CHỜ (LOBBY ROOM) -->
    <div id="coopLobbySection" style="display:none;">
      <div class="prep-header">
        <div>
          <span class="banner-tag" style="position:static; display:inline-block; background:#3a86ff; color:#fff; margin-bottom:4px;">PHÒNG CHỜ CO-OP</span>
          <h2 style="color:var(--gold); font-size:24px;">MÃ PHÒNG: <span id="coopRoomCodeDisplay" style="color:var(--teal); letter-spacing:0.1em;">----</span></h2>
          <p style="font-size:12px; color:var(--text-2);">Gửi mã này cho bạn bè để cùng vào phòng (Tối đa 4 người).</p>
        </div>
        <button class="action-btn" style="border-color:var(--danger); color:var(--danger);" onclick="leaveCoopRoom()">Rời Phòng</button>
      </div>

      <div style="margin:16px 0;">
        <h4 style="font-size:13px; color:var(--gold); margin-bottom:10px;">👥 THÀNH VIÊN TRONG PHÒNG:</h4>
        <div id="coopPlayersList" style="display:flex; flex-direction:column; gap:8px;"></div>
      </div>

      <div style="text-align:center; margin-top:20px;">
        <button class="btn-play-game" id="btnStartCoopGame" style="font-size:15px; padding:12px 36px;" onclick="hostLaunchCoopEndless()">
          ⚔️ BẮT ĐẦU LEO THÁP CO-OP ⚔️
        </button>
      </div>
    </div>

  </div>
</div>

<!-- OVERLAY HIỆU ỨNG CRITICAL CUT-IN (FIRE EMBLEM STYLE) -->
<div id="critCutIn" class="crit-cut-in" style="display:none;">
  <div class="crit-flash"></div>
  <div class="crit-strip">
    <div class="crit-full-face-wrap" id="critFullFaceWrap" style="display:none;">
      <img src="" alt="Crit Cut-in" id="critFullFaceImg" class="crit-full-face-img">
      <div class="crit-face-overlay"></div>
    </div>

    <div class="crit-default-wrap" id="critDefaultWrap">
      <div class="crit-badge-wrap">
        <div class="crit-badge" id="critBadge">剣</div>
      </div>
      <div class="crit-content">
        <div class="crit-quote" id="critQuote">"Thanh kiếm này... sẽ chém đứt tất cả!"</div>
        <div class="crit-label">⚡ CRITICAL HIT!</div>
        <div class="crit-name" id="critName">Aria — Vanguard</div>
      </div>
    </div>
  </div>
</div>

<!-- OVERLAY HOẠT ẢNH SKILL CUT-IN (PERSONA 4 ARENA STYLE - SLIDE TỪ BÊN TRÁI QUA) -->
<div id="skillCutIn" class="skill-cut-in" style="display:none;">
  <div class="skill-cutin-backdrop"></div>
  <div class="skill-cutin-speedlines"></div>
  <div class="skill-cutin-slide-wrap">
    <img src="" alt="Skill Cut-in" id="skillCutInImg" class="skill-cutin-img">
  </div>
</div>

<!-- THƯ VIỆN KẾT NỐI MẠNG ĐÔI (WEBRTC PEERJS & WEBSOCKET MQTT) -->
<script src="js/peerjs.min.js"></script>
<script src="js/mqtt.min.js"></script>

<script src="js/state.js?v=<?= time(); ?>"></script>
<script src="js/network.js?v=<?= time(); ?>"></script>
<script src="js/audio.js?v=<?= time(); ?>"></script>
<script src="js/combat.js?v=<?= time(); ?>"></script>
<script src="js/gacha.js?v=<?= time(); ?>"></script>
<script src="js/main.js?v=<?= time(); ?>"></script>
</body>
</html>
