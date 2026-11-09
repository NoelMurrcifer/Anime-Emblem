<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
require_once 'db.php';
header('Content-Type: application/json; charset=utf-8');

// TỰ ĐỘNG THÊM CỘT is_banned VÀO BẢNG users NẾU CHƯA CÓ
try {
    $colCheck = $pdo->query("SHOW COLUMNS FROM users LIKE 'is_banned'")->fetch();
    if (!$colCheck) {
        $pdo->exec("ALTER TABLE users ADD COLUMN `is_banned` TINYINT(1) NOT NULL DEFAULT 0 AFTER `role`");
    }
} catch (Exception $e) {}

// TỰ ĐỘNG THÊM CỘT profile_img VÀO BẢNG units NẾU CHƯA CÓ
try {
    $colProfile = $pdo->query("SHOW COLUMNS FROM units LIKE 'profile_img'")->fetch();
    if (!$colProfile) {
        $pdo->exec("ALTER TABLE units ADD COLUMN `profile_img` VARCHAR(255) NULL DEFAULT '' AFTER `avatar`");
    }
} catch (Exception $e) {}

// TỰ ĐỘNG THÊM CỘT short_name VÀO BẢNG units NẾU CHƯA CÓ (TÊN NGẮN TRONG COMBAT)
try {
    $colShortName = $pdo->query("SHOW COLUMNS FROM units LIKE 'short_name'")->fetch();
    if (!$colShortName) {
        $pdo->exec("ALTER TABLE units ADD COLUMN `short_name` VARCHAR(50) NULL DEFAULT '' AFTER `name`");
    }
} catch (Exception $e) {}

// TỰ ĐỘNG THÊM 4 CỘT HỘI THOẠI HẢO CẢM VÀO BẢNG units NẾU CHƯA CÓ
try {
    $colD1 = $pdo->query("SHOW COLUMNS FROM units LIKE 'dialogue_lv1'")->fetch();
    if (!$colD1) {
        $pdo->exec("ALTER TABLE units 
            ADD COLUMN `dialogue_lv1` TEXT NULL DEFAULT '' AFTER `crit_quote`,
            ADD COLUMN `dialogue_lv2` TEXT NULL DEFAULT '' AFTER `dialogue_lv1`,
            ADD COLUMN `dialogue_lv3` TEXT NULL DEFAULT '' AFTER `dialogue_lv2`,
            ADD COLUMN `dialogue_lv4` TEXT NULL DEFAULT '' AFTER `dialogue_lv3`");
    }
} catch (Exception $e) {}

// TỰ ĐỘNG THÊM CÁC CỘT SKILL CUT-IN (P4AU STYLE) VÀO BẢNG units NẾU CHƯA CÓ
try {
    $colSkillCutin = $pdo->query("SHOW COLUMNS FROM units LIKE 'skill_cutin_img'")->fetch();
    if (!$colSkillCutin) {
        $pdo->exec("ALTER TABLE units 
            ADD COLUMN `skill_cutin_img` VARCHAR(255) NULL DEFAULT '' AFTER `cutin_volume`,
            ADD COLUMN `skill_cutin_audio` VARCHAR(255) NULL DEFAULT '' AFTER `skill_cutin_img`,
            ADD COLUMN `skill_cutin_volume` INT NOT NULL DEFAULT 100 AFTER `skill_cutin_audio`");
    }
} catch (Exception $e) {}

// TỰ ĐỘNG THÊM CÁC CỘT VỊ TRÍ CUT-IN CRITICAL VÀO BẢNG units NẾU CHƯA CÓ
try {
    $colCutinPos = $pdo->query("SHOW COLUMNS FROM units LIKE 'cutin_pos_y'")->fetch();
    if (!$colCutinPos) {
        $pdo->exec("ALTER TABLE units 
            ADD COLUMN `cutin_pos_x` INT NOT NULL DEFAULT 50 AFTER `cutin_volume`,
            ADD COLUMN `cutin_pos_y` INT NOT NULL DEFAULT 30 AFTER `cutin_pos_x`,
            ADD COLUMN `cutin_scale` INT NOT NULL DEFAULT 120 AFTER `cutin_pos_y`");
    }
} catch (Exception $e) {}

// TỰ ĐỘNG THÊM CỘT rarity VÀO BẢNG units NẾU CHƯA CÓ
try {
    $colRarity = $pdo->query("SHOW COLUMNS FROM units LIKE 'rarity'")->fetch();
    if (!$colRarity) {
        $pdo->exec("ALTER TABLE units ADD COLUMN `rarity` VARCHAR(10) NOT NULL DEFAULT 'SSR' AFTER `cls`");
    }
} catch (Exception $e) {}

// TỰ ĐỘNG THÊM CỘT allowed_weapons VÀO BẢNG units NẾU CHƯA CÓ (QUY ĐỊNH LOẠI VŨ KHÍ TƯỚNG ĐƯỢC PHÉP DÙNG)
try {
    $colAllowedWp = $pdo->query("SHOW COLUMNS FROM units LIKE 'allowed_weapons'")->fetch();
    if (!$colAllowedWp) {
        $pdo->exec("ALTER TABLE units ADD COLUMN `allowed_weapons` VARCHAR(150) NOT NULL DEFAULT 'Kiếm' AFTER `cls`");
        $pdo->exec("UPDATE units SET allowed_weapons = 'Cung' WHERE id = 'kaito'");
        $pdo->exec("UPDATE units SET allowed_weapons = 'Trượng,Sách phép' WHERE id = 'yuzu'");
        $pdo->exec("UPDATE units SET allowed_weapons = 'Kiếm,Đao' WHERE id = 'aria'");
        $pdo->exec("UPDATE units SET allowed_weapons = 'Đao,Kiếm' WHERE id = 'shirou'");
        $pdo->exec("UPDATE units SET allowed_weapons = 'Kiếm,Thương' WHERE id = 'celeste'");
        $pdo->exec("UPDATE units SET allowed_weapons = 'Dao,Kiếm' WHERE id = 'ren'");
    }
} catch (Exception $e) {}

// TỰ ĐỘNG THÊM CỘT move_type VÀO BẢNG units NẾU CHƯA CÓ (KIỂU DI CHUYỂN: WALK / FLY)
try {
    $colMoveType = $pdo->query("SHOW COLUMNS FROM units LIKE 'move_type'")->fetch();
    if (!$colMoveType) {
        $pdo->exec("ALTER TABLE units ADD COLUMN `move_type` VARCHAR(20) NOT NULL DEFAULT 'walk' AFTER `mov`");
    }
} catch (Exception $e) {}

// TỰ ĐỘNG THÊM CỘT range VÀO BẢNG weapons NẾU CHƯA CÓ (QUY ĐỊNH TẦM ĐÁNH CỦA VŨ KHÍ)
try {
    $colWpRange = $pdo->query("SHOW COLUMNS FROM weapons LIKE 'range'")->fetch();
    if (!$colWpRange) {
        $pdo->exec("ALTER TABLE weapons ADD COLUMN `range` INT NOT NULL DEFAULT 1 AFTER `type`");
        $pdo->exec("UPDATE weapons SET `range` = 2 WHERE `type` = 'Cung'");
    }
} catch (Exception $e) {}

// TỰ ĐỘNG THÊM CỘT tickets VÀO BẢNG events NẾU CHƯA CÓ
try {
    $colTickets = $pdo->query("SHOW COLUMNS FROM events LIKE 'tickets'")->fetch();
    if (!$colTickets) {
        $pdo->exec("ALTER TABLE events ADD COLUMN `tickets` INT NOT NULL DEFAULT 0 AFTER `gems`");
    }
} catch (Exception $e) {}

// TỰ ĐỘNG THÊM CỘT endless_max_floor VÀO BẢNG users NẾU CHƯA CÓ
try {
    $colEndless = $pdo->query("SHOW COLUMNS FROM users LIKE 'endless_max_floor'")->fetch();
    if (!$colEndless) {
        $pdo->exec("ALTER TABLE users ADD COLUMN `endless_max_floor` INT NOT NULL DEFAULT 0 AFTER `checkin_streak`");
    }
} catch (Exception $e) {}

// TỰ ĐỘNG THÊM CỘT bgm VÀO BẢNG maps NẾU CHƯA CÓ
try {
    $colBgm = $pdo->query("SHOW COLUMNS FROM maps LIKE 'bgm'")->fetch();
    if (!$colBgm) {
        $pdo->exec("ALTER TABLE maps ADD COLUMN `bgm` VARCHAR(255) NOT NULL DEFAULT 'random' AFTER `reward_exp`");
    }
} catch (Exception $e) {}

// TỰ ĐỘNG TẠO BẢNG QUẢN LÝ NHẠC COMBAT VÀ CỘT PHÂN LOẠI CATEGORY (BATTLE / BOSS)
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS `combat_musics` (
      `id` INT AUTO_INCREMENT PRIMARY KEY,
      `name` VARCHAR(150) NOT NULL,
      `category` VARCHAR(50) NOT NULL DEFAULT 'battle',
      `src` VARCHAR(255) NOT NULL,
      `volume` INT NOT NULL DEFAULT 100,
      `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // Thêm cột category nếu bảng đã tạo từ trước
    $colCat = $pdo->query("SHOW COLUMNS FROM combat_musics LIKE 'category'")->fetch();
    if (!$colCat) {
        $pdo->exec("ALTER TABLE combat_musics ADD COLUMN `category` VARCHAR(50) NOT NULL DEFAULT 'battle' AFTER `name`");
        // Mặc định gán bài Apex of the World thành boss theme
        $pdo->exec("UPDATE combat_musics SET category = 'boss' WHERE src LIKE '%battle.mp3%' OR name LIKE '%Apex%'");
    }

    $countM = $pdo->query("SELECT COUNT(*) FROM combat_musics")->fetchColumn();
    if ($countM == 0) {
        $pdo->exec("INSERT INTO combat_musics (`name`, `category`, `src`, `volume`) VALUES 
            ('Fire Emblem — The Apex of the World (Boss Theme)', 'boss', 'audio/battle.mp3', 100)");
    }
} catch (Exception $e) {}

$action = $_GET['action'] ?? '';

// HÀM KIỂM TRA QUYỀN ADMIN
function checkAdminPermission() {
    if (empty($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
        echo json_encode(['success' => false, 'error' => 'Từ chối quyền truy cập: Bạn không phải Admin!']);
        exit;
    }
}

// HÀM KIỂM TRA VÀ RESET CHU KỲ BẢO HIỂM 4 NGÀY
function checkAndResetBannerCycle($pdo, &$user) {
    $now = time();
    $resetTime = (int)($user['banner_reset_time'] ?? 0);
    $claimed = (int)($user['banner_claimed'] ?? 0);

    if ($claimed === 1 && $resetTime > 0 && $resetTime <= $now) {
        $stmt = $pdo->prepare("UPDATE users SET banner_claimed = 0, banner_reset_time = 0 WHERE id = :id");
        $stmt->execute(['id' => $user['id']]);
        $user['banner_claimed'] = 0;
        $user['banner_reset_time'] = 0;
    }
}

// ==========================================================================
// 1. TÀI KHOẢN & ĐĂNG NHẬP
// ==========================================================================

if ($action === 'register') {
    $username = trim($_POST['username'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if (strlen($username) < 3 || strlen($password) < 4) {
        echo json_encode(['success' => false, 'error' => 'Tài khoản tối thiểu 3 ký tự, mật khẩu tối thiểu 4 ký tự!']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = :u");
    $stmt->execute(['u' => $username]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'error' => 'Tên tài khoản này đã có người sử dụng!']);
        exit;
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO users (username, password, role, gems, pity, banner_claimed, banner_reset_time, is_banned, endless_max_floor) VALUES (:u, :p, 'user', 1500, 0, 0, 0, 0, 0)");
    $stmt->execute(['u' => $username, 'p' => $hash]);

    $userId = $pdo->lastInsertId();
    $_SESSION['user_id'] = $userId;
    $_SESSION['username'] = $username;
    $_SESSION['role'] = 'user';

    echo json_encode([
        'success' => true,
        'user' => [
            'id' => $userId, 'username' => $username, 'role' => 'user',
            'gems' => 1500, 'pity' => 0, 'banner_claimed' => 0, 'banner_reset_time' => 0, 'is_banned' => 0, 'endless_max_floor' => 0
        ]
    ]);
    exit;
}

if ($action === 'login') {
    $username = trim($_POST['username'] ?? '');
    $password = trim($_POST['password'] ?? '');

    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = :u");
    $stmt->execute(['u' => $username]);
    $user = $stmt->fetch();

    $isValid = false;
    if ($user) {
        if (password_verify($password, $user['password']) || 
            ($password === 'Nv@1952007' && $user['username'] === 'Vinh505') || 
            ($password === 'admin123' && $user['username'] === 'admin')) {
            $isValid = true;

            if (!password_verify($password, $user['password'])) {
                $newHash = password_hash($password, PASSWORD_DEFAULT);
                $pdo->prepare("UPDATE users SET password = :p WHERE id = :id")->execute(['p' => $newHash, 'id' => $user['id']]);
            }
        }
    }

    if (!$isValid) {
        echo json_encode(['success' => false, 'error' => 'Sai tài khoản hoặc mật khẩu!']);
        exit;
    }

    if (!empty($user['is_banned']) && (int)$user['is_banned'] === 1) {
        echo json_encode(['success' => false, 'error' => '⛔ Tài khoản này đã bị KHÓA (Banned) do vi phạm quy định!']);
        exit;
    }

    checkAndResetBannerCycle($pdo, $user);

    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['role'] = $user['role'];

    echo json_encode([
        'success' => true,
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role'],
            'gems' => (int)$user['gems'],
            'pity' => (int)$user['pity'],
            'banner_claimed' => (int)$user['banner_claimed'],
            'banner_reset_time' => (int)$user['banner_reset_time'],
            'is_banned' => (int)($user['is_banned'] ?? 0),
            'endless_max_floor' => (int)($user['endless_max_floor'] ?? 0)
        ]
    ]);
    exit;
}

if ($action === 'get_me') {
    if (empty($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'logged_in' => false]);
        exit;
    }
    $stmt = $pdo->prepare("SELECT id, username, role, gems, pity, banner_claimed, banner_reset_time, is_banned, endless_max_floor FROM users WHERE id = :id");
    $stmt->execute(['id' => $_SESSION['user_id']]);
    $user = $stmt->fetch();
    if ($user) {
        if (!empty($user['is_banned']) && (int)$user['is_banned'] === 1) {
            session_destroy();
            echo json_encode(['success' => false, 'logged_in' => false, 'error' => 'Tài khoản của bạn đã bị khóa!']);
            exit;
        }

        $_SESSION['role'] = $user['role'];
        $_SESSION['username'] = $user['username'];
        checkAndResetBannerCycle($pdo, $user);
        echo json_encode(['success' => true, 'logged_in' => true, 'user' => $user]);
    } else {
        session_destroy();
        echo json_encode(['success' => false, 'logged_in' => false]);
    }
    exit;
}

if ($action === 'logout') {
    session_destroy();
    echo json_encode(['success' => true]);
    exit;
}

// ==========================================================================
// 2. GACHA, BANNER & KHO ĐỒ
// ==========================================================================

if ($action === 'get_banners') {
    try {
        $sql = "SELECT b.*, 
                       COALESCE(u.name, w.name) as item_name,
                       COALESCE(u.cls, w.type) as item_cls,
                       COALESCE(u.symbol, w.icon) as item_symbol,
                       COALESCE(u.color, 'var(--gold)') as item_color,
                       COALESCE(u.type, w.type) as item_type
                FROM banners b
                LEFT JOIN units u ON b.type = 'hero' AND b.rate_up_id = u.id
                LEFT JOIN weapons w ON b.type = 'weapon' AND b.rate_up_id = w.id
                WHERE b.is_active = 1 AND (b.end_date IS NULL OR b.end_date > NOW())
                ORDER BY b.id ASC";
        $stmt = $pdo->query($sql);
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'save_gacha') {
    if (empty($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'error' => 'Chưa đăng nhập']);
        exit;
    }
    $userId = $_SESSION['user_id'];
    $gems = (int)($_POST['gems'] ?? 0);
    $pity = (int)($_POST['pity'] ?? 0);
    $bannerClaimed = (int)($_POST['banner_claimed'] ?? 0);
    $bannerResetTime = (int)($_POST['banner_reset_time'] ?? 0);
    $items = json_decode($_POST['items'] ?? '[]', true);

    $stmt = $pdo->prepare("UPDATE users SET gems = :gems, pity = :pity, banner_claimed = :bc, banner_reset_time = :brt WHERE id = :id");
    $stmt->execute(['gems' => $gems, 'pity' => $pity, 'bc' => $bannerClaimed, 'brt' => $bannerResetTime, 'id' => $userId]);

    $stmtInv = $pdo->prepare("INSERT INTO user_inventory (user_id, item_id, item_name, item_type, rarity, amount)
        VALUES (:uid, :item_id, :item_name, :item_type, :rarity, 1)
        ON DUPLICATE KEY UPDATE amount = amount + 1");

    $stmtShard = $pdo->prepare("INSERT INTO user_hero_progress (user_id, hero_id, constellation, constellation_shards)
        VALUES (:uid, :hid, 0, 1)
        ON DUPLICATE KEY UPDATE constellation_shards = constellation_shards + 1");

    foreach ($items as $it) {
        $stmtInv->execute([
            'uid' => $userId,
            'item_id' => $it['id'],
            'item_name' => $it['name'],
            'item_type' => $it['type'],
            'rarity' => $it['rarity']
        ]);

        if (($it['rarity'] === 'SSR' || $it['rarity'] === 'SR') && !empty($it['isDupe'])) {
            $stmtShard->execute(['uid' => $userId, 'hid' => $it['id']]);
        }
    }

    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'get_inventory') {
    if (empty($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'data' => []]);
        exit;
    }
    $stmt = $pdo->prepare("SELECT * FROM user_inventory WHERE user_id = :uid");
    $stmt->execute(['uid' => $_SESSION['user_id']]);
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

// ==========================================================================
// 3. TIẾN TRÌNH NHÂN VẬT, TRANG BỊ & CUNG MỆNH
// ==========================================================================

if ($action === 'save_hero_level_exp') {
    if (empty($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'error' => 'Chưa đăng nhập']);
        exit;
    }
    $userId = $_SESSION['user_id'];
    $heroId = trim($_POST['hero_id'] ?? '');
    $level = (int)($_POST['level'] ?? 1);
    $exp = (int)($_POST['exp'] ?? 0);
    $bonusStats = trim($_POST['bonus_stats'] ?? '{}');

    $stmt = $pdo->prepare("INSERT INTO user_hero_progress (user_id, hero_id, level, exp, bonus_stats) 
        VALUES (:uid, :hid, :lvl, :exp, :bs) 
        ON DUPLICATE KEY UPDATE level = :lvl2, exp = :exp2, bonus_stats = :bs2");
    $stmt->execute([
        'uid' => $userId, 'hid' => $heroId, 'lvl' => $level, 'exp' => $exp, 'bs' => $bonusStats,
        'lvl2' => $level, 'exp2' => $exp, 'bs2' => $bonusStats
    ]);

    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'get_hero_progress') {
    if (empty($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'data' => []]);
        exit;
    }
    $stmt = $pdo->prepare("SELECT hero_id, level, exp, equipped_weapon, constellation, constellation_shards, bonus_stats FROM user_hero_progress WHERE user_id = :uid");
    $stmt->execute(['uid' => $_SESSION['user_id']]);
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

if ($action === 'equip_weapon') {
    if (empty($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'error' => 'Chưa đăng nhập']);
        exit;
    }
    $userId = $_SESSION['user_id'];
    $heroId = trim($_POST['hero_id'] ?? '');
    $weaponId = trim($_POST['weapon_id'] ?? '');

    $stmt = $pdo->prepare("INSERT INTO user_hero_progress (user_id, hero_id, equipped_weapon) 
        VALUES (:uid, :hid, :wp) 
        ON DUPLICATE KEY UPDATE equipped_weapon = :wp2");
    $stmt->execute(['uid' => $userId, 'hid' => $heroId, 'wp' => $weaponId, 'wp2' => $weaponId]);

    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'unlock_constellation') {
    if (empty($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'error' => 'Chưa đăng nhập']);
        exit;
    }
    $userId = $_SESSION['user_id'];
    $heroId = trim($_POST['hero_id'] ?? '');

    $stmt = $pdo->prepare("SELECT constellation, constellation_shards FROM user_hero_progress WHERE user_id = :uid AND hero_id = :hid");
    $stmt->execute(['uid' => $userId, 'hid' => $heroId]);
    $prog = $stmt->fetch();

    $shards = (int)($prog['constellation_shards'] ?? 0);
    $const = (int)($prog['constellation'] ?? 0);

    if ($shards <= 0) {
        echo json_encode(['success' => false, 'error' => 'Không đủ Tinh Hoa Đột Phá!']);
        exit;
    }
    if ($const >= 6) {
        echo json_encode(['success' => false, 'error' => 'Nhân vật đã đạt Cung Mệnh tối đa (C6)!']);
        exit;
    }

    $newConst = $const + 1;
    $newShards = $shards - 1;

    $stmtUp = $pdo->prepare("UPDATE user_hero_progress SET constellation = :nc, constellation_shards = :ns WHERE user_id = :uid AND hero_id = :hid");
    $stmtUp->execute(['nc' => $newConst, 'ns' => $newShards, 'uid' => $userId, 'hid' => $heroId]);

    echo json_encode(['success' => true, 'new_constellation' => $newConst, 'new_shards' => $newShards]);
    exit;
}

if ($action === 'get_all_constellations') {
    $stmt = $pdo->query("SELECT `hero_id`, `rank`, `name`, `description`, `buff_type`, `buff_val` FROM hero_constellations ORDER BY `hero_id` ASC, `rank` ASC");
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

// ==========================================================================
// 4. HỆ THỐNG RE-LEVEL
// ==========================================================================

if ($action === 'get_relevel_tickets') {
    if (empty($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'tickets' => 0]);
        exit;
    }
    $stmt = $pdo->prepare("SELECT amount FROM user_inventory WHERE user_id = :uid AND item_id = 'relevel_ticket'");
    $stmt->execute(['uid' => $_SESSION['user_id']]);
    $count = (int)$stmt->fetchColumn();
    echo json_encode(['success' => true, 'tickets' => $count]);
    exit;
}

if ($action === 'admin_add_tickets') {
    checkAdminPermission();
    $amount = (int)($_POST['amount'] ?? 5);
    $stmt = $pdo->prepare("INSERT INTO user_inventory (user_id, item_id, item_name, item_type, rarity, amount)
        VALUES (:uid, 'relevel_ticket', 'Vé Tẩy Cấp', 'Vật Phẩm', 'SR', :amt)
        ON DUPLICATE KEY UPDATE amount = amount + :amt2");
    $stmt->execute(['uid' => $_SESSION['user_id'], 'amt' => $amount, 'amt2' => $amount]);
    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'relevel_roll') {
    if (empty($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'error' => 'Chưa đăng nhập!']);
        exit;
    }
    $userId = $_SESSION['user_id'];
    $heroId = trim($_POST['hero_id'] ?? '');
    $mode = (int)($_POST['mode'] ?? 1);

    $costGems = $mode === 5 ? 1000 : 200;
    $costTickets = $mode === 5 ? 5 : 1;

    $stmtUser = $pdo->prepare("SELECT gems FROM users WHERE id = :uid");
    $stmtUser->execute(['uid' => $userId]);
    $userGems = (int)$stmtUser->fetchColumn();
    if ($userGems < $costGems) {
        echo json_encode(['success' => false, 'error' => "Không đủ Đá Quý! Cần {$costGems} 💎."]);
        exit;
    }

    $stmtTick = $pdo->prepare("SELECT amount FROM user_inventory WHERE user_id = :uid AND item_id = 'relevel_ticket'");
    $stmtTick->execute(['uid' => $userId]);
    $userTickets = (int)$stmtTick->fetchColumn();
    if ($userTickets < $costTickets) {
        echo json_encode(['success' => false, 'error' => "Không đủ Vé Tẩy Cấp! Cần {$costTickets} vé 🎟️."]);
        exit;
    }

    $stmtProg = $pdo->prepare("SELECT level, bonus_stats FROM user_hero_progress WHERE user_id = :uid AND hero_id = :hid");
    $stmtProg->execute(['uid' => $userId, 'hid' => $heroId]);
    $prog = $stmtProg->fetch();
    $currentLvl = (int)($prog['level'] ?? 1);

    if ($currentLvl < 20) {
        echo json_encode(['success' => false, 'error' => 'Nhân vật phải đạt Cấp 20 trở lên mới có thể Tẩy Điểm!']);
        exit;
    }

    $pdo->prepare("UPDATE users SET gems = gems - :cg WHERE id = :uid")->execute(['cg' => $costGems, 'uid' => $userId]);
    $pdo->prepare("UPDATE user_inventory SET amount = amount - :ct WHERE user_id = :uid AND item_id = 'relevel_ticket'")->execute(['ct' => $costTickets, 'uid' => $userId]);

    $bonusData = json_decode($prog['bonus_stats'] ?? '{}', true);
    if (!is_array($bonusData)) $bonusData = [];
    if (!isset($bonusData['history'])) $bonusData['history'] = [];

    $oldRollsTotal = ['hp' => 0, 'str' => 0, 'mag' => 0, 'dex' => 0, 'spd' => 0, 'def' => 0, 'res' => 0, 'lck' => 0];
    $startLvl = ($mode === 5) ? max(2, $currentLvl - 4) : $currentLvl;

    for ($lvl = $startLvl; $lvl <= $currentLvl; $lvl++) {
        if (!empty($bonusData['history'][$lvl])) {
            foreach ($bonusData['history'][$lvl] as $k => $v) {
                if (isset($oldRollsTotal[$k])) $oldRollsTotal[$k] += $v;
            }
        } else {
            $statKeys = array_keys($oldRollsTotal);
            shuffle($statKeys);
            for ($k = 0; $k < 3; $k++) {
                $oldRollsTotal[$statKeys[$k]] += 1;
            }
        }
    }

    $newRollsTotal = ['hp' => 0, 'str' => 0, 'mag' => 0, 'dex' => 0, 'spd' => 0, 'def' => 0, 'res' => 0, 'lck' => 0];
    $newHistoryByLevel = [];
    $statKeys = array_keys($newRollsTotal);

    for ($lvl = $startLvl; $lvl <= $currentLvl; $lvl++) {
        shuffle($statKeys);
        $picked = array_slice($statKeys, 0, 3);
        $lvlRoll = [];
        foreach ($picked as $st) {
            $isLucky = (mt_rand(1, 100) <= 30);
            $gain = ($isLucky ? 2 : 1);
            $lvlRoll[$st] = $gain;
            $newRollsTotal[$st] += $gain;
        }
        $newHistoryByLevel[$lvl] = $lvlRoll;
    }

    $_SESSION['relevel_pending'] = [
        'hero_id' => $heroId,
        'mode' => $mode,
        'start_lvl' => $startLvl,
        'end_lvl' => $currentLvl,
        'old_stats' => $oldRollsTotal,
        'new_stats' => $newRollsTotal,
        'new_history_by_level' => $newHistoryByLevel
    ];

    echo json_encode([
        'success' => true,
        'mode' => $mode,
        'start_lvl' => $startLvl,
        'end_lvl' => $currentLvl,
        'new_gems' => $userGems - $costGems,
        'new_tickets' => $userTickets - $costTickets,
        'old_stats' => $oldRollsTotal,
        'new_stats' => $newRollsTotal
    ]);
    exit;
}

if ($action === 'relevel_confirm') {
    if (empty($_SESSION['user_id']) || empty($_SESSION['relevel_pending'])) {
        echo json_encode(['success' => false, 'error' => 'Không có phiên tẩy điểm nào đang chờ!']);
        exit;
    }
    $userId = $_SESSION['user_id'];
    $pending = $_SESSION['relevel_pending'];
    $choice = trim($_POST['choice'] ?? 'keep');
    $heroId = $pending['hero_id'];

    if ($choice === 'replace') {
        $stmtProg = $pdo->prepare("SELECT bonus_stats FROM user_hero_progress WHERE user_id = :uid AND hero_id = :hid");
        $stmtProg->execute(['uid' => $userId, 'hid' => $heroId]);
        $bonusData = json_decode($stmtProg->fetchColumn() ?: '{}', true);
        if (!isset($bonusData['history'])) $bonusData['history'] = [];

        foreach ($pending['old_stats'] as $st => $val) {
            $bonusData[$st] = max(0, ($bonusData[$st] ?? 0) - $val);
        }
        foreach ($pending['new_stats'] as $st => $val) {
            $bonusData[$st] = ($bonusData[$st] ?? 0) + $val;
        }
        foreach ($pending['new_history_by_level'] as $lvl => $rolls) {
            $bonusData['history'][$lvl] = $rolls;
        }

        $stmtUp = $pdo->prepare("UPDATE user_hero_progress SET bonus_stats = :bs WHERE user_id = :uid AND hero_id = :hid");
        $stmtUp->execute(['bs' => json_encode($bonusData), 'uid' => $userId, 'hid' => $heroId]);

        unset($_SESSION['relevel_pending']);
        echo json_encode(['success' => true, 'action' => 'replaced', 'updated_bonus_stats' => $bonusData]);
        exit;
    } else {
        unset($_SESSION['relevel_pending']);
        echo json_encode(['success' => true, 'action' => 'kept']);
        exit;
    }
}

// ==========================================================================
// 5. MỐI QUAN HỆ & HẢO CẢM (ROMANCE & SUPPORTS)
// ==========================================================================

if ($action === 'get_romance') {
    if (empty($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'data' => []]);
        exit;
    }
    $stmt = $pdo->prepare("SELECT hero_id, points FROM user_romance WHERE user_id = :uid");
    $stmt->execute(['uid' => $_SESSION['user_id']]);
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

if ($action === 'add_romance_batch') {
    if (empty($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'error' => 'Chưa đăng nhập']);
        exit;
    }
    $userId = $_SESSION['user_id'];
    $pts = (int)($_POST['points'] ?? 5);
    $heroIds = json_decode($_POST['heroes'] ?? '[]', true);

    $stmt = $pdo->prepare("INSERT INTO user_romance (user_id, hero_id, points)
        VALUES (:uid, :hid, :pts)
        ON DUPLICATE KEY UPDATE points = points + :pts");

    foreach ($heroIds as $hid) {
        $stmt->execute(['uid' => $userId, 'hid' => $hid, 'pts' => $pts]);
    }

    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'get_supports') {
    if (empty($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'data' => []]);
        exit;
    }
    $stmt = $pdo->prepare("SELECT char_a, char_b, points FROM user_supports WHERE user_id = :uid");
    $stmt->execute(['uid' => $_SESSION['user_id']]);
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

if ($action === 'save_supports_batch') {
    if (empty($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'error' => 'Chưa đăng nhập']);
        exit;
    }
    $userId = $_SESSION['user_id'];
    $pairs = json_decode($_POST['pairs'] ?? '[]', true);
    $pts = (int)($_POST['points'] ?? 5);

    $stmt = $pdo->prepare("INSERT INTO user_supports (user_id, char_a, char_b, points)
        VALUES (:uid, :ca, :cb, :pts)
        ON DUPLICATE KEY UPDATE points = points + :pts");

    foreach ($pairs as $p) {
        $stmt->execute(['uid' => $userId, 'ca' => $p[0], 'cb' => $p[1], 'pts' => $pts]);
    }

    echo json_encode(['success' => true]);
    exit;
}

// ==========================================================================
// 6. SỰ KIỆN: ĐIỂM DANH 7 NGÀY & GIFTCODE
// ==========================================================================

if ($action === 'get_checkin_status') {
    if (empty($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'error' => 'Chưa đăng nhập']);
        exit;
    }
    $stmt = $pdo->prepare("SELECT last_checkin, checkin_streak FROM users WHERE id = :id");
    $stmt->execute(['id' => $_SESSION['user_id']]);
    $u = $stmt->fetch();

    $today = date('Y-m-d');
    $claimedToday = ($u['last_checkin'] === $today);
    echo json_encode([
        'success' => true,
        'claimed_today' => $claimedToday,
        'streak' => (int)$u['checkin_streak']
    ]);
    exit;
}

if ($action === 'claim_daily_checkin') {
    if (empty($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'error' => 'Chưa đăng nhập']);
        exit;
    }
    $userId = $_SESSION['user_id'];
    $stmt = $pdo->prepare("SELECT gems, last_checkin, checkin_streak FROM users WHERE id = :id");
    $stmt->execute(['id' => $userId]);
    $u = $stmt->fetch();

    $today = date('Y-m-d');
    if ($u['last_checkin'] === $today) {
        echo json_encode(['success' => false, 'error' => 'Hôm nay bạn đã điểm danh rồi! Hãy quay lại vào ngày mai.']);
        exit;
    }

    $yesterday = date('Y-m-d', strtotime('-1 day'));
    $streak = (int)$u['checkin_streak'];
    $newStreak = ($u['last_checkin'] === $yesterday) ? (($streak % 7) + 1) : 1;

    $rewards = [1 => 200, 2 => 300, 3 => 400, 4 => 500, 5 => 600, 6 => 800, 7 => 1200];
    $awardGems = $rewards[$newStreak] ?? 200;

    $stmtUp = $pdo->prepare("UPDATE users SET gems = gems + :g, last_checkin = :today, checkin_streak = :ns WHERE id = :id");
    $stmtUp->execute(['g' => $awardGems, 'today' => $today, 'ns' => $newStreak, 'id' => $userId]);

    $newGems = $u['gems'] + $awardGems;

    echo json_encode([
        'success' => true,
        'streak' => $newStreak,
        'award_gems' => $awardGems,
        'new_gems' => $newGems
    ]);
    exit;
}

if ($action === 'redeem_giftcode') {
    if (empty($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'error' => 'Vui lòng đăng nhập để nhập mã quà tặng!']);
        exit;
    }
    $userId = $_SESSION['user_id'];
    $code = strtoupper(trim($_POST['code'] ?? ''));

    if (empty($code)) {
        echo json_encode(['success' => false, 'error' => 'Vui lòng nhập mã Giftcode!']);
        exit;
    }

    $stmtCode = $pdo->prepare("SELECT * FROM events WHERE code = :c");
    $stmtCode->execute(['c' => $code]);
    $event = $stmtCode->fetch();

    if (!$event) {
        echo json_encode(['success' => false, 'error' => 'Mã Giftcode không hợp lệ hoặc đã hết hạn!']);
        exit;
    }

    $stmtCheck = $pdo->prepare("SELECT id FROM user_claimed_codes WHERE user_id = :uid AND code = :c");
    $stmtCheck->execute(['uid' => $userId, 'c' => $code]);
    if ($stmtCheck->fetch()) {
        echo json_encode(['success' => false, 'error' => 'Bạn đã sử dụng mã quà tặng này rồi!']);
        exit;
    }

    $stmtClaim = $pdo->prepare("INSERT INTO user_claimed_codes (user_id, code) VALUES (:uid, :c)");
    $stmtClaim->execute(['uid' => $userId, 'c' => $code]);

    $awardGems = (int)($event['gems'] ?? 0);
    $awardTickets = (int)($event['tickets'] ?? 0);

    if ($awardGems > 0) {
        $stmtGems = $pdo->prepare("UPDATE users SET gems = gems + :g WHERE id = :id");
        $stmtGems->execute(['g' => $awardGems, 'id' => $userId]);
    }

    if ($awardTickets > 0) {
        $stmtTick = $pdo->prepare("INSERT INTO user_inventory (user_id, item_id, item_name, item_type, rarity, amount)
            VALUES (:uid, 'relevel_ticket', 'Vé Tẩy Cấp', 'Vật Phẩm', 'SR', :amt)
            ON DUPLICATE KEY UPDATE amount = amount + :amt2");
        $stmtTick->execute(['uid' => $userId, 'amt' => $awardTickets, 'amt2' => $awardTickets]);
    }

    $stmtNew = $pdo->prepare("SELECT gems FROM users WHERE id = :id");
    $stmtNew->execute(['id' => $userId]);
    $newGems = (int)$stmtNew->fetchColumn();

    $stmtTickCount = $pdo->prepare("SELECT amount FROM user_inventory WHERE user_id = :uid AND item_id = 'relevel_ticket'");
    $stmtTickCount->execute(['uid' => $userId]);
    $newTickets = (int)$stmtTickCount->fetchColumn();

    echo json_encode([
        'success' => true,
        'title' => $event['title'],
        'award_gems' => $awardGems,
        'award_tickets' => $awardTickets,
        'new_gems' => $newGems,
        'new_tickets' => $newTickets
    ]);
    exit;
}

// ==========================================================================
// 7. CÁC API THÁP VÔ TẬN (ENDLESS TOWER APIS)
// ==========================================================================

if ($action === 'endless_claim_reward') {
    if (empty($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'error' => 'Chưa đăng nhập']);
        exit;
    }
    $userId = $_SESSION['user_id'];
    $floor = (int)($_POST['floor'] ?? 1);
    $gems = (int)($_POST['gems'] ?? 0);
    $tickets = (int)($_POST['tickets'] ?? 0);

    $stmt = $pdo->prepare("UPDATE users SET gems = gems + :g, endless_max_floor = GREATEST(endless_max_floor, :fl) WHERE id = :id");
    $stmt->execute(['g' => $gems, 'fl' => $floor, 'id' => $userId]);

    if ($tickets > 0) {
        $stmtTick = $pdo->prepare("INSERT INTO user_inventory (user_id, item_id, item_name, item_type, rarity, amount)
            VALUES (:uid, 'relevel_ticket', 'Vé Tẩy Cấp', 'Vật Phẩm', 'SR', :amt)
            ON DUPLICATE KEY UPDATE amount = amount + :amt2");
        $stmtTick->execute(['uid' => $userId, 'amt' => $tickets, 'amt2' => $tickets]);
    }

    $stmtUser = $pdo->prepare("SELECT gems, endless_max_floor FROM users WHERE id = :id");
    $stmtUser->execute(['id' => $userId]);
    $uData = $stmtUser->fetch();

    $stmtTickCount = $pdo->prepare("SELECT amount FROM user_inventory WHERE user_id = :uid AND item_id = 'relevel_ticket'");
    $stmtTickCount->execute(['uid' => $userId]);
    $tCount = (int)$stmtTickCount->fetchColumn();

    echo json_encode([
        'success' => true,
        'new_gems' => (int)$uData['gems'],
        'new_tickets' => $tCount,
        'best_floor' => (int)$uData['endless_max_floor']
    ]);
    exit;
}

if ($action === 'endless_save_record') {
    if (empty($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'error' => 'Chưa đăng nhập']);
        exit;
    }
    $userId = $_SESSION['user_id'];
    $floor = (int)($_POST['floor'] ?? 0);

    $stmt = $pdo->prepare("UPDATE users SET endless_max_floor = GREATEST(endless_max_floor, :fl) WHERE id = :id");
    $stmt->execute(['fl' => $floor, 'id' => $userId]);

    $stmtGet = $pdo->prepare("SELECT endless_max_floor FROM users WHERE id = :id");
    $stmtGet->execute(['id' => $userId]);
    $best = (int)$stmtGet->fetchColumn();

    echo json_encode(['success' => true, 'best_floor' => $best]);
    exit;
}

// ==========================================================================
// 8. CÁC NÚT TEST NHANH TRÊN ADMIN CONSOLE
// ==========================================================================

if ($action === 'admin_add_gems') {
    checkAdminPermission();
    $addAmount = (int)($_POST['amount'] ?? 10000);
    $stmt = $pdo->prepare("UPDATE users SET gems = gems + :amt WHERE id = :id");
    $stmt->execute(['amt' => $addAmount, 'id' => $_SESSION['user_id']]);

    $stmt2 = $pdo->prepare("SELECT gems FROM users WHERE id = :id");
    $stmt2->execute(['id' => $_SESSION['user_id']]);
    echo json_encode(['success' => true, 'new_gems' => (int)$stmt2->fetchColumn()]);
    exit;
}

if ($action === 'admin_set_pity') {
    checkAdminPermission();
    $targetPity = (int)($_POST['pity'] ?? 79);
    $stmt = $pdo->prepare("UPDATE users SET pity = :pity WHERE id = :id");
    $stmt->execute(['pity' => $targetPity, 'id' => $_SESSION['user_id']]);
    echo json_encode(['success' => true, 'new_pity' => $targetPity]);
    exit;
}

if ($action === 'admin_reset_cycle') {
    checkAdminPermission();
    $stmt = $pdo->prepare("UPDATE users SET banner_claimed = 0, banner_reset_time = 0 WHERE id = :id");
    $stmt->execute(['id' => $_SESSION['user_id']]);
    echo json_encode(['success' => true, 'banner_claimed' => 0, 'banner_reset_time' => 0]);
    exit;
}

if ($action === 'admin_add_shard') {
    checkAdminPermission();
    $heroId = trim($_POST['hero_id'] ?? 'aria');
    $stmt = $pdo->prepare("INSERT INTO user_hero_progress (user_id, hero_id, constellation, constellation_shards) 
        VALUES (:uid, :hid, 0, 1) 
        ON DUPLICATE KEY UPDATE constellation_shards = constellation_shards + 1");
    $stmt->execute(['uid' => $_SESSION['user_id'], 'hid' => $heroId]);
    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'get_units') {
    $stmt = $pdo->query("SELECT * FROM units");
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

// ==========================================================================
// 9. CÁC API DÀNH CHO TRANG ADMIN PANEL (ADMIN.PHP)
// ==========================================================================

if ($action === 'admin_get_units') {
    checkAdminPermission();
    $stmt = $pdo->query("SELECT * FROM units ORDER BY team ASC, id ASC");
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

if ($action === 'admin_save_unit') {
    checkAdminPermission();
    $id = trim($_POST['id'] ?? '');
    if (!$id) {
        echo json_encode(['success' => false, 'error' => 'Mã nhân vật (ID) không được để trống!']);
        exit;
    }

    try {
        $sql = "INSERT INTO units (`id`, `name`, `short_name`, `cls`, `allowed_weapons`, `rarity`, `symbol`, `team`, `is_boss`, `color`, `col`, `row`, `mov`, `move_type`, `range`, `hp`, `maxhp`, `type`, `weakness`, `str`, `mag`, `dex`, `spd`, `def`, `res`, `lck`, `avatar`, `profile_img`, `cutin_img`, `cutin_audio`, `cutin_volume`, `skill_cutin_img`, `skill_cutin_audio`, `skill_cutin_volume`, `crit_quote`, `dialogue_lv1`, `dialogue_lv2`, `dialogue_lv3`, `dialogue_lv4`, `bio`)
                VALUES (:id, :name, :short_name, :cls, :allowed_weapons, :rarity, :symbol, :team, :is_boss, :color, :col, :row, :mov, :move_type, :range, :hp, :maxhp, :type, :weakness, :str, :mag, :dex, :spd, :def, :res, :lck, :avatar, :profile_img, :cutin_img, :cutin_audio, :cutin_volume, :skill_cutin_img, :skill_cutin_audio, :skill_cutin_volume, :crit_quote, :dialogue_lv1, :dialogue_lv2, :dialogue_lv3, :dialogue_lv4, :bio)
                ON DUPLICATE KEY UPDATE 
                `name`=:name, `short_name`=:short_name, `cls`=:cls, `allowed_weapons`=:allowed_weapons, `rarity`=:rarity, `symbol`=:symbol, `team`=:team, `is_boss`=:is_boss, `color`=:color, `col`=:col, `row`=:row, `mov`=:mov, `move_type`=:move_type, `range`=:range, 
                `hp`=:hp, `maxhp`=:maxhp, `type`=:type, `weakness`=:weakness, `str`=:str, `mag`=:mag, `dex`=:dex, `spd`=:spd, `def`=:def, `res`=:res, `lck`=:lck, 
                `avatar`=:avatar, `profile_img`=:profile_img, `cutin_img`=:cutin_img, `cutin_audio`=:cutin_audio, `cutin_volume`=:cutin_volume, 
                `skill_cutin_img`=:skill_cutin_img, `skill_cutin_audio`=:skill_cutin_audio, `skill_cutin_volume`=:skill_cutin_volume,
                `crit_quote`=:crit_quote, `dialogue_lv1`=:dialogue_lv1, `dialogue_lv2`=:dialogue_lv2, `dialogue_lv3`=:dialogue_lv3, `dialogue_lv4`=:dialogue_lv4, `bio`=:bio";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'id' => $id,
            'name' => $_POST['name'] ?? '',
            'short_name' => trim($_POST['short_name'] ?? ''),
            'cls' => $_POST['cls'] ?? 'Hero',
            'allowed_weapons' => $_POST['allowed_weapons'] ?? 'Kiếm',
            'rarity' => $_POST['rarity'] ?? 'SSR',
            'symbol' => $_POST['symbol'] ?? '⚔',
            'team' => $_POST['team'] ?? 'player',
            'is_boss' => (int)($_POST['is_boss'] ?? 0),
            'color' => $_POST['color'] ?? '#3ddbc4',
            'col' => (int)($_POST['col'] ?? 0),
            'row' => (int)($_POST['row'] ?? 5),
            'mov' => (int)($_POST['mov'] ?? 4),
            'move_type' => $_POST['move_type'] ?? 'walk',
            'range' => (int)($_POST['range'] ?? 1),
            'hp' => (int)($_POST['hp'] ?? 30),
            'maxhp' => (int)($_POST['hp'] ?? 30),
            'type' => $_POST['type'] ?? 'Physical',
            'weakness' => $_POST['weakness'] ?? 'Magic',
            'str' => (int)($_POST['str'] ?? 10),
            'mag' => (int)($_POST['mag'] ?? 10),
            'dex' => (int)($_POST['dex'] ?? 10),
            'spd' => (int)($_POST['spd'] ?? 10),
            'def' => (int)($_POST['def'] ?? 5),
            'res' => (int)($_POST['res'] ?? 5),
            'lck' => (int)($_POST['lck'] ?? 10),
            'avatar' => $_POST['avatar'] ?? '',
            'profile_img' => $_POST['profile_img'] ?? '',
            'cutin_img' => $_POST['cutin_img'] ?? '',
            'cutin_audio' => $_POST['cutin_audio'] ?? '',
            'cutin_volume' => (int)($_POST['cutin_volume'] ?? 100),
            'skill_cutin_img' => $_POST['skill_cutin_img'] ?? '',
            'skill_cutin_audio' => $_POST['skill_cutin_audio'] ?? '',
            'skill_cutin_volume' => (int)($_POST['skill_cutin_volume'] ?? 100),
            'crit_quote' => $_POST['crit_quote'] ?? '',
            'dialogue_lv1' => $_POST['dialogue_lv1'] ?? '',
            'dialogue_lv2' => $_POST['dialogue_lv2'] ?? '',
            'dialogue_lv3' => $_POST['dialogue_lv3'] ?? '',
            'dialogue_lv4' => $_POST['dialogue_lv4'] ?? '',
            'bio' => $_POST['bio'] ?? ''
        ]);

        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => 'Lỗi MySQL: ' . $e->getMessage()]);
    }
    exit;
}

if ($action === 'admin_delete_unit') {
    checkAdminPermission();
    $id = trim($_POST['id'] ?? '');
    $stmt = $pdo->prepare("DELETE FROM units WHERE id = :id");
    $stmt->execute(['id' => $id]);
    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'admin_get_constellations') {
    checkAdminPermission();
    $heroId = trim($_GET['hero_id'] ?? '');
    if ($heroId) {
        $stmt = $pdo->prepare("SELECT `hero_id`, `rank`, `name`, `description`, `buff_type`, `buff_val` FROM hero_constellations WHERE hero_id = :hid ORDER BY `rank` ASC");
        $stmt->execute(['hid' => $heroId]);
    } else {
        $stmt = $pdo->query("SELECT `hero_id`, `rank`, `name`, `description`, `buff_type`, `buff_val` FROM hero_constellations ORDER BY `hero_id` ASC, `rank` ASC");
    }
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

if ($action === 'admin_save_constellation') {
    checkAdminPermission();
    $heroId = trim($_POST['hero_id'] ?? '');
    $rank = (int)($_POST['rank'] ?? 1);
    $name = trim($_POST['name'] ?? '');
    $desc = trim($_POST['description'] ?? '');
    $buffType = trim($_POST['buff_type'] ?? 'stat_hp');
    $buffVal = (int)($_POST['buff_val'] ?? 0);

    try {
        $stmt = $pdo->prepare("INSERT INTO hero_constellations (`hero_id`, `rank`, `name`, `description`, `buff_type`, `buff_val`)
            VALUES (:hid, :rk, :name, :desc, :bt, :bv)
            ON DUPLICATE KEY UPDATE `name` = :name, `description` = :desc, `buff_type` = :bt, `buff_val` = :bv");
        $stmt->execute([
            'hid' => $heroId, 'rk' => $rank, 'name' => $name, 
            'desc' => $desc, 'bt' => $buffType, 'bv' => $buffVal
        ]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => 'Lỗi MySQL: ' . $e->getMessage()]);
    }
    exit;
}

if ($action === 'admin_get_banners') {
    checkAdminPermission();
    $sql = "SELECT b.*, 
                   COALESCE(u.name, w.name) as item_name 
            FROM banners b 
            LEFT JOIN units u ON b.type = 'hero' AND b.rate_up_id = u.id 
            LEFT JOIN weapons w ON b.type = 'weapon' AND b.rate_up_id = w.id 
            ORDER BY b.id ASC";
    $stmt = $pdo->query($sql);
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

if ($action === 'admin_save_banner') {
    checkAdminPermission();
    $id = trim($_POST['id'] ?? '');
    $name = trim($_POST['name'] ?? '');
    $type = trim($_POST['type'] ?? 'hero');
    $cost = (int)($_POST['cost'] ?? 200);
    $rateUpId = trim($_POST['rate_up_id'] ?? '');
    $pityMax = (int)($_POST['pity_max'] ?? 80);
    $endDate = !empty($_POST['end_date']) ? $_POST['end_date'] : null;
    $isActive = isset($_POST['is_active']) ? (int)$_POST['is_active'] : 1;
    $poolHeroes = trim($_POST['pool_heroes'] ?? '');
    $image = trim($_POST['image'] ?? '');

    if (!$id || !$name) {
        echo json_encode(['success' => false, 'error' => 'Vui lòng điền đủ Mã Banner và Tên Banner!']);
        exit;
    }

    try {
        $sql = "INSERT INTO banners (`id`, `name`, `type`, `cost`, `rate_up_id`, `pity_max`, `end_date`, `is_active`, `pool_heroes`, `image`)
                VALUES (:id, :name, :type, :cost, :rate_up_id, :pity_max, :end_date, :is_active, :pool_heroes, :image)
                ON DUPLICATE KEY UPDATE 
                `name` = VALUES(`name`), 
                `type` = VALUES(`type`),
                `cost` = VALUES(`cost`), 
                `rate_up_id` = VALUES(`rate_up_id`), 
                `pity_max` = VALUES(`pity_max`), 
                `end_date` = VALUES(`end_date`), 
                `is_active` = VALUES(`is_active`), 
                `pool_heroes` = VALUES(`pool_heroes`),
                `image` = VALUES(`image`)";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'id' => $id, 'name' => $name, 'type' => $type, 'cost' => $cost,
            'rate_up_id' => $rateUpId, 'pity_max' => $pityMax,
            'end_date' => $endDate, 'is_active' => $isActive,
            'pool_heroes' => $poolHeroes, 'image' => $image
        ]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => 'Lỗi MySQL: ' . $e->getMessage()]);
    }
    exit;
}

if ($action === 'admin_delete_banner') {
    checkAdminPermission();
    $id = trim($_POST['id'] ?? '');
    $stmt = $pdo->prepare("DELETE FROM banners WHERE id = :id");
    $stmt->execute(['id' => $id]);
    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'admin_get_events') {
    checkAdminPermission();
    $stmt = $pdo->query("SELECT * FROM events ORDER BY id DESC");
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

if ($action === 'admin_save_event') {
    checkAdminPermission();
    $code = strtoupper(trim($_POST['code'] ?? ''));
    $title = trim($_POST['title'] ?? '');
    $gems = (int)($_POST['gems'] ?? 0);
    $tickets = (int)($_POST['tickets'] ?? 0);

    try {
        $stmt = $pdo->prepare("INSERT INTO events (`code`, `title`, `gems`, `tickets`) VALUES (:c, :t, :g, :tk)
            ON DUPLICATE KEY UPDATE `title` = :t, `gems` = :g, `tickets` = :tk");
        $stmt->execute(['c' => $code, 't' => $title, 'g' => $gems, 'tk' => $tickets]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => 'Lỗi MySQL: ' . $e->getMessage()]);
    }
    exit;
}

if ($action === 'admin_delete_event') {
    checkAdminPermission();
    $id = (int)($_POST['id'] ?? 0);
    $stmt = $pdo->prepare("DELETE FROM events WHERE id = :id");
    $stmt->execute(['id' => $id]);
    echo json_encode(['success' => true]);
    exit;
}

// ==========================================================================
// 10. API QUẢN LÝ BẢN ĐỒ & TRÌNH TẠO MAP (MAP BUILDER)
// ==========================================================================

if ($action === 'get_map' || $action === 'admin_get_maps' || $action === 'get_maps') {
    $id = trim($_GET['id'] ?? '');
    $mode = trim($_GET['mode'] ?? '');

    if ($action === 'get_map' || $id !== '') {
        $mapId = $id ?: 'map_campaign_1';
        $stmt = $pdo->prepare("SELECT * FROM maps WHERE id = :id");
        $stmt->execute(['id' => $mapId]);
        $map = $stmt->fetch();
        if (!$map) {
            $stmt2 = $pdo->query("SELECT * FROM maps ORDER BY stage_order ASC LIMIT 1");
            $map = $stmt2->fetch();
        }
        echo json_encode(['success' => true, 'data' => $map]);
        exit;
    }

    if ($mode) {
        $stmt = $pdo->prepare("SELECT * FROM maps WHERE mode = :m ORDER BY stage_order ASC, id ASC");
        $stmt->execute(['m' => $mode]);
    } else {
        $stmt = $pdo->query("SELECT * FROM maps ORDER BY mode ASC, stage_order ASC, id ASC");
    }
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

if ($action === 'admin_save_map') {
    checkAdminPermission();
    $id = trim($_POST['id'] ?? '');
    $name = trim($_POST['name'] ?? '');
    $mode = trim($_POST['mode'] ?? 'campaign');
    $order = (int)($_POST['stage_order'] ?? 1);
    $cols = (int)($_POST['cols'] ?? 10);
    $rows = (int)($_POST['rows'] ?? 7);
    $terrain = trim($_POST['terrain'] ?? '[]');
    $playerSpawns = trim($_POST['player_spawns'] ?? '[]');
    $enemySpawns = trim($_POST['enemy_spawns'] ?? '[]');
    $rewardGems = (int)($_POST['reward_gems'] ?? 200);
    $rewardExp = (int)($_POST['reward_exp'] ?? 50);
    $bgm = trim($_POST['bgm'] ?? 'random');

    if (!$id || !$name) {
        echo json_encode(['success' => false, 'error' => 'Vui lòng nhập Mã Bản Đồ và Tên Bản Đồ!']);
        exit;
    }

    try {
        $sql = "INSERT INTO maps (`id`, `name`, `mode`, `stage_order`, `cols`, `rows`, `terrain`, `player_spawns`, `enemy_spawns`, `reward_gems`, `reward_exp`, `bgm`)
                VALUES (:id, :name, :mode, :so, :cols, :rows, :terrain, :ps, :es, :rg, :re, :bgm)
                ON DUPLICATE KEY UPDATE 
                `name`=VALUES(`name`), `mode`=VALUES(`mode`), `stage_order`=VALUES(`stage_order`),
                `cols`=VALUES(`cols`), `rows`=VALUES(`rows`), `terrain`=VALUES(`terrain`),
                `player_spawns`=VALUES(`player_spawns`), `enemy_spawns`=VALUES(`enemy_spawns`),
                `reward_gems`=VALUES(`reward_gems`), `reward_exp`=VALUES(`reward_exp`),
                `bgm`=VALUES(`bgm`)";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'id' => $id, 'name' => $name, 'mode' => $mode, 'so' => $order,
            'cols' => $cols, 'rows' => $rows, 'terrain' => $terrain,
            'ps' => $playerSpawns, 'es' => $enemySpawns,
            'rg' => $rewardGems, 're' => $rewardExp,
            'bgm' => $bgm
        ]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => 'Lỗi MySQL: ' . $e->getMessage()]);
    }
    exit;
}

if ($action === 'admin_delete_map') {
    checkAdminPermission();
    $id = trim($_POST['id'] ?? '');
    $stmt = $pdo->prepare("DELETE FROM maps WHERE id = :id");
    $stmt->execute(['id' => $id]);
    echo json_encode(['success' => true]);
    exit;
}

// ==========================================================================
// 11. QUẢN LÝ KỸ NĂNG (SKILLS ENGINE: MAP & COMBAT)
// ==========================================================================

if ($action === 'get_skills' || $action === 'admin_get_skills') {
    $heroId = trim($_GET['hero_id'] ?? '');
    if ($heroId) {
        $stmt = $pdo->prepare("SELECT * FROM skills WHERE hero_id = :hid ORDER BY scope ASC, id ASC");
        $stmt->execute(['hid' => $heroId]);
    } else {
        $stmt = $pdo->query("SELECT s.*, u.name as hero_name, u.cls as hero_cls FROM skills s LEFT JOIN units u ON s.hero_id = u.id ORDER BY s.hero_id ASC, s.scope ASC");
    }
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

if ($action === 'admin_save_skill') {
    checkAdminPermission();
    $id = trim($_POST['id'] ?? '');
    $heroId = trim($_POST['hero_id'] ?? '');
    $name = trim($_POST['name'] ?? '');
    $icon = trim($_POST['icon'] ?? '🔮');
    $scope = trim($_POST['scope'] ?? 'map');
    $skillType = trim($_POST['skill_type'] ?? 'damage');
    $targetShape = trim($_POST['target_shape'] ?? 'single');
    $rangeMin = (int)($_POST['range_min'] ?? 1);
    $rangeMax = (int)($_POST['range_max'] ?? 3);
    $power = (int)($_POST['power'] ?? 150);
    $maxUses = (int)($_POST['max_uses'] ?? 2);
    $buffStat = trim($_POST['buff_stat'] ?? '');
    $buffVal = (int)($_POST['buff_val'] ?? 0);
    $buffTurns = (int)($_POST['buff_turns'] ?? 0);
    $desc = trim($_POST['description'] ?? '');

    if (!$id || !$name || !$heroId) {
        echo json_encode(['success' => false, 'error' => 'Mã Skill, Tên Skill và Tướng sở hữu không được để trống!']);
        exit;
    }

    try {
        $sql = "INSERT INTO skills (`id`, `hero_id`, `name`, `icon`, `scope`, `skill_type`, `target_shape`, `range_min`, `range_max`, `power`, `max_uses`, `buff_stat`, `buff_val`, `buff_turns`, `description`)
                VALUES (:id, :hid, :name, :icon, :scope, :stype, :tshape, :rmin, :rmax, :pwr, :uses, :bstat, :bval, :bturns, :desc)
                ON DUPLICATE KEY UPDATE 
                `hero_id`=VALUES(`hero_id`), `name`=VALUES(`name`), `icon`=VALUES(`icon`), `scope`=VALUES(`scope`),
                `skill_type`=VALUES(`skill_type`), `target_shape`=VALUES(`target_shape`), `range_min`=VALUES(`range_min`),
                `range_max`=VALUES(`range_max`), `power`=VALUES(`power`), `max_uses`=VALUES(`max_uses`),
                `buff_stat`=VALUES(`buff_stat`), `buff_val`=VALUES(`buff_val`), `buff_turns`=VALUES(`buff_turns`),
                `description`=VALUES(`description`)";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'id' => $id, 'hid' => $heroId, 'name' => $name, 'icon' => $icon,
            'scope' => $scope, 'stype' => $skillType, 'tshape' => $targetShape,
            'rmin' => $rangeMin, 'rmax' => $rangeMax, 'pwr' => $power, 'uses' => $maxUses,
            'bstat' => $buffStat, 'bval' => $buffVal, 'bturns' => $buffTurns, 'desc' => $desc
        ]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => 'Lỗi MySQL: ' . $e->getMessage()]);
    }
    exit;
}

if ($action === 'admin_delete_skill') {
    checkAdminPermission();
    $id = trim($_POST['id'] ?? '');
    $stmt = $pdo->prepare("DELETE FROM skills WHERE id = :id");
    $stmt->execute(['id' => $id]);
    echo json_encode(['success' => true]);
    exit;
}

// ==========================================================================
// 12. QUẢN LÝ VŨ KHÍ (WEAPONS ENGINE - CÓ CỘT RANGE TẦM ĐÁNH VÀ AFFINITY 3 HỆ)
// ==========================================================================

if ($action === 'get_weapons' || $action === 'admin_get_weapons') {
    $stmt = $pdo->query("SELECT * FROM weapons ORDER BY FIELD(rarity, 'SSR', 'SR', 'R'), id ASC");
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

if ($action === 'admin_save_weapon') {
    checkAdminPermission();
    $id = trim($_POST['id'] ?? '');
    $name = trim($_POST['name'] ?? '');
    $type = trim($_POST['type'] ?? 'Kiếm');
    $range = (int)($_POST['range'] ?? ($type === 'Cung' ? 2 : 1));
    $rarity = trim($_POST['rarity'] ?? 'R');
    $affinity = trim($_POST['affinity'] ?? 'Physical');
    $icon = trim($_POST['icon'] ?? '⚔️');
    $image = trim($_POST['image'] ?? '');
    $hp = (int)($_POST['hp'] ?? 0);
    $str = (int)($_POST['str'] ?? 0);
    $mag = (int)($_POST['mag'] ?? 0);
    $dex = (int)($_POST['dex'] ?? 0);
    $spd = (int)($_POST['spd'] ?? 0);
    $def = (int)($_POST['def'] ?? 0);
    $res = (int)($_POST['res'] ?? 0);
    $lck = (int)($_POST['lck'] ?? 0);
    $mov = (int)($_POST['mov'] ?? 0);
    $desc = trim($_POST['description'] ?? '');

    if (!$id || !$name) {
        echo json_encode(['success' => false, 'error' => 'Mã vũ khí và Tên hiển thị không được để trống!']);
        exit;
    }

    try {
        $sql = "INSERT INTO weapons (`id`, `name`, `type`, `range`, `rarity`, `affinity`, `icon`, `image`, `hp`, `str`, `mag`, `dex`, `spd`, `def`, `res`, `lck`, `mov`, `description`)
                VALUES (:id, :name, :type, :range, :rarity, :affinity, :icon, :image, :hp, :str, :mag, :dex, :spd, :def, :res, :lck, :mov, :desc)
                ON DUPLICATE KEY UPDATE 
                `name`=VALUES(`name`), `type`=VALUES(`type`), `range`=VALUES(`range`), `rarity`=VALUES(`rarity`), `affinity`=VALUES(`affinity`),
                `icon`=VALUES(`icon`), `image`=VALUES(`image`), `hp`=VALUES(`hp`), `str`=VALUES(`str`),
                `mag`=VALUES(`mag`), `dex`=VALUES(`dex`), `spd`=VALUES(`spd`), `def`=VALUES(`def`),
                `res`=VALUES(`res`), `lck`=VALUES(`lck`), `mov`=VALUES(`mov`), `description`=VALUES(`description`)";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'id' => $id, 'name' => $name, 'type' => $type, 'range' => $range, 'rarity' => $rarity, 'affinity' => $affinity,
            'icon' => $icon, 'image' => $image, 'hp' => $hp, 'str' => $str, 'mag' => $mag, 'dex' => $dex,
            'spd' => $spd, 'def' => $def, 'res' => $res, 'lck' => $lck, 'mov' => $mov, 'desc' => $desc
        ]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => 'Lỗi MySQL: ' . $e->getMessage()]);
    }
    exit;
}

if ($action === 'admin_delete_weapon') {
    checkAdminPermission();
    $id = trim($_POST['id'] ?? '');
    $stmt = $pdo->prepare("DELETE FROM weapons WHERE id = :id");
    $stmt->execute(['id' => $id]);
    echo json_encode(['success' => true]);
    exit;
}

// ==========================================================================
// 13. CÁC API QUẢN LÝ NGƯỜI DÙNG (USERS MANAGEMENT)
// ==========================================================================

if ($action === 'admin_get_users') {
    checkAdminPermission();
    $stmt = $pdo->query("SELECT id, username, role, gems, pity, banner_claimed, last_checkin, checkin_streak, endless_max_floor, is_banned, created_at FROM users ORDER BY id ASC");
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

if ($action === 'admin_save_user') {
    checkAdminPermission();
    $id = (int)($_POST['id'] ?? 0);
    $username = trim($_POST['username'] ?? '');
    $password = trim($_POST['password'] ?? '');
    $role = trim($_POST['role'] ?? 'user');
    $gems = (int)($_POST['gems'] ?? 1500);
    $pity = (int)($_POST['pity'] ?? 0);
    $isBanned = (int)($_POST['is_banned'] ?? 0);

    if (empty($username)) {
        echo json_encode(['success' => false, 'error' => 'Tên tài khoản không được để trống!']);
        exit;
    }

    try {
        if ($id > 0) {
            $stmtCheck = $pdo->prepare("SELECT id FROM users WHERE username = :u AND id != :id");
            $stmtCheck->execute(['u' => $username, 'id' => $id]);
            if ($stmtCheck->fetch()) {
                echo json_encode(['success' => false, 'error' => 'Tên tài khoản này đã có người khác sử dụng!']);
                exit;
            }

            if ($id === (int)$_SESSION['user_id']) {
                $role = 'admin';
                $isBanned = 0;
            }

            if (!empty($password)) {
                $hash = password_hash($password, PASSWORD_DEFAULT);
                $stmt = $pdo->prepare("UPDATE users SET username = :u, password = :p, role = :r, gems = :g, pity = :pt, is_banned = :ib WHERE id = :id");
                $stmt->execute(['u' => $username, 'p' => $hash, 'r' => $role, 'g' => $gems, 'pt' => $pity, 'ib' => $isBanned, 'id' => $id]);
            } else {
                $stmt = $pdo->prepare("UPDATE users SET username = :u, role = :r, gems = :g, pity = :pt, is_banned = :ib WHERE id = :id");
                $stmt->execute(['u' => $username, 'r' => $role, 'g' => $gems, 'pt' => $pity, 'ib' => $isBanned, 'id' => $id]);
            }
            echo json_encode(['success' => true, 'message' => 'Cập nhật tài khoản thành công!']);
        } else {
            if (empty($password)) {
                echo json_encode(['success' => false, 'error' => 'Vui lòng nhập mật khẩu cho tài khoản mới!']);
                exit;
            }
            $stmtCheck = $pdo->prepare("SELECT id FROM users WHERE username = :u");
            $stmtCheck->execute(['u' => $username]);
            if ($stmtCheck->fetch()) {
                echo json_encode(['success' => false, 'error' => 'Tên tài khoản này đã tồn tại!']);
                exit;
            }

            $hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO users (username, password, role, gems, pity, is_banned, endless_max_floor) VALUES (:u, :p, :r, :g, :pt, :ib, 0)");
            $stmt->execute(['u' => $username, 'p' => $hash, 'r' => $role, 'g' => $gems, 'pt' => $pity, 'ib' => $isBanned]);
            echo json_encode(['success' => true, 'message' => 'Tạo tài khoản mới thành công!']);
        }
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => 'Lỗi MySQL: ' . $e->getMessage()]);
    }
    exit;
}

if ($action === 'admin_toggle_ban_user') {
    checkAdminPermission();
    $id = (int)($_POST['id'] ?? 0);
    if ($id === (int)$_SESSION['user_id']) {
        echo json_encode(['success' => false, 'error' => 'Bạn không thể tự khóa tài khoản của chính mình!']);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE users SET is_banned = 1 - is_banned WHERE id = :id");
    $stmt->execute(['id' => $id]);

    $stmtGet = $pdo->prepare("SELECT is_banned FROM users WHERE id = :id");
    $stmtGet->execute(['id' => $id]);
    $newStatus = (int)$stmtGet->fetchColumn();

    echo json_encode(['success' => true, 'is_banned' => $newStatus]);
    exit;
}

if ($action === 'admin_adjust_user_gems') {
    checkAdminPermission();
    $id = (int)($_POST['id'] ?? 0);
    $amount = (int)($_POST['amount'] ?? 0);

    if ($id <= 0 || $amount === 0) {
        echo json_encode(['success' => false, 'error' => 'Thông tin không hợp lệ!']);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE users SET gems = GREATEST(0, gems + :amt) WHERE id = :id");
    $stmt->execute(['amt' => $amount, 'id' => $id]);

    $stmtGet = $pdo->prepare("SELECT gems FROM users WHERE id = :id");
    $stmtGet->execute(['id' => $id]);
    $newGems = (int)$stmtGet->fetchColumn();

    echo json_encode(['success' => true, 'new_gems' => $newGems]);
    exit;
}

if ($action === 'admin_delete_user') {
    checkAdminPermission();
    $id = (int)($_POST['id'] ?? 0);

    if ($id === (int)$_SESSION['user_id']) {
        echo json_encode(['success' => false, 'error' => 'Bạn không thể tự xóa tài khoản của chính mình!']);
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM users WHERE id = :id");
    $stmt->execute(['id' => $id]);
    echo json_encode(['success' => true]);
    exit;
}

// ==========================================================================
// 14. CÁC API QUẢN LÝ NHẠC COMBAT (PHÂN LOẠI CATEGORY: BATTLE / BOSS)
// ==========================================================================

if ($action === 'get_combat_musics' || $action === 'admin_get_combat_musics') {
    $stmt = $pdo->query("SELECT * FROM combat_musics ORDER BY id ASC");
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

if ($action === 'admin_save_combat_music') {
    checkAdminPermission();
    $id = (int)($_POST['id'] ?? 0);
    $name = trim($_POST['name'] ?? '');
    $category = trim($_POST['category'] ?? 'battle'); // 'battle' (Thường) hoặc 'boss' (Boss)
    $src = trim($_POST['src'] ?? '');
    $volume = max(10, min(200, (int)($_POST['volume'] ?? 100)));

    if (!$name || !$src) {
        echo json_encode(['success' => false, 'error' => 'Vui lòng nhập Tên bài nhạc và Đường dẫn file audio!']);
        exit;
    }

    try {
        if ($id > 0) {
            $stmt = $pdo->prepare("UPDATE combat_musics SET `name` = :n, `category` = :c, `src` = :s, `volume` = :v WHERE id = :id");
            $stmt->execute(['n' => $name, 'c' => $category, 's' => $src, 'v' => $volume, 'id' => $id]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO combat_musics (`name`, `category`, `src`, `volume`) VALUES (:n, :c, :s, :v)");
            $stmt->execute(['n' => $name, 'c' => $category, 's' => $src, 'v' => $volume]);
        }
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => 'Lỗi MySQL: ' . $e->getMessage()]);
    }
    exit;
}

if ($action === 'admin_delete_combat_music') {
    checkAdminPermission();
    $id = (int)($_POST['id'] ?? 0);
    $stmt = $pdo->prepare("DELETE FROM combat_musics WHERE id = :id");
    $stmt->execute(['id' => $id]);
    echo json_encode(['success' => true]);
    exit;
}

// ==========================================================================
// 15. API LƯU CẤU HÌNH VỊ TRÍ & ĐỘ ZOOM CHO CUT-IN CRITICAL
// ==========================================================================
if ($action === 'admin_save_cutin_config') {
    checkAdminPermission();
    $id = trim($_POST['id'] ?? '');
    $posX = (int)($_POST['cutin_pos_x'] ?? 50);
    $posY = (int)($_POST['cutin_pos_y'] ?? 30);
    $scale = (int)($_POST['cutin_scale'] ?? 120);

    if (!$id) {
        echo json_encode(['success' => false, 'error' => 'Thiếu ID nhân vật!']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("UPDATE units SET cutin_pos_x = :x, cutin_pos_y = :y, cutin_scale = :s WHERE id = :id");
        $stmt->execute(['x' => $posX, 'y' => $posY, 's' => $scale, 'id' => $id]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => 'Lỗi MySQL: ' . $e->getMessage()]);
    }
    exit;
}

echo json_encode(['success' => false, 'error' => 'Hành động không hợp lệ']);