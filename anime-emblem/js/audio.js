/* ==================== AUDIO MANAGER (VOLUME SLIDER & CUSTOM BASE ENGINE) ==================== */
const SoundManager = {
  titleBGM: new Audio('audio/title.mp3'),       // 1. Nhạc Màn hình tiêu đề (Landing/Title)
  lobbyBGM: new Audio('audio/lobby.mp3'),       // 2. Nhạc Sảnh Chính (Lobby Hub)
  prepBGM: new Audio('audio/prep.mp3'),         // 🎵 Nhạc giai đoạn Chuẩn Bị Xuất Trận
  battleBGM: new Audio('audio/battle.mp3'),     // 3. Nhạc Chiến trường mặc định
  gachaBGM: new Audio('audio/gacha.mp3'),       // 4. Nhạc Gacha
  charBGM: new Audio('audio/character.mp3'),   // 5. Nhạc Tab Nhân Vật
  parrySFX: new Audio('audio/parry.mp3'),       // 6. SFX Parry đỡ đòn QTE
  critSFX: new Audio('audio/crit.mp3'),         // 7. SFX Critical Cut-In xé màn hình
  levelupSFX: new Audio('audio/levelup.mp3'),   // 8. SFX Level Up chúc mừng thăng cấp
  oneMoreSFX: new Audio('audio/1more.mp3'),     // 9. SFX 1 MORE PERSONA

  // MỨC ÂM LƯỢNG GỐC CỦA TỪNG BÀI (ỨNG VỚI MỨC 50% THANH KÉO)
  baseVolumes: {
    title: 0.3,
    lobby: 0.13, // Âm lượng nhạc Sảnh Chính thư thái, êm dịu
    prep: 0.08,  // Âm lượng nhạc Chuẩn Bị Xuất Trận
    battle: 0.1, // Âm lượng chuẩn 0.1 cho nhạc chiến đấu
    gacha: 0.14,
    char: 0.2,
    parry: 0.7,
    crit: 0.5,
    levelup: 1.0,
    onemore: 0.4
  },

  masterVolume: 0.5,
  previousVolume: 0.5,
  currentBGM: null,

  // DANH MỤC NHẠC COMBAT RIÊNG BIỆT (TẢI TỪ DATABASE)
  combatTracks: [],
  currentBattleTrackSrc: 'audio/battle.mp3',
  currentBattleTrackVol: 100,
  currentBgmSetting: 'random_battle',

  init() {
    this.titleBGM.loop = true;
    this.lobbyBGM.loop = true;
    this.prepBGM.loop = true;
    this.battleBGM.loop = true;
    this.gachaBGM.loop = true;
    this.charBGM.loop = true;

    const savedVol = localStorage.getItem('game_master_volume');
    if (savedVol !== null) {
      this.masterVolume = parseFloat(savedVol);
    }
    this.applyAllVolumes();

    // Tự động tải danh sách nhạc combat từ MySQL
    this.loadCombatTracks();

    // CHỈ PHÁT NHẠC TIÊU ĐỀ NẾU MÀN HÌNH TITLE THỰC SỰ ĐANG MỞ
    const playMenuOnFirstClick = () => {
      const landing = document.getElementById('landingScreen');
      const isLandingVisible = landing && landing.style.display !== 'none' && !landing.classList.contains('fade-out');
      if (isLandingVisible && (!this.currentBGM || this.currentBGM === 'title')) {
        this.playTitleBGM();
      }
      window.removeEventListener('click', playMenuOnFirstClick);
    };
    window.addEventListener('click', playMenuOnFirstClick);

    setTimeout(() => {
      this.updateUI(this.masterVolume);
    }, 200);
  },

  // TẢI DANH SÁCH BÀI HÁT TỪ DATABASE (CÓ CẢ CỘT CATEGORY THƯỜNG / BOSS)
  async loadCombatTracks() {
    try {
      const res = await fetch('api.php?action=get_combat_musics');
      const d = await res.json();
      if (d.success && Array.isArray(d.data)) {
        this.combatTracks = d.data;
      }
    } catch (e) {
      console.warn("Lỗi tải danh mục nhạc combat:", e);
    }
  },

  // THIẾT LẬP ÂM LƯỢNG MƯỢT MÀ KHI KÉO THANH RANGE
  setMasterVolume(val) {
    const vol = Math.max(0, Math.min(100, parseInt(val) || 0)) / 100;
    this.masterVolume = vol;
    if (vol > 0) this.previousVolume = vol;

    localStorage.setItem('game_master_volume', vol);
    this.applyAllVolumes();
    this.updateUI(vol);

    if (vol > 0 && this.currentBGM) {
      this.resumeBGM();
    }
  },

  // ÁP DỤNG TRỰC TIẾP ÂM LƯỢNG CHO TẤT CẢ FILE AUDIO ĐANG CHẠY
  applyAllVolumes() {
    const factor = this.masterVolume / 0.5;

    this.titleBGM.volume = Math.min(1, Math.max(0, this.baseVolumes.title * factor));
    this.lobbyBGM.volume = Math.min(1, Math.max(0, this.baseVolumes.lobby * factor));
    this.prepBGM.volume = Math.min(1, Math.max(0, this.baseVolumes.prep * factor));
    this.gachaBGM.volume = Math.min(1, Math.max(0, this.baseVolumes.gacha * factor));
    this.charBGM.volume = Math.min(1, Math.max(0, this.baseVolumes.char * factor));
    this.parrySFX.volume = Math.min(1, Math.max(0, this.baseVolumes.parry * factor));
    this.critSFX.volume = Math.min(1, Math.max(0, this.baseVolumes.crit * factor));
    this.levelupSFX.volume = Math.min(1, Math.max(0, this.baseVolumes.levelup * factor));
    this.oneMoreSFX.volume = Math.min(1, Math.max(0, this.baseVolumes.onemore * factor));

    if (this.battleBGM) {
      const trackFactor = (this.currentBattleTrackVol || 100) / 100;
      this.battleBGM.volume = Math.min(1, Math.max(0, this.baseVolumes.battle * factor * trackFactor));
    }
  },

  updateUI(vol) {
    const slider = document.getElementById('volumeSlider');
    const text = document.getElementById('volumePercent');
    const icon = document.getElementById('volumeIcon');

    const pct = Math.round(vol * 100);
    if (slider) slider.value = pct;
    if (text) text.textContent = `${pct}%`;

    if (icon) {
      if (pct === 0) icon.textContent = '🔇';
      else if (pct < 50) icon.textContent = '🔉';
      else icon.textContent = '🔊';
    }
  },

  toggleQuickMute() {
    if (this.masterVolume > 0) {
      this.setMasterVolume(0);
    } else {
      this.setMasterVolume((this.previousVolume || 0.5) * 100);
    }
  },

  // DỪNG SẠCH TOÀN BỘ BGM VÀ ĐƯA CON TRỎ VỀ 0
  stopAllBGM() {
    [this.titleBGM, this.lobbyBGM, this.prepBGM, this.battleBGM, this.gachaBGM, this.charBGM].forEach(audio => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    this.currentBGM = null;
  },

  playTitleBGM() {
    if (this.currentBGM === 'title' && !this.titleBGM.paused) return;
    this.stopAllBGM();
    this.currentBGM = 'title';
    if (this.masterVolume > 0) {
      this.titleBGM.play().catch(() => {});
    }
  },

  playLobbyBGM() {
    if (this.currentBGM === 'lobby' && !this.lobbyBGM.paused) return;
    this.stopAllBGM();
    this.currentBGM = 'lobby';
    if (this.masterVolume > 0) {
      this.lobbyBGM.play().catch(() => {
        this.playTitleBGM();
      });
    }
  },

  playPrepBGM() {
    if (this.currentBGM === 'prep' && !this.prepBGM.paused) return;
    this.stopAllBGM();
    this.currentBGM = 'prep';
    if (this.masterVolume > 0) {
      this.prepBGM.play().catch(() => {
        this.lobbyBGM.play().catch(() => {});
      });
    }
  },

  // PHÁT NHẠC COMBAT: HỖ TRỢ RANDOM NHẠC THƯỜNG (BATTLE) VS RANDOM NHẠC BOSS
  playBattleBGM(bgmSetting = 'random_battle') {
    let chosenSrc = 'audio/battle.mp3';
    let chosenVol = 100;

    const isRandomMode = (!bgmSetting || bgmSetting === 'random' || bgmSetting === 'random_battle' || bgmSetting === 'random_boss');

    if (isRandomMode) {
      if (this.combatTracks.length > 0) {
        let pool = [];

        if (bgmSetting === 'random_boss') {
          // Lọc các bài nhạc Boss
          pool = this.combatTracks.filter(t => t.category === 'boss');
        } else {
          // Lọc các bài nhạc Thường (hoặc bài chưa gán category)
          pool = this.combatTracks.filter(t => t.category === 'battle' || !t.category);
        }

        // Dự phòng: nếu danh mục đó chưa có bài nào, lấy ngẫu nhiên trong toàn bộ bài đang có
        if (pool.length === 0) {
          pool = this.combatTracks;
        }

        const randTrack = pool[Math.floor(Math.random() * pool.length)];
        chosenSrc = randTrack.src;
        chosenVol = parseInt(randTrack.volume) || 100;
      }
    } else {
      // Chỉ định đích danh 1 bài hát theo đường dẫn file
      chosenSrc = bgmSetting;
      const found = this.combatTracks.find(t => t.src === bgmSetting);
      if (found) {
        chosenVol = parseInt(found.volume) || 100;
      }
    }

    // NẾU ĐANG PHÁT ĐÚNG BÀI NÀY THÌ GIỮ NGUYÊN, KHÔNG PHÁT ĐÈ TRÙNG LẶP
    if (this.currentBGM === 'battle' && this.battleBGM && !this.battleBGM.paused && this.currentBattleTrackSrc === chosenSrc) {
      return;
    }

    this.stopAllBGM();
    this.currentBGM = 'battle';
    this.currentBgmSetting = bgmSetting;
    this.currentBattleTrackVol = chosenVol;

    // TÁI SỬ DỤNG DUY NHẤT 1 ĐỐI TƯỢNG BATTLEBGM
    if (this.currentBattleTrackSrc !== chosenSrc || !this.battleBGM.src.includes(chosenSrc)) {
      this.battleBGM.src = chosenSrc;
      this.battleBGM.load();
      this.currentBattleTrackSrc = chosenSrc;
    }

    const factor = this.masterVolume / 0.5;
    const trackFactor = chosenVol / 100;
    this.battleBGM.volume = Math.min(1, Math.max(0, this.baseVolumes.battle * factor * trackFactor));

    if (this.masterVolume > 0) {
      this.battleBGM.play().catch(e => {
        if (chosenSrc !== 'audio/battle.mp3') {
          this.battleBGM.src = 'audio/battle.mp3';
          this.battleBGM.load();
          this.currentBattleTrackSrc = 'audio/battle.mp3';
          this.battleBGM.volume = Math.min(1, Math.max(0, this.baseVolumes.battle * factor));
          this.battleBGM.play().catch(() => {});
        }
      });
    }
  },

  playGachaBGM() {
    if (this.currentBGM === 'gacha' && !this.gachaBGM.paused) return;
    this.stopAllBGM();
    this.currentBGM = 'gacha';
    if (this.masterVolume > 0) {
      this.gachaBGM.play().catch(() => {});
    }
  },

  playCharBGM() {
    if (this.currentBGM === 'char' && !this.charBGM.paused) return;
    this.stopAllBGM();
    this.currentBGM = 'char';
    if (this.masterVolume > 0) {
      this.charBGM.play().catch(() => {
        this.playTitleBGM();
      });
    }
  },

  resumeBGM() {
    if (this.masterVolume <= 0 || !this.currentBGM) return;

    const bgmMap = {
      title: this.titleBGM,
      lobby: this.lobbyBGM,
      prep: this.prepBGM,
      battle: this.battleBGM,
      gacha: this.gachaBGM,
      char: this.charBGM
    };

    const currentAudio = bgmMap[this.currentBGM];
    if (currentAudio && currentAudio.paused) {
      currentAudio.play().catch(() => {});
    }
  },

  playParry() {
    if (this.masterVolume <= 0) return;
    this.parrySFX.currentTime = 0;
    this.parrySFX.play().catch(() => {});
  },

  playCrit() {
    if (this.masterVolume <= 0) return;
    this.critSFX.currentTime = 0;
    this.critSFX.play().catch(() => {});
  },

  playLevelUp() {
    if (this.masterVolume <= 0) return;
    this.levelupSFX.currentTime = 0;
    this.levelupSFX.play().catch(() => {});
  },

  playOneMore() {
    if (this.masterVolume <= 0) return;
    this.oneMoreSFX.currentTime = 0;
    this.oneMoreSFX.play().catch(() => {
      this.playParry();
    });
  }
};

SoundManager.init();