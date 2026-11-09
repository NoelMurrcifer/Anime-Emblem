/* ==========================================================================
   DUAL-ENGINE CO-OP NETWORKING (js/network.js) — BẢN NÂNG CẤP ĐỒNG BỘ TOÀN DIỆN
   - ĐỒNG BỘ THOÁT COMBAT (SYNC_BATTLE_END): CẢ 2 BÊN CÙNG THOÁT VỀ MAP, HẾT KẸT
   - ĐỒNG BỘ HỦY BƯỚC ĐI (UNIT_MOVE_CANCEL): TƯỚNG TỰ LÙI VỀ VỊ TRÍ CŨ TRÊN CẢ 2 MÁY
   - ĐỒNG BỘ XÁM MÀU (UNIT_ACTED) & KÍCH HOẠT QUÁI (TRIGGER_ENEMY_PHASE)
   - CỤM MÁY CHỦ SINGAPORE (EMQX) & GOOGLE STUN CHO TAILSCALE: PING THẤP, CỰC MƯỢT
   - CHỦ PHÒNG LÀM MÁY CHỦ DUY NHẤT (AUTHORITATIVE HOST): ĐỒNG BỘ QUÁI 100%
   ========================================================================== */

   const NetworkManager = {
    mode: 'webrtc',
    isHost: false,
    isCoopActive: false,
    roomCode: '',
    myPlayerId: '',
    myPlayerName: 'Chỉ Huy',
  
    players: [],
    mySlotIndex: 0,
    assignedUnitSlots: [0, 1],
    currentSubTurnIndex: 0,
  
    coopSquad: {},
    playerReadyStatus: {},
  
    peer: null,
    connections: [],
    hostConn: null,
  
    mqttClient: null,
    mqttTopic: '',
  
    // Cấu hình Google STUN Servers hỗ trợ kết nối qua Tailscale / LAN
    rtcConfig: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    },
  
    init() {
      this.myPlayerId = 'usr_' + Math.random().toString(36).substring(2, 9);
      try {
        const userDisplay = document.getElementById('userNameDisplay')?.textContent;
        if (userDisplay && !userDisplay.includes('Đang tải')) {
          this.myPlayerName = userDisplay.replace('👑', '').replace('👤', '').replace('(Admin)', '').trim();
        }
      } catch (e) {
        this.myPlayerName = 'Chỉ Huy ' + Math.floor(Math.random() * 100);
      }
    },
  
    generateRoomCode() {
      return Math.floor(1000 + Math.random() * 9000).toString();
    },
  
    createRoom(mode = 'webrtc') {
      try {
        this.init();
        this.mode = mode;
        this.isHost = true;
        this.roomCode = this.generateRoomCode();
        this.players = [{
          id: this.myPlayerId,
          name: this.myPlayerName,
          isHost: true,
          slotIndex: 0
        }];
        this.mySlotIndex = 0;
        this.coopSquad = {};
        this.playerReadyStatus = { [this.myPlayerId]: true };
  
        if (this.mode === 'webrtc') {
          if (typeof Peer === 'undefined') {
            alert('⚠️ Trình duyệt chưa tải được thư viện WebRTC (PeerJS)!\nHãy thử chuyển sang chế độ WebSocket.');
            return false;
          }
          this.initWebRTCHost();
        } else {
          if (typeof mqtt === 'undefined') {
            alert('⚠️ Trình duyệt chưa tải được thư viện WebSocket (MQTT)!\nHãy thử chuyển sang chế độ WebRTC.');
            return false;
          }
          this.initWebSocketClient();
        }
  
        this.updateLobbyUI();
        return true;
      } catch (err) {
        console.error('Lỗi khi tạo phòng:', err);
        alert('❌ Không thể khởi tạo phòng: ' + err.message);
        return false;
      }
    },
  
    joinRoom(mode = 'webrtc', code) {
      try {
        this.init();
        this.mode = mode;
        this.isHost = false;
        this.roomCode = code.trim().toUpperCase();
  
        if (this.mode === 'webrtc') {
          if (typeof Peer === 'undefined') {
            alert('⚠️ Chưa tải được thư viện WebRTC (PeerJS)!');
            return false;
          }
          this.initWebRTCGuest();
        } else {
          if (typeof mqtt === 'undefined') {
            alert('⚠️ Chưa tải được thư viện WebSocket (MQTT)!');
            return false;
          }
          this.initWebSocketClient();
        }
        return true;
      } catch (err) {
        alert('❌ Lỗi vào phòng: ' + err.message);
        return false;
      }
    },
  
    // ==========================================================================
    // 1. WEBRTC ENGINE (CÓ GOOGLE STUN CHO TAILSCALE / LAN)
    // ==========================================================================
    initWebRTCHost() {
      try {
        const peerId = 'anime-emblem-v2-' + this.roomCode;
        if (this.peer) this.peer.destroy();
  
        this.peer = new Peer(peerId, {
          debug: 1,
          config: this.rtcConfig
        });
  
        this.peer.on('open', (id) => {
          console.log('👑 [WebRTC Host] Đã mở phòng thành công qua STUN:', id);
          this.updateLobbyUI();
        });
  
        this.peer.on('connection', (conn) => {
          conn.on('open', () => {
            if (this.players.length >= 4) {
              conn.send({ type: 'ROOM_FULL' });
              setTimeout(() => conn.close(), 500);
              return;
            }
  
            this.connections.push(conn);
            conn.on('data', (data) => this.handleHostIncomingData(conn, data));
            conn.on('close', () => this.handleGuestDisconnect(conn));
          });
        });
  
        this.peer.on('error', (err) => {
          if (err.type === 'unavailable-id') {
            this.roomCode = this.generateRoomCode();
            this.initWebRTCHost();
          } else {
            console.warn('Cảnh báo WebRTC Host:', err);
          }
        });
      } catch (e) {
        console.error('Lỗi WebRTC Host:', e);
      }
    },
  
    initWebRTCGuest() {
      try {
        if (this.peer) this.peer.destroy();
  
        this.peer = new Peer({
          debug: 1,
          config: this.rtcConfig
        });
  
        this.peer.on('open', () => {
          const targetHostPeerId = 'anime-emblem-v2-' + this.roomCode;
          this.hostConn = this.peer.connect(targetHostPeerId, {
            reliable: true
          });
  
          this.hostConn.on('open', () => {
            console.log('🤝 [WebRTC Guest] Đã kết nối tới Chủ phòng qua Tailscale!');
            this.hostConn.send({
              type: 'GUEST_JOIN',
              playerId: this.myPlayerId,
              playerName: this.myPlayerName,
              senderId: this.myPlayerId
            });
          });
  
          this.hostConn.on('data', (data) => this.handleGuestIncomingData(data));
          this.hostConn.on('close', () => {
            alert('⚠️ Đã ngắt kết nối với Chủ phòng!');
            this.reset();
          });
        });
  
        this.peer.on('error', (err) => {
          if (err.type === 'peer-unavailable') {
            alert(`❌ Không tìm thấy phòng [${this.roomCode}]!\n\n👉 Hãy chắc chắn rằng Chủ phòng đã bấm "Tạo phòng" và đang ở trong phòng chờ.`);
          } else {
            console.warn('Lỗi PeerJS Guest:', err);
          }
        });
      } catch (e) {
        console.error('Lỗi WebRTC Guest:', e);
      }
    },
  
    // ==========================================================================
    // 2. WEBSOCKET ENGINE (DÙNG CLUSTER CHÂU Á SINGAPORE - PING ~35MS HẾT LAG)
    // ==========================================================================
    initWebSocketClient() {
      try {
        this.mqttTopic = `anime_emblem_asia/room_${this.roomCode}`;
        
        this.mqttClient = mqtt.connect('wss://broker.emqx.io:8084/mqtt', {
          clean: true,
          connectTimeout: 4000
        });
  
        this.mqttClient.on('connect', () => {
          console.log('⚡ [WebSocket EMQX Singapore] Đã kết nối máy chủ Châu Á! Topic:', this.mqttTopic);
          this.mqttClient.subscribe(this.mqttTopic);
  
          if (!this.isHost) {
            this.sendWS({
              type: 'GUEST_JOIN',
              playerId: this.myPlayerId,
              playerName: this.myPlayerName,
              senderId: this.myPlayerId
            });
          } else {
            this.updateLobbyUI();
          }
        });
  
        this.mqttClient.on('message', (topic, message) => {
          try {
            const packet = JSON.parse(message.toString());
            if (packet.senderId === this.myPlayerId) return;
  
            if (this.isHost) this.handleHostIncomingData(null, packet);
            else this.handleGuestIncomingData(packet);
          } catch (e) {
            console.warn('Lỗi đọc packet MQTT:', e);
          }
        });
  
        this.mqttClient.on('error', (err) => {
          console.warn('Lỗi MQTT broker:', err);
        });
      } catch (e) {
        console.error('Lỗi khởi động WebSocket MQTT:', e);
      }
    },
  
    sendWS(packet) {
      if (this.mqttClient && this.mqttClient.connected) {
        packet.senderId = this.myPlayerId;
        this.mqttClient.publish(this.mqttTopic, JSON.stringify(packet));
      }
    },
  
    handleHostIncomingData(conn, packet) {
      if (packet.senderId === this.myPlayerId) return;
  
      switch (packet.type) {
        case 'GUEST_JOIN':
          const newSlot = this.players.length;
          this.players.push({
            id: packet.playerId,
            name: packet.playerName,
            isHost: false,
            slotIndex: newSlot,
            conn: conn
          });
          this.playerReadyStatus[packet.playerId] = false;
          this.recalculateUnitAssignments();
          this.broadcastRoomState();
          this.updateLobbyUI();
          break;
  
        case 'COOP_PREP_PICK':
          this.coopSquad[packet.heroId] = {
            heroId: packet.heroId,
            playerId: packet.playerId,
            playerName: packet.playerName,
            slotIndex: packet.slotIndex,
            heroData: packet.heroData
          };
          this.broadcastSquadState();
          if (typeof renderPrepRoster === 'function') renderPrepRoster();
          break;
  
        case 'COOP_PREP_UNPICK':
          delete this.coopSquad[packet.heroId];
          this.broadcastSquadState();
          if (typeof renderPrepRoster === 'function') renderPrepRoster();
          break;
  
        case 'COOP_GUEST_READY':
          this.playerReadyStatus[packet.playerId] = packet.isReady;
          this.broadcastSquadState();
          if (typeof renderPrepRoster === 'function') renderPrepRoster();
          break;
  
        case 'TRIGGER_ENEMY_PHASE':
          if (typeof endMapTurn === 'function') {
            endMapTurn();
          }
          break;
  
        default:
          // Chuyển tiếp gói tin cho các máy khác nhưng không gửi ngược lại người gửi (chống dội lặp)
          this.broadcast(packet, conn);
          this.processGamePacket(packet);
          break;
      }
    },
  
    handleGuestIncomingData(packet) {
      if (packet.senderId === this.myPlayerId) return;
  
      switch (packet.type) {
        case 'ROOM_STATE':
          this.players = packet.players;
          const me = this.players.find(p => p.id === this.myPlayerId);
          if (me) this.mySlotIndex = me.slotIndex;
          this.recalculateUnitAssignments();
          this.updateLobbyUI();
          break;
  
        case 'COOP_OPEN_PREP':
          this.isCoopActive = true;
          if (typeof closeCoopModal === 'function') closeCoopModal();
          if (typeof coopOpenPrepScreen === 'function') coopOpenPrepScreen();
          break;
  
        case 'COOP_SQUAD_STATE':
          this.coopSquad = packet.coopSquad;
          this.playerReadyStatus = packet.playerReadyStatus;
          if (document.getElementById('prepModal')?.classList.contains('active')) {
            if (typeof renderPrepRoster === 'function') renderPrepRoster();
          }
          break;
  
        case 'COOP_DEPLOY_MATCH':
          this.isCoopActive = true;
          document.getElementById('prepModal')?.classList.remove('active');
          if (typeof syncStartCoopMatchFromHost === 'function') {
            syncStartCoopMatchFromHost(packet);
          }
          break;
  
        default:
          this.processGamePacket(packet);
          break;
      }
    },
  
    recalculateUnitAssignments() {
      const total = this.players.length;
      let distribution = [];
  
      if (total === 2) {
        distribution = [
          [0, 1], // Host: Tướng 1 + 2
          [2, 3]  // Khách: Tướng 3 + 4
        ];
      } else if (total === 3) {
        distribution = [
          [0, 1], // Host: Tướng 1 + 2
          [2],    // Khách 1: Tướng 3
          [3]     // Khách 2: Tướng 4
        ];
      } else {
        distribution = [
          [0], [1], [2], [3]
        ];
      }
  
      this.assignedUnitSlots = distribution[this.mySlotIndex] || [0];
    },
  
    getMyMaxPickCount() {
      return this.assignedUnitSlots.length;
    },
  
    getMyCurrentPickCount() {
      return Object.values(this.coopSquad).filter(x => x.playerId === this.myPlayerId).length;
    },
  
    broadcastRoomState() {
      const cleanPlayers = this.players.map(p => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        slotIndex: p.slotIndex
      }));
      this.broadcast({
        type: 'ROOM_STATE',
        players: cleanPlayers
      });
    },
  
    broadcastSquadState() {
      this.broadcast({
        type: 'COOP_SQUAD_STATE',
        coopSquad: this.coopSquad,
        playerReadyStatus: this.playerReadyStatus
      });
    },
  
    broadcast(packet, excludeConn = null) {
      packet.senderId = packet.senderId || this.myPlayerId;
      if (this.mode === 'webrtc') {
        this.connections.forEach(conn => {
          if (conn && conn.open && conn !== excludeConn) {
            conn.send(packet);
          }
        });
      } else {
        this.sendWS(packet);
      }
    },
  
    send(packet) {
      packet.senderId = this.myPlayerId;
      if (this.isHost) {
        this.broadcast(packet);
      } else {
        if (this.mode === 'webrtc') {
          if (this.hostConn && this.hostConn.open) this.hostConn.send(packet);
        } else {
          this.sendWS(packet);
        }
      }
    },
  
    processGamePacket(packet) {
      switch (packet.type) {
        case 'UNIT_MOVE':
          if (typeof syncRemoteUnitMove === 'function') {
            syncRemoteUnitMove(packet.unitId, packet.col, packet.row);
          }
          break;
  
        case 'UNIT_MOVE_CANCEL':
          // 🤝 Đồng bộ đưa tướng quay về ô cũ khi hủy di chuyển
          if (typeof syncRemoteUnitMoveCancel === 'function') {
            syncRemoteUnitMoveCancel(packet.unitId, packet.col, packet.row);
          }
          break;
  
        case 'UNIT_ACTED':
          if (typeof syncRemoteUnitActed === 'function') {
            syncRemoteUnitActed(packet.unitId);
          }
          break;
  
        case 'SUB_TURN_NEXT':
          this.currentSubTurnIndex = packet.nextPlayerIndex;
          if (typeof updateCoopTurnIndicator === 'function') updateCoopTurnIndicator();
          break;
  
        case 'PLAYER_PHASE_START':
          if (typeof syncRemotePlayerPhaseStart === 'function') {
            syncRemotePlayerPhaseStart();
          }
          break;
  
        case 'TRIGGER_ENEMY_PHASE':
          if (this.isHost && typeof endMapTurn === 'function') {
            endMapTurn();
          }
          break;
  
        case 'SYNC_COMBAT_TRIGGER':
          if (typeof syncRemoteBattleTrigger === 'function') {
            syncRemoteBattleTrigger(packet);
          }
          break;
  
        case 'SYNC_COMBAT_ACTION':
          if (typeof syncRemoteCombatAction === 'function') {
            syncRemoteCombatAction(packet);
          }
          break;
  
        case 'TRIGGER_QTE_TARGET':
          if (this.isMyUnit({ id: packet.targetUnitId, team: 'player' })) {
            if (typeof startQTE === 'function') {
              startQTE(packet.enemy, packet.target, packet.callback);
            }
          }
          break;
  
        case 'SYNC_BUFF_CHOICE':
          if (typeof syncRemoteBuffChoice === 'function') {
            syncRemoteBuffChoice(packet.buffId);
          }
          break;
  
        default:
          // Chuyển tiếp các gói tin của sàn đấu 4v4 sang combat.js
          if (typeof handleCombatNetworkPackets === 'function') {
            handleCombatNetworkPackets(packet);
          }
          break;
      }
    },
  
    isMyUnit(unit) {
      if (!this.isCoopActive) return true;
      if (!unit || unit.team !== 'player') return false;
  
      const item = Object.values(this.coopSquad).find(x => x.heroId === unit.id);
      if (item) return item.playerId === this.myPlayerId;
  
      const slotIdx = deployedHeroIds.indexOf(unit.id);
      return this.assignedUnitSlots.includes(slotIdx);
    },
  
    isMyTurnNow() {
      if (!this.isCoopActive) return true;
      if (mapPhase !== 'player') return false;
      return this.currentSubTurnIndex === this.mySlotIndex;
    },
  
    passTurnToNextPlayer() {
      if (!this.isMyTurnNow()) return;
  
      let nextIdx = this.currentSubTurnIndex + 1;
      if (nextIdx >= this.players.length) {
        this.currentSubTurnIndex = 0;
        this.send({ type: 'SUB_TURN_NEXT', nextPlayerIndex: 0 });
  
        if (this.isHost) {
          if (typeof endMapTurn === 'function') endMapTurn();
        } else {
          this.send({ type: 'TRIGGER_ENEMY_PHASE' });
        }
      } else {
        this.currentSubTurnIndex = nextIdx;
        this.send({ type: 'SUB_TURN_NEXT', nextPlayerIndex: nextIdx });
        if (typeof updateCoopTurnIndicator === 'function') updateCoopTurnIndicator();
      }
    },
  
    updateLobbyUI() {
      const codeEl = document.getElementById('coopRoomCodeDisplay');
      const listEl = document.getElementById('coopPlayersList');
      const btnStart = document.getElementById('btnStartCoopGame');
  
      if (codeEl) codeEl.textContent = this.roomCode || '----';
  
      if (listEl) {
        listEl.innerHTML = '';
        const total = this.players.length;
  
        this.players.forEach((p, idx) => {
          let slotDesc = '';
          if (total === 2) slotDesc = idx === 0 ? 'Tướng 1 & 2' : 'Tướng 3 & 4';
          else if (total === 3) slotDesc = idx === 0 ? 'Tướng 1 & 2' : (idx === 1 ? 'Tướng 3' : 'Tướng 4');
          else slotDesc = `Tướng ${idx + 1}`;
  
          const isMe = p.id === this.myPlayerId;
          const row = document.createElement('div');
          row.className = 'coop-player-row';
          row.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
              <div class="coop-player-badge">${p.isHost ? '👑' : '👤'}</div>
              <div>
                <strong style="color:${isMe ? 'var(--teal)' : '#fff'}">${p.name} ${isMe ? '(Bạn)' : ''}</strong>
                <div style="font-size:11px; color:var(--text-3);">${p.isHost ? 'Chủ Phòng (Host)' : 'Đồng Đội'}</div>
              </div>
            </div>
            <div class="coop-slot-badge">Điều khiển: <strong>${slotDesc}</strong></div>
          `;
          listEl.appendChild(row);
        });
      }
  
      if (btnStart) {
        btnStart.style.display = this.isHost ? 'inline-block' : 'none';
        btnStart.disabled = this.players.length < 2;
      }
    },
  
    reset() {
      this.isCoopActive = false;
      this.isHost = false;
      this.players = [];
      this.coopSquad = {};
      this.playerReadyStatus = {};
      if (this.peer) { this.peer.destroy(); this.peer = null; }
      if (this.mqttClient) { this.mqttClient.end(); this.mqttClient = null; }
    }
  };
  
  window.NetworkManager = NetworkManager;