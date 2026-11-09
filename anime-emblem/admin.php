<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
require_once 'db.php';
header('Content-Type: text/html; charset=utf-8');

if (empty($_SESSION['user_id'])) {
    header('Location: index.php');
    exit;
}

$stmtCheck = $pdo->prepare("SELECT role, username FROM users WHERE id = :id");
$stmtCheck->execute(['id' => $_SESSION['user_id']]);
$userAcc = $stmtCheck->fetch();

if (!$userAcc || $userAcc['role'] !== 'admin') {
    header('Location: index.php');
    exit;
}

$_SESSION['role'] = 'admin';
$_SESSION['username'] = $userAcc['username'];
?>
<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin Dashboard — Anime Emblem</title>
<link rel="stylesheet" href="css/style.css?v=<?= time(); ?>">
<style>
  .admin-wrap { max-width: 1200px; margin: 0 auto; padding: 20px 16px; }
  .admin-nav { display: flex; gap: 8px; margin: 20px 0; flex-wrap: wrap; }
  .admin-tab-btn {
    background: var(--panel-2); border: 1px solid var(--line); color: var(--text-2);
    padding: 10px 18px; border-radius: 10px; font-weight: 700; cursor: pointer; transition: 0.2s;
  }
  .admin-tab-btn.active, .admin-tab-btn:hover {
    border-color: var(--gold); color: #12111b; background: var(--gold);
  }
  .admin-section { display: none; }
  .admin-section.active { display: block; }
  .admin-table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 13px; }
  .admin-table th, .admin-table td { padding: 10px 12px; border: 1px solid var(--line); text-align: left; vertical-align: middle; }
  .admin-table th { background: var(--panel-2); color: var(--gold); }
  .admin-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin: 14px 0; }
  .admin-input-group { display: flex; flex-direction: column; gap: 4px; }
  .admin-input-group label { font-size: 11px; font-weight: 700; color: var(--text-2); }
  .admin-input-group input, .admin-input-group select, .admin-input-group textarea {
    background: var(--panel-2); border: 1px solid var(--line); color: #fff;
    padding: 8px 12px; border-radius: 8px; font-family: inherit; font-size: 13px; outline: none;
  }
  .admin-input-group input:focus, .admin-input-group select:focus, .admin-input-group textarea:focus { border-color: var(--teal); }

  /* BÀN CỜ MAP */
  .map-builder-container { display: flex; flex-direction: column; gap: 16px; margin-top: 16px; }
  .builder-toolbar { display: flex; gap: 10px; flex-wrap: wrap; background: var(--panel-2); padding: 12px; border-radius: 12px; border: 1px solid var(--line); align-items: center; }
  .brush-btn {
    display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 800; cursor: pointer;
    background: var(--panel); border: 1px solid var(--line); color: var(--text-2); transition: 0.15s;
  }
  .brush-btn.active, .brush-btn:hover { border-color: var(--teal); color: #fff; transform: translateY(-2px); }
  .brush-btn.active { background: rgba(61, 219, 196, 0.2); }
  
  .builder-canvas-wrap {
    background: var(--panel-2); border: 2px dashed var(--line); border-radius: 12px; padding: 20px;
    overflow: auto; max-height: 580px; display: flex; justify-content: center; align-items: center;
  }
  .builder-grid { display: grid; gap: 2px; background: rgba(0,0,0,0.4); padding: 6px; border-radius: 8px; user-select: none; }
  .b-tile {
    width: 44px; height: 44px; border-radius: 4px; display: flex; align-items: center; justify-content: center;
    font-weight: 900; font-size: 14px; cursor: pointer; border: 1px solid rgba(255,255,255,0.06); transition: transform 0.1s;
  }
  .b-tile:hover { transform: scale(1.1); z-index: 10; border-color: #fff; }
  .b-tile.tile-P { background: var(--tile-plain); color: var(--text-3); }
  .b-tile.tile-F { background: var(--tile-forest); color: #4ade80; }
  .b-tile.tile-W { background: var(--tile-wall); color: #f87171; border-color: #333; }
  .b-tile.tile-H { background: rgba(232, 178, 61, 0.35); color: var(--gold); border-color: var(--gold); }
  .b-tile.tile-A { background: #0f2b46; color: #48cae4; border: 1px solid #1e4e79; }
  .b-tile.tile-S { background: rgba(61, 219, 196, 0.4); color: var(--teal); border: 2px solid var(--teal); }
  .b-tile.tile-E { background: rgba(209, 73, 91, 0.4); color: var(--enemy-red); border: 2px solid var(--enemy-red); }
  .b-tile.boss-tile {
    background: rgba(232, 178, 61, 0.4) !important;
    color: var(--gold) !important;
    border: 2px solid var(--gold) !important;
    box-shadow: 0 0 10px rgba(232, 178, 61, 0.6) !important;
  }
  .size-preset-btn {
    background: var(--panel); border: 1px solid var(--line); color: var(--text-2);
    padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; transition: 0.15s;
  }
  .size-preset-btn:hover { border-color: var(--gold); color: var(--gold); transform: translateY(-1px); }

  #builderEnemySelect {
    background: #1b1930 !important; color: #ffffff !important; border: 1px solid var(--danger) !important;
    padding: 6px 10px !important; border-radius: 6px !important; font-size: 12px !important; font-weight: 700 !important; outline: none !important;
  }

  /* KHUNG PREVIEW CUT-IN */
  #previewCritStrip {
    transform: skewX(-14deg);
    margin: 0 auto;
    width: clamp(700px, 85vw, 1100px);
    max-width: 100%;
    height: clamp(140px, 15vh, 180px);
    box-shadow: 0 0 30px rgba(232, 178, 61, 0.5), inset 0 0 15px rgba(61, 219, 196, 0.3);
    position: relative;
    overflow: hidden;
    border-top: 3px solid var(--gold);
    border-bottom: 3px solid var(--teal);
    background: linear-gradient(90deg, #1b1930 0%, #3a152e 35%, #18283e 70%, #1b1930 100%);
  }

  #previewCritStrip:not(.animating) {
    animation: none;
    opacity: 1;
  }

  #previewCritStrip.animating {
    animation: cutInSlidePreview 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
  }

  @keyframes cutInSlidePreview {
    0% { transform: skewX(-14deg) translateX(-110%); opacity: 0; }
    25% { transform: skewX(-14deg) translateX(0%); opacity: 1; }
    75% { transform: skewX(-14deg) translateX(0%); opacity: 1; }
    100% { transform: skewX(-14deg) translateX(110%); opacity: 0; }
  }
</style>
</head>
<body>
<div class="admin-wrap">
  <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--line); padding-bottom:14px; flex-wrap:wrap; gap:10px;">
    <div>
      <h1 style="color:var(--gold); font-size:26px;">⚡ ADMIN CONTROL PANEL</h1>
      <p style="font-size:13px; color:var(--text-2); margin-top:2px;">Quản trị hệ thống: Người dùng, Nhân vật, Vũ khí, Cung Mệnh, Banner, Kỹ Năng, Sự Kiện, Bản Đồ & Nhạc Combat</p>
    </div>
    <a href="index.php" class="action-btn" style="text-decoration:none; display:inline-flex; align-items:center; gap:6px; padding:10px 18px; border-color:var(--teal); color:var(--teal); font-weight:700;">
      ⬅️ QUAY LẠI GAME
    </a>
  </div>

  <!-- NAVIGATION TABS -->
  <div class="admin-nav">
    <button class="admin-tab-btn" style="border-color:var(--rose); color:var(--rose);" onclick="switchAdminSection('secUsers', this)">👥 Quản Lý Người Dùng</button>
    <button class="admin-tab-btn active" onclick="switchAdminSection('secHeroes', this)">👤 Quản Lý Nhân Vật</button>
    <button class="admin-tab-btn" style="border-color:#ff0055; color:#ff0055; font-weight:800;" onclick="switchAdminSection('secCutinEditor', this)">✂️ Căn Chỉnh Cut-In</button>
    <button class="admin-tab-btn" style="border-color:var(--gold); color:var(--gold);" onclick="switchAdminSection('secWeapons', this)">⚔️ Quản Lý Vũ Khí</button>
    <button class="admin-tab-btn" onclick="switchAdminSection('secConst', this)">🌟 Chỉnh Sửa 6 Cung Mệnh</button>
    <button class="admin-tab-btn" onclick="switchAdminSection('secBanners', this)">🎰 Quản Lý Banner Gacha</button>
    <button class="admin-tab-btn" onclick="switchAdminSection('secSkills', this)">🔮 Quản Lý Kỹ Năng (Skills)</button>
    <button class="admin-tab-btn" onclick="switchAdminSection('secEvents', this)">🎁 Quản Lý Giftcode</button>
    <button class="admin-tab-btn" style="border-color:var(--teal); color:var(--teal);" onclick="switchAdminSection('secMaps', this)">🗺️ Trình Tạo Bản Đồ (Map Builder)</button>
    <button class="admin-tab-btn" style="border-color:#3a86ff; color:#3a86ff;" onclick="switchAdminSection('secMusics', this)">🎵 Quản Lý Nhạc Combat</button>
  </div>

  <!-- ==================== 0. QUẢN LÝ NGƯỜI DÙNG (USERS) ==================== -->
  <div id="secUsers" class="admin-section">
    <div class="card">
      <h3 style="color:var(--rose); font-size:16px;" id="userFormTitle">➕ THÊM / CẬP NHẬT TÀI KHOẢN NGƯỜI DÙNG</h3>
      <form id="userForm" onsubmit="saveUser(event)">
        <input type="hidden" id="u_id" value="0">
        <div class="admin-form-grid">
          <div class="admin-input-group">
            <label>Tên tài khoản (Username):</label>
            <input type="text" id="u_username" placeholder="Nhập tên tài khoản..." required autocomplete="off">
          </div>
          <div class="admin-input-group">
            <label>Mật khẩu:</label>
            <input type="text" id="u_password" placeholder="Bỏ trống nếu không muốn đổi pass...">
          </div>
          <div class="admin-input-group">
            <label style="color:var(--gold); font-weight:800;">👑 Phân Quyền (Role):</label>
            <select id="u_role">
              <option value="user">👤 Người Chơi (User)</option>
              <option value="admin">👑 Quản TrỊ Viên (Admin)</option>
            </select>
          </div>
          <div class="admin-input-group">
            <label style="color:var(--teal); font-weight:800;">💎 Số Kim Cương (Đá Quý):</label>
            <input type="number" id="u_gems" value="1500" min="0" required>
          </div>
          <div class="admin-input-group">
            <label>🎯 Pity Hiện Tại (0 - 80):</label>
            <input type="number" id="u_pity" value="0" min="0" max="80" required>
          </div>
          <div class="admin-input-group">
            <label style="color:var(--danger); font-weight:800;">🚫 Trạng Thái Tài Khoản:</label>
            <select id="u_is_banned">
              <option value="0">🟢 Hoạt Động (Bình thường)</option>
              <option value="1">⛔ BỊ KHÓA (Cấm đăng nhập)</option>
            </select>
          </div>
        </div>

        <div style="margin-top:14px; display:flex; gap:10px;">
          <button type="submit" class="btn-summon btn-multi" style="padding:10px 24px;">💾 LƯU THÔNG TIN</button>
          <button type="button" class="action-btn" onclick="resetUserForm()">Làm mới Form</button>
        </div>
      </form>
    </div>

    <div class="card" style="margin-top:20px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
        <h3 style="color:var(--text); font-size:15px;">📋 DANH SÁCH TÀI KHOẢN HỆ THỐNG</h3>
        <div style="display:flex; align-items:center; gap:8px;">
          <label style="font-size:12px; color:var(--text-2);">🔍 Tìm kiếm:</label>
          <input type="text" id="userSearchInput" placeholder="Tìm theo tên username hoặc ID..." oninput="filterUsersList(this.value)" 
                 style="background:var(--panel-2); border:1px solid var(--line); color:#fff; padding:6px 12px; border-radius:8px; font-size:12px; width:220px; outline:none;">
        </div>
      </div>

      <table class="admin-table" id="usersTable">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên Tài Khoản</th>
            <th>Vai Trò</th>
            <th>Kim Cương (💎)</th>
            <th>Pity</th>
            <th>Streak Điểm Danh</th>
            <th>Trạng Thái</th>
            <th>Ngày Tạo</th>
            <th>Thao Tác</th>
          </tr>
        </thead>
        <tbody>
          <tr><td colspan="9" style="text-align:center;">Đang tải danh sách tài khoản...</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ==================== 1. QUẢN LÝ NHÂN VẬT ==================== -->
  <div id="secHeroes" class="admin-section active">
    <div class="card">
      <h3 style="color:var(--teal); font-size:16px;">➕ THÊM / CẬP NHẬT NHÂN VẬT</h3>
      <form id="heroForm" onsubmit="saveHero(event)">
        <div class="admin-form-grid">
          <div class="admin-input-group"><label>Mã Tướng (ID):</label><input type="text" id="h_id" placeholder="invincible" required></div>
          
          <div class="admin-input-group">
            <label>Tên Đầy Đủ (Hồ Sơ / Profile):</label>
            <input type="text" id="h_name" placeholder="VD: Mark Grayson — Invincible" required>
          </div>

          <div class="admin-input-group">
            <label style="color:var(--gold); font-weight:800;">⚔️ Tên Ngắn (Combat / Map):</label>
            <input type="text" id="h_short_name" placeholder="VD: Invincible (để trống = lấy tên đầy đủ)">
          </div>

          <div class="admin-input-group"><label>Class:</label><input type="text" id="h_cls" placeholder="Viltrumite / Hero..." required></div>
          
          <div class="admin-input-group">
            <label style="color:var(--teal); font-weight:800;">⚔️ Loại Vũ Khí Được Dùng:</label>
            <input type="text" id="h_allowed_weapons" placeholder="VD: Nắm đấm hoặc Kiếm,Đao hoặc Rìu,Nắm đấm" value="Nắm đấm" required>
          </div>

          <div class="admin-input-group">
            <label style="color:var(--gold); font-weight:800;">⭐ Phẩm Cấp:</label>
            <select id="h_rarity">
              <option value="SSR">⭐⭐⭐⭐⭐ Phẩm SSR (5★)</option>
              <option value="SR">⭐⭐⭐⭐ Phẩm SR (4★)</option>
            </select>
          </div>

          <div class="admin-input-group"><label>Symbol:</label><input type="text" id="h_symbol" placeholder="拳..." required></div>
          <div class="admin-input-group"><label>Phe:</label><select id="h_team"><option value="player">Phe Ta</option><option value="enemy">Phe Địch</option></select></div>
          <div class="admin-input-group">
            <label style="color:var(--gold); font-weight:700;">👑 Cấp Bậc:</label>
            <select id="h_is_boss"><option value="0">💀 Quái Thường</option><option value="1">👑 BOSS</option></select>
          </div>
          <div class="admin-input-group"><label>Màu đại diện:</label><input type="text" id="h_color" value="#ff7b00"></div>
          <div class="admin-input-group"><label>Hệ:</label><select id="h_type"><option value="Physical">Physical</option><option value="Magic">Magic</option><option value="Pierce">Pierce</option></select></div>
          <div class="admin-input-group"><label>Điểm yếu:</label><select id="h_weakness"><option value="Magic">Magic</option><option value="Pierce">Pierce</option><option value="Physical">Physical</option></select></div>
          <div class="admin-input-group"><label>Tầm đánh cơ bản:</label><input type="number" id="h_range" min="1" max="2" value="1"></div>
          <div class="admin-input-group"><label>Tầm đi (MP):</label><input type="number" id="h_mov" min="1" max="6" value="4"></div>
          
          <div class="admin-input-group">
            <label style="color:var(--teal); font-weight:800;">🦅 Kiểu Di Chuyển:</label>
            <select id="h_move_type">
              <option value="walk">🚶 Đi Bộ (Bình thường)</option>
              <option value="fly">🦅 Bay (Đi qua & Đứng trên Nước)</option>
            </select>
          </div>
        </div>

        <h4 style="color:var(--gold); font-size:13px; margin:10px 0 6px;">📊 8 CHỈ SỐ CƠ BẢN:</h4>
        <div class="admin-form-grid" style="grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));">
          <div class="admin-input-group"><label>HP:</label><input type="number" id="h_hp" value="30" required></div>
          <div class="admin-input-group"><label>Str:</label><input type="number" id="h_str" value="12" required></div>
          <div class="admin-input-group"><label>Mag:</label><input type="number" id="h_mag" value="5" required></div>
          <div class="admin-input-group"><label>Dex:</label><input type="number" id="h_dex" value="12" required></div>
          <div class="admin-input-group"><label>Spd:</label><input type="number" id="h_spd" value="11" required></div>
          <div class="admin-input-group"><label>Def:</label><input type="number" id="h_def" value="6" required></div>
          <div class="admin-input-group"><label>Res:</label><input type="number" id="h_res" value="4" required></div>
          <div class="admin-input-group"><label>Lck:</label><input type="number" id="h_lck" value="10" required></div>
        </div>

        <div class="admin-input-group" style="margin-top:10px;">
          <label>Link Avatar (Icon tròn):</label>
          <input type="text" id="h_avatar" placeholder="img/avatar.png">
        </div>

        <div class="admin-input-group" style="margin-top:10px;">
          <label style="color:var(--gold); font-weight:700;">🖼️ Link Ảnh Card / Profile (Hiện bên phải tên tướng - WuWa/Discord style):</label>
          <input type="text" id="h_profile_img" placeholder="img/heroes/invincible_card.png (hoặc link ảnh web)">
        </div>

        <div class="admin-input-group" style="margin-top:10px;"><label style="color:var(--gold); font-weight:700;">⚡ Câu Thoại Khi Chí Mạng (Crit Quote):</label><input type="text" id="h_crit_quote"></div>
        
        <div style="background:var(--panel-2); border:1px solid var(--line); border-radius:12px; padding:14px; margin-top:14px;">
          <h4 style="color:var(--rose); font-size:13px; margin-bottom:10px;">💬 4 CÂU THOẠI HẢO CẢM TƯƠNG TÁC SẢNH CHÍNH:</h4>
          <div class="admin-form-grid" style="grid-template-columns: 1fr 1fr;">
            <div class="admin-input-group">
              <label>💖 Cấp 1 — Đồng Đội (0 - 29 Pts):</label>
              <input type="text" id="h_dialogue_lv1" placeholder="Báo cáo Chỉ huy! Toàn đội đã sẵn sàng xuất kích.">
            </div>
            <div class="admin-input-group">
              <label>💖 Cấp 2 — Thân Thiết (30 - 79 Pts):</label>
              <input type="text" id="h_dialogue_lv2" placeholder="Được kề vai chiến đấu cùng người khiến tôi cảm thấy rất an tâm!">
            </div>
            <div class="admin-input-group">
              <label>💖 Cấp 3 — Tri Kỷ (80 - 149 Pts):</label>
              <input type="text" id="h_dialogue_lv3" placeholder="Chỉ huy này... sau trận đánh hôm nay, người có rảnh đi dạo cùng tôi một lát không?">
            </div>
            <div class="admin-input-group">
              <label>💖 Cấp 4 — Định Mệnh (150+ Pts):</label>
              <input type="text" id="h_dialogue_lv4" placeholder="Dù là chân trời góc bể, sức mạnh này chỉ hướng về một mình người thôi ❤️">
            </div>
          </div>
        </div>

        <div style="background:var(--panel-2); border:1px solid #3a86ff; border-radius:12px; padding:14px; margin-top:14px;">
          <h4 style="color:#3a86ff; font-size:13px; margin-bottom:10px;">🔥 HOẠT ẢNH & VOICE KHI DÙNG SKILL (PERSONA 4 ARENA STYLE):</h4>
          <div class="admin-form-grid" style="grid-template-columns: 2fr 3fr 1fr; align-items:flex-end;">
            <div class="admin-input-group">
              <label style="color:#3a86ff; font-weight:700;">🖼️ Link Ảnh Skill Cut-in (Trượt từ trái qua):</label>
              <input type="text" id="h_skill_cutin_img" placeholder="img/heroes/invincible_skill.png">
            </div>
            <div class="admin-input-group">
              <label style="color:var(--rose); font-weight:700;">🎤 Link Voice Skill (VD: audio/voice_skill.mp3):</label>
              <input type="text" id="h_skill_cutin_audio" placeholder="audio/voice_skill.mp3">
            </div>
            <div class="admin-input-group">
              <label style="color:var(--gold); font-weight:700;">🔊 Âm lượng (%):</label>
              <input type="number" id="h_skill_cutin_volume" min="0" max="200" value="100" placeholder="100">
            </div>
          </div>
        </div>

        <div class="admin-form-grid" style="grid-template-columns: 2fr 3fr 1fr; margin-top:14px; align-items:flex-end;">
          <div class="admin-input-group">
            <label style="color:var(--teal); font-weight:700;">🖼️ Link Ảnh Cut-In Chí Mạng (Khuôn mặt):</label>
            <input type="text" id="h_cutin_img" placeholder="img/cutin_invincible.png">
          </div>
          <div class="admin-input-group">
            <label style="color:var(--rose); font-weight:700;">🎤 Link Voice Cut-In Chí Mạng:</label>
            <input type="text" id="h_cutin_audio" placeholder="audio/voice_crit.mp3">
          </div>
          <div class="admin-input-group">
            <label style="color:var(--gold); font-weight:700;">🔊 Âm lượng (%):</label>
            <input type="number" id="h_cutin_volume" min="0" max="200" value="100" placeholder="100">
          </div>
        </div>

        <div style="margin-top:14px; display:flex; gap:10px;">
          <button type="submit" class="btn-summon btn-multi" style="padding:10px 24px;">💾 LƯU NHÂN VẬT</button>
          <button type="button" class="action-btn" onclick="document.getElementById('heroForm').reset()">Làm mới Form</button>
        </div>
      </form>
    </div>

    <!-- KHU VỰC DANH SÁCH NHÂN VẬT -->
    <div class="card" style="margin-top:20px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
        <h3 style="color:var(--text); font-size:15px;">📋 DANH SÁCH NHÂN VẬT</h3>
        <div style="display:flex; align-items:center; gap:8px;">
          <label style="font-size:12px; color:var(--text-2);">🔍 Tìm kiếm:</label>
          <input type="text" id="heroSearchInput" placeholder="Tìm theo tên, ID, class, phe, kiểu bay..." oninput="filterHeroesList(this.value)" 
                 style="background:var(--panel-2); border:1px solid var(--line); color:#fff; padding:6px 12px; border-radius:8px; font-size:12px; width:260px; outline:none;">
        </div>
      </div>

      <table class="admin-table" id="heroesTable">
        <thead><tr><th>ID</th><th>Avatar</th><th>Tên Hiển Thị</th><th>Vũ Khí Dùng</th><th>Phẩm Cấp</th><th>Phe / Cấp Bậc</th><th>Class</th><th>Hệ</th><th>Máu</th><th>Str / Mag</th><th>Voice & Âm lượng</th><th>Thao tác</th></tr></thead>
        <tbody><tr><td colspan="12" style="text-align:center;">Đang tải...</td></tr></tbody>
      </table>
    </div>
  </div>

  <!-- ==================== TAB CĂN CHỈNH VỊ TRÍ CUT-IN CRITICAL ==================== -->
  <div id="secCutinEditor" class="admin-section">
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:14px;">
        <div>
          <h3 style="color:var(--rose); font-size:18px;">✂️ TRÌNH CĂN CHỈNH VỊ TRÍ CUT-IN CRITICAL</h3>
          <p style="font-size:12px; color:var(--text-2); margin-top:2px;">Kéo thanh trượt hoặc dùng chuột nhấn giữ và rê trực tiếp trên ảnh để căn đúng đôi mắt nhân vật!</p>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <label style="font-weight:700; color:var(--gold); font-size:13px;">Chọn Tướng Cần Căn:</label>
          <select id="cutinHeroSelect" onchange="onSelectCutinHero(this.value)" style="background:var(--panel-2); color:#fff; border:1px solid var(--teal); padding:8px 14px; border-radius:8px; font-weight:700; outline:none;"></select>
        </div>
      </div>

      <!-- KHUNG XEM TRƯỚC BĂNG MẮT (LIVE PREVIEW) -->
      <div style="background:#090810; padding:35px 15px; border-radius:14px; border:2px dashed var(--line); display:flex; justify-content:center; align-items:center; overflow:hidden; position:relative; min-height:220px;">
        <div class="crit-strip" id="previewCritStrip" style="cursor:move; user-select:none;">
          <div class="crit-full-face-wrap">
            <img src="" id="previewCutinImg" class="crit-full-face-img" alt="Cut-in Preview" style="pointer-events:none;">
            <div class="crit-face-overlay"></div>
          </div>
        </div>
      </div>

      <!-- THANH ĐIỀU KHIỂN THÔNG SỐ -->
      <div class="admin-form-grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-top:18px; background:var(--panel-2); padding:16px; border-radius:12px; border:1px solid var(--line);">
        <div class="admin-input-group">
          <label style="color:var(--gold); font-weight:700;">↕️ Vị Trí Dọc (Lên / Xuống): <strong id="lblPosY">30%</strong></label>
          <input type="range" id="rangePosY" min="0" max="100" value="30" oninput="updateCutinPreviewLive()">
        </div>
        <div class="admin-input-group">
          <label style="color:var(--teal); font-weight:700;">↔️ Vị Trí Ngang (Trái / Phải): <strong id="lblPosX">50%</strong></label>
          <input type="range" id="rangePosX" min="0" max="100" value="50" oninput="updateCutinPreviewLive()">
        </div>
        <div class="admin-input-group">
          <label style="color:var(--rose); font-weight:700;">🔍 Phóng To / Thu Nhỏ (Zoom): <strong id="lblScale">120%</strong></label>
          <input type="range" id="rangeScale" min="50" max="250" value="120" oninput="updateCutinPreviewLive()">
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:16px;">
        <button type="button" class="action-btn" onclick="testCurrentCutinAnimation()" style="border-color:#3a86ff; color:#3a86ff; font-weight:700;">⚡ Xem Thử Hoạt Ảnh</button>
        <button type="button" class="btn-summon btn-multi" onclick="saveCurrentCutinConfig()" style="padding:10px 28px;">💾 LƯU CẤU HÌNH VỊ TRÍ</button>
      </div>
    </div>
  </div>

  <!-- ==================== 2. QUẢN LÝ VŨ KHÍ ==================== -->
  <div id="secWeapons" class="admin-section">
    <div class="card">
      <h3 style="color:var(--gold); font-size:16px;">⚔️ TẠO / SỬA TRANG BỊ VŨ KHÍ</h3>
      <p style="font-size:12px; color:var(--text-2); margin-top:2px;">
        💡 <em>Phân loại chuẩn: Kiếm, Cung, Trượng, Thương, Dao găm, Nắm đấm... Cung sẽ có tầm đánh 2 ô, các vũ khí cận chiến có tầm đánh 1 ô!</em>
      </p>

      <form id="weaponForm" onsubmit="saveWeapon(event)">
        <div class="admin-form-grid">
          <div class="admin-input-group"><label>Mã Vũ Khí (ID):</label><input type="text" id="wp_id" placeholder="ssr_power_fist" required></div>
          <div class="admin-input-group"><label>Tên Vũ Khí:</label><input type="text" id="wp_name" placeholder="Găng Tay Vô Địch" required></div>
          <div class="admin-input-group">
            <label style="color:var(--gold); font-weight:800;">⭐ Phẩm Cấp:</label>
            <select id="wp_rarity">
              <option value="R">⭐⭐⭐ Phẩm R (3 Sao)</option>
              <option value="SR">⭐⭐⭐⭐ Phẩm SR (4 Sao)</option>
              <option value="SSR">⭐⭐⭐⭐⭐ Phẩm SSR (5 Sao)</option>
            </select>
          </div>

          <div class="admin-input-group">
            <label style="color:var(--rose); font-weight:800;">🌀 Hệ Tương Thích (Affinity):</label>
            <select id="wp_affinity">
              <option value="Physical">⚔️ Physical (Vật lý)</option>
              <option value="Magic">🔮 Magic (Ma pháp)</option>
              <option value="Pierce">🎯 Pierce (Xuyên thấu)</option>
            </select>
          </div>

          <div class="admin-input-group">
            <label>Loại Vũ Khí:</label>
            <select id="wp_type" onchange="onWeaponTypeSelect(this.value)">
              <option value="Kiếm">Kiếm (Sword)</option>
              <option value="Rìu">Rìu (Axe)</option>
              <option value="Đao">Đao (Blade)</option>
              <option value="Nắm đấm">Nắm đấm / Găng tay (Gauntlet / Fist)</option>
              <option value="Trượng">Trượng (Staff)</option>
              <option value="Sách phép">Sách phép (Tome / Grimoire)</option>
              <option value="Cung">Cung (Bow)</option>
              <option value="Thương">Thương / Giáo (Spear / Lance)</option>
              <option value="Dao">Dao Găm (Dagger)</option>
            </select>
          </div>

          <div class="admin-input-group">
            <label style="color:var(--gold); font-weight:800;">🎯 Tầm Đánh Của Vũ Khí:</label>
            <select id="wp_range">
              <option value="1">1 ô (Cận chiến - Kiếm, Rìu, Đao, Nắm đấm, Thương, Dao)</option>
              <option value="2">2 ô (Bắn xa - Cung, Phép tầm xa)</option>
            </select>
          </div>

          <div class="admin-input-group"><label>Icon Emoji:</label><input type="text" id="wp_icon" value="🥊" required></div>
          <div class="admin-input-group" style="grid-column: 1 / -1;">
            <label style="color:var(--teal); font-weight:800;">🖼️ Link Ảnh Vũ Khí:</label>
            <input type="text" id="wp_image" placeholder="img/weapons/fist.png">
          </div>
        </div>

        <h4 style="color:var(--gold); font-size:13px; margin:10px 0 6px;">📈 CHỈ SỐ CỘNG THÊM (STATS BONUS):</h4>
        <div class="admin-form-grid" style="grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));">
          <div class="admin-input-group"><label>+ HP:</label><input type="number" id="wp_hp" value="0"></div>
          <div class="admin-input-group"><label>+ Str:</label><input type="number" id="wp_str" value="6"></div>
          <div class="admin-input-group"><label>+ Mag:</label><input type="number" id="wp_mag" value="0"></div>
          <div class="admin-input-group"><label>+ Dex:</label><input type="number" id="wp_dex" value="0"></div>
          <div class="admin-input-group"><label>+ Spd:</label><input type="number" id="wp_spd" value="3"></div>
          <div class="admin-input-group"><label>+ Def:</label><input type="number" id="wp_def" value="0"></div>
          <div class="admin-input-group"><label>+ Res:</label><input type="number" id="wp_res" value="0"></div>
          <div class="admin-input-group"><label>+ Lck:</label><input type="number" id="wp_lck" value="0"></div>
          <div class="admin-input-group"><label>+ MP:</label><input type="number" id="wp_mov" value="0"></div>
        </div>

        <div class="admin-input-group" style="margin-top:10px;">
          <label>Mô tả hiển thị:</label>
          <input type="text" id="wp_desc" placeholder="+6 Công vật lý, +3 Tốc độ ra đòn...">
        </div>

        <div style="margin-top:14px; display:flex; gap:10px;">
          <button type="submit" class="btn-summon btn-multi" style="padding:10px 24px;">💾 LƯU VŨ KHÍ</button>
          <button type="button" class="action-btn" onclick="document.getElementById('weaponForm').reset()">Làm mới Form</button>
        </div>
      </form>
    </div>

    <div class="card" style="margin-top:20px;">
      <h3 style="color:var(--text); font-size:15px;">📋 DANH SÁCH VŨ KHÍ</h3>
      <table class="admin-table" id="weaponsTable">
        <thead><tr><th>Ảnh / Icon</th><th>Tên Vũ Khí</th><th>Phẩm Cấp</th><th>Hệ</th><th>Loại</th><th>Tầm Đánh</th><th>Chỉ Số Cộng</th><th>Mô Tả</th><th>Thao tác</th></tr></thead>
        <tbody><tr><td colspan="9" style="text-align:center;">Đang tải...</td></tr></tbody>
      </table>
    </div>
  </div>

  <!-- ==================== 3. CUNG MỆNH ==================== -->
  <div id="secConst" class="admin-section">
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <h3 style="color:var(--gold); font-size:16px;">🌟 CHỈNH SỬA 6 TẦNG CUNG MỆNH</h3>
        <div>
          <label style="font-size:12px; color:var(--text-2); margin-right:8px;">Chọn tướng:</label>
          <select id="constHeroSelect" onchange="loadHeroConstellations()"></select>
        </div>
      </div>
      <div id="constNodesFormList" style="display:flex; flex-direction:column; gap:14px;"></div>
    </div>
  </div>

  <!-- ==================== 4. BANNER GACHA ==================== -->
  <div id="secBanners" class="admin-section">
    <div class="card">
      <h3 style="color:var(--gold); font-size:16px;">🎰 TẠO / SỬA BANNER GACHA</h3>
      <form id="bannerForm" onsubmit="saveBanner(event)">
        <div class="admin-form-grid">
          <div class="admin-input-group"><label>Mã Banner (ID):</label><input type="text" id="b_id" required></div>
          <div class="admin-input-group"><label>Tên Banner:</label><input type="text" id="b_name" required></div>
          <div class="admin-input-group">
            <label style="color:var(--gold); font-weight:800;">🎯 Loại Banner:</label>
            <select id="b_type" onchange="onBannerTypeChange()">
              <option value="hero">👤 Banner Nhân Vật (Hero Banner)</option>
              <option value="weapon">⚔️ Banner Vũ Khí (Weapon Banner)</option>
            </select>
          </div>
          <div class="admin-input-group"><label>Giá quay 1 lần (Đá):</label><input type="number" id="b_cost" value="200" required></div>
          <div class="admin-input-group"><label id="lblRateUp">Mục Tiêu Rate-up 5★:</label><select id="b_rate_up_id"></select></div>
          <div class="admin-input-group"><label>Mốc Pity:</label><input type="number" id="b_pity_max" value="80" required></div>
          <div class="admin-input-group"><label>Thời hạn kết thúc:</label><input type="datetime-local" id="b_end_date"></div>
          <div class="admin-input-group" style="grid-column: 1 / -1;">
            <label style="color:var(--gold); font-weight:800;">🖼️ Link Ảnh Nền Banner:</label>
            <input type="text" id="b_image" placeholder="img/banner_hero.png">
          </div>
        </div>

        <div style="background:var(--panel-2); border:1px solid var(--line); border-radius:12px; padding:14px; margin:14px 0;">
          <label style="font-size:12px; font-weight:800; color:var(--gold); display:block; margin-bottom:4px;" id="lblPoolTitle">
            💎 BỂ VẬT PHẨM 5★ (SSR) TRONG BANNER:
          </label>
          <div id="bannerPoolCheckboxes" style="display:flex; flex-wrap:wrap; gap:12px;"></div>
        </div>

        <div style="margin: 12px 0; display:flex; align-items:center; gap:8px;">
          <input type="checkbox" id="b_is_active" checked style="width:18px; height:18px;">
          <label for="b_is_active" style="font-size:13px; font-weight:700; color:var(--teal);">✅ Cho phép hiển thị Banner này</label>
        </div>

        <div style="margin-top:10px; display:flex; gap:10px;">
          <button type="submit" class="btn-summon btn-multi" style="padding:10px 24px;">💾 LƯU BANNER</button>
          <button type="button" class="action-btn" onclick="resetBannerForm()">Làm mới</button>
        </div>
      </form>
    </div>

    <div class="card" style="margin-top:20px;">
      <h3 style="color:var(--text); font-size:15px;">📋 DANH SÁCH BANNERS</h3>
      <table class="admin-table" id="bannersTable">
        <thead><tr><th>ID</th><th>Loại</th><th>Ảnh</th><th>Tên Banner</th><th>Giá</th><th>Rate-up 5★</th><th>Bể SSR</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
        <tbody><tr><td colspan="9" style="text-align:center;">Đang tải...</td></tr></tbody>
      </table>
    </div>
  </div>

  <!-- ==================== 5. KỸ NĂNG ==================== -->
  <div id="secSkills" class="admin-section">
    <div class="card">
      <h3 style="color:var(--gold); font-size:16px;">➕ TẠO / SỬA KỸ NĂNG NHÂN VẬT</h3>
      <form id="skillForm" onsubmit="saveSkill(event)">
        <div class="admin-form-grid">
          <div class="admin-input-group"><label>Mã Skill (ID):</label><input type="text" id="sk_id" required></div>
          <div class="admin-input-group"><label>Tên Kỹ Năng:</label><input type="text" id="sk_name" required></div>
          <div class="admin-input-group"><label>Icon:</label><input type="text" id="sk_icon" value="🔮" required></div>
          <div class="admin-input-group"><label>Tướng Sở Hữu:</label><select id="sk_hero_id"></select></div>
          <div class="admin-input-group">
            <label>Phạm vi dùng (Scope):</label>
            <select id="sk_scope"><option value="map">🗺️ Trên Bản Đồ</option><option value="combat">⚔️ Sàn Đấu 4v4</option></select>
          </div>
          <div class="admin-input-group">
            <label>Loại:</label>
            <select id="sk_type"><option value="damage">Sát Thương</option><option value="heal">Hồi Máu</option><option value="buff">Buff</option></select>
          </div>

          <div class="admin-input-group">
            <label>Hình dạng:</label>
            <select id="sk_shape">
              <option value="single">🎯 Đơn Mục Tiêu</option>
              <option value="line">📏 Tia Thẳng</option>
              <option value="cross">➕ Chữ Thập</option>
              <option value="ally_single">🤝 1 Đồng Minh (Chỉ Định)</option>
              <option value="ally_all">👥 Toàn Đội Đồng Minh (Toàn Party 4v4)</option>
            </select>
          </div>

          <div class="admin-input-group"><label>Tầm tối thiểu:</label><input type="number" id="sk_rmin" value="1"></div>
          <div class="admin-input-group"><label>Tầm tối đa:</label><input type="number" id="sk_rmax" value="4"></div>
          <div class="admin-input-group"><label>Sức mạnh:</label><input type="number" id="sk_power" value="180"></div>
          <div class="admin-input-group"><label>Lượt dùng / Ải:</label><input type="number" id="sk_uses" value="2"></div>
        </div>

        <div class="admin-form-grid" style="grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); margin-top:8px;">
          <div class="admin-input-group">
            <label style="color:var(--gold); font-weight:700;">💠 Chỉ Số Buff (Nếu là Buff):</label>
            <select id="sk_buff_stat">
              <option value="">-- Không có (Sát thương / Hồi máu) --</option>
              <option value="str">⚔️ Str (Công Vật Lý)</option>
              <option value="mag">🔮 Mag (Ma Lực Phép)</option>
              <option value="def">🛡️ Def (Giáp Vật Lý)</option>
            </select>
          </div>
          <div class="admin-input-group">
            <label style="color:var(--gold); font-weight:700;">📈 Điểm Cộng Thêm:</label>
            <input type="number" id="sk_buff_val" value="0" placeholder="VD: 4">
          </div>
          <div class="admin-input-group">
            <label style="color:var(--gold); font-weight:700;">⏳ Số Lượt Duy Trì:</label>
            <input type="number" id="sk_buff_turns" value="2" placeholder="VD: 2">
          </div>
        </div>

        <div class="admin-input-group" style="margin-top:10px;"><label>Mô tả:</label><textarea id="sk_desc" rows="2"></textarea></div>

        <div style="margin-top:14px; display:flex; gap:10px;">
          <button type="submit" class="btn-summon btn-multi" style="padding:10px 24px;">💾 LƯU KỸ NĂNG</button>
          <button type="button" class="action-btn" onclick="document.getElementById('skillForm').reset()">Làm mới</button>
        </div>
      </form>
    </div>

    <div class="card" style="margin-top:20px;">
      <h3 style="color:var(--text); font-size:15px;">📋 DANH SÁCH KỸ NĂNG</h3>
      <table class="admin-table" id="skillsTable">
        <thead><tr><th>Icon</th><th>Tên</th><th>Tướng</th><th>Scope</th><th>Phạm Vi</th><th>Lực / Buff</th><th>Lượt</th><th>Thao tác</th></tr></thead>
        <tbody><tr><td colspan="8" style="text-align:center;">Đang tải...</td></tr></tbody>
      </table>
    </div>
  </div>

  <!-- ==================== 6. GIFTCODE ==================== -->
  <div id="secEvents" class="admin-section">
    <div class="card">
      <h3 style="color:var(--teal); font-size:16px;">🎁 THÊM MÃ GIFTCODE</h3>
      <p style="font-size:12px; color:var(--text-2); margin-top:2px; margin-bottom:12px;">
        💡 <em>Mẹo: Bạn có thể nhập tặng riêng Đá, riêng Vé, hoặc tặng CẢ ĐÁ VÀ VÉ cùng lúc trong 1 mã Giftcode!</em>
      </p>
      <form id="eventForm" onsubmit="saveEvent(event)">
        <div class="admin-form-grid">
          <div class="admin-input-group"><label>Mã Code:</label><input type="text" id="e_code" placeholder="VD: SIEUTANTHU" required></div>
          <div class="admin-input-group"><label>Tiêu đề:</label><input type="text" id="e_title" placeholder="Quà Tân Thủ Đặc Biệt" required></div>
          <div class="admin-input-group">
            <label style="color:var(--gold); font-weight:700;">💎 Số Đá (Gems):</label>
            <input type="number" id="e_gems" value="1000" min="0" required>
          </div>
          <div class="admin-input-group">
            <label style="color:var(--teal); font-weight:700;">🎟️ Số Vé Tẩy Cấp (Tickets):</label>
            <input type="number" id="e_tickets" value="0" min="0" required>
          </div>
        </div>
        <button type="submit" class="btn-summon btn-multi" style="padding:10px 24px; margin-top:10px;">💾 TẠO GIFTCODE</button>
      </form>
    </div>

    <div class="card" style="margin-top:20px;">
      <h3 style="color:var(--text); font-size:15px;">📋 DANH SÁCH GIFTCODES</h3>
      <table class="admin-table" id="eventsTable">
        <thead><tr><th>Mã Code</th><th>Tên Quà Tặng</th><th>Phần Thưởng</th><th>Thao tác</th></tr></thead>
        <tbody><tr><td colspan="4" style="text-align:center;">Đang tải...</td></tr></tbody>
      </table>
    </div>
  </div>

  <!-- ==================== 7. MAP BUILDER (CÓ Ô NƯỚC 🌊 VÀ NHẠC PHÂN LOẠI) ==================== -->
  <div id="secMaps" class="admin-section">
    <div class="card">
      <h3 style="color:var(--teal); font-size:18px;">🗺️ TRÌNH BIÊN TẬP BẢN ĐỒ CHIẾN THUẬT</h3>
      <div class="admin-form-grid" style="margin-top:16px;">
        <div class="admin-input-group"><label>Mã Map (ID):</label><input type="text" id="m_id" required></div>
        <div class="admin-input-group"><label>Tên Bản Đồ:</label><input type="text" id="m_name" required></div>
        <div class="admin-input-group">
          <label>Chế độ:</label>
          <select id="m_mode"><option value="campaign">Chiến Dịch</option><option value="endless">Tháp Vô Tận</option></select>
        </div>
        <div class="admin-input-group"><label>Thứ tự:</label><input type="number" id="m_order" value="1"></div>
        <div class="admin-input-group"><label>Thưởng Đá:</label><input type="number" id="m_gems" value="200"></div>
        <div class="admin-input-group"><label>Thưởng EXP:</label><input type="number" id="m_exp" value="50"></div>
        <div class="admin-input-group">
          <label style="color:#3a86ff; font-weight:800;">🎵 Nhạc Nền Combat (BGM):</label>
          <select id="m_bgm"></select>
        </div>
      </div>

      <div style="background:var(--panel-2); border:1px solid var(--line); border-radius:12px; padding:14px; margin:14px 0;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div>
            <strong style="color:var(--gold); font-size:13px;">📐 CHỌN KÍCH CỠ BẢN ĐỒ CÓ SẴN:</strong>
            <span style="font-size:12px; color:var(--text-3); margin-left:8px;">Bấm chọn nhanh hoặc tự gõ số tùy ý</span>
          </div>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button type="button" class="size-preset-btn" onclick="applyMapPreset(10, 7)">🌾 Tiêu Chuẩn (10 x 7)</button>
            <button type="button" class="size-preset-btn" onclick="applyMapPreset(8, 6)">⚔️ Đấu Trường (8 x 6)</button>
            <button type="button" class="size-preset-btn" onclick="applyMapPreset(14, 8)">🛡️ Thành Trì (14 x 8)</button>
            <button type="button" class="size-preset-btn" onclick="applyMapPreset(18, 6)">🌉 Hẻm Dài (18 x 6)</button>
            <button type="button" class="size-preset-btn" onclick="applyMapPreset(12, 10)">🏰 Đại Điện (12 x 10)</button>
            <button type="button" class="size-preset-btn" onclick="applyMapPreset(16, 10)">🗺️ Chiến Trường (16 x 10)</button>
          </div>
        </div>

        <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin-top:12px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <label style="font-size:12px; font-weight:700; color:#fff;">Số Cột (Chiều Ngang):</label>
            <input type="number" id="m_cols" value="10" min="6" max="30" style="width:70px; background:var(--panel); border:1px solid var(--line); color:#fff; padding:6px; border-radius:6px; font-weight:800;">
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <label style="font-size:12px; font-weight:700; color:#fff;">Số Hàng (Chiều Dọc):</label>
            <input type="number" id="m_rows" value="7" min="5" max="25" style="width:70px; background:var(--panel); border:1px solid var(--line); color:#fff; padding:6px; border-radius:6px; font-weight:800;">
          </div>
          <button type="button" class="action-btn" style="border-color:var(--teal); color:var(--teal); font-weight:800;" onclick="generateGridCanvas()">
            📐 KHỞI TẠO BÀN CỜ
          </button>
        </div>
      </div>

      <div class="map-builder-container">
        <div class="builder-toolbar">
          <button type="button" class="brush-btn active" id="brush_P" onclick="selectBrush('P')">🌾 Đồng Bằng</button>
          <button type="button" class="brush-btn" id="brush_F" onclick="selectBrush('F')">🌲 Rừng</button>
          <button type="button" class="brush-btn" id="brush_W" onclick="selectBrush('W')">🧱 Tường</button>
          <button type="button" class="brush-btn" id="brush_A" onclick="selectBrush('A')">🌊 Nước</button>
          <button type="button" class="brush-btn" id="brush_H" onclick="selectBrush('H')">🏰 Cứ Điểm</button>
          <button type="button" class="brush-btn" id="brush_S" onclick="selectBrush('S')">🔵 Ra Quân (Max 4)</button>
          <div style="display:inline-flex; align-items:center; gap:8px; background:#1b1930; padding:4px 8px; border-radius:8px;">
            <button type="button" class="brush-btn" id="brush_E" onclick="selectBrush('E')">🔴 Đặt Quái:</button>
            <select id="builderEnemySelect"></select>
          </div>
        </div>

        <div class="builder-canvas-wrap"><div id="builderGrid" class="builder-grid"></div></div>

        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:10px;">
          <button type="button" class="btn-summon btn-multi" style="padding:10px 28px;" onclick="saveCustomMap()">💾 LƯU MAP</button>
          <button type="button" class="action-btn" onclick="resetBuilderForm()">Làm mới</button>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:20px;">
      <h3 style="color:var(--text); font-size:15px;">📋 DANH SÁCH BẢN ĐỒ</h3>
      <table class="admin-table" id="mapsTable">
        <thead><tr><th>ID</th><th>Tên</th><th>Chế Độ</th><th>Ải</th><th>Kích Thước</th><th>Quái</th><th>Nhạc Combat</th><th>Thao tác</th></tr></thead>
        <tbody><tr><td colspan="8" style="text-align:center;">Đang tải...</td></tr></tbody>
      </table>
    </div>
  </div>

  <!-- ==================== 8. QUẢN LÝ NHẠC COMBAT (PHÂN LOẠI THƯỜNG / BOSS) ==================== -->
  <div id="secMusics" class="admin-section">
    <div class="card">
      <h3 style="color:#3a86ff; font-size:16px;" id="musicFormTitle">🎵 THÊM / CẬP NHẬT NHẠC COMBAT CHIẾN TRƯỜNG</h3>
      <p style="font-size:12px; color:var(--text-2); margin-top:2px;">
        💡 Âm lượng cơ bản mặc định là <strong>0.1</strong> (chuẩn dịu tai). Bạn có thể phân loại <strong>Nhạc Thường</strong> hoặc <strong>Nhạc Boss</strong> để dùng cơ chế Random thông minh.
      </p>

      <form id="musicForm" onsubmit="saveCombatMusic(event)">
        <input type="hidden" id="bgm_id" value="0">
        <div class="admin-form-grid">
          <div class="admin-input-group">
            <label>Tên bài nhạc hiển thị:</label>
            <input type="text" id="bgm_name" placeholder="VD: Boss Theme — Apex of the World" required autocomplete="off">
          </div>
          <div class="admin-input-group">
            <label style="color:var(--gold); font-weight:800;">👑 Thể Loại Nhạc Combat:</label>
            <select id="bgm_category">
              <option value="battle">⚔️ Nhạc Trận Đấu Thường (Battle Theme)</option>
              <option value="boss">👑 Nhạc Trận Đấu Boss (Boss Theme)</option>
            </select>
          </div>
          <div class="admin-input-group">
            <label>Đường dẫn file (src):</label>
            <input type="text" id="bgm_src" placeholder="audio/battle.mp3 hoặc audio/boss.mp3" required autocomplete="off">
          </div>
          <div class="admin-input-group">
            <label>Âm lượng riêng bài này (%):</label>
            <input type="number" id="bgm_vol" min="10" max="200" value="100" required>
          </div>
        </div>

        <div style="margin-top:14px; display:flex; gap:10px; align-items:center;">
          <button type="submit" class="btn-summon btn-multi" style="padding:10px 24px;">💾 LƯU BÀI NHẠC</button>
          <button type="button" class="action-btn" onclick="previewCurrentFormMusic()">🎧 Nghe Thử</button>
          <button type="button" class="action-btn" onclick="resetMusicForm()">Làm mới</button>
        </div>
      </form>
    </div>

    <div class="card" style="margin-top:20px;">
      <h3 style="color:var(--text); font-size:15px;">📋 DANH SÁCH NHẠC COMBAT KHẢ DỤNG</h3>
      <table class="admin-table" id="musicsTable">
        <thead>
          <tr>
            <th>ID</th>
            <th>Thể Loại</th>
            <th>Tên Bài Hát</th>
            <th>Đường Dẫn Audio</th>
            <th>Âm Lượng Riêng</th>
            <th>Nghe Thử</th>
            <th>Thao Tác</th>
          </tr>
        </thead>
        <tbody>
          <tr><td colspan="7" style="text-align:center;">Đang tải danh sách nhạc...</td></tr>
        </tbody>
      </table>
    </div>
  </div>

</div>

<!-- SCRIPT DASHBOARD -->
<script>
let heroesList = [];
let weaponsList = [];
let bannersList = [];
let mapsList = [];
let skillsList = [];
let allUsersList = [];
let combatMusicsList = [];
let previewAudioInstance = null;

let bCols = 10, bRows = 7;
let bTerrainMatrix = [], bPlayerSpawns = [], bEnemySpawns = [];
let activeBrush = 'P', isMouseDownOnGrid = false, lastInteractedTile = null;

// BIẾN CHO TRÌNH CĂN CHỈNH CUT-IN
let isCutinDragging = false, cutinDragStartY = 0, cutinDragStartX = 0, cutinStartValY = 30, cutinStartValX = 50;

window.addEventListener('mouseup', () => { 
  isMouseDownOnGrid = false; 
  lastInteractedTile = null; 
  isCutinDragging = false;
});

const AVAILABLE_BUFF_TYPES = [
  { id: 'stat_hp', label: '🟢 + Max HP' },
  { id: 'stat_str', label: '⚔️ + Str' },
  { id: 'stat_mag', label: '🔮 + Mag' },
  { id: 'stat_def', label: '🛡️ + Def' },
  { id: 'stat_res', label: '💠 + Res' },
  { id: 'stat_dex', label: '🎯 + Dex' },
  { id: 'stat_spd', label: '⚡ + Spd' },
  { id: 'stat_mov', label: '👟 + MP' },
  { id: 'crit_rate', label: '💥 +% Crit' },
  { id: 'weakness_dmg', label: '🎯 +% Weakness Dmg' },
  { id: 'first_strike_crit', label: '👑 Đòn Đầu 100% Crit (Nhập: 1)' },
  { id: 'life_steal', label: '🩸 +% Life Steal' },
  { id: 'dmg_reduction', label: '🛡️ -% Giảm Dame' }
];

function switchAdminSection(secId, btn) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(secId)?.classList.add('active');
  if (btn) btn.classList.add('active');

  if (previewAudioInstance) previewAudioInstance.pause();

  if (secId === 'secMaps') { loadMaps(); if (bTerrainMatrix.length === 0) generateGridCanvas(); }
  else if (secId === 'secSkills') loadSkills();
  else if (secId === 'secWeapons') loadWeapons();
  else if (secId === 'secBanners') loadBanners();
  else if (secId === 'secUsers') loadUsers();
  else if (secId === 'secEvents') loadEvents();
  else if (secId === 'secMusics') loadCombatMusics();
  else if (secId === 'secCutinEditor') initCutinEditor();
}

// 0. QUẢN LÝ NGƯỜI DÙNG
async function loadUsers() {
  try {
    const res = await fetch('api.php?action=admin_get_users');
    const d = await res.json();
    if (d.success) {
      allUsersList = d.data || [];
      renderUsersTable(allUsersList);
    }
  } catch (err) {
    console.error("Lỗi nạp users:", err);
  }
}

function renderUsersTable(list) {
  const tbody = document.querySelector('#usersTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:var(--text-3);">Không tìm thấy tài khoản nào!</td></tr>';
    return;
  }

  list.forEach(u => {
    const tr = document.createElement('tr');
    const isBanned = (parseInt(u.is_banned) === 1);
    const isAdmin = (u.role === 'admin');

    const roleBadge = isAdmin
      ? '<span style="color:var(--gold); font-weight:800; background:rgba(232,178,61,0.15); padding:2px 8px; border-radius:6px; border:1px solid var(--gold);">👑 Admin</span>'
      : '<span style="color:var(--teal); font-weight:700;">👤 User</span>';

    const statusBadge = isBanned
      ? '<span style="color:var(--danger); font-weight:800; background:rgba(209,73,91,0.15); padding:2px 8px; border-radius:6px; border:1px solid var(--danger);">⛔ BỊ KHÓA</span>'
      : '<span style="color:var(--teal); font-weight:700;">🟢 Hoạt Động</span>';

    const banBtnText = isBanned ? '🔓 Mở Khóa' : '⛔ Khóa Acc';
    const banBtnColor = isBanned ? 'var(--teal)' : 'var(--danger)';

    tr.innerHTML = `
      <td><strong>#${u.id}</strong></td>
      <td><strong style="font-size:14px; color:${isBanned ? 'var(--text-3)' : '#fff'};">${u.username}</strong></td>
      <td>${roleBadge}</td>
      <td><strong style="color:var(--gold); font-size:14px;">${parseInt(u.gems).toLocaleString()} 💎</strong></td>
      <td>${u.pity} / 80</td>
      <td>${u.checkin_streak || 0} ngày</td>
      <td>${statusBadge}</td>
      <td style="font-size:11px; color:var(--text-3);">${u.created_at || 'Không rõ'}</td>
      <td>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button class="action-btn" style="padding:4px 8px; font-size:11px;" onclick="editUser(${u.id})">✏️ Sửa</button>
          <button class="action-btn" style="padding:4px 8px; font-size:11px; border-color:var(--gold); color:var(--gold);" onclick="quickAdjustGems(${u.id}, '${u.username}')">💎 Tặng Đá</button>
          <button class="action-btn" style="padding:4px 8px; font-size:11px; border-color:${banBtnColor}; color:${banBtnColor};" onclick="toggleBanUser(${u.id}, ${isBanned ? 1 : 0})">${banBtnText}</button>
          <button class="action-btn" style="padding:4px 8px; font-size:11px; border-color:var(--danger); color:var(--danger);" onclick="deleteUser(${u.id}, '${u.username}')">🗑️ Xóa</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filterUsersList(kw) {
  const term = kw.trim().toLowerCase();
  if (!term) {
    renderUsersTable(allUsersList);
    return;
  }
  const filtered = allUsersList.filter(u => 
    u.username.toLowerCase().includes(term) || String(u.id).includes(term)
  );
  renderUsersTable(filtered);
}

function editUser(id) {
  const u = allUsersList.find(x => parseInt(x.id) === parseInt(id));
  if (!u) return;

  document.getElementById('u_id').value = u.id;
  document.getElementById('u_username').value = u.username;
  document.getElementById('u_password').value = '';
  document.getElementById('u_role').value = u.role || 'user';
  document.getElementById('u_gems').value = u.gems;
  document.getElementById('u_pity').value = u.pity || 0;
  document.getElementById('u_is_banned').value = u.is_banned || 0;

  document.getElementById('userFormTitle').textContent = `✏️ CẬP NHẬT TÀI KHOẢN [${u.username}] (ID: #${u.id})`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetUserForm() {
  document.getElementById('userForm').reset();
  document.getElementById('u_id').value = 0;
  document.getElementById('u_role').value = 'user';
  document.getElementById('u_is_banned').value = 0;
  document.getElementById('u_gems').value = 1500;
  document.getElementById('u_pity').value = 0;
  document.getElementById('userFormTitle').textContent = `➕ THÊM / CẬP NHẬT TÀI KHOẢN NGƯỜI DÙNG`;
}

async function saveUser(e) {
  e.preventDefault();
  const id = parseInt(document.getElementById('u_id').value) || 0;
  const username = document.getElementById('u_username').value.trim();
  const password = document.getElementById('u_password').value.trim();
  const role = document.getElementById('u_role').value;
  const gems = document.getElementById('u_gems').value;
  const pity = document.getElementById('u_pity').value;
  const is_banned = document.getElementById('u_is_banned').value;

  try {
    const fd = new FormData();
    fd.append('id', id);
    fd.append('username', username);
    fd.append('password', password);
    fd.append('role', role);
    fd.append('gems', gems);
    fd.append('pity', pity);
    fd.append('is_banned', is_banned);

    const res = await fetch('api.php?action=admin_save_user', { method: 'POST', body: fd });
    const d = await res.json();
    if (d.success) {
      alert(`🎉 ${d.message || 'Lưu thành công!'}`);
      resetUserForm();
      loadUsers();
    } else {
      alert("❌ Lỗi: " + d.error);
    }
  } catch (err) {
    alert("Lỗi kết nối: " + err);
  }
}

async function toggleBanUser(id, currentBanned) {
  const actionText = currentBanned ? 'MỞ KHÓA' : 'KHÓA (BAN)';
  if (!confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản ID #${id}?`)) return;

  try {
    const fd = new FormData();
    fd.append('id', id);
    const res = await fetch('api.php?action=admin_toggle_ban_user', { method: 'POST', body: fd });
    const d = await res.json();
    if (d.success) {
      loadUsers();
    } else {
      alert("❌ " + d.error);
    }
  } catch (err) {
    alert("Lỗi: " + err);
  }
}

async function quickAdjustGems(id, username) {
  const input = prompt(`💎 Nhập số Kim Cương muốn cộng / trừ cho [${username}]:\n(Ví dụ: nhập 5000 để cộng 5,000 Đá, hoặc -2000 để trừ bớt)`, "5000");
  if (input === null) return;

  const amt = parseInt(input);
  if (isNaN(amt) || amt === 0) {
    alert("⚠️ Số lượng không hợp lệ!");
    return;
  }

  try {
    const fd = new FormData();
    fd.append('id', id);
    fd.append('amount', amt);

    const res = await fetch('api.php?action=admin_adjust_user_gems', { method: 'POST', body: fd });
    const d = await res.json();
    if (d.success) {
      alert(`🎉 Đã cập nhật! Số Đá mới của [${username}] là: ${d.new_gems.toLocaleString()} 💎`);
      loadUsers();
    } else {
      alert("❌ " + d.error);
    }
  } catch (err) {
    alert("Lỗi: " + err);
  }
}

async function deleteUser(id, username) {
  if (!confirm(`⚠️ CẢNH BÁO: Xóa vĩnh viễn tài khoản [${username}] (ID #${id})?\nToàn bộ kho đồ và tiến trình tướng sẽ bị xóa sạch!`)) return;

  try {
    const fd = new FormData();
    fd.append('id', id);
    const res = await fetch('api.php?action=admin_delete_user', { method: 'POST', body: fd });
    const d = await res.json();
    if (d.success) {
      alert("🗑️ Đã xóa người dùng thành công!");
      loadUsers();
    } else {
      alert("❌ " + d.error);
    }
  } catch (err) {
    alert("Lỗi: " + err);
  }
}

// ==========================================================================
// 1. QUẢN LÝ NHÂN VẬT
// ==========================================================================
async function loadHeroes() {
  try {
    const res = await fetch('api.php?action=admin_get_units');
    const d = await res.json();
    if (d.success) {
      heroesList = d.data || [];
      renderHeroesTable(heroesList);

      const selectConst = document.getElementById('constHeroSelect');
      const skHeroSelect = document.getElementById('sk_hero_id');
      const enemySelect = document.getElementById('builderEnemySelect');

      if (selectConst) selectConst.innerHTML = '';
      if (skHeroSelect) skHeroSelect.innerHTML = '';

      heroesList.forEach(u => {
        if (u.team === 'player') {
          if (selectConst) {
            const opt = document.createElement('option'); opt.value = u.id; opt.textContent = `${u.name} (${u.cls})`;
            selectConst.appendChild(opt);
          }
          if (skHeroSelect) {
            const opt = document.createElement('option'); opt.value = u.id; opt.textContent = `${u.name} (${u.cls})`;
            skHeroSelect.appendChild(opt);
          }
        }
      });

      if (enemySelect) {
        enemySelect.innerHTML = `<optgroup label="👑 BOSS" id="optGroupBoss"></optgroup><optgroup label="💀 LÍNH" id="optGroupMinion"></optgroup>`;
        const gb = document.getElementById('optGroupBoss'), gm = document.getElementById('optGroupMinion');
        heroesList.filter(u => u.team === 'enemy').forEach(u => {
          const opt = document.createElement('option'); opt.value = u.id;
          opt.textContent = (u.is_boss == 1 ? `👑 [BOSS] ${u.name}` : `${u.symbol} ${u.name}`);
          (u.is_boss == 1 ? gb : gm).appendChild(opt);
        });
      }

      loadHeroConstellations();
      onBannerTypeChange();
    }
  } catch (err) { console.error(err); }
}

function renderHeroesTable(list) {
  const tbody = document.querySelector('#heroesTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="12" style="text-align:center; color:var(--text-3);">Không tìm thấy nhân vật nào phù hợp!</td></tr>';
    return;
  }

  list.forEach(u => {
    const tr = document.createElement('tr');
    const avatarHtml = u.avatar 
      ? `<img src="${u.avatar}" style="width:32px; height:32px; border-radius:50%; object-fit:cover;">`
      : `<div style="width:28px; height:28px; border-radius:50%; background:${u.color}; color:#12111b; display:flex; align-items:center; justify-content:center; font-weight:800;">${u.symbol}</div>`;

    const isBoss = (u.is_boss == 1);
    const teamBadge = (u.team === 'player')
      ? '<span style="color:var(--teal); font-weight:700;">Phe Ta</span>'
      : (isBoss ? '<span style="color:var(--gold); font-weight:800;">👑 BOSS</span>' : '<span style="color:var(--danger);">Địch</span>');

    const volText = u.cutin_volume !== undefined ? `${u.cutin_volume}%` : '100%';
    const voiceBadge = u.cutin_audio && u.cutin_audio.trim() !== ''
      ? `<span style="color:var(--teal); font-size:11px; font-weight:800;" title="${u.cutin_audio}">🎵 Có Voice (${volText})</span>`
      : `<span style="color:var(--text-3); font-size:11px;">Mặc định</span>`;

    const uRarity = u.rarity || 'SSR';
    const rarityBadge = (uRarity === 'SSR')
      ? '<span style="color:var(--gold); font-weight:800; background:rgba(232,178,61,0.15); padding:2px 8px; border-radius:6px; border:1px solid var(--gold);">5★ SSR</span>'
      : '<span style="color:var(--sr); font-weight:800; background:rgba(181,23,158,0.15); padding:2px 8px; border-radius:6px; border:1px solid var(--sr);">4★ SR</span>';

    const allowedWpBadge = `<span style="color:var(--teal); font-size:11px; font-weight:700; background:rgba(61,219,196,0.1); padding:2px 6px; border-radius:4px; border:1px solid rgba(61,219,196,0.3);">${u.allowed_weapons || 'Kiếm'}</span>`;

    const nameDisplay = `
      <strong>${u.name}</strong>
      ${u.short_name ? `<br><small style="color:var(--gold); font-weight:700;">[Combat: ${u.short_name}]</small>` : ''}
    `;

    const moveBadge = (u.move_type === 'fly') 
      ? '<br><span style="color:#48cae4; font-size:10px; font-weight:800; background:rgba(72,202,228,0.15); padding:1px 6px; border-radius:4px; border:1px solid rgba(72,202,228,0.4);">🦅 Bay (Qua Nước)</span>' 
      : '<br><span style="color:var(--text-3); font-size:10px;">🚶 Đi Bộ</span>';

    tr.innerHTML = `
      <td><strong>${u.id}</strong></td>
      <td>${avatarHtml}</td>
      <td>${nameDisplay}</td>
      <td>${allowedWpBadge}</td>
      <td>${rarityBadge}</td>
      <td>${teamBadge}</td>
      <td><strong>${u.cls}</strong>${moveBadge}</td>
      <td>${u.type}</td>
      <td>${u.hp}/${u.maxhp}</td>
      <td>${u.str}/${u.mag}</td>
      <td>${voiceBadge}</td>
      <td>
        <div style="display:flex; gap:5px; flex-wrap:wrap;">
          <button class="action-btn" style="padding:4px 8px; font-size:11px;" onclick="editHero('${u.id}')">Sửa</button>
          <button class="action-btn" style="padding:4px 8px; font-size:11px; border-color:var(--teal); color:var(--teal); font-weight:700;" onclick="cloneHero('${u.id}')" title="Nhân bản tạo một con tương tự">📑 Copy</button>
          <button class="action-btn" style="padding:4px 8px; font-size:11px; border-color:var(--danger); color:var(--danger);" onclick="deleteHero('${u.id}')">Xóa</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filterHeroesList(kw) {
  const term = kw.trim().toLowerCase();
  if (!term) {
    renderHeroesTable(heroesList);
    return;
  }
  const filtered = heroesList.filter(u => {
    const teamText = (u.team === 'player' ? 'phe ta' : 'phe địch');
    const bossText = (u.is_boss == 1 ? 'boss' : '');
    const moveText = (u.move_type === 'fly' ? 'bay qua nước' : 'đi bộ');
    return (u.id || '').toLowerCase().includes(term) ||
           (u.name || '').toLowerCase().includes(term) ||
           (u.short_name || '').toLowerCase().includes(term) ||
           (u.cls || '').toLowerCase().includes(term) ||
           (u.type || '').toLowerCase().includes(term) ||
           (u.rarity || '').toLowerCase().includes(term) ||
           (u.team || '').toLowerCase().includes(term) ||
           (u.move_type || '').toLowerCase().includes(term) ||
           teamText.includes(term) ||
           bossText.includes(term) ||
           moveText.includes(term);
  });
  renderHeroesTable(filtered);
}

function cloneHero(id) {
  const u = heroesList.find(x => x.id === id);
  if (!u) return;

  let newId = u.id + '_copy';
  let counter = 2;
  while (heroesList.some(x => x.id === newId)) {
    newId = `${u.id}_copy_${counter}`;
    counter++;
  }

  ['id','name','short_name','cls','allowed_weapons','rarity','symbol','team','is_boss','color','type','weakness','range','mov','move_type','hp','str','mag','dex','spd','def','res','lck','avatar','profile_img','crit_quote','dialogue_lv1','dialogue_lv2','dialogue_lv3','dialogue_lv4','cutin_img','cutin_audio','skill_cutin_img','skill_cutin_audio'].forEach(k => {
    const el = document.getElementById(`h_${k}`);
    if (el) el.value = u[k] ?? (k === 'rarity' ? 'SSR' : (k === 'allowed_weapons' ? 'Kiếm' : (k === 'move_type' ? 'walk' : '')));
  });

  const idEl = document.getElementById('h_id');
  if (idEl) idEl.value = newId;

  const nameEl = document.getElementById('h_name');
  if (nameEl) nameEl.value = `${u.name} (Copy)`;

  const shortNameEl = document.getElementById('h_short_name');
  if (shortNameEl && u.short_name) shortNameEl.value = `${u.short_name} 2`;

  const volEl = document.getElementById('h_cutin_volume');
  if (volEl) volEl.value = u.cutin_volume !== undefined ? u.cutin_volume : 100;

  const skillVolEl = document.getElementById('h_skill_cutin_volume');
  if (skillVolEl) skillVolEl.value = u.skill_cutin_volume !== undefined ? u.skill_cutin_volume : 100;

  window.scrollTo({ top: 0, behavior: 'smooth' });
  alert(`✨ Đã nhân bản toàn bộ thông số của [${u.name}]!\n🆔 Mã nhân vật mới tự tạo: [${newId}]\nBạn có thể đổi lại chỉ số/tên rồi bấm "LƯU NHÂN VẬT".`);
}

function editHero(id) {
  const u = heroesList.find(x => x.id === id); if (!u) return;
  ['id','name','short_name','cls','allowed_weapons','rarity','symbol','team','is_boss','color','type','weakness','range','mov','move_type','hp','str','mag','dex','spd','def','res','lck','avatar','profile_img','crit_quote','dialogue_lv1','dialogue_lv2','dialogue_lv3','dialogue_lv4','cutin_img','cutin_audio','skill_cutin_img','skill_cutin_audio'].forEach(k => {
    const el = document.getElementById(`h_${k}`);
    if (el) el.value = u[k] ?? (k === 'rarity' ? 'SSR' : (k === 'allowed_weapons' ? 'Kiếm' : (k === 'move_type' ? 'walk' : '')));
  });

  const volEl = document.getElementById('h_cutin_volume');
  if (volEl) volEl.value = u.cutin_volume !== undefined ? u.cutin_volume : 100;

  const skillVolEl = document.getElementById('h_skill_cutin_volume');
  if (skillVolEl) skillVolEl.value = u.skill_cutin_volume !== undefined ? u.skill_cutin_volume : 100;

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function saveHero(e) {
  e.preventDefault();
  try {
    const fd = new FormData();
    ['h_id','h_name','h_short_name','h_cls','h_allowed_weapons','h_rarity','h_symbol','h_team','h_is_boss','h_color','h_type','h_weakness','h_range','h_mov','h_move_type','h_hp','h_str','h_mag','h_dex','h_spd','h_def','h_res','h_lck','h_avatar','h_profile_img','h_cutin_img','h_cutin_audio','h_cutin_volume','h_skill_cutin_img','h_skill_cutin_audio','h_skill_cutin_volume','h_crit_quote','h_dialogue_lv1','h_dialogue_lv2','h_dialogue_lv3','h_dialogue_lv4'].forEach(k => {
      fd.append(k.replace('h_', ''), document.getElementById(k)?.value || '');
    });
    const res = await fetch('api.php?action=admin_save_unit', { method: 'POST', body: fd });
    const d = await res.json();
    if (d.success) { alert("🎉 Đã lưu nhân vật thành công!"); loadHeroes(); }
    else alert("Lỗi: " + d.error);
  } catch (err) { alert(err); }
}

async function deleteHero(id) {
  if (!confirm(`Xóa nhân vật [${id}]?`)) return;
  try {
    const fd = new FormData(); fd.append('id', id);
    await fetch('api.php?action=admin_delete_unit', { method: 'POST', body: fd });
    loadHeroes();
  } catch (err) { alert(err); }
}

// ==========================================================================
// 🎯 TRÌNH CĂN CHỈNH VỊ TRÍ CUT-IN CRITICAL
// ==========================================================================
function initCutinEditor() {
  const sel = document.getElementById('cutinHeroSelect');
  if (!sel) return;
  sel.innerHTML = '';
  heroesList.filter(u => u.team === 'player').forEach(u => {
    const opt = document.createElement('option');
    opt.value = u.id;
    opt.textContent = `${u.name} (${u.short_name || u.id})`;
    sel.appendChild(opt);
  });
  if (heroesList.length > 0) onSelectCutinHero(sel.value || 'aria');

  const strip = document.getElementById('previewCritStrip');
  if (strip && !strip.dataset.boundDrag) {
    strip.dataset.boundDrag = "true";
    strip.addEventListener('mousedown', (e) => {
      isCutinDragging = true;
      cutinDragStartY = e.clientY;
      cutinDragStartX = e.clientX;
      cutinStartValY = parseInt(document.getElementById('rangePosY').value) || 30;
      cutinStartValX = parseInt(document.getElementById('rangePosX').value) || 50;
    });
    window.addEventListener('mousemove', (e) => {
      if (!isCutinDragging) return;
      const diffY = Math.round((e.clientY - cutinDragStartY) * 0.25);
      const diffX = Math.round((e.clientX - cutinDragStartX) * 0.25);
      let newY = Math.max(0, Math.min(100, cutinStartValY - diffY));
      let newX = Math.max(0, Math.min(100, cutinStartValX - diffX));
      document.getElementById('rangePosY').value = newY;
      document.getElementById('rangePosX').value = newX;
      updateCutinPreviewLive();
    });
  }
}

function onSelectCutinHero(heroId) {
  const u = heroesList.find(x => x.id === heroId);
  if (!u) return;
  const imgEl = document.getElementById('previewCutinImg');
  const cutinSrc = u.cutin_img || u.profile_img || u.avatar || '';
  imgEl.src = cutinSrc;

  document.getElementById('rangePosX').value = u.cutin_pos_x !== undefined ? u.cutin_pos_x : 50;
  document.getElementById('rangePosY').value = u.cutin_pos_y !== undefined ? u.cutin_pos_y : 30;
  document.getElementById('rangeScale').value = u.cutin_scale !== undefined ? u.cutin_scale : 120;
  updateCutinPreviewLive();
}

function updateCutinPreviewLive() {
  const x = document.getElementById('rangePosX').value;
  const y = document.getElementById('rangePosY').value;
  const scale = (parseInt(document.getElementById('rangeScale').value) || 120) / 100;

  document.getElementById('lblPosX').textContent = `${x}%`;
  document.getElementById('lblPosY').textContent = `${y}%`;
  document.getElementById('lblScale').textContent = `${Math.round(scale * 100)}%`;

  const img = document.getElementById('previewCutinImg');
  if (img) {
    img.style.objectPosition = `${x}% ${y}%`;
    img.style.transform = `skewX(14deg) scale(${scale})`;
  }
}

async function saveCurrentCutinConfig() {
  const heroId = document.getElementById('cutinHeroSelect').value;
  const x = document.getElementById('rangePosX').value;
  const y = document.getElementById('rangePosY').value;
  const scale = document.getElementById('rangeScale').value;

  try {
    const fd = new FormData();
    fd.append('id', heroId);
    fd.append('cutin_pos_x', x);
    fd.append('cutin_pos_y', y);
    fd.append('cutin_scale', scale);

    const res = await fetch('api.php?action=admin_save_cutin_config', { method: 'POST', body: fd });
    const d = await res.json();
    if (d.success) {
      alert("🎉 Đã lưu cấu hình vị trí Cut-in thành công!");
      const u = heroesList.find(h => h.id === heroId);
      if (u) { u.cutin_pos_x = x; u.cutin_pos_y = y; u.cutin_scale = scale; }
    } else alert("Lỗi: " + d.error);
  } catch (e) { alert(e); }
}

function testCurrentCutinAnimation() {
  const strip = document.getElementById('previewCritStrip');
  if (!strip) return;
  strip.classList.remove('animating');
  void strip.offsetWidth;
  strip.classList.add('animating');
  setTimeout(() => {
    strip.classList.remove('animating');
  }, 820);
}

// 2. VŨ KHÍ
function onWeaponTypeSelect(val) {
  const rangeSelect = document.getElementById('wp_range');
  if (rangeSelect) {
    rangeSelect.value = (val === 'Cung') ? '2' : '1';
  }
  const iconInput = document.getElementById('wp_icon');
  if (iconInput) {
    const iconMap = {
      'Kiếm': '⚔️', 'Rìu': '🪓', 'Đao': '🗡️', 'Trượng': '🪄',
      'Sách phép': '📖', 'Cung': '🏹', 'Thương': '🔱', 'Dao': '🗡️',
      'Nắm đấm': '🥊'
    };
    if (iconMap[val]) iconInput.value = iconMap[val];
  }
}

async function loadWeapons() {
  try {
    const res = await fetch('api.php?action=admin_get_weapons');
    const d = await res.json();
    if (d.success) {
      weaponsList = d.data;
      const tbody = document.querySelector('#weaponsTable tbody');
      tbody.innerHTML = '';

      weaponsList.forEach(w => {
        const tr = document.createElement('tr');
        const rBadge = w.rarity === 'SSR' ? '<strong style="color:var(--gold);">⭐⭐⭐⭐⭐ SSR</strong>' : (w.rarity === 'SR' ? '<strong style="color:var(--sr);">⭐⭐⭐⭐ SR</strong>' : '<strong style="color:var(--r);">⭐⭐⭐ R</strong>');
        const imgThumb = w.image ? `<img src="${w.image}" style="width:36px; height:36px; object-fit:contain;">` : `<span style="font-size:24px;">${w.icon}</span>`;

        let affBadge = '';
        if (w.affinity === 'Physical') affBadge = '<span style="color:var(--teal); font-weight:800; background:rgba(61,219,196,0.15); padding:2px 6px; border-radius:4px; border:1px solid var(--teal);">⚔️ Physical</span>';
        else if (w.affinity === 'Magic') affBadge = '<span style="color:var(--rose); font-weight:800; background:rgba(232,86,124,0.15); padding:2px 6px; border-radius:4px; border:1px solid var(--rose);">🔮 Magic</span>';
        else affBadge = '<span style="color:var(--gold); font-weight:800; background:rgba(232,178,61,0.15); padding:2px 6px; border-radius:4px; border:1px solid var(--gold);">🎯 Pierce</span>';

        const rangeBadge = (w.range == 2 || w.type === 'Cung')
          ? '<span style="color:var(--gold); font-weight:800;">2 ô (Bắn xa)</span>'
          : '<span style="color:var(--text-2);">1 ô (Cận chiến)</span>';

        const statArr = [];
        ['hp','str','mag','dex','spd','def','res','lck','mov'].forEach(st => {
          if (w[st] > 0) statArr.push(`${st.toUpperCase()} +${w[st]}`);
        });

        tr.innerHTML = `
          <td style="text-align:center;">${imgThumb}</td>
          <td><strong>${w.name}</strong><br><span style="font-size:11px; color:var(--text-3);">${w.id}</span></td>
          <td>${rBadge}</td>
          <td>${affBadge}</td>
          <td>${w.type}</td>
          <td>${rangeBadge}</td>
          <td style="color:var(--teal); font-weight:700;">${statArr.join(', ') || 'Không cộng'}</td>
          <td style="font-size:11px; color:var(--text-2); max-width:240px;">${w.description || ''}</td>
          <td>
            <button class="action-btn" style="padding:4px 8px; font-size:11px;" onclick="editWeapon('${w.id}')">Sửa</button>
            <button class="action-btn" style="padding:4px 8px; font-size:11px; border-color:var(--danger); color:var(--danger);" onclick="deleteWeapon('${w.id}')">Xóa</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
      onBannerTypeChange();
    }
  } catch (err) { console.error(err); }
}

function editWeapon(id) {
  const w = weaponsList.find(x => x.id === id); if (!w) return;
  ['id','name','type','range','rarity','affinity','icon','image','hp','str','mag','dex','spd','def','res','lck','mov','description'].forEach(k => {
    const el = document.getElementById(`wp_${k === 'description' ? 'desc' : k}`);
    if (el) el.value = w[k] ?? (k === 'affinity' ? 'Physical' : (k === 'range' ? (w.type === 'Cung' ? 2 : 1) : 0));
  });
  window.scrollTo({ top: 300, behavior: 'smooth' });
}

async function saveWeapon(e) {
  e.preventDefault();
  try {
    const fd = new FormData();
    ['id','name','type','range','rarity','affinity','icon','image','hp','str','mag','dex','spd','def','res','lck','mov'].forEach(k => {
      fd.append(k, document.getElementById(`wp_${k}`)?.value || '');
    });
    fd.append('description', document.getElementById('wp_desc')?.value || '');
    const res = await fetch('api.php?action=admin_save_weapon', { method: 'POST', body: fd });
    const d = await res.json();
    if (d.success) { alert("🎉 Đã lưu Vũ Khí thành công!"); loadWeapons(); }
    else alert("Lỗi: " + d.error);
  } catch (err) { alert(err); }
}

async function deleteWeapon(id) {
  if (!confirm(`Xóa vũ khí [${id}]?`)) return;
  try {
    const fd = new FormData(); fd.append('id', id);
    await fetch('api.php?action=admin_delete_weapon', { method: 'POST', body: fd });
    loadWeapons();
  } catch (err) { alert(err); }
}

// 3. CUNG MỆNH
async function loadHeroConstellations() {
  const heroId = document.getElementById('constHeroSelect')?.value; if (!heroId) return;
  try {
    const res = await fetch(`api.php?action=admin_get_constellations&hero_id=${heroId}`);
    const d = await res.json();
    const list = d.data || [];
    const container = document.getElementById('constNodesFormList'); container.innerHTML = '';

    for (let r = 1; r <= 6; r++) {
      const node = list.find(x => parseInt(x.rank) === r) || { rank: r, name: `Tầng ${r}`, description: '', buff_type: 'stat_hp', buff_val: 5 };
      let optionsHtml = '';
      AVAILABLE_BUFF_TYPES.forEach(opt => { optionsHtml += `<option value="${opt.id}" ${node.buff_type === opt.id ? 'selected' : ''}>${opt.label}</option>`; });

      const div = document.createElement('div');
      div.style.cssText = 'background:var(--panel-2); border:1px solid var(--line); border-radius:12px; padding:14px; display:flex; flex-direction:column; gap:10px;';
      div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:8px;">
          <strong style="color:var(--gold);">🌟 CUNG MỆNH C${r}</strong>
          <button type="button" class="action-btn" style="border-color:var(--teal); color:var(--teal);" onclick="saveSingleConstellation('${heroId}', ${r})">💾 Lưu C${r}</button>
        </div>
        <div style="grid-template-columns: 1fr 2fr; gap:10px; display:grid;">
          <input type="text" id="const_name_${r}" value="${node.name}" style="background:var(--panel); color:#fff; padding:7px; border-radius:6px; border:1px solid var(--line);">
          <input type="text" id="const_desc_${r}" value="${node.description}" style="background:var(--panel); color:#fff; padding:7px; border-radius:6px; border:1px solid var(--line);">
        </div>
        <div style="display:flex; gap:12px; align-items:center;">
          <select id="const_buff_${r}" style="flex:1; background:var(--panel); color:#fff; padding:7px; border-radius:6px; border:1px solid var(--line);">${optionsHtml}</select>
          <input type="number" id="const_val_${r}" value="${node.buff_val || 0}" style="width:100px; background:var(--panel); color:#fff; padding:7px; border-radius:6px; border:1px solid var(--line);">
        </div>
      `;
      container.appendChild(div);
    }
  } catch (err) { console.error(err); }
}

async function saveSingleConstellation(heroId, rank) {
  try {
    const fd = new FormData();
    fd.append('hero_id', heroId); fd.append('rank', rank);
    fd.append('name', document.getElementById(`const_name_${rank}`).value.trim());
    fd.append('description', document.getElementById(`const_desc_${rank}`).value.trim());
    fd.append('buff_type', document.getElementById(`const_buff_${rank}`).value);
    fd.append('buff_val', document.getElementById(`const_val_${rank}`).value);
    await fetch('api.php?action=admin_save_constellation', { method: 'POST', body: fd });
    alert(`🎉 Đã lưu Cung Mệnh C${rank}!`);
  } catch (err) { alert(err); }
}

// 4. BANNER GACHA
function onBannerTypeChange() {
  const bType = document.getElementById('b_type').value;
  const selectRateUp = document.getElementById('b_rate_up_id');
  const poolCheckboxes = document.getElementById('bannerPoolCheckboxes');
  const lblRateUp = document.getElementById('lblRateUp');
  const lblPoolTitle = document.getElementById('lblPoolTitle');

  selectRateUp.innerHTML = '<option value="">-- Không có (Banner Thường) --</option>';
  poolCheckboxes.innerHTML = '';

  if (bType === 'hero') {
    lblRateUp.textContent = '👤 Tướng Rate-up 5★ (SSR):';
    lblPoolTitle.innerHTML = '👥 BỂ TƯỚNG 5★ (SSR) TRONG BANNER: <span style="font-size:11px; font-weight:normal; color:var(--text-3);">(Vũ khí 3★, 4★ và Tướng 4★ sẽ tự động có mặt trong mọi lần quay)</span>';

    heroesList.filter(u => u.team === 'player' && (u.rarity === 'SSR' || !u.rarity)).forEach(u => {
      const opt = document.createElement('option'); opt.value = u.id; opt.textContent = `${u.name} (${u.cls} · ${u.type})`;
      selectRateUp.appendChild(opt);

      const label = document.createElement('label');
      label.style.cssText = 'display:inline-flex; align-items:center; gap:6px; background:var(--panel); border:1px solid var(--line); padding:6px 12px; border-radius:8px; font-size:12px; cursor:pointer; color:#fff;';
      label.innerHTML = `<input type="checkbox" name="banner_pool_item" value="${u.id}" checked><span>${u.symbol} ${u.name}</span>`;
      poolCheckboxes.appendChild(label);
    });
  } else {
    lblRateUp.textContent = '⚔️ Vũ Khí Rate-up 5★ (SSR):';
    lblPoolTitle.innerHTML = '⚔️ BỂ VŨ KHÍ 5★ (SSR) TRONG BANNER: <span style="font-size:11px; font-weight:normal; color:var(--text-3);">(Vũ khí 3★, 4★ sẽ tự động có mặt trong mọi lần quay)</span>';

    const ssrWeapons = weaponsList.filter(w => w.rarity === 'SSR');
    if (ssrWeapons.length === 0) {
      poolCheckboxes.innerHTML = '<span style="color:var(--danger); font-size:12px;">Chưa có vũ khí 5★ (SSR) nào! Hãy vào tab "Quản Lý Vũ Khí" tạo vũ khí 5★ trước.</span>';
    }

    ssrWeapons.forEach(w => {
      const opt = document.createElement('option'); opt.value = w.id; opt.textContent = `${w.name} (5★ ${w.type})`;
      selectRateUp.appendChild(opt);

      const label = document.createElement('label');
      label.style.cssText = 'display:inline-flex; align-items:center; gap:6px; background:var(--panel); border:1px solid var(--line); padding:6px 12px; border-radius:8px; font-size:12px; cursor:pointer; color:var(--gold);';
      label.innerHTML = `<input type="checkbox" name="banner_pool_item" value="${w.id}" checked><span style="font-weight:700;">${w.icon || '⚔️'} ${w.name} (5★)</span>`;
      poolCheckboxes.appendChild(label);
    });
  }
}

async function loadBanners() {
  try {
    const res = await fetch('api.php?action=admin_get_banners');
    const d = await res.json();
    if (d.success) {
      bannersList = d.data;
      const tbody = document.querySelector('#bannersTable tbody');
      tbody.innerHTML = '';
      bannersList.forEach(b => {
        const tr = document.createElement('tr');
        const isActive = (b.is_active == 1);
        const isWeaponBanner = (b.type === 'weapon');
        const typeBadge = isWeaponBanner 
          ? '<span style="color:var(--gold); font-weight:800; background:rgba(232,178,61,0.15); padding:2px 8px; border-radius:6px; border:1px solid var(--gold);">⚔️ VŨ KHÍ</span>' 
          : '<span style="color:var(--teal); font-weight:800; background:rgba(61,219,196,0.15); padding:2px 8px; border-radius:6px; border:1px solid var(--teal);">👤 TƯỚNG</span>';

        const poolDisplay = b.pool_heroes ? b.pool_heroes.split(',').join(', ') : 'Toàn bộ';
        const rateUpDisplay = b.rate_up_id 
          ? `<strong style="color:var(--gold);">${b.item_name || b.rate_up_id}</strong>` 
          : `<span style="color:var(--text-3); font-style:italic;">⚪ Tiêu Chuẩn</span>`;

        tr.innerHTML = `
          <td><strong>${b.id}</strong></td>
          <td>${typeBadge}</td>
          <td>${b.image ? `<img src="${b.image}" style="width:50px; height:28px; border-radius:4px; object-fit:cover;">` : 'Mặc định'}</td>
          <td><strong>${b.name}</strong></td>
          <td>${b.cost} 💎</td>
          <td>${rateUpDisplay}</td>
          <td style="font-size:11px; color:var(--teal); max-width:200px;">${poolDisplay}</td>
          <td><strong style="color:${isActive ? 'var(--teal)' : 'var(--text-3)'}">${isActive ? '🟢 HIỆN' : '⚪ ẨN'}</strong></td>
          <td>
            <button class="action-btn" style="padding:4px 8px; font-size:11px;" onclick="editBanner('${b.id}')">Sửa</button>
            <button class="action-btn" style="padding:4px 8px; font-size:11px; border-color:var(--danger); color:var(--danger);" onclick="deleteBanner('${b.id}')">Xóa</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (err) { console.error(err); }
}

function editBanner(id) {
  const b = bannersList.find(x => x.id === id); if (!b) return;
  document.getElementById('b_id').value = b.id;
  document.getElementById('b_name').value = b.name;
  document.getElementById('b_type').value = b.type || 'hero';
  onBannerTypeChange();

  document.getElementById('b_cost').value = b.cost;
  document.getElementById('b_rate_up_id').value = b.rate_up_id || '';
  document.getElementById('b_pity_max').value = b.pity_max;
  document.getElementById('b_end_date').value = b.end_date ? b.end_date.replace(' ', 'T') : '';
  document.getElementById('b_image').value = b.image || '';
  document.getElementById('b_is_active').checked = (b.is_active == 1);

  const poolArr = b.pool_heroes ? b.pool_heroes.split(',') : [];
  setTimeout(() => {
    document.querySelectorAll('input[name="banner_pool_item"]').forEach(chk => {
      chk.checked = (poolArr.length === 0 || poolArr.includes(chk.value));
    });
  }, 50);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetBannerForm() {
  document.getElementById('bannerForm').reset();
  document.getElementById('b_type').value = 'hero';
  onBannerTypeChange();
}

async function saveBanner(e) {
  e.preventDefault();
  try {
    const selectedPool = [];
    document.querySelectorAll('input[name="banner_pool_item"]:checked').forEach(chk => selectedPool.push(chk.value));
    if (selectedPool.length === 0) { alert("⚠️ Phải chọn ít nhất 1 mục 5★ (SSR) trong Banner!"); return; }

    const fd = new FormData();
    fd.append('id', document.getElementById('b_id').value.trim());
    fd.append('name', document.getElementById('b_name').value.trim());
    fd.append('type', document.getElementById('b_type').value);
    fd.append('cost', document.getElementById('b_cost').value);
    fd.append('rate_up_id', document.getElementById('b_rate_up_id').value.trim());
    fd.append('pity_max', document.getElementById('b_pity_max').value);
    fd.append('end_date', document.getElementById('b_end_date').value);
    fd.append('image', document.getElementById('b_image').value.trim());
    fd.append('is_active', document.getElementById('b_is_active').checked ? 1 : 0);
    fd.append('pool_heroes', selectedPool.join(','));

    const res = await fetch('api.php?action=admin_save_banner', { method: 'POST', body: fd });
    const d = await res.json();
    if (d.success) { alert("🎉 Đã lưu Banner Gacha!"); resetBannerForm(); loadBanners(); }
    else alert("Lỗi: " + d.error);
  } catch (err) { alert(err); }
}

async function deleteBanner(id) {
  if (!confirm(`Xóa banner [${id}]?`)) return;
  try {
    const fd = new FormData(); fd.append('id', id);
    await fetch('api.php?action=admin_delete_banner', { method: 'POST', body: fd });
    loadBanners();
  } catch (err) { alert(err); }
}

// 5. KỸ NĂNG
async function loadSkills() {
  try {
    const res = await fetch('api.php?action=admin_get_skills');
    const d = await res.json();
    if (d.success) {
      skillsList = d.data;
      const tbody = document.querySelector('#skillsTable tbody');
      tbody.innerHTML = '';
      skillsList.forEach(s => {
        const tr = document.createElement('tr');
        const shapeLabels = {
          single: '🎯 Đơn Mục Tiêu',
          line: '📏 Tia Thẳng',
          cross: '➕ Chữ Thập',
          ally_single: '🤝 1 Đồng Minh',
          ally_all: '👥 Toàn Đội Đồng Minh'
        };
        const shapeDisplay = shapeLabels[s.target_shape] || s.target_shape;
        const buffDisplay = (s.skill_type === 'buff' && s.buff_stat) 
          ? `<br><span style="color:var(--gold); font-size:11px;">Buff +${s.buff_val} ${s.buff_stat.toUpperCase()} (${s.buff_turns} lượt)</span>` 
          : '';

        tr.innerHTML = `
          <td style="font-size:20px; text-align:center;">${s.icon}</td>
          <td><strong>${s.name}</strong><br><span style="font-size:11px; color:var(--text-3);">${s.id}</span></td>
          <td><strong style="color:var(--gold);">${s.hero_name || s.hero_id}</strong></td>
          <td>${s.scope === 'map' ? '🗺️ MAP' : '⚔️ COMBAT'}</td>
          <td><span style="color:var(--teal); font-weight:700;">${shapeDisplay}</span></td>
          <td>Tầm: ${s.range_min}-${s.range_max} | Lực: <strong>${s.power}</strong>${buffDisplay}</td>
          <td><strong style="color:var(--teal);">${s.max_uses} lượt / Ải</strong></td>
          <td>
            <button class="action-btn" style="padding:4px 8px; font-size:11px;" onclick="editSkill('${s.id}')">Sửa</button>
            <button class="action-btn" style="padding:4px 8px; font-size:11px; border-color:var(--danger); color:var(--danger);" onclick="deleteSkill('${s.id}')">Xóa</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (err) { console.error(err); }
}

function editSkill(id) {
  const s = skillsList.find(x => x.id === id); if (!s) return;
  ['id','name','icon','hero_id','scope','type','shape','rmin','rmax','power','uses','desc'].forEach(k => {
    const keyMap = { rmin:'range_min', rmax:'range_max', power:'power', uses:'max_uses', desc:'description', shape:'target_shape', type:'skill_type' };
    const el = document.getElementById(`sk_${k}`);
    if (el) el.value = s[keyMap[k] || k] ?? '';
  });

  const buffStatEl = document.getElementById('sk_buff_stat');
  if (buffStatEl) buffStatEl.value = s.buff_stat || '';
  const buffValEl = document.getElementById('sk_buff_val');
  if (buffValEl) buffValEl.value = s.buff_val || 0;
  const buffTurnsEl = document.getElementById('sk_buff_turns');
  if (buffTurnsEl) buffTurnsEl.value = s.buff_turns || 0;

  window.scrollTo({ top: 300, behavior: 'smooth' });
}

async function saveSkill(e) {
  e.preventDefault();
  try {
    const fd = new FormData();
    fd.append('id', document.getElementById('sk_id').value.trim());
    fd.append('hero_id', document.getElementById('sk_hero_id').value);
    fd.append('name', document.getElementById('sk_name').value.trim());
    fd.append('icon', document.getElementById('sk_icon').value.trim() || '🔮');
    fd.append('scope', document.getElementById('sk_scope').value);
    fd.append('skill_type', document.getElementById('sk_type').value);
    fd.append('target_shape', document.getElementById('sk_shape').value);
    fd.append('range_min', document.getElementById('sk_rmin').value);
    fd.append('range_max', document.getElementById('sk_rmax').value);
    fd.append('power', document.getElementById('sk_power').value);
    fd.append('max_uses', document.getElementById('sk_uses').value);
    fd.append('buff_stat', document.getElementById('sk_buff_stat')?.value || '');
    fd.append('buff_val', document.getElementById('sk_buff_val')?.value || 0);
    fd.append('buff_turns', document.getElementById('sk_buff_turns')?.value || 0);
    fd.append('description', document.getElementById('sk_desc').value.trim());

    const res = await fetch('api.php?action=admin_save_skill', { method: 'POST', body: fd });
    const d = await res.json();
    if (d.success) { alert("🎉 Đã lưu Kỹ Năng!"); loadSkills(); }
    else alert("Lỗi: " + d.error);
  } catch (err) { alert(err); }
}

async function deleteSkill(id) {
  if (!confirm(`Xóa kỹ năng [${id}]?`)) return;
  try {
    const fd = new FormData(); fd.append('id', id);
    await fetch('api.php?action=admin_delete_skill', { method: 'POST', body: fd });
    loadSkills();
  } catch (err) { alert(err); }
}

// 6. GIFTCODE
async function loadEvents() {
  try {
    const res = await fetch('api.php?action=admin_get_events');
    const d = await res.json();
    if (d.success) {
      const tbody = document.querySelector('#eventsTable tbody');
      tbody.innerHTML = '';
      d.data.forEach(e => {
        const tr = document.createElement('tr');
        const gVal = parseInt(e.gems) || 0;
        const tVal = parseInt(e.tickets) || 0;

        const rewardParts = [];
        if (gVal > 0) rewardParts.push(`<strong style="color:var(--gold);">+${gVal.toLocaleString()} 💎</strong>`);
        if (tVal > 0) rewardParts.push(`<strong style="color:var(--teal);">+${tVal.toLocaleString()} 🎟️ Vé Tẩy Cấp</strong>`);
        const rewardText = rewardParts.length > 0 ? rewardParts.join(' & ') : '<span style="color:var(--text-3);">Không có quà</span>';

        tr.innerHTML = `
          <td><strong style="color:var(--teal);">${e.code}</strong></td>
          <td>${e.title}</td>
          <td>${rewardText}</td>
          <td><button class="action-btn" style="padding:4px 8px; font-size:11px;" onclick="deleteEvent(${e.id})">Xóa</button></td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (err) { console.error(err); }
}

async function saveEvent(e) {
  e.preventDefault();
  const code = document.getElementById('e_code').value.trim();
  const title = document.getElementById('e_title').value.trim();
  const gems = parseInt(document.getElementById('e_gems').value) || 0;
  const tickets = parseInt(document.getElementById('e_tickets').value) || 0;

  if (gems <= 0 && tickets <= 0) {
    alert("⚠️ Quà tặng phải có ít nhất Số Đá hoặc Số Vé Tẩy Cấp lớn hơn 0!");
    return;
  }

  try {
    const fd = new FormData();
    fd.append('code', code);
    fd.append('title', title);
    fd.append('gems', gems);
    fd.append('tickets', tickets);
    const res = await fetch('api.php?action=admin_save_event', { method: 'POST', body: fd });
    const d = await res.json();
    if (d.success) { 
      alert("🎉 Đã tạo Giftcode thành công!"); 
      document.getElementById('eventForm').reset(); 
      document.getElementById('e_gems').value = 1000;
      document.getElementById('e_tickets').value = 0;
      loadEvents(); 
    }
    else alert("Lỗi: " + d.error);
  } catch (err) { alert(err); }
}

async function deleteEvent(id) {
  if (!confirm("Xóa mã Giftcode này?")) return;
  try {
    const fd = new FormData(); fd.append('id', id);
    await fetch('api.php?action=admin_delete_event', { method: 'POST', body: fd });
    loadEvents();
  } catch (err) { alert(err); }
}

// 7. MAP BUILDER
function applyMapPreset(cols, rows) {
  document.getElementById('m_cols').value = cols; document.getElementById('m_rows').value = rows;
  generateGridCanvas();
}
function selectBrush(brushKey) {
  activeBrush = brushKey;
  document.querySelectorAll('.brush-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`brush_${brushKey}`)?.classList.add('active');
}
function generateGridCanvas() {
  bCols = Math.max(6, Math.min(30, parseInt(document.getElementById('m_cols').value) || 10));
  bRows = Math.max(5, Math.min(25, parseInt(document.getElementById('m_rows').value) || 7));
  bTerrainMatrix = [];
  for (let r = 0; r < bRows; r++) bTerrainMatrix.push(new Array(bCols).fill('P'));
  bPlayerSpawns = []; bEnemySpawns = [];
  renderBuilderGrid();
}
function renderBuilderGrid() {
  const container = document.getElementById('builderGrid'); if (!container) return;
  container.innerHTML = ''; container.style.gridTemplateColumns = `repeat(${bCols}, 44px)`;
  for (let r = 0; r < bRows; r++) {
    for (let c = 0; c < bCols; c++) {
      const tile = document.createElement('div');
      const tCode = bTerrainMatrix[r][c];
      const pSpawnIdx = bPlayerSpawns.findIndex(s => s.col === c && s.row === r);
      const eSpawn = bEnemySpawns.find(s => s.col === c && s.row === r);

      let tileClass = `tile-${tCode}`, tileText = '';
      if (pSpawnIdx !== -1) { tileClass = 'tile-S'; tileText = `S${pSpawnIdx + 1}`; }
      else if (eSpawn) {
        const eUnit = heroesList.find(u => u.id === eSpawn.id);
        tileClass = (eUnit?.is_boss == 1) ? 'b-tile tile-E boss-tile' : 'b-tile tile-E';
        tileText = (eUnit?.is_boss == 1) ? '👑' : (eUnit ? (eUnit.short_name || eUnit.name) : '💀');
      } else {
        if (tCode === 'F') tileText = '🌲'; 
        else if (tCode === 'W') tileText = '🧱'; 
        else if (tCode === 'H') tileText = '🏰';
        else if (tCode === 'A') tileText = '🌊';
      }

      tile.className = `b-tile ${tileClass}`; tile.innerHTML = tileText;
      tile.onmousedown = (e) => { e.preventDefault(); isMouseDownOnGrid = true; lastInteractedTile = `${c},${r}`; paintTile(c, r, true); };
      tile.onmouseenter = (e) => { if (isMouseDownOnGrid && e.buttons === 1 && lastInteractedTile !== `${c},${r}`) { lastInteractedTile = `${c},${r}`; paintTile(c, r, false); } };
      container.appendChild(tile);
    }
  }
}
function paintTile(c, r, isExplicitClick) {
  if (activeBrush === 'S') {
    if (!isExplicitClick) return;
    const existIdx = bPlayerSpawns.findIndex(s => s.col === c && s.row === r);
    if (existIdx !== -1) bPlayerSpawns.splice(existIdx, 1);
    else { if (bPlayerSpawns.length >= 4) { alert("⚠️ Tối đa 4 điểm ra quân!"); return; } bPlayerSpawns.push({ col: c, row: r }); }
  } else if (activeBrush === 'E') {
    if (!isExplicitClick) return;
    const enemyId = document.getElementById('builderEnemySelect').value || 'shade';
    const existIdx = bEnemySpawns.findIndex(s => s.col === c && s.row === r);
    if (existIdx !== -1) bEnemySpawns.splice(existIdx, 1);
    else bEnemySpawns.push({ id: enemyId, col: c, row: r });
  } else {
    bTerrainMatrix[r][c] = activeBrush;
  }
  renderBuilderGrid();
}
async function loadMaps() {
  try {
    const res = await fetch('api.php?action=admin_get_maps');
    const d = await res.json();
    if (d.success) {
      mapsList = d.data;
      const tbody = document.querySelector('#mapsTable tbody'); tbody.innerHTML = '';
      mapsList.forEach(m => {
        const tr = document.createElement('tr');
        
        let bgmText = '';
        if (m.bgm === 'random_boss') {
          bgmText = '<span style="color:var(--gold); font-size:11px; font-weight:800;">👑 Ngẫu nhiên Boss</span>';
        } else if (m.bgm === 'random_battle' || m.bgm === 'random') {
          bgmText = '<span style="color:var(--teal); font-size:11px; font-weight:700;">🎲 Ngẫu nhiên Thường</span>';
        } else if (m.bgm) {
          bgmText = `<code style="color:var(--teal); font-size:11px;">${m.bgm}</code>`;
        } else {
          bgmText = '<span style="color:var(--text-3); font-size:11px;">Mặc định</span>';
        }

        tr.innerHTML = `
          <td><strong>${m.id}</strong></td><td><strong>${m.name}</strong></td><td>${m.mode.toUpperCase()}</td><td>Ải ${m.stage_order}</td>
          <td>${m.cols} x ${m.rows}</td><td>${JSON.parse(m.enemy_spawns || '[]').length} quái</td>
          <td>${bgmText}</td>
          <td>
            <button class="action-btn" style="padding:4px 8px; font-size:11px;" onclick="editMap('${m.id}')">Sửa</button>
            <button class="action-btn" style="padding:4px 8px; font-size:11px; border-color:var(--danger); color:var(--danger);" onclick="deleteMap('${m.id}')">Xóa</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (err) { console.error(err); }
}
function editMap(id) {
  const m = mapsList.find(x => x.id === id); if (!m) return;
  document.getElementById('m_id').value = m.id; document.getElementById('m_name').value = m.name;
  document.getElementById('m_mode').value = m.mode; document.getElementById('m_order').value = m.stage_order;
  document.getElementById('m_cols').value = m.cols; document.getElementById('m_rows').value = m.rows;
  document.getElementById('m_gems').value = m.reward_gems; document.getElementById('m_exp').value = m.reward_exp;
  
  populateMapBgmDropdown(m.bgm || 'random_battle');

  bCols = parseInt(m.cols); bRows = parseInt(m.rows);
  const rawTerrain = JSON.parse(m.terrain || '[]');
  bTerrainMatrix = [];
  for (let r = 0; r < bRows; r++) { const rowStr = rawTerrain[r] || 'P'.repeat(bCols); bTerrainMatrix.push(rowStr.split('').slice(0, bCols)); }
  bPlayerSpawns = JSON.parse(m.player_spawns || '[]'); bEnemySpawns = JSON.parse(m.enemy_spawns || '[]');
  renderBuilderGrid();
  window.scrollTo({ top: 300, behavior: 'smooth' });
}
function resetBuilderForm() {
  document.getElementById('m_id').value = ''; document.getElementById('m_name').value = '';
  populateMapBgmDropdown('random_battle');
  generateGridCanvas();
}
async function saveCustomMap() {
  const id = document.getElementById('m_id').value.trim(), name = document.getElementById('m_name').value.trim();
  if (!id || !name) { alert("⚠️ Điền đủ Mã và Tên Map!"); return; }
  if (bPlayerSpawns.length === 0) { alert("⚠️ Cắm ít nhất 1 Điểm Ra Quân!"); return; }
  if (bEnemySpawns.length === 0) { alert("⚠️ Đặt ít nhất 1 Quái Vật (🔴 E)!"); return; }

  const fd = new FormData();
  fd.append('id', id); fd.append('name', name); fd.append('mode', document.getElementById('m_mode').value);
  fd.append('stage_order', document.getElementById('m_order').value); fd.append('cols', bCols); fd.append('rows', bRows);
  fd.append('terrain', JSON.stringify(bTerrainMatrix.map(row => row.join(''))));
  fd.append('player_spawns', JSON.stringify(bPlayerSpawns)); fd.append('enemy_spawns', JSON.stringify(bEnemySpawns));
  fd.append('reward_gems', document.getElementById('m_gems').value); fd.append('reward_exp', document.getElementById('m_exp').value);
  fd.append('bgm', document.getElementById('m_bgm')?.value || 'random_battle');

  const res = await fetch('api.php?action=admin_save_map', { method: 'POST', body: fd });
  const d = await res.json();
  if (d.success) { alert(`🎉 Đã lưu Map!`); loadMaps(); } else alert("Lỗi: " + d.error);
}
async function deleteMap(id) {
  if (!confirm(`Xóa map [${id}]?`)) return;
  const fd = new FormData(); fd.append('id', id);
  await fetch('api.php?action=admin_delete_map', { method: 'POST', body: fd });
  loadMaps();
}

// ==========================================================================
// 8. QUẢN LÝ NHẠC COMBAT (PHÂN LOẠI THƯỜNG / BOSS)
// ==========================================================================
async function loadCombatMusics() {
  try {
    const res = await fetch('api.php?action=admin_get_combat_musics');
    const d = await res.json();
    if (d.success) {
      combatMusicsList = d.data || [];
      renderMusicsTable();
      populateMapBgmDropdown();
    }
  } catch (err) { console.error(err); }
}

function renderMusicsTable() {
  const tbody = document.querySelector('#musicsTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (combatMusicsList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-3);">Chưa có bài nhạc nào!</td></tr>';
    return;
  }

  combatMusicsList.forEach(m => {
    const tr = document.createElement('tr');
    const catBadge = (m.category === 'boss')
      ? '<span style="color:var(--gold); font-weight:800; background:rgba(232,178,61,0.15); padding:2px 8px; border-radius:6px; border:1px solid var(--gold);">👑 Boss</span>'
      : '<span style="color:var(--teal); font-weight:700; background:rgba(61,219,196,0.12); padding:2px 8px; border-radius:6px; border:1px solid var(--teal);">⚔️ Thường</span>';

    tr.innerHTML = `
      <td><strong>#${m.id}</strong></td>
      <td>${catBadge}</td>
      <td><strong style="color:#fff;">${m.name}</strong></td>
      <td><code style="color:var(--teal); font-size:12px;">${m.src}</code></td>
      <td><strong style="color:var(--gold);">${m.volume}%</strong></td>
      <td>
        <button class="action-btn" style="padding:4px 10px; font-size:11px; border-color:#3a86ff; color:#3a86ff;" onclick="togglePlayPreview('${m.src}', ${m.volume}, this)">▶ Phát</button>
      </td>
      <td>
        <button class="action-btn" style="padding:4px 8px; font-size:11px;" onclick="editMusic(${m.id})">Sửa</button>
        <button class="action-btn" style="padding:4px 8px; font-size:11px; border-color:var(--danger); color:var(--danger);" onclick="deleteMusic(${m.id}, '${m.name}')">Xóa</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// MENU CHỌN NHẠC MAP BUILDER: CÓ RANDOM THƯỜNG / RANDOM BOSS VÀ NHÓM BÀI HÁT
function populateMapBgmDropdown(selectedBgm = 'random_battle') {
  const select = document.getElementById('m_bgm');
  if (!select) return;

  select.innerHTML = `
    <option value="random_battle">🎲 [Ngẫu Nhiên Nhạc Thường - Random Battle Theme]</option>
    <option value="random_boss">👑 [Ngẫu Nhiên Nhạc Boss - Random Boss Theme]</option>
  `;

  const optBattle = document.createElement('optgroup');
  optBattle.label = '⚔️ DANH SÁCH NHẠC TRẬN ĐẤU THƯỜNG';
  const optBoss = document.createElement('optgroup');
  optBoss.label = '👑 DANH SÁCH NHẠC TRẬN ĐẤU BOSS';

  combatMusicsList.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.src;
    opt.textContent = `🎵 ${m.name} (${m.src})`;

    if (m.category === 'boss') optBoss.appendChild(opt);
    else optBattle.appendChild(opt);
  });

  select.appendChild(optBattle);
  select.appendChild(optBoss);

  if (selectedBgm === 'random' || selectedBgm === 'random_battle') {
    select.value = 'random_battle';
  } else if (selectedBgm === 'random_boss') {
    select.value = 'random_boss';
  } else {
    select.value = selectedBgm;
  }
}

function togglePlayPreview(src, volume, btn) {
  if (previewAudioInstance && !previewAudioInstance.paused && previewAudioInstance.dataset.src === src) {
    previewAudioInstance.pause();
    btn.textContent = '▶ Phát';
    return;
  }
  if (previewAudioInstance) previewAudioInstance.pause();

  previewAudioInstance = new Audio(src);
  previewAudioInstance.dataset.src = src;
  previewAudioInstance.volume = Math.min(1.0, Math.max(0, 0.1 * (volume / 100)));
  previewAudioInstance.play().then(() => {
    btn.textContent = '⏹ Dừng';
  }).catch(e => alert("Không tìm thấy file audio: " + src));

  previewAudioInstance.onended = () => { btn.textContent = '▶ Phát'; };
}

function previewCurrentFormMusic() {
  const src = document.getElementById('bgm_src').value.trim();
  const vol = parseInt(document.getElementById('bgm_vol').value) || 100;
  if (!src) { alert("Vui lòng nhập đường dẫn file audio trước!"); return; }
  togglePlayPreview(src, vol, { textContent: '' });
}

function editMusic(id) {
  const m = combatMusicsList.find(x => x.id == id);
  if (!m) return;
  document.getElementById('bgm_id').value = m.id;
  document.getElementById('bgm_name').value = m.name;
  document.getElementById('bgm_category').value = m.category || 'battle';
  document.getElementById('bgm_src').value = m.src;
  document.getElementById('bgm_vol').value = m.volume;
  document.getElementById('musicFormTitle').textContent = `✏️ CẬP NHẬT BÀI NHẠC: ${m.name}`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetMusicForm() {
  document.getElementById('musicForm').reset();
  document.getElementById('bgm_id').value = 0;
  document.getElementById('bgm_category').value = 'battle';
  document.getElementById('bgm_vol').value = 100;
  document.getElementById('musicFormTitle').textContent = `🎵 THÊM / CẬP NHẬT NHẠC COMBAT CHIẾN TRƯỜNG`;
  if (previewAudioInstance) previewAudioInstance.pause();
}

async function saveCombatMusic(e) {
  e.preventDefault();
  const fd = new FormData();
  fd.append('id', document.getElementById('bgm_id').value);
  fd.append('name', document.getElementById('bgm_name').value.trim());
  fd.append('category', document.getElementById('bgm_category').value);
  fd.append('src', document.getElementById('bgm_src').value.trim());
  fd.append('volume', document.getElementById('bgm_vol').value);

  const res = await fetch('api.php?action=admin_save_combat_music', { method: 'POST', body: fd });
  const d = await res.json();
  if (d.success) {
    alert("🎉 Đã lưu bài nhạc combat!");
    resetMusicForm();
    loadCombatMusics();
  } else alert("Lỗi: " + d.error);
}

async function deleteMusic(id, name) {
  if (!confirm(`Xóa bài nhạc [${name}] khỏi danh mục?`)) return;
  const fd = new FormData();
  fd.append('id', id);
  await fetch('api.php?action=admin_delete_combat_music', { method: 'POST', body: fd });
  loadCombatMusics();
}

// KHỞI CHẠY TẤT CẢ DỮ LIỆU BAN ĐẦU
loadUsers();
loadHeroes();
loadWeapons();
loadBanners();
loadEvents();
loadSkills();
loadCombatMusics();
</script>
</body>
</html>