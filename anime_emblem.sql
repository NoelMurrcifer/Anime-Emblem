-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th10 14, 2026 lúc 11:01 AM
-- Phiên bản máy phục vụ: 10.4.28-MariaDB
-- Phiên bản PHP: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `anime_emblem`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `banners`
--

CREATE TABLE `banners` (
  `id` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `type` enum('hero','weapon') NOT NULL DEFAULT 'hero',
  `cost` int(11) NOT NULL DEFAULT 200,
  `rate_up_id` varchar(50) NOT NULL,
  `pity_max` int(11) NOT NULL DEFAULT 80,
  `end_date` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `pool_heroes` text DEFAULT NULL,
  `image` varchar(255) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `banners`
--

INSERT INTO `banners` (`id`, `name`, `type`, `cost`, `rate_up_id`, `pity_max`, `end_date`, `is_active`, `pool_heroes`, `image`) VALUES
('b_a', 'Lời Thề Bóng Đêm — Makoto (SSR)', 'hero', 200, 'emilia', 80, NULL, 1, 'aria,beast,celeste,deadpool,emilia,kaito,makoto,megumin,shirou,yuzu', 'img/banner_makoto.jpg'),
('b_aria', 'Nguyện Ước Ánh Bạc — Aria (SSR)', 'hero', 200, 'aria', 80, NULL, 1, 'aria,yuzu,kaito,shirou,celeste', ''),
('b_excalibur_weap', 'Đúc Rèn Thần Binh — Thánh Kiếm Excalibur (5★)', 'weapon', 200, 'ssr_excalibur_sword', 80, NULL, 1, 'ssr_excalibur_sword,ssr_astral_bow,ssr_astral_staff', ''),
('b_yuzu', 'Ảo Thuật Thần Bí — Yuzu (SSR)', 'hero', 200, 'yuzu', 80, NULL, 1, 'yuzu,kaito,aria,shirou,celeste', '');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `combat_musics`
--

CREATE TABLE `combat_musics` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `category` varchar(50) NOT NULL DEFAULT 'battle',
  `src` varchar(255) NOT NULL,
  `volume` int(11) NOT NULL DEFAULT 100,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `combat_musics`
--

INSERT INTO `combat_musics` (`id`, `name`, `category`, `src`, `volume`, `created_at`) VALUES
(1, 'Fire Emblem - The Apex of the World', 'boss', 'audio/battle.mp3', 95, '2026-10-03 19:38:59'),
(2, 'Persona 3 - Mass Destruction', 'battle', 'audio/battle 2.mp3', 100, '2026-10-04 07:25:28'),
(3, 'Persona 4 - Reach Out To The Truth', 'battle', 'audio/battle 3.mp3', 95, '2026-10-04 07:32:04'),
(4, 'Fire Emblem - Fódlan Winds', 'battle', 'audio/battle 4.mp3', 150, '2026-10-04 07:43:29'),
(5, 'Fire Emblem - Tearing Through Heaven', 'battle', 'audio/battle 5.mp3', 100, '2026-10-04 07:49:38'),
(6, 'Clair Obscur: Expedition 33 - Our Drafts Unite', 'battle', 'audio/battle 6.mp3', 100, '2026-10-05 11:40:09');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `events`
--

CREATE TABLE `events` (
  `id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `title` varchar(150) NOT NULL,
  `gems` int(11) NOT NULL DEFAULT 0,
  `tickets` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `events`
--

INSERT INTO `events` (`id`, `code`, `title`, `gems`, `tickets`) VALUES
(1, 'ANIMEEMBLEM', 'Quà Ra Mắt Anime Emblem', 1000, 5),
(2, 'PARRYGOD', 'Quà Cao Thủ Phản Đòn QTE', 500, 2),
(3, 'ENDLESS2026', 'Quà Chinh Phục Tháp Vô Tận', 800, 3);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `hero_constellations`
--

CREATE TABLE `hero_constellations` (
  `id` int(11) NOT NULL,
  `hero_id` varchar(50) NOT NULL,
  `rank` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `buff_type` varchar(50) NOT NULL DEFAULT 'stat_hp',
  `buff_val` int(11) NOT NULL DEFAULT 5
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `hero_constellations`
--

INSERT INTO `hero_constellations` (`id`, `hero_id`, `rank`, `name`, `description`, `buff_type`, `buff_val`) VALUES
(1, 'aria', 1, 'Tầng 1: Khởi Tâm', '+5 Máu Tối Đa và gia tăng thể lực cơ bản.', 'stat_hp', 5),
(2, 'aria', 2, 'Tầng 2: Cương Thể', '+2 Giáp vật lý (Def) giúp giảm sát thương nhận vào.', 'stat_def', 2),
(3, 'aria', 3, 'Tầng 3: Tật Phong', '+3 Kỹ năng (Dex) tăng khả năng ra đòn chính xác.', 'stat_dex', 3),
(4, 'aria', 4, 'Tầng 4: Nhược Điểm', 'Tăng thêm 20% sát thương khi đánh trúng Điểm Yếu của địch.', 'weakness_dmg', 20),
(5, 'aria', 5, 'Tầng 5: Thiên Mệnh', '+8% Tỉ lệ nổ đòn Chí Mạng (Crit Rate) xé màn hình.', 'crit_rate', 8),
(6, 'aria', 6, 'Tầng 6: Tuyệt Đỉnh', 'Đòn đánh đầu tiên trong trận luôn 100% Chí Mạng!', 'first_strike_crit', 1),
(7, 'yuzu', 1, 'Tầng 1: Khởi Ma', '+3 Ma lực phép (Mag) gia tăng sát thương nguyền rủa.', 'stat_mag', 3),
(8, 'yuzu', 2, 'Tầng 2: Tâm Giới', '+2 Kháng phép (Res) bảo hộ trước pháp thuật hắc ám.', 'stat_res', 2),
(9, 'yuzu', 3, 'Tầng 3: Tật Nhãn', '+3 Kỹ năng (Dex) giúp niệm chú chuẩn xác tuyệt đối.', 'stat_dex', 3),
(10, 'yuzu', 4, 'Tầng 4: Khắc Ấn', 'Tăng thêm 25% sát thương khi đánh trúng Điểm Yếu.', 'weakness_dmg', 25),
(11, 'yuzu', 5, 'Tầng 5: Hắc Nguyệt', '+8% Tỉ lệ nổ đòn Chí Mạng (Crit Rate).', 'crit_rate', 8),
(12, 'yuzu', 6, 'Tầng 6: Ma Đạo Chung Cực', 'Đòn đánh đầu tiên trong trận luôn 100% Chí Mạng!', 'first_strike_crit', 1),
(13, 'kaito', 1, 'Tầng 1: Tiễn Ý', '+3 Công vật lý (Str) tăng lực xuyên phá của mũi tên.', 'stat_str', 3),
(14, 'kaito', 2, 'Tầng 2: Bộ Phong', '+2 Tốc độ (Spd) tăng khả năng né đòn linh hoạt.', 'stat_spd', 2),
(15, 'kaito', 3, 'Tầng 3: Ưng Nhãn', '+4 Kỹ năng (Dex) tăng cơ hội bắn xuyên giáp.', 'stat_dex', 4),
(16, 'kaito', 4, 'Tầng 4: Xuyên Tâm', 'Tăng thêm 20% sát thương khi đánh trúng Điểm Yếu.', 'weakness_dmg', 20),
(17, 'kaito', 5, 'Tầng 5: Phong Lôi Tiễn', '+10% Tỉ lệ nổ đòn Chí Mạng (Crit Rate).', 'crit_rate', 10),
(18, 'kaito', 6, 'Tầng 6: Nhất Kích Tất Sát', 'Đòn đánh đầu tiên trong trận luôn 100% Chí Mạng!', 'first_strike_crit', 1),
(19, 'shirou', 1, 'Tầng 1: Đao Ý', '+4 Sức mạnh vật lý (Str).', 'stat_str', 4),
(20, 'shirou', 2, 'Tầng 2: Thuấn Bộ', '+3 Tốc độ né đòn (Spd).', 'stat_spd', 3),
(21, 'shirou', 3, 'Tầng 3: Trảm Ảnh', '+3 Kỹ năng (Dex).', 'stat_dex', 3),
(22, 'shirou', 4, 'Tầng 4: Phá Giáp', '+20% Sát thương điểm yếu.', 'weakness_dmg', 20),
(23, 'shirou', 5, 'Tầng 5: Tuyệt Kiếm', '+10% Tỉ lệ Chí Mạng.', 'crit_rate', 10),
(24, 'shirou', 6, 'Tầng 6: Trảm Hư Vô', 'Đòn đánh đầu tiên trong trận luôn 100% Chí Mạng!', 'first_strike_crit', 1),
(25, 'celeste', 1, 'Tầng 1: Thánh Thuẫn', '+8 Máu tối đa (Max HP).', 'stat_hp', 8),
(26, 'celeste', 2, 'Tầng 2: Hộ Thể', '+4 Giáp vật lý (Def).', 'stat_def', 4),
(27, 'celeste', 3, 'Tầng 3: Kiên Định', '+3 Kháng phép (Res).', 'stat_res', 3),
(28, 'celeste', 4, 'Tầng 4: Trừng Phạt', '+20% Sát thương điểm yếu.', 'weakness_dmg', 20),
(29, 'celeste', 5, 'Tầng 5: Thánh Quang', '+8% Tỉ lệ Chí Mạng.', 'crit_rate', 8),
(30, 'celeste', 6, 'Tầng 6: Thần Thánh Bảo Hộ', 'Đòn đánh đầu tiên luôn 100% Chí Mạng!', 'first_strike_crit', 1),
(31, 'ren', 1, 'Tầng 1: Ảnh Nhẫn', '+3 Kỹ năng (Dex) giúp phi tiêu cắm chuẩn tử huyệt.', 'stat_dex', 3),
(32, 'ren', 2, 'Tầng 2: Thuấn Ảnh', '+3 Tốc độ (Spd) tăng né tránh và tốc độ ra đòn.', 'stat_spd', 3),
(33, 'ren', 3, 'Tầng 3: Nhẫn Đao', '+3 Công vật lý (Str).', 'stat_str', 3),
(34, 'ren', 4, 'Tầng 4: Đột Kích', '+20% Sát thương điểm yếu khi tập kích bất ngờ.', 'weakness_dmg', 20),
(35, 'ren', 5, 'Tầng 5: Ám Ảnh', '+10% Tỉ lệ đòn Chí Mạng (Crit Rate).', 'crit_rate', 10),
(36, 'ren', 6, 'Tầng 6: Tuyệt Sát Ninja', 'Đòn đánh đầu tiên trong trận luôn 100% Chí Mạng!', 'first_strike_crit', 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `maps`
--

CREATE TABLE `maps` (
  `id` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `mode` enum('campaign','endless','event') NOT NULL DEFAULT 'campaign',
  `stage_order` int(11) NOT NULL DEFAULT 1,
  `cols` int(11) NOT NULL DEFAULT 10,
  `rows` int(11) NOT NULL DEFAULT 7,
  `terrain` text NOT NULL,
  `player_spawns` text NOT NULL,
  `enemy_spawns` text NOT NULL,
  `reward_gems` int(11) NOT NULL DEFAULT 200,
  `reward_exp` int(11) NOT NULL DEFAULT 50,
  `bgm` varchar(255) NOT NULL DEFAULT 'random',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `maps`
--

INSERT INTO `maps` (`id`, `name`, `mode`, `stage_order`, `cols`, `rows`, `terrain`, `player_spawns`, `enemy_spawns`, `reward_gems`, `reward_exp`, `bgm`, `created_at`) VALUES
('map_campaign_1', 'Ải 1-1: Cửa Ải Shade Knight', 'campaign', 1, 10, 7, '[\"PPPFPPPPPP\",\"PWPPPPFPPP\",\"PPPPWPPPWP\",\"FPPPPPPPPF\",\"PPWPPPWPPP\",\"PPPPPPPPPP\",\"PFPPPPPFPP\"]', '[{\"col\":1,\"row\":5},{\"col\":2,\"row\":6},{\"col\":0,\"row\":6},{\"col\":0,\"row\":5}]', '[{\"id\":\"shade\",\"col\":8,\"row\":1},{\"id\":\"wraith\",\"col\":7,\"row\":0},{\"id\":\"shade_archer\",\"col\":6,\"row\":1}]', 200, 50, 'audio/battle.mp3', '2026-10-03 19:38:59'),
('map_campaign_2', 'Ải 1-2: Phục Kích Rừng Sâu', 'campaign', 2, 10, 7, '[\"FPFPPPPFPF\",\"PPPPWPPPPP\",\"FWPWPWPWPF\",\"PPPPPPPPPP\",\"FWPWPWPWPF\",\"PPPPWPPPPP\",\"FPFPPPPFPF\"]', '[{\"col\":1,\"row\":3},{\"col\":2,\"row\":3},{\"col\":1,\"row\":2},{\"col\":1,\"row\":4}]', '[{\"id\":\"shade\",\"col\":8,\"row\":3},{\"id\":\"wraith\",\"col\":7,\"row\":1},{\"id\":\"shade_archer\",\"col\":7,\"row\":5}]', 300, 80, 'random', '2026-10-03 19:38:59'),
('map_endless_arena', 'Tháp Vô Tận: Đấu Trường Hẹp (8x6)', 'endless', 1, 8, 6, '[\"PPPPPPPP\",\"PWPWWPWP\",\"PPPPPPPP\",\"PPFWWFPP\",\"PWPWWPWP\",\"PPPPPPPP\"]', '[{\"col\":1,\"row\":2},{\"col\":1,\"row\":3},{\"col\":0,\"row\":2},{\"col\":0,\"row\":3}]', '[{\"id\":\"goblin_scout\",\"col\":6,\"row\":1},{\"id\":\"shadow_assassin\",\"col\":6,\"row\":4},{\"id\":\"frost_witch\",\"col\":7,\"row\":2}]', 100, 40, 'random', '2026-10-03 19:38:59'),
('map_endless_colosseum', 'Tháp Vô Tận: Vực Thẳm Quỷ Vương (16x10)', 'endless', 4, 16, 10, '[\"PPPPPPPPPPPPPPPP\",\"PWWPPPPWWPPPPWWP\",\"PWWPFFFFFFFFPWWP\",\"PPPPFWWWWWFPPPPP\",\"PPPPFWWWWWFPPPPP\",\"PPPPFWWWWWFPPPPP\",\"PPPPFWWWWWFPPPPP\",\"PWWPFFFFFFFFPWWP\",\"PWWPPPPWWPPPPWWP\",\"PPPPPPPPPPPPPPPP\"]', '[{\"col\":2,\"row\":4},{\"col\":2,\"row\":5},{\"col\":1,\"row\":4},{\"col\":1,\"row\":5}]', '[{\"id\":\"demon_lord\",\"col\":13,\"row\":4},{\"id\":\"abyssal_dragon\",\"col\":13,\"row\":5},{\"id\":\"blood_vampire\",\"col\":14,\"row\":3},{\"id\":\"dullahan\",\"col\":14,\"row\":6}]', 600, 200, 'random', '2026-10-03 19:38:59'),
('map_endless_forest', 'Tháp Vô Tận: Mê Cung Rừng (10x7)', 'endless', 2, 10, 7, '[\"FPFPPPPFPF\",\"PPPPWPPPPP\",\"FWPWPWPWPF\",\"PPPPPPPPPP\",\"FWPWPWPWPF\",\"PPPPWPPPPP\",\"FPFPPPPFPF\"]', '[{\"col\":1,\"row\":3},{\"col\":2,\"row\":3},{\"col\":1,\"row\":2},{\"col\":1,\"row\":4}]', '[{\"id\":\"iron_golem\",\"col\":7,\"row\":3},{\"id\":\"frost_witch\",\"col\":8,\"row\":1},{\"id\":\"shadow_assassin\",\"col\":8,\"row\":5}]', 150, 60, 'random', '2026-10-03 19:38:59'),
('map_endless_fortress', 'Tháp Vô Tận: Pháo Đài CỔ (14x8)', 'endless', 3, 14, 8, '[\"WWWWWWWWWWWWWW\",\"WPPPPPPWPPPPPW\",\"WPWWPWPWPWWPPW\",\"WPPPFPPPPPFPPW\",\"WPPPFPPPPPFPPW\",\"WPWWPWPWPWWPPW\",\"WPPPPPPWPPPPPW\",\"WWWWWWWWWWWWWW\"]', '[{\"col\":2,\"row\":3},{\"col\":2,\"row\":4},{\"col\":1,\"row\":3},{\"col\":1,\"row\":4}]', '[{\"id\":\"dullahan\",\"col\":11,\"row\":3},{\"id\":\"iron_golem\",\"col\":10,\"row\":4},{\"id\":\"frost_witch\",\"col\":12,\"row\":2},{\"id\":\"shadow_assassin\",\"col\":12,\"row\":5}]', 300, 100, 'random', '2026-10-03 19:38:59');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `skills`
--

CREATE TABLE `skills` (
  `id` varchar(50) NOT NULL,
  `hero_id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `icon` varchar(20) NOT NULL DEFAULT '?',
  `scope` enum('map','combat') NOT NULL DEFAULT 'map',
  `skill_type` enum('damage','heal','buff') NOT NULL DEFAULT 'damage',
  `target_shape` enum('single','line','cross','ally_single','ally_all') NOT NULL DEFAULT 'single',
  `range_min` int(11) NOT NULL DEFAULT 1,
  `range_max` int(11) NOT NULL DEFAULT 3,
  `power` int(11) NOT NULL DEFAULT 150,
  `max_uses` int(11) NOT NULL DEFAULT 2,
  `buff_stat` varchar(30) DEFAULT '',
  `buff_val` int(11) NOT NULL DEFAULT 0,
  `buff_turns` int(11) NOT NULL DEFAULT 0,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `skills`
--

INSERT INTO `skills` (`id`, `hero_id`, `name`, `icon`, `scope`, `skill_type`, `target_shape`, `range_min`, `range_max`, `power`, `max_uses`, `buff_stat`, `buff_val`, `buff_turns`, `description`) VALUES
('aria_brave_slash', 'aria', 'Tuyệt Kỹ: Trảm Bão Tố', '⚡', 'combat', 'damage', 'single', 1, 1, 240, 3, '', 0, 0, '[Persona] Đòn kiếm vũ bão gây 240% sát thương vật lý cực mạnh trong sàn đấu 4v4.'),
('aria_excalibur', 'aria', 'Excalibur (Trảm Quang)', '🗡️', 'map', 'damage', 'line', 1, 4, 30, 2, '', 0, 0, 'Phóng vệt kiếm sáng thẳng 4 ô trên bản đồ, quét sạch mọi kẻ địch trên đường bay! (180% Str)'),
('celeste_fortress', 'celeste', 'Thánh Thuẫn Bất Hoại', '🛡️', 'combat', 'buff', 'ally_all', 1, 1, 0, 2, 'def', 5, 2, '[Persona] Tăng +5 Giáp thủ cho toàn đội trong 2 lượt.'),
('celeste_judgment', 'celeste', 'Phán Quyết Thánh Quang', '✨', 'map', 'damage', 'cross', 1, 2, 160, 2, '', 0, 0, 'Tạo vùng nổ ánh sáng chữ thập phạm vi 2 ô gây 160% sát thương.'),
('kaito_arrow_rain', 'kaito', 'Vạn Tiễn Quy Tông', '🎯', 'combat', 'damage', 'single', 1, 2, 200, 2, '', 0, 0, '[Persona] Bắn loạt tên dồn dập 200% sát thương và tăng 15% Crit Rate.'),
('kaito_deadeye', 'kaito', 'Ưng Nhãn Xuyên Tâm', '🏹', 'map', 'damage', 'single', 2, 5, 160, 3, '', 0, 0, 'Bắn tỉa từ cực xa (2 - 5 ô) trên bản đồ. Gây 160% sát thương Pierce xuyên giáp địch!'),
('ren_shadow_strike', 'ren', 'Ám Đao Đoạt Mệnh', '🗡️', 'combat', 'damage', 'single', 1, 1, 220, 3, '', 0, 0, '[Persona] Tập kích bóng ma gây 220% sát thương Pierce và tăng 20% Crit Rate.'),
('ren_shuriken', 'ren', 'Ám Hắc Tiêu (Shuriken)', '🥷', 'map', 'damage', 'single', 2, 3, 150, 3, '', 0, 0, 'Phóng phi tiêu bóng tối tầm 2-3 ô gây 150% sát thương Pierce.'),
('shirou_iaido', 'shirou', 'Cư Hợp Trảm (Iaido)', '🗡️', 'map', 'damage', 'line', 1, 3, 170, 2, '', 0, 0, 'Rút đao chém nhanh vệt thẳng 3 ô gây 170% sát thương vật lý.'),
('shirou_tsubame', 'shirou', 'Yến Quy (Tsubame Gaeshi)', '⚡', 'combat', 'damage', 'single', 1, 1, 250, 3, '', 0, 0, '[Persona] Ba nhát chém cùng một thời điểm gây 250% sát thương và tăng 20% Crit.'),
('yuzu_heal', 'yuzu', 'Thần Chú Trị Liệu', '💚', 'map', 'heal', 'ally_single', 1, 3, 22, 4, '', 0, 0, 'Hồi phục trực tiếp 22 HP cho 1 đồng minh trong phạm vi 3 ô trên bản đồ.'),
('yuzu_tarukaja', 'yuzu', 'Khúc Ma Hồn (Tarukaja)', '🔮', 'combat', 'buff', 'ally_all', 1, 1, 0, 2, 'str', 4, 2, '[Persona] Cổ vũ toàn đội trong sàn 4v4, tăng +4 Công vật lý/Phép thuật trong 2 lượt.');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `units`
--

CREATE TABLE `units` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `short_name` varchar(50) DEFAULT '',
  `cls` varchar(50) NOT NULL,
  `allowed_weapons` varchar(150) NOT NULL DEFAULT 'Kiếm',
  `rarity` varchar(10) NOT NULL DEFAULT 'SSR',
  `symbol` varchar(10) NOT NULL,
  `team` enum('player','enemy') NOT NULL,
  `is_boss` tinyint(1) NOT NULL DEFAULT 0,
  `color` varchar(30) NOT NULL,
  `col` int(11) NOT NULL,
  `row` int(11) NOT NULL,
  `mov` int(11) NOT NULL,
  `move_type` varchar(20) NOT NULL DEFAULT 'walk',
  `range` int(11) NOT NULL DEFAULT 1,
  `hp` int(11) NOT NULL,
  `maxhp` int(11) NOT NULL,
  `type` varchar(50) NOT NULL,
  `weakness` varchar(50) NOT NULL,
  `str` int(11) NOT NULL DEFAULT 10,
  `mag` int(11) NOT NULL DEFAULT 10,
  `dex` int(11) NOT NULL DEFAULT 10,
  `spd` int(11) NOT NULL DEFAULT 10,
  `def` int(11) NOT NULL DEFAULT 5,
  `res` int(11) NOT NULL DEFAULT 5,
  `lck` int(11) NOT NULL DEFAULT 10,
  `avatar` varchar(255) DEFAULT '',
  `profile_img` varchar(255) DEFAULT '',
  `cutin_img` varchar(255) DEFAULT '',
  `cutin_audio` varchar(255) DEFAULT '',
  `cutin_volume` int(11) NOT NULL DEFAULT 100,
  `cutin_pos_x` int(11) NOT NULL DEFAULT 50,
  `cutin_pos_y` int(11) NOT NULL DEFAULT 30,
  `cutin_scale` int(11) NOT NULL DEFAULT 120,
  `skill_cutin_img` varchar(255) DEFAULT '',
  `skill_cutin_audio` varchar(255) DEFAULT '',
  `skill_cutin_volume` int(11) NOT NULL DEFAULT 100,
  `crit_quote` varchar(255) DEFAULT '',
  `dialogue_lv1` text DEFAULT NULL,
  `dialogue_lv2` text DEFAULT NULL,
  `dialogue_lv3` text DEFAULT NULL,
  `dialogue_lv4` text DEFAULT NULL,
  `romance_points` int(11) DEFAULT 0,
  `bio` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `units`
--

INSERT INTO `units` (`id`, `name`, `short_name`, `cls`, `allowed_weapons`, `rarity`, `symbol`, `team`, `is_boss`, `color`, `col`, `row`, `mov`, `move_type`, `range`, `hp`, `maxhp`, `type`, `weakness`, `str`, `mag`, `dex`, `spd`, `def`, `res`, `lck`, `avatar`, `profile_img`, `cutin_img`, `cutin_audio`, `cutin_volume`, `cutin_pos_x`, `cutin_pos_y`, `cutin_scale`, `skill_cutin_img`, `skill_cutin_audio`, `skill_cutin_volume`, `crit_quote`, `dialogue_lv1`, `dialogue_lv2`, `dialogue_lv3`, `dialogue_lv4`, `romance_points`, `bio`) VALUES
('abyssal_dragon', 'Ma Long Vực Thẳm', 'Ma Long', 'Dragon', 'Kiếm', 'SSR', '竜', 'enemy', 1, '#d35400', 8, 2, 3, 'walk', 2, 85, 85, 'Physical', 'Magic', 24, 18, 16, 12, 16, 12, 15, '', '', '', '', 100, 50, 30, 120, '', '', 100, '', '', '', '', '', 0, 'Đại Boss tầng 10: Rồng đen cổ đại thở ra hỏa diệm thiêu rụi chiến trường.'),
('aria', 'Aria von Rosenberg', 'Aria', 'Vanguard', 'Kiếm,Đao', 'SSR', '剣', 'player', 0, 'var(--teal)', 0, 5, 4, 'walk', 1, 34, 34, 'Physical', 'Magic', 14, 2, 12, 11, 9, 3, 10, '', '', '', '', 100, 50, 30, 120, '', '', 100, 'Thanh kiếm này... sẽ chém đứt tất cả!', 'Báo cáo Chỉ huy! Toàn đội đã sẵn sàng nhận lệnh xuất kích.', 'Được kề vai chiến đấu cùng người khiến tôi cảm thấy rất an tâm!', 'Chỉ huy này... sau trận đánh hôm nay, người có rảnh đi dạo cùng tôi một lát không?', 'Dù là chân trời góc bể, thanh kiếm này chỉ hướng về một mình người thôi ❤️', 20, ''),
('beast', 'Battle Beast', 'Battle Beast', 'Berserker', 'Rìu', 'SSR', '牙', 'player', 0, '#B91C1C', 0, 5, 4, 'walk', 1, 42, 42, 'Physical', 'Magic', 18, 2, 10, 8, 14, 4, 7, 'img/battlebeast_avatar.png', 'img/heroes/battlebeast.png', 'img/cutin_beast.png', '', 100, 33, 70, 108, 'img/heroes/battlebeast_skill.png', '', 100, '', '', '', '', '', 0, ''),
('blood_vampire', 'Huyết Tộc Bá Tước', 'Bá Tước', 'Vampire', 'Trượng', 'SSR', '血', 'enemy', 1, '#9b59b6', 6, 1, 3, 'walk', 1, 52, 52, 'Magic', 'Pierce', 4, 22, 16, 13, 7, 15, 12, '', '', '', '', 100, 50, 30, 120, '', '', 100, '', '', '', '', '', 0, 'Tiểu Boss tầng 15: Ma cà rồng khát máu chuyên niệm phép hút sinh lực.'),
('celeste', 'Celeste Saint', 'Celeste', 'Paladin', 'Kiếm,Thương', 'SSR', '聖', 'player', 0, '#f72585', 0, 6, 4, 'walk', 1, 38, 38, 'Physical', 'Pierce', 13, 5, 10, 7, 12, 8, 14, '', '', '', '', 100, 50, 30, 120, '', '', 100, 'Dưới ánh sáng thánh thần, hãy sám hối!', '', '', '', '', 0, 'Nữ thánh kỵ sĩ với tấm khiên thần hộ thể.'),
('claude', 'Claude von Riegan', 'Claude', 'Lord', 'Cung', 'SR', '弓', 'player', 0, '#EAB308', 0, 5, 4, 'walk', 2, 30, 30, 'Pierce', 'Physical', 12, 5, 13, 12, 7, 5, 11, 'img/claude_avatar.png', 'img/heroes/claude.png', '', '', 100, 50, 30, 120, '', '', 100, '', '', '', '', '', 0, ''),
('darkness', 'Darkness', 'Darkness', 'Crusader', 'Kiếm', 'SR', '盾', 'player', 0, '#CA8A04', 0, 5, 4, 'walk', 1, 40, 40, 'Physical', 'Magic', 13, 3, 5, 6, 16, 9, 8, 'img/darkness_avatar.png', 'img/heroes/darkness.png', '', '', 100, 50, 30, 120, 'img/heroes/darkness_skill.png', '', 100, '', '', '', '', '', 0, ''),
('deadpool', 'Deadpool', 'Deadpool', 'Mercenary', 'Kiếm', 'SSR', '刀', 'player', 0, '#DC2626', 0, 5, 5, 'walk', 1, 36, 36, 'Physical', 'Magic', 15, 3, 14, 13, 9, 6, 14, 'img/deadpool_avatar.png', 'img/heroes/deadpool.png', '', '', 100, 50, 30, 120, '', '', 100, '', '', '', '', '', 0, ''),
('demon_lord', 'Quỷ Vương Tận Thế', 'Quỷ Vương', 'DemonLord', 'Trượng', 'SSR', '魔', 'enemy', 1, '#e74c3c', 7, 1, 4, 'walk', 2, 110, 110, 'Magic', 'Pierce', 22, 28, 20, 15, 18, 18, 18, '', '', '', '', 100, 50, 30, 120, '', '', 100, '', '', '', '', '', 0, 'Đại Boss tầng 20: Chúa tể quỷ dữ nắm giữ ma pháp hủy diệt không gian.'),
('dullahan', 'Kỵ Sĩ Không Đầu (Dullahan)', 'Dullahan', 'DeathKnight', 'Đao', 'SSR', '首', 'enemy', 1, '#c0392b', 7, 1, 3, 'walk', 1, 58, 58, 'Physical', 'Magic', 18, 5, 14, 11, 12, 6, 10, '', '', '', '', 100, 50, 30, 120, '', '', 100, '', '', '', '', '', 0, 'Tiểu Boss tầng 5: Kỵ sĩ hắc ám cầm đại đao chém sắt như chém chuối.'),
('edelgard', 'Edelgard von Hresvelg', 'Edelgard', 'Lord', 'Rìu', 'SR', '帝', 'player', 0, '#9F1239', 0, 5, 4, 'walk', 1, 34, 34, 'Physical', 'Magic', 15, 7, 12, 11, 10, 5, 9, 'img/edelgard_avatar.png', 'img/heroes/edelgard.png', '', '', 100, 50, 30, 120, '', '', 100, '', '', '', '', '', 0, ''),
('emilia', 'Emilia', 'Emilia', 'Ice Mage', 'Trượng,Sách phép', 'SSR', '氷', 'player', 0, '#C4B5FD', 0, 5, 5, 'walk', 2, 30, 30, 'Magic', 'Pierce', 5, 18, 10, 11, 7, 13, 11, 'img/emilia_avatar.png', 'img/heroes/emilia.png', '', '', 100, 50, 30, 120, '', '', 100, '', '', '', '', '', 0, ''),
('frost_witch', 'Băng Sương Ma Nữ', 'Băng Nữ', 'Sorceress', 'Trượng', 'SR', '氷', 'enemy', 0, '#2980b9', 6, 3, 3, 'walk', 1, 25, 25, 'Magic', 'Pierce', 2, 17, 13, 9, 3, 12, 8, '', '', '', '', 100, 50, 30, 120, '', '', 100, '', '', '', '', '', 0, 'Phù thủy băng giá, kháng phép cực cao.'),
('goblin_scout', 'Goblin Tiễu Binh', 'Goblin', 'Scout', 'Dao', 'SR', '小', 'enemy', 0, '#27ae60', 5, 2, 4, 'walk', 1, 20, 20, 'Physical', 'Magic', 10, 1, 13, 15, 3, 1, 12, '', '', '', '', 100, 50, 30, 120, '', '', 100, '', '', '', '', '', 0, 'Tiểu yêu tinh nhanh nhẹn, tốc độ cao.'),
('invincible', 'Invincible', 'Invincible', 'Hero', 'Nắm đấm', 'SR', '英', 'player', 0, '#EAB308', 0, 5, 4, 'fly', 1, 32, 32, 'Physical', 'Magic', 14, 2, 10, 12, 11, 4, 9, 'img/invincible_avatar.png', 'img/heroes/invincible.png', '', '', 100, 50, 30, 120, '', '', 100, '', '', '', '', '', 0, ''),
('iron_golem', 'Thiết Giáp Cự Nhân', 'Cự Nhân', 'Guardian', 'Rìu', 'SR', '鉄', 'enemy', 0, '#7f8c8d', 4, 3, 2, 'walk', 1, 45, 45, 'Physical', 'Magic', 16, 0, 8, 5, 15, 1, 4, '', '', '', '', 100, 50, 30, 120, '', '', 100, '', '', '', '', '', 0, 'Người đá giáp sắt khổng lồ, phòng thủ vật lý cực trâu.'),
('junpei', 'Junpei Iori (F.E.S ver)', 'Junpei', 'Slugger', 'Kiếm', 'SR', '球', 'player', 0, '#EA580C', 0, 5, 5, 'walk', 1, 33, 33, 'Physical', 'Magic', 16, 5, 11, 11, 9, 6, 10, 'img/junpei_avatar.png', 'img/heroes/junpei.png', '', '', 100, 50, 30, 120, '', '', 100, '', '', '', '', '', 0, ''),
('kaito', 'Kaito Shigure', 'Kaito', 'Ranger', 'Cung', 'SSR', '弓', 'player', 0, 'var(--gold)', 0, 6, 4, 'walk', 2, 26, 26, 'Pierce', 'Physical', 12, 3, 17, 14, 5, 4, 11, '', '', '', '', 100, 50, 30, 120, '', '', 100, 'Một phát... xuyên tâm!', 'Cung tên đã lên dây, sẵn sàng yểm trợ toàn đội.', 'Chỉ huy cứ tiến lên, sau lưng người đã có mũi tên của tôi canh gác.', 'Hôm nay trời đẹp, chúng ta thi bắn cung giải khuây chứ?', 'Mục tiêu duy nhất mà mắt tôi không bao giờ rời khỏi... chính là người.', 10, 'Xạ thủ điềm tĩnh, chuyên gia bao quát toàn chiến trường.'),
('magik', 'Magik', 'Magik', 'Sorceress', 'Kiếm', 'SR', '剣', 'player', 0, '#7E22CE', 0, 5, 4, 'walk', 2, 28, 28, 'Magic', 'Pierce', 8, 16, 11, 12, 6, 12, 9, 'img/magik_avatar.png', 'img/heroes/magik.png', '', '', 100, 50, 30, 120, '', '', 100, '', '', '', '', '', 0, ''),
('makoto', 'Makoto Yuki (F.E.S ver)', 'Makoto', 'Persona Wielder', 'Kiếm', 'SSR', '魂', 'player', 0, '#1E3A8A', 0, 5, 4, 'walk', 1, 33, 33, 'Physical', 'Magic', 16, 4, 12, 12, 9, 5, 10, 'img/makoto_avatar.png', 'img/heroes/makoto.png', 'img/cutin_makoto.png', 'audio/voice_makoto.mp3', 120, 50, 57, 101, 'img/heroes/makoto_persona.png', '', 100, '', '', '', '', '', 0, ''),
('megumin', 'Megumin', 'Megumin', 'Arch Wizard', 'Trượng,Sách phép', 'SSR', '爆', 'player', 0, '#C2410C', 0, 5, 4, 'walk', 2, 26, 26, 'Magic', 'Pierce', 3, 20, 9, 7, 5, 12, 11, 'img/megumin_avatar.png', 'img/heroes/megumin.png', 'img/cutin_megumin.png', '', 100, 43, 47, 100, 'img/heroes/megumin_skill.png', '', 100, '', '', '', '', '', 0, ''),
('ren', 'Ren Kage', 'Ren', 'Ninja', 'Dao,Kiếm', 'SR', '忍', 'player', 0, '#9b59b6', 0, 4, 4, 'walk', 1, 26, 26, 'Pierce', 'Physical', 11, 4, 15, 16, 4, 4, 12, '', '', '', '', 100, 50, 30, 120, '', '', 100, 'Bóng tối sẽ nuốt chửng ngươi!', '', '', '', '', 0, 'Nhẫn giả thần tốc với ám khí xuyên phá.'),
('shade', 'Shade Knight', 'Shade', 'Enforcer', 'Kiếm', 'SSR', '骸', 'enemy', 1, 'var(--enemy-red)', 8, 1, 3, 'walk', 1, 34, 34, 'Physical', 'Magic', 13, 1, 10, 8, 9, 2, 6, '', '', '', '', 100, 50, 30, 120, '', '', 100, '', '', '', '', '', 0, 'Thủ lĩnh kỵ sĩ vong linh nguy hiểm (Boss Chiến Dịch).'),
('shade_archer', 'Shade Archer', 'Archer', 'Archer', 'Cung', 'SSR', '射', 'enemy', 0, '#e67e22', 6, 1, 3, 'walk', 2, 24, 24, 'Pierce', 'Physical', 11, 2, 14, 12, 4, 3, 8, '', '', '', '', 100, 50, 30, 120, '', '', 100, '', '', '', '', '', 0, 'Cung thủ vong linh bắn tỉa từ xa.'),
('shadow_assassin', 'Ám Dạ Thích Khách', 'Thích Khách', 'Assassin', 'Dao', 'SR', '影', 'enemy', 0, '#8e44ad', 7, 2, 4, 'walk', 1, 24, 24, 'Pierce', 'Physical', 14, 2, 18, 16, 4, 4, 15, '', '', '', '', 100, 50, 30, 120, '', '', 100, '', '', '', '', '', 0, 'Thích khách thoắt ẩn thoắt hiện, tỉ lệ chí mạng cao.'),
('shirou', 'Shirou Mikazuki', 'Shirou', 'Ronin', 'Đao,Kiếm', 'SSR', '刀', 'player', 0, '#4cc9f0', 0, 5, 4, 'walk', 1, 28, 28, 'Physical', 'Magic', 16, 1, 16, 15, 6, 2, 8, '', '', '', '', 100, 50, 30, 120, '', '', 100, 'Nhát kiếm này... trảm tuyệt hư vô!', '', '', '', '', 0, 'Kiếm khách lãng tử với tuyệt kỹ kiếm vũ bão.'),
('wraith', 'Wraith Mage', 'Wraith', 'Hexer', 'Trượng', 'SSR', '幽', 'enemy', 0, 'var(--enemy-purple)', 7, 0, 3, 'walk', 1, 22, 22, 'Magic', 'Pierce', 2, 15, 12, 9, 2, 9, 7, '', '', '', '', 100, 50, 30, 120, '', '', 100, '', '', '', '', '', 0, 'Ảo thuật sư hắc ám.'),
('yosuke', 'Yosuke Hanamura (Golden ver)', 'Yosuke', 'Wind Blade', 'Đao', 'SR', '刃', 'player', 0, '#F97316', 0, 5, 5, 'walk', 1, 31, 31, 'Physical', 'Magic', 14, 6, 13, 14, 8, 7, 10, 'img/yosuke_avatar.png', 'img/heroes/yosuke.png', 'img/cutin_yosuke.png', '', 100, 27, 48, 100, 'img/heroes/yosuke_persona.png', '', 100, '', '', '', '', '', 0, ''),
('yuzu', 'Yuzu Hoshizora', 'Yuzu', 'Mystic', 'Trượng,Sách phép', 'SSR', '呪', 'player', 0, 'var(--rose)', 2, 6, 3, 'walk', 1, 24, 24, 'Magic', 'Pierce', 2, 16, 14, 10, 3, 11, 12, '', '', '', '', 100, 50, 30, 120, '', '', 100, 'Ngươi không thể trốn khỏi lời nguyền!', 'Chỉ huy cần tra cứu ma đạo thư cổ nào không?', 'Ở cạnh người, dòng ma lực trong tôi luôn ổn định lạ kỳ.', 'Tôi đã pha sẵn trà thảo mộc... người vào uống cùng tôi nhé?', 'Lời nguyền lớn nhất của tôi... chính là đã trót hướng về người ❤️', 15, 'Pháp sư bí ẩn thích đọc ma đạo thư cổ.');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `is_banned` tinyint(1) NOT NULL DEFAULT 0,
  `gems` int(11) NOT NULL DEFAULT 1500,
  `pity` int(11) NOT NULL DEFAULT 0,
  `banner_claimed` tinyint(1) NOT NULL DEFAULT 0,
  `banner_reset_time` bigint(20) NOT NULL DEFAULT 0,
  `last_checkin` date DEFAULT NULL,
  `checkin_streak` int(11) NOT NULL DEFAULT 0,
  `endless_max_floor` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `role`, `is_banned`, `gems`, `pity`, `banner_claimed`, `banner_reset_time`, `last_checkin`, `checkin_streak`, `endless_max_floor`, `created_at`) VALUES
(1, 'Vinh505', '$2y$10$eQg27DPJGaIV1beHESKmue/sDRB8FDxx5etMyrqq4O897gblPAL9m', 'admin', 0, 614399, 48, 0, 0, NULL, 0, 1, '2026-10-03 19:38:59'),
(2, 'test', '$2y$10$m3WQJn2tNG1nhKC5ekB2n.HV0MzvfwknxbBI2esVcq/EpDmghrtBy', 'user', 0, 1500, 0, 0, 0, NULL, 0, 0, '2026-10-09 07:41:58'),
(3, 'CHOVINHGAVC', '$2y$10$5u3dDqAGPpvtp79BvGiILOp3xmarCNXn0shdWyqEdu.GqCPeUMEN2', 'user', 0, 2147253647, 4, 1, 1792078662, '2026-10-11', 1, 1, '2026-10-11 15:29:56');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `user_claimed_codes`
--

CREATE TABLE `user_claimed_codes` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `claimed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `user_claimed_codes`
--

INSERT INTO `user_claimed_codes` (`id`, `user_id`, `code`, `claimed_at`) VALUES
(1, 3, 'PARRYGOD', '2026-10-11 15:36:55');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `user_hero_progress`
--

CREATE TABLE `user_hero_progress` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `hero_id` varchar(50) NOT NULL,
  `level` int(11) NOT NULL DEFAULT 1,
  `exp` int(11) NOT NULL DEFAULT 0,
  `equipped_weapon` varchar(50) DEFAULT NULL,
  `constellation` int(11) NOT NULL DEFAULT 0,
  `constellation_shards` int(11) NOT NULL DEFAULT 0,
  `bonus_stats` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `user_hero_progress`
--

INSERT INTO `user_hero_progress` (`id`, `user_id`, `hero_id`, `level`, `exp`, `equipped_weapon`, `constellation`, `constellation_shards`, `bonus_stats`, `updated_at`) VALUES
(1, 1, 'aria', 2, 20, 'sr_sword', 0, 6, '{\"hp\":0,\"str\":0,\"mag\":0,\"dex\":0,\"spd\":1,\"def\":1,\"res\":1,\"lck\":0,\"history\":{\"2\":{\"res\":1,\"spd\":1,\"def\":1}}}', '2026-10-06 15:44:49'),
(2, 1, 'yuzu', 2, 0, 'r_oak_staff', 0, 4, '{\"hp\":0,\"str\":1,\"mag\":1,\"dex\":0,\"spd\":0,\"def\":2,\"res\":0,\"lck\":0,\"history\":{\"2\":{\"str\":1,\"mag\":1,\"def\":2}}}', '2026-10-07 09:08:45'),
(3, 1, 'kaito', 2, 0, 'r_short_bow', 0, 2, '{\"hp\":1,\"str\":0,\"mag\":0,\"dex\":2,\"spd\":0,\"def\":1,\"res\":0,\"lck\":0,\"history\":{\"2\":{\"def\":1,\"hp\":1,\"dex\":2}}}', '2026-10-06 15:44:29'),
(4, 1, 'shirou', 1, 0, NULL, 0, 4, '{\"hp\":0,\"str\":0,\"mag\":0,\"dex\":0,\"spd\":0,\"def\":0,\"res\":0,\"lck\":0,\"history\":{}}', '2026-10-06 15:45:46'),
(5, 1, 'celeste', 1, 0, NULL, 0, 3, '{\"hp\":0,\"str\":0,\"mag\":0,\"dex\":0,\"spd\":0,\"def\":0,\"res\":0,\"lck\":0,\"history\":{}}', '2026-10-06 15:45:13'),
(6, 1, 'ren', 1, 0, NULL, 0, 21, '{\"hp\":0,\"str\":0,\"mag\":0,\"dex\":0,\"spd\":0,\"def\":0,\"res\":0,\"lck\":0,\"history\":{}}', '2026-10-09 06:46:48'),
(18, 1, 'makoto', 1, 0, 'r_iron_sword', 0, 7, NULL, '2026-10-07 09:08:54'),
(25, 1, 'edelgard', 1, 0, NULL, 0, 25, NULL, '2026-10-09 06:46:41'),
(33, 1, 'yosuke', 1, 0, NULL, 0, 27, NULL, '2026-10-07 09:08:30'),
(37, 1, 'darkness', 1, 0, NULL, 0, 19, NULL, '2026-10-07 09:08:56'),
(41, 1, 'deadpool', 1, 0, NULL, 0, 3, NULL, '2026-10-06 15:45:01'),
(42, 1, 'megumin', 1, 0, NULL, 0, 2, NULL, '2026-10-06 15:45:10'),
(53, 1, 'junpei', 1, 0, NULL, 0, 28, NULL, '2026-10-09 06:46:44'),
(125, 1, 'beast', 1, 0, NULL, 0, 1, NULL, '2026-10-06 15:45:21'),
(140, 1, 'invincible', 1, 0, NULL, 0, 4, NULL, '2026-10-07 09:08:50'),
(143, 1, 'emilia', 1, 0, NULL, 0, 4, NULL, '2026-10-09 06:46:42'),
(171, 1, 'claude', 1, 0, NULL, 0, 1, NULL, '2026-10-07 09:09:00'),
(178, 3, 'aria', 3, 90, NULL, 4, 0, '{\"hp\":1,\"str\":0,\"mag\":1,\"dex\":2,\"spd\":0,\"def\":0,\"res\":1,\"lck\":1,\"history\":{\"2\":{\"dex\":1,\"res\":1,\"mag\":1},\"3\":{\"lck\":1,\"dex\":1,\"hp\":1}}}', '2026-10-11 15:42:52'),
(179, 3, 'yuzu', 3, 10, NULL, 0, 0, '{\"hp\":2,\"str\":0,\"mag\":0,\"dex\":1,\"spd\":2,\"def\":0,\"res\":0,\"lck\":1,\"history\":{\"2\":{\"spd\":1,\"dex\":1,\"hp\":1},\"3\":{\"hp\":1,\"spd\":1,\"lck\":1}}}', '2026-10-11 15:36:19'),
(180, 3, 'kaito', 3, 75, NULL, 3, 0, '{\"hp\":1,\"str\":3,\"mag\":0,\"dex\":3,\"spd\":0,\"def\":2,\"res\":0,\"lck\":0,\"history\":{\"2\":{\"hp\":1,\"str\":2,\"dex\":1},\"3\":{\"def\":2,\"dex\":2,\"str\":1}}}', '2026-10-11 15:42:47'),
(184, 3, 'magik', 1, 0, NULL, 0, 25, NULL, '2026-10-11 15:43:28'),
(185, 3, 'junpei', 1, 0, NULL, 0, 10, NULL, '2026-10-11 15:43:25'),
(186, 3, 'ren', 1, 0, NULL, 0, 17, NULL, '2026-10-11 15:43:38'),
(187, 3, 'yosuke', 1, 0, NULL, 0, 16, NULL, '2026-10-11 15:43:17'),
(190, 3, 'invincible', 1, 0, NULL, 0, 13, NULL, '2026-10-11 15:42:25'),
(201, 3, 'darkness', 1, 0, NULL, 0, 15, NULL, '2026-10-11 15:43:27'),
(207, 3, 'megumin', 1, 0, 'ssr_astral_staff', 2, 0, NULL, '2026-10-11 15:43:02'),
(209, 3, 'emilia', 1, 0, 'ssr_astral_staff', 6, 1, NULL, '2026-10-11 16:09:16'),
(214, 3, 'edelgard', 1, 0, NULL, 0, 8, NULL, '2026-10-11 15:42:31'),
(228, 3, 'shirou', 1, 0, NULL, 2, 1, NULL, '2026-10-11 15:43:38'),
(233, 3, 'claude', 1, 0, NULL, 0, 12, NULL, '2026-10-11 15:43:37'),
(252, 3, 'beast', 1, 0, NULL, 4, 1, NULL, '2026-10-11 15:43:37'),
(290, 3, 'celeste', 1, 0, NULL, 1, 0, NULL, '2026-10-11 15:43:00');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `user_inventory`
--

CREATE TABLE `user_inventory` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `item_id` varchar(50) NOT NULL,
  `item_name` varchar(100) NOT NULL,
  `item_type` varchar(100) NOT NULL,
  `rarity` varchar(10) NOT NULL,
  `amount` int(11) NOT NULL DEFAULT 1,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `user_inventory`
--

INSERT INTO `user_inventory` (`id`, `user_id`, `item_id`, `item_name`, `item_type`, `rarity`, `amount`, `updated_at`) VALUES
(1, 1, 'relevel_ticket', 'Vé Tẩy Cấp', 'Vật Phẩm', 'SR', 10, '2026-10-03 19:38:59'),
(2, 1, 'r_iron_sword', 'Kiếm Thép', 'Kiếm', 'R', 251, '2026-10-09 06:46:48'),
(3, 1, 'r_oak_staff', 'Trượng Gỗ Sồi', 'Trượng', 'R', 280, '2026-10-09 06:46:48'),
(4, 1, 'r_short_bow', 'Cung Săn Bắn', 'Cung', 'R', 251, '2026-10-09 06:46:47'),
(5, 1, 'r_axe', 'Rìu Chiến Sắt', 'Vũ khí 3★ (Rìu)', 'R', 227, '2026-10-09 06:46:48'),
(6, 1, 'r_dagger', 'Dao Găm Bạc', 'Vũ khí 3★ (Dao)', 'R', 272, '2026-10-09 06:46:48'),
(8, 1, 'r_lance', 'Giáo Tân Binh', 'Vũ khí 3★ (Thương)', 'R', 256, '2026-10-09 06:46:48'),
(10, 1, 'sr_bow', 'Cung Bão Tố', 'Vũ khí 4★ (Cung)', 'SR', 49, '2026-10-09 06:46:47'),
(11, 1, 'sr_sword', 'Kiếm Ánh Quang', 'Vũ khí 4★ (Kiếm)', 'SR', 28, '2026-10-07 09:08:58'),
(22, 1, 'ren', 'Ren Kage', 'Nhân vật 4★ (Ninja)', 'SR', 22, '2026-10-09 06:46:48'),
(29, 1, 'sr_staff', 'Trượng Tinh Tú', 'Vũ khí 4★ (Trượng)', 'SR', 38, '2026-10-09 06:46:46'),
(39, 1, 'sr_spear', 'Thương Băng Giá', 'Vũ khí 4★ (Thương)', 'SR', 33, '2026-10-07 09:08:58'),
(68, 1, 'makoto', 'Makoto Yuki (F.E.S ver)', 'Nhân vật (Persona Wielder)', 'SSR', 8, '2026-10-07 09:08:54'),
(131, 1, 'celeste', 'Celeste Saint', 'Nhân vật (Paladin)', 'SSR', 4, '2026-10-06 15:45:13'),
(139, 1, 'sr_blade', 'Huyết Dạ Đao', 'Vũ khí 4★ (Đao)', 'SR', 25, '2026-10-07 09:08:57'),
(152, 1, 'beast', 'Battle Beast', 'Nhân vật (Berserker)', 'SSR', 2, '2026-10-06 15:45:21'),
(164, 1, 'aria', 'Aria von Rosenberg', 'Nhân vật (Vanguard)', 'SSR', 6, '2026-10-06 15:44:49'),
(231, 1, 'shirou', 'Shirou Mikazuki', 'Nhân vật (Ronin)', 'SSR', 5, '2026-10-06 15:45:46'),
(251, 1, 'megumin', 'Megumin', 'Nhân vật (Arch Wizard)', 'SSR', 3, '2026-10-06 15:45:10'),
(258, 1, 'edelgard', 'Edelgard von Hresvelg', 'Nhân vật 4★ (Lord)', 'SR', 26, '2026-10-09 06:46:41'),
(269, 1, 'yuzu', 'Yuzu Hoshizora', 'Nhân vật (Mystic)', 'SSR', 4, '2026-10-07 09:08:45'),
(339, 1, 'kaito', 'Kaito Shigure', 'Nhân vật (Ranger)', 'SSR', 2, '2026-10-06 15:44:29'),
(369, 1, 'yosuke', 'Yosuke Hanamura', 'Nhân vật 4★ (Wind Blade)', 'SR', 28, '2026-10-07 09:08:30'),
(426, 1, 'darkness', 'Darkness', 'Nhân vật 4★ (Crusader)', 'SR', 20, '2026-10-07 09:08:56'),
(456, 1, 'deadpool', 'Deadpool', 'Nhân vật (Mercenary)', 'SSR', 4, '2026-10-06 15:45:01'),
(675, 1, 'junpei', 'Junpei Iori (F.E.S ver)', 'Nhân vật 4★ (Slugger)', 'SR', 29, '2026-10-09 06:46:44'),
(1518, 1, 'emilia', 'Emilia', 'Nhân vật (Ice Mage)', 'SSR', 5, '2026-10-09 06:46:42'),
(1538, 1, 'invincible', 'Invincible', 'Nhân vật 4★ (Hero)', 'SR', 5, '2026-10-07 09:08:50'),
(1548, 1, 'r_gauntlet_test', 'Test', 'Vũ khí 3★ (Nắm đấm)', 'R', 50, '2026-10-09 06:46:48'),
(1730, 1, 'claude', 'Claude von Riegan', 'Nhân vật 4★ (Lord)', 'SR', 2, '2026-10-07 09:09:00'),
(1933, 1, 'magik', 'Magik', 'Nhân vật 4★ (Sorceress)', 'SR', 1, '2026-10-09 06:46:48'),
(1935, 3, 'relevel_ticket', 'Vé Tẩy Cấp', 'Vật Phẩm', 'SR', 2, '2026-10-11 15:36:55'),
(1936, 3, 'r_dagger', 'Dao Găm Bạc', 'Vũ khí 3★ (Dao)', 'R', 154, '2026-10-11 15:43:37'),
(1937, 3, 'r_axe', 'Rìu Chiến Sắt', 'Vũ khí 3★ (Rìu)', 'R', 118, '2026-10-11 15:43:27'),
(1938, 3, 'r_lance', 'Giáo Tân Binh', 'Vũ khí 3★ (Thương)', 'R', 153, '2026-10-11 15:43:28'),
(1939, 3, 'junpei', 'Junpei Iori (F.E.S ver)', 'Nhân vật 4★ (Slugger)', 'SR', 11, '2026-10-11 15:43:25'),
(1940, 3, 'r_iron_sword', 'Kiếm Thép', 'Vũ khí 3★ (Kiếm)', 'R', 132, '2026-10-11 15:43:38'),
(1945, 3, 'r_gauntlet_test', 'Test', 'Vũ khí 3★ (Nắm đấm)', 'R', 163, '2026-10-11 15:43:37'),
(1953, 3, 'r_short_bow', 'Cung Săn Bắn', 'Vũ khí 3★ (Cung)', 'R', 155, '2026-10-11 15:43:38'),
(1955, 3, 'magik', 'Magik', 'Nhân vật 4★ (Sorceress)', 'SR', 26, '2026-10-11 15:43:28'),
(1963, 3, 'invincible', 'Invincible', 'Nhân vật 4★ (Hero)', 'SR', 14, '2026-10-11 15:42:25'),
(1975, 3, 'r_oak_staff', 'Trượng Gỗ Sồi', 'Vũ khí 3★ (Trượng)', 'R', 142, '2026-10-11 15:43:37'),
(1980, 3, 'ren', 'Ren Kage', 'Nhân vật 4★ (Ninja)', 'SR', 18, '2026-10-11 15:43:38'),
(1989, 3, 'sr_blade', 'Huyết Dạ Đao', 'Vũ khí 4★ (Đao)', 'SR', 8, '2026-10-11 15:43:17'),
(1996, 3, 'sr_sword', 'Kiếm Ánh Quang', 'Vũ khí 4★ (Kiếm)', 'SR', 22, '2026-10-11 15:43:24'),
(1999, 3, 'yosuke', 'Yosuke Hanamura (Golden ver)', 'Nhân vật 4★ (Wind Blade)', 'SR', 17, '2026-10-11 15:43:17'),
(2005, 3, 'emilia', 'Emilia', 'Nhân vật (Ice Mage)', 'SSR', 8, '2026-10-11 15:43:17'),
(2011, 3, 'sr_spear', 'Thương Băng Giá', 'Vũ khí 4★ (Thương)', 'SR', 18, '2026-10-11 15:43:23'),
(2031, 3, 'darkness', 'Darkness', 'Nhân vật 4★ (Crusader)', 'SR', 16, '2026-10-11 15:43:27'),
(2046, 3, 'edelgard', 'Edelgard von Hresvelg', 'Nhân vật 4★ (Lord)', 'SR', 9, '2026-10-11 15:42:31'),
(2059, 3, 'sr_staff', 'Trượng Tinh Tú', 'Vũ khí 4★ (Trượng)', 'SR', 17, '2026-10-11 15:42:27'),
(2069, 3, 'kaito', 'Kaito Shigure', 'Nhân vật (Ranger)', 'SSR', 3, '2026-10-11 15:41:52'),
(2129, 3, 'sr_bow', 'Cung Bão Tố', 'Vũ khí 4★ (Cung)', 'SR', 19, '2026-10-11 15:42:35'),
(2130, 3, 'celeste', 'Celeste Saint', 'Nhân vật (Paladin)', 'SSR', 2, '2026-10-11 15:41:52'),
(2132, 3, 'aria', 'Aria von Rosenberg', 'Nhân vật (Vanguard)', 'SSR', 4, '2026-10-11 15:42:23'),
(2134, 3, 'megumin', 'Megumin', 'Nhân vật (Arch Wizard)', 'SSR', 3, '2026-10-11 15:41:28'),
(2166, 3, 'ssr_astral_staff', 'Thần Trượng Khải Huyền', 'Thần Binh 5★ (Trượng)', 'SSR', 2, '2026-10-11 15:39:13'),
(2231, 3, 'ssr_excalibur_sword', 'Thánh Kiếm Excalibur', 'Thần Binh 5★ (Kiếm)', 'SSR', 1, '2026-10-11 15:39:17'),
(2309, 3, 'beast', 'Battle Beast', 'Nhân vật (Berserker)', 'SSR', 6, '2026-10-11 15:43:37'),
(2370, 3, 'shirou', 'Shirou Mikazuki', 'Nhân vật (Ronin)', 'SSR', 4, '2026-10-11 15:43:38'),
(2391, 3, 'claude', 'Claude von Riegan', 'Nhân vật 4★ (Lord)', 'SR', 13, '2026-10-11 15:43:37'),
(2769, 3, 'deadpool', 'Deadpool', 'Nhân vật (Mercenary)', 'SSR', 1, '2026-10-11 15:41:25'),
(2788, 3, 'makoto', 'Makoto Yuki (F.E.S ver)', 'Nhân vật (Persona Wielder)', 'SSR', 1, '2026-10-11 15:41:29');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `user_romance`
--

CREATE TABLE `user_romance` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `hero_id` varchar(50) NOT NULL,
  `points` int(11) NOT NULL DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `user_romance`
--

INSERT INTO `user_romance` (`id`, `user_id`, `hero_id`, `points`, `updated_at`) VALUES
(1, 1, 'aria', 20, '2026-10-03 19:38:59'),
(2, 1, 'yuzu', 15, '2026-10-03 19:38:59'),
(3, 1, 'kaito', 10, '2026-10-03 19:38:59'),
(4, 1, 'makoto', 30, '2026-10-04 16:38:16');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `user_supports`
--

CREATE TABLE `user_supports` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `char_a` varchar(50) NOT NULL,
  `char_b` varchar(50) NOT NULL,
  `points` int(11) NOT NULL DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `user_supports`
--

INSERT INTO `user_supports` (`id`, `user_id`, `char_a`, `char_b`, `points`, `updated_at`) VALUES
(1, 1, 'aria', 'yuzu', 35, '2026-10-03 19:38:59'),
(2, 1, 'aria', 'kaito', 15, '2026-10-03 19:38:59'),
(3, 1, 'kaito', 'yuzu', 10, '2026-10-03 19:38:59');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `weapons`
--

CREATE TABLE `weapons` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `type` varchar(50) NOT NULL DEFAULT 'Kiếm',
  `range` int(11) NOT NULL DEFAULT 1,
  `rarity` enum('R','SR','SSR') NOT NULL DEFAULT 'R',
  `affinity` enum('Physical','Magic','Pierce') NOT NULL DEFAULT 'Physical',
  `icon` varchar(20) NOT NULL DEFAULT '⚔️',
  `image` varchar(255) DEFAULT '',
  `hp` int(11) NOT NULL DEFAULT 0,
  `str` int(11) NOT NULL DEFAULT 0,
  `mag` int(11) NOT NULL DEFAULT 0,
  `dex` int(11) NOT NULL DEFAULT 0,
  `spd` int(11) NOT NULL DEFAULT 0,
  `def` int(11) NOT NULL DEFAULT 0,
  `res` int(11) NOT NULL DEFAULT 0,
  `lck` int(11) NOT NULL DEFAULT 0,
  `mov` int(11) NOT NULL DEFAULT 0,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `weapons`
--

INSERT INTO `weapons` (`id`, `name`, `type`, `range`, `rarity`, `affinity`, `icon`, `image`, `hp`, `str`, `mag`, `dex`, `spd`, `def`, `res`, `lck`, `mov`, `description`) VALUES
('r_axe', 'Rìu Chiến Sắt', 'Rìu', 1, 'R', 'Physical', '🪓', '', 0, 4, 0, 0, 0, 0, 0, 0, 0, '+4 Công vật lý'),
('r_dagger', 'Dao Găm Bạc', 'Dao', 1, 'R', 'Pierce', '🗡️', '', 0, 0, 0, 0, 3, 0, 0, 0, 0, '+3 Tốc độ'),
('r_gauntlet_test', 'Test', 'Nắm đấm', 1, 'R', 'Physical', '🥊', '', 0, 6, 0, 0, 3, 0, 0, 0, 0, ''),
('r_iron_sword', 'Kiếm Thép', 'Kiếm', 1, 'R', 'Physical', '⚔️', '', 0, 3, 0, 0, 0, 0, 0, 0, 0, '+3 Công vật lý'),
('r_lance', 'Giáo Tân Binh', 'Thương', 1, 'R', 'Pierce', '🔱', '', 0, 3, 0, 0, 0, 0, 0, 0, 0, '+3 Công vật lý'),
('r_oak_staff', 'Trượng Gỗ Sồi', 'Trượng', 1, 'R', 'Magic', '🪄', '', 0, 0, 3, 0, 0, 0, 0, 0, 0, '+3 Ma lực phép'),
('r_short_bow', 'Cung Săn Bắn', 'Cung', 2, 'R', 'Pierce', '🏹', '', 0, 2, 0, 2, 0, 0, 0, 0, 0, '+2 Công, +2 Kỹ năng (Tầm xa 2 ô)'),
('sr_blade', 'Huyết Dạ Đao', 'Đao', 1, 'SR', 'Physical', '🗡️', '', 0, 6, 0, 0, 0, 0, 0, 2, 0, '+6 Công vật lý, +2 May mắn'),
('sr_bow', 'Cung Bão Tố', 'Cung', 2, 'SR', 'Pierce', '🏹', '', 0, 4, 0, 4, 0, 0, 0, 0, 0, '+4 Công, +4 Kỹ năng (Tầm xa 2 ô)'),
('sr_spear', 'Thương Băng Giá', 'Thương', 1, 'SR', 'Pierce', '🔱', '', 0, 5, 0, 0, 0, 3, 0, 0, 0, '+5 Công vật lý, +3 Giáp thủ'),
('sr_staff', 'Trượng Tinh Tú', 'Trượng', 1, 'SR', 'Magic', '🪄', '', 0, 0, 6, 0, 0, 0, 2, 0, 0, '+6 Ma lực phép, +2 Kháng phép'),
('sr_sword', 'Kiếm Ánh Quang', 'Kiếm', 1, 'SR', 'Physical', '⚔️', '', 0, 5, 0, 0, 2, 0, 0, 0, 0, '+5 Công vật lý, +2 Tốc độ'),
('ssr_astral_bow', 'Thiên Cung Tinh Tú', 'Cung', 2, 'SSR', 'Pierce', '🏹', '', 0, 9, 3, 10, 6, 2, 2, 8, 0, '+9 Công, +10 Kỹ năng, +6 Tốc độ, +8 May mắn cực đại (Tầm 2)!'),
('ssr_astral_staff', 'Thần Trượng Khải Huyền', 'Trượng', 1, 'SSR', 'Magic', '🪄', '', 0, 0, 12, 6, 4, 2, 8, 6, 1, '+12 Ma lực phép, +8 Kháng phép, +6 Dex, +4 Spd và +1 MP!'),
('ssr_excalibur_sword', 'Thánh Kiếm Excalibur', 'Kiếm', 1, 'SSR', 'Physical', '⚔️', '', 10, 10, 4, 6, 4, 5, 3, 5, 1, '+10 Máu, +10 Công, +6 Dex, +4 Spd và +1 Bước đi (MP)!');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `banners`
--
ALTER TABLE `banners`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `combat_musics`
--
ALTER TABLE `combat_musics`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Chỉ mục cho bảng `hero_constellations`
--
ALTER TABLE `hero_constellations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_hero_rank` (`hero_id`,`rank`);

--
-- Chỉ mục cho bảng `maps`
--
ALTER TABLE `maps`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `skills`
--
ALTER TABLE `skills`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `units`
--
ALTER TABLE `units`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Chỉ mục cho bảng `user_claimed_codes`
--
ALTER TABLE `user_claimed_codes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_code` (`user_id`,`code`);

--
-- Chỉ mục cho bảng `user_hero_progress`
--
ALTER TABLE `user_hero_progress`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_hero_prog` (`user_id`,`hero_id`);

--
-- Chỉ mục cho bảng `user_inventory`
--
ALTER TABLE `user_inventory`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_item` (`user_id`,`item_id`);

--
-- Chỉ mục cho bảng `user_romance`
--
ALTER TABLE `user_romance`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_hero_romance` (`user_id`,`hero_id`);

--
-- Chỉ mục cho bảng `user_supports`
--
ALTER TABLE `user_supports`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_pair` (`user_id`,`char_a`,`char_b`);

--
-- Chỉ mục cho bảng `weapons`
--
ALTER TABLE `weapons`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `combat_musics`
--
ALTER TABLE `combat_musics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT cho bảng `events`
--
ALTER TABLE `events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `hero_constellations`
--
ALTER TABLE `hero_constellations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `user_claimed_codes`
--
ALTER TABLE `user_claimed_codes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `user_hero_progress`
--
ALTER TABLE `user_hero_progress`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=329;

--
-- AUTO_INCREMENT cho bảng `user_inventory`
--
ALTER TABLE `user_inventory`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3196;

--
-- AUTO_INCREMENT cho bảng `user_romance`
--
ALTER TABLE `user_romance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT cho bảng `user_supports`
--
ALTER TABLE `user_supports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `user_claimed_codes`
--
ALTER TABLE `user_claimed_codes`
  ADD CONSTRAINT `fk_claimed_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `user_hero_progress`
--
ALTER TABLE `user_hero_progress`
  ADD CONSTRAINT `fk_hero_prog_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `user_inventory`
--
ALTER TABLE `user_inventory`
  ADD CONSTRAINT `fk_user_inventory` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `user_romance`
--
ALTER TABLE `user_romance`
  ADD CONSTRAINT `fk_romance_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `user_supports`
--
ALTER TABLE `user_supports`
  ADD CONSTRAINT `fk_support_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
