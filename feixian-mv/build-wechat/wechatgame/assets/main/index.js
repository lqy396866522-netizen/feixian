System.register("chunks:///_virtual/CombatLoop.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "12e4foay7tCx7pnHN12oFZD", "CombatLoop", undefined);
      /**
       * 驱动自动战斗节奏（由 MainGame update 调用）
       */
      var CombatLoop = exports('CombatLoop', /*#__PURE__*/function () {
        function CombatLoop(model) {
          this.model = void 0;
          this.interval = 0.85;
          this.acc = 0;
          this.onTick = null;
          this.model = model;
        }
        var _proto = CombatLoop.prototype;
        _proto.update = function update(dt) {
          if (!this.model.save.autoBattle) return;
          this.acc += dt;
          if (this.acc < this.interval) return;
          this.acc = 0;
          var ev = this.model.combatTick();
          this.onTick && this.onTick(ev);
        };
        _proto.forceTick = function forceTick() {
          var ev = this.model.combatTick();
          this.onTick && this.onTick(ev);
          return ev;
        };
        return CombatLoop;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/GameModel.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameTypes.ts', './SaveSystem.ts'], function (exports) {
  var _createClass, cclegacy, monsterStats, goldDrop, lingshiDrop, materialDrop, equipDrop, killsNeededForStage, breakthroughExpNeed, breakthroughCost, REALM_NAMES, SLOT_LABELS, baseCombatPower, equipPowerBonus, STAGE_NAMES, SaveSystem;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      monsterStats = module.monsterStats;
      goldDrop = module.goldDrop;
      lingshiDrop = module.lingshiDrop;
      materialDrop = module.materialDrop;
      equipDrop = module.equipDrop;
      killsNeededForStage = module.killsNeededForStage;
      breakthroughExpNeed = module.breakthroughExpNeed;
      breakthroughCost = module.breakthroughCost;
      REALM_NAMES = module.REALM_NAMES;
      SLOT_LABELS = module.SLOT_LABELS;
      baseCombatPower = module.baseCombatPower;
      equipPowerBonus = module.equipPowerBonus;
      STAGE_NAMES = module.STAGE_NAMES;
    }, function (module) {
      SaveSystem = module.SaveSystem;
    }],
    execute: function () {
      cclegacy._RF.push({}, "bc206M7qCZP4qw6n5re4vqE", "GameModel", undefined);
      var GameModel = exports('GameModel', /*#__PURE__*/function () {
        function GameModel() {
          this.save = void 0;
          /** runtime combat */
          this.playerHp = 100;
          this.playerMaxHp = 100;
          this.monsterHp = 0;
          this.monsterMaxHp = 0;
          this.monsterAtk = 0;
          this.monsterName = '';
          this.lastLog = '';
          this.lastLoot = null;
          this.chestReady = false;
          this.dirty = false;
          this.save = SaveSystem.load();
          this.recalcPlayerHp();
          this.spawnMonster();
        }
        var _proto = GameModel.prototype;
        _proto.persist = function persist() {
          SaveSystem.save(this.save);
          this.dirty = false;
        };
        _proto.maybePersist = function maybePersist() {
          if (this.dirty) this.persist();
        };
        _proto.cnLayer = function cnLayer(n) {
          var _map$n;
          var map = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
          return (_map$n = map[n]) != null ? _map$n : String(n);
        };
        _proto.getItem = function getItem(id) {
          return this.save.inventory.find(function (i) {
            return i.id === id;
          });
        };
        _proto.getEquipped = function getEquipped(slot) {
          var id = this.save.equipped[slot];
          return id ? this.getItem(id) : undefined;
        };
        _proto.playerAtk = function playerAtk() {
          var atk = 20 + this.save.realmIndex * 8 + this.save.realmLayer * 2;
          atk += Math.floor(this.combatPower / 200);
          for (var _i = 0, _arr = Object.keys(SLOT_LABELS); _i < _arr.length; _i++) {
            var slot = _arr[_i];
            var it = this.getEquipped(slot);
            if (it) atk += it.atk;
          }
          return atk;
        };
        _proto.playerDef = function playerDef() {
          var d = 5 + this.save.realmIndex * 2;
          for (var _i2 = 0, _arr2 = Object.keys(SLOT_LABELS); _i2 < _arr2.length; _i2++) {
            var slot = _arr2[_i2];
            var it = this.getEquipped(slot);
            if (it) d += it.def;
          }
          return d;
        };
        _proto.recalcPlayerHp = function recalcPlayerHp() {
          this.playerMaxHp = 100 + this.save.realmIndex * 40 + this.save.realmLayer * 10 + this.playerDef() * 2;
          this.playerHp = Math.min(this.playerHp || this.playerMaxHp, this.playerMaxHp);
          if (this.playerHp <= 0) this.playerHp = this.playerMaxHp;
        };
        _proto.spawnMonster = function spawnMonster() {
          var m = monsterStats(this.save.stage);
          this.monsterMaxHp = m.hp;
          this.monsterHp = m.hp;
          this.monsterAtk = m.atk;
          this.monsterName = m.name;
        }

        /** one combat tick; returns events for UI */;
        _proto.combatTick = function combatTick() {
          var dodge = Math.random() < 0.08;
          var dmgToPlayer = 0;
          if (!dodge) {
            dmgToPlayer = Math.max(1, this.monsterAtk - Math.floor(this.playerDef() * 0.3));
            this.playerHp = Math.max(0, this.playerHp - dmgToPlayer);
          }
          var dmgToMonster = Math.max(1, this.playerAtk() + Math.floor(Math.random() * 10) - 3);
          this.monsterHp = Math.max(0, this.monsterHp - dmgToMonster);
          var killed = false;
          var cleared = false;
          if (this.monsterHp <= 0) {
            killed = true;
            this.onMonsterKilled();
            if (this.save.killsInStage >= this.save.killsNeeded) {
              cleared = true;
              this.chestReady = true;
            }
            this.spawnMonster();
            if (this.playerHp <= 0) {
              this.playerHp = this.playerMaxHp;
              this.lastLog = '重伤回阵，恢复生机…';
            }
          } else if (this.playerHp <= 0) {
            this.playerHp = this.playerMaxHp;
            this.lastLog = '重伤回阵，恢复生机…';
          }
          this.dirty = true;
          return {
            dmgToMonster: dmgToMonster,
            dmgToPlayer: dmgToPlayer,
            dodge: dodge,
            killed: killed,
            cleared: cleared
          };
        };
        _proto.onMonsterKilled = function onMonsterKilled() {
          var s = this.save;
          s.killsInStage += 1;
          s.stageProgress = Math.min(1, s.killsInStage / s.killsNeeded);
          var g = goldDrop(s.stage);
          s.gold += g;
          var ls = lingshiDrop(s.stage);
          if (ls) s.lingshi += ls;
          var mats = [];
          var mat = materialDrop(s.stage);
          if (mat) {
            s.materials[mat.id] = (s.materials[mat.id] || 0) + mat.n;
            mats.push(mat.name + 'x' + mat.n);
          }
          var eq = equipDrop(s.stage);
          if (eq) s.inventory.push(eq);
          s.realmExp += 1;
          this.lastLoot = {
            gold: g,
            lingshi: ls || 0,
            materials: mats,
            equip: eq,
            cleared: false
          };
          this.lastLog = '击杀 +' + g + '金' + (ls ? ' +' + ls + '灵石' : '') + (mats.length ? ' +' + mats.join(',') : '') + (eq ? ' 掉落[' + eq.name + ']' : '');
          this.persist();
        };
        _proto.advanceStage = function advanceStage() {
          this.save.stage += 1;
          this.save.killsInStage = 0;
          this.save.killsNeeded = killsNeededForStage(this.save.stage);
          this.save.stageProgress = 0;
          if (this.lastLoot) this.lastLoot.cleared = true;
          this.lastLog = '通关！进入 ' + this.stageTitle;
          this.persist();
        };
        _proto.breakthroughReady = function breakthroughReady() {
          var need = breakthroughExpNeed(this.save.realmIndex, this.save.realmLayer);
          var cost = breakthroughCost(this.save.realmIndex, this.save.realmLayer);
          return this.save.realmExp >= need && this.save.lingshi >= cost;
        };
        _proto.breakthroughProgress = function breakthroughProgress() {
          var need = breakthroughExpNeed(this.save.realmIndex, this.save.realmLayer);
          return Math.min(1, this.save.realmExp / need);
        };
        _proto.tryBreakthrough = function tryBreakthrough() {
          if (!this.breakthroughReady()) return false;
          var cost = breakthroughCost(this.save.realmIndex, this.save.realmLayer);
          this.save.lingshi -= cost;
          this.save.realmExp = 0;
          this.save.realmLayer += 1;
          if (this.save.realmLayer > 9) {
            this.save.realmLayer = 1;
            this.save.realmIndex = Math.min(this.save.realmIndex + 1, REALM_NAMES.length - 1);
          }
          this.recalcPlayerHp();
          this.lastLog = "\u7A81\u7834\u6210\u529F\uFF01" + this.realmText + " \u6218\u529B " + this.combatPower;
          this.persist();
          return true;
        };
        _proto.wear = function wear(itemId) {
          var item = this.getItem(itemId);
          if (!item) return false;
          this.save.equipped[item.slot] = item.id;
          this.recalcPlayerHp();
          this.lastLog = "\u7A7F\u6234 " + item.name;
          this.persist();
          return true;
        };
        _proto.tryOpenChest = function tryOpenChest() {
          if (!this.chestReady) return false;
          var s = this.save;
          var g = 30 + s.stage * 15;
          s.gold += g;
          var ls = 2 + Math.floor(s.stage / 2);
          s.lingshi += ls;
          var eq = equipDrop(s.stage + 1);
          if (eq) s.inventory.push(eq);
          this.lastLoot = {
            gold: g,
            lingshi: ls,
            materials: [],
            equip: eq,
            cleared: true
          };
          this.lastLog = "开宝箱 +" + g + "金 +" + ls + "灵石" + (eq ? " [" + eq.name + "]" : "");
          this.chestReady = false;
          this.advanceStage();
          this.persist();
          return true;
        };
        _proto.toggleAuto = function toggleAuto() {
          this.save.autoBattle = !this.save.autoBattle;
          this.persist();
        };
        _proto.fmtGold = function fmtGold(n) {
          if (n >= 10000) return ((n / 10000).toFixed(n >= 100000 ? 1 : 1) + "\u4E07").replace('.0万', '万');
          return String(n);
        };
        _proto.nextBreakthroughCost = function nextBreakthroughCost() {
          return breakthroughCost(this.save.realmIndex, this.save.realmLayer);
        };
        _proto.nextBreakthroughNeed = function nextBreakthroughNeed() {
          return breakthroughExpNeed(this.save.realmIndex, this.save.realmLayer);
        };
        _createClass(GameModel, [{
          key: "combatPower",
          get: function get() {
            var p = baseCombatPower(this.save.realmIndex, this.save.realmLayer);
            for (var _i3 = 0, _arr3 = Object.keys(SLOT_LABELS); _i3 < _arr3.length; _i3++) {
              var slot = _arr3[_i3];
              var id = this.save.equipped[slot];
              if (!id) continue;
              p += equipPowerBonus(this.getItem(id));
            }
            return Math.floor(p);
          }
        }, {
          key: "realmText",
          get: function get() {
            var name = REALM_NAMES[Math.min(this.save.realmIndex, REALM_NAMES.length - 1)];
            return name + "\xB7" + this.cnLayer(this.save.realmLayer) + "\u5C42";
          }
        }, {
          key: "stageTitle",
          get: function get() {
            var idx = (this.save.stage - 1) % STAGE_NAMES.length;
            return this.save.stage + "-" + STAGE_NAMES[idx];
          }
        }]);
        return GameModel;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/GameTypes.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports({
        baseCombatPower: baseCombatPower,
        breakthroughCost: breakthroughCost,
        breakthroughExpNeed: breakthroughExpNeed,
        createNewSave: createNewSave,
        defaultInventory: defaultInventory,
        equipDrop: equipDrop,
        equipPowerBonus: equipPowerBonus,
        goldDrop: goldDrop,
        killsNeededForStage: killsNeededForStage,
        lingshiDrop: lingshiDrop,
        materialDrop: materialDrop,
        monsterStats: monsterStats,
        stageCoef: stageCoef
      });
      cclegacy._RF.push({}, "d12606mWDhGz7KL9eOFOQKd", "GameTypes", undefined);
      /**
       * 飞仙 MVP 数值与类型表（本地）
       */
      var SLOT_LABELS = exports('SLOT_LABELS', {
        weapon: '武器',
        armor: '铠甲',
        helmet: '头盔',
        boots: '靴子',
        accessory: '饰品',
        artifact: '法宝'
      });
      var REALM_NAMES = exports('REALM_NAMES', ['炼气期前期', '炼气期中期', '炼气期后期', '筑基期前期', '筑基期中期', '筑基期后期', '金丹期前期']);
      var STAGE_NAMES = exports('STAGE_NAMES', ['清萍原野', '雾隐林', '碎石坡', '碧湖泽', '玄风谷', '赤炎原', '寒霜岭', '幽冥径', '天梯崖', '仙门前']);

      /** 怪物基础数值（再乘关卡系数） */
      function monsterStats(stage) {
        var coef = stageCoef(stage);
        return {
          hp: Math.floor(80 * coef),
          atk: Math.floor(8 * coef),
          name: "\u91CE\u5916\u602A\xB7" + stage
        };
      }
      function stageCoef(stage) {
        return 1 + (Math.max(1, stage) - 1) * 0.35;
      }
      function killsNeededForStage(stage) {
        return 5 + Math.floor((stage - 1) * 1.5);
      }
      function goldDrop(stage) {
        return Math.floor(12 + stage * 6 + Math.random() * 8);
      }
      function lingshiDrop(stage) {
        return Math.random() < 0.35 ? Math.floor(1 + stage * 0.4) : 0;
      }
      function materialDrop(stage) {
        if (Math.random() > 0.25) return null;
        var table = [{
          id: 'mat_grass',
          name: '清萍草'
        }, {
          id: 'mat_ore',
          name: '玄铁矿'
        }, {
          id: 'mat_wood',
          name: '灵木屑'
        }];
        var t = table[Math.floor(Math.random() * table.length)];
        return {
          id: t.id,
          name: t.name,
          n: 1 + (stage > 5 ? 1 : 0)
        };
      }

      /** 突破所需灵石 */
      function breakthroughCost(realmIndex, realmLayer) {
        return 20 + realmIndex * 15 + realmLayer * 8;
      }

      /** 突破所需经验（击杀填充） */
      function breakthroughExpNeed(realmIndex, realmLayer) {
        return 2 + realmIndex + Math.floor(realmLayer / 2);
      }
      function baseCombatPower(realmIndex, realmLayer) {
        return 5000 + realmIndex * 800 + realmLayer * 120;
      }
      function equipPowerBonus(item) {
        if (!item) return 0;
        return item.atk * 8 + item.def * 6 + item.spd * 5 + item.spirit * 4;
      }
      function defaultInventory() {
        return [{
          id: 'eq_sword1',
          name: '青锋剑',
          slot: 'weapon',
          quality: '蓝',
          atk: 45,
          def: 0,
          spd: 0,
          spirit: 0
        }, {
          id: 'eq_cloth1',
          name: '布衣',
          slot: 'armor',
          quality: '白',
          atk: 0,
          def: 12,
          spd: 0,
          spirit: 0
        }, {
          id: 'eq_boots1',
          name: '疾风靴',
          slot: 'boots',
          quality: '绿',
          atk: 0,
          def: 0,
          spd: 8,
          spirit: 0
        }, {
          id: 'eq_ring1',
          name: '聚灵戒',
          slot: 'accessory',
          quality: '蓝',
          atk: 0,
          def: 0,
          spd: 0,
          spirit: 20
        }, {
          id: 'eq_sword2',
          name: '铁剑',
          slot: 'weapon',
          quality: '白',
          atk: 18,
          def: 0,
          spd: 0,
          spirit: 0
        }, {
          id: 'eq_helm1',
          name: '皮帽',
          slot: 'helmet',
          quality: '白',
          atk: 0,
          def: 8,
          spd: 0,
          spirit: 0
        }];
      }

      /** 野怪掉装备（约 18%），品质随关卡略提升 */
      function equipDrop(stage) {
        if (Math.random() > 0.18) return null;
        var slots = ['weapon', 'armor', 'helmet', 'boots', 'accessory', 'artifact'];
        var slot = slots[Math.floor(Math.random() * slots.length)];
        var qualityRoll = Math.random() + stage * 0.02;
        var quality = qualityRoll > 0.92 ? '橙' : qualityRoll > 0.7 ? '紫' : qualityRoll > 0.4 ? '蓝' : '白';
        var mult = quality === '橙' ? 3.2 : quality === '紫' ? 2.2 : quality === '蓝' ? 1.5 : 1;
        var base = 8 + stage * 3;
        var names = {
          weapon: ['铁剑', '青锋', '霜刃', '灵钩'],
          armor: ['布甲', '皮甲', '玄甲', '云纹袍'],
          helmet: ['皮帽', '铁盔', '灵冠'],
          boots: ['布靴', '疾风靴', '云步履'],
          accessory: ['木戒', '玉佩', '聚灵环'],
          artifact: ['木符', '聚气珠', '护心镜']
        };
        var pool = names[slot];
        var name = pool[Math.floor(Math.random() * pool.length)];
        var id = 'drop_' + slot + '_' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 999);
        var atk = slot === 'weapon' ? Math.floor(base * mult) : Math.floor(base * 0.15 * mult);
        var def = slot === 'armor' || slot === 'helmet' ? Math.floor(base * 0.5 * mult) : Math.floor(base * 0.1 * mult);
        var spd = slot === 'boots' ? Math.floor(base * 0.4 * mult) : 0;
        var spirit = slot === 'accessory' || slot === 'artifact' ? Math.floor(base * 0.6 * mult) : 0;
        return {
          id: id,
          name: quality + '·' + name,
          slot: slot,
          quality: quality,
          atk: atk,
          def: def,
          spd: spd,
          spirit: spirit
        };
      }
      function createNewSave() {
        var inv = defaultInventory();
        return {
          version: 1,
          gold: 125000,
          lingshi: 830,
          xianyu: 56,
          stage: 2,
          stageProgress: 0,
          killsInStage: 0,
          killsNeeded: killsNeededForStage(2),
          realmIndex: 0,
          realmLayer: 2,
          realmExp: 0,
          autoBattle: true,
          inventory: inv,
          equipped: {
            weapon: 'eq_sword1',
            armor: 'eq_cloth1',
            boots: 'eq_boots1',
            accessory: 'eq_ring1'
          },
          materials: {
            mat_grass: 3,
            mat_ore: 1
          },
          playerName: '玩家昵称'
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/main", ['./CombatLoop.ts', './GameModel.ts', './GameTypes.ts', './MainGame.ts', './SaveSystem.ts'], function () {
  return {
    setters: [null, null, null, null, null],
    execute: function () {}
  };
});

System.register("chunks:///_virtual/MainGame.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameModel.ts', './CombatLoop.ts', './GameTypes.ts'], function (exports) {
  var _inheritsLoose, _createForOfIteratorHelperLoose, cclegacy, _decorator, Color, view, ResolutionPolicy, Node, UITransform, Graphics, Label, Overflow, Button, Sprite, resources, Texture2D, SpriteFrame, ImageAsset, Component, GameModel, CombatLoop, SLOT_LABELS;
  return {
    setters: [function (module) {
      _inheritsLoose = module.inheritsLoose;
      _createForOfIteratorHelperLoose = module.createForOfIteratorHelperLoose;
    }, function (module) {
      cclegacy = module.cclegacy;
      _decorator = module._decorator;
      Color = module.Color;
      view = module.view;
      ResolutionPolicy = module.ResolutionPolicy;
      Node = module.Node;
      UITransform = module.UITransform;
      Graphics = module.Graphics;
      Label = module.Label;
      Overflow = module.Overflow;
      Button = module.Button;
      Sprite = module.Sprite;
      resources = module.resources;
      Texture2D = module.Texture2D;
      SpriteFrame = module.SpriteFrame;
      ImageAsset = module.ImageAsset;
      Component = module.Component;
    }, function (module) {
      GameModel = module.GameModel;
    }, function (module) {
      CombatLoop = module.CombatLoop;
    }, function (module) {
      SLOT_LABELS = module.SLOT_LABELS;
    }],
    execute: function () {
      var _dec, _class;
      cclegacy._RF.push({}, "144baLlG31HJJFuB3CQ2vS3", "MainGame", undefined);
      var ccclass = _decorator.ccclass;
      var UI_2D = 33554432;
      var DESIGN_W = 720;
      var DESIGN_H = 1280;
      var CHAR_SIZE = 180; // ~25% of design width 720

      var EQUIP_ICON = {
        weapon: 'textures/icons/equip_weapon',
        armor: 'textures/icons/equip_armor',
        helmet: 'textures/icons/equip_helm',
        boots: 'textures/icons/equip_boots',
        accessory: 'textures/icons/equip_ring',
        artifact: 'textures/icons/equip_gloves'
      };
      var C = {
        grass: new Color(168, 196, 140, 255),
        grassDk: new Color(140, 168, 112, 255),
        sky: new Color(196, 220, 196, 255),
        navy: new Color(26, 42, 68, 255),
        navy2: new Color(36, 56, 88, 255),
        gold: new Color(212, 168, 72, 255),
        goldLt: new Color(240, 210, 130, 255),
        red: new Color(220, 64, 64, 255),
        disabled: new Color(148, 152, 160, 255),
        disabledBg: new Color(210, 214, 220, 255),
        primary: new Color(72, 140, 220, 255),
        ok: new Color(72, 176, 120, 255),
        white: new Color(255, 255, 255, 255),
        ink: new Color(32, 40, 52, 255),
        inkMuted: new Color(100, 110, 124, 255),
        panel: new Color(255, 255, 255, 240),
        hero: new Color(72, 140, 220, 255),
        monster: new Color(220, 80, 80, 255),
        chat: new Color(40, 48, 60, 200),
        hot: new Color(220, 90, 50, 255)
      };
      var MainGame = exports('MainGame', (_dec = ccclass('MainGame'), _dec(_class = /*#__PURE__*/function (_Component) {
        _inheritsLoose(MainGame, _Component);
        function MainGame() {
          var _this;
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          _this = _Component.call.apply(_Component, [this].concat(args)) || this;
          _this.model = void 0;
          _this.loop = void 0;
          _this.uiLayer = UI_2D;
          _this.root = void 0;
          _this.tab = 'play';
          _this.lblGold = void 0;
          _this.lblLing = void 0;
          _this.lblJade = void 0;
          _this.lblPower = void 0;
          _this.lblTopPower = void 0;
          _this.lootPanel = void 0;
          _this.lblLoot = void 0;
          _this.lootTimer = 0;
          _this.lblRealm = void 0;
          _this.lblName = void 0;
          _this.lblStage = void 0;
          _this.lblStageProg = void 0;
          _this.lblHeroHp = void 0;
          _this.lblMonHp = void 0;
          _this.lblMonName = void 0;
          _this.lblFloat = void 0;
          _this.lblChat = void 0;
          _this.lblAuto = void 0;
          _this.lblBreak = void 0;
          _this.lblBreakCost = void 0;
          _this.barStageFill = void 0;
          _this.barBreakFill = void 0;
          _this.playRoot = void 0;
          _this.equipRoot = void 0;
          _this.spellsRoot = void 0;
          _this.chestBtn = void 0;
          _this.lblChest = void 0;
          _this.skillCd = 0;
          _this.heroNode = void 0;
          _this.mobNode = void 0;
          _this.grayToast = void 0;
          _this.toastTimer = 0;
          _this.floatTimer = 0;
          _this.persistAcc = 0;
          _this.tabDots = {};
          _this.tabLabels = {};
          _this.selectedItemId = null;
          _this.lblEquipPower = void 0;
          _this.equipListNode = void 0;
          _this.slotLabels = {};
          _this.wearBtnLabel = void 0;
          return _this;
        }
        var _proto = MainGame.prototype;
        _proto.onLoad = function onLoad() {
          var _this2 = this;
          view.setDesignResolutionSize(DESIGN_W, DESIGN_H, ResolutionPolicy.FIXED_HEIGHT);
          this.uiLayer = this.node.layer || UI_2D;
          this.model = new GameModel();
          this.loop = new CombatLoop(this.model);
          this.loop.onTick = function (ev) {
            return _this2.onCombat(ev);
          };
          this.buildUI();
          this.refreshAll();
          console.log('[MainGame] 飞仙 MVP 启动, 战力=', this.model.combatPower, '关卡=', this.model.stageTitle);
        };
        _proto.onDestroy = function onDestroy() {
          this.model && this.model.persist();
        };
        _proto.update = function update(dt) {
          this.loop.update(dt);
          if (this.skillCd > 0) this.skillCd -= dt;
          if (this.chestBtn) this.chestBtn.active = !!this.model.chestReady;
          if (this.lootTimer > 0) {
            this.lootTimer -= dt;
            if (this.lootTimer <= 0 && this.lootPanel) this.lootPanel.active = false;
          }
          this.persistAcc += dt;
          if (this.persistAcc > 4) {
            this.persistAcc = 0;
            this.model.maybePersist();
          }
          if (this.toastTimer > 0) {
            this.toastTimer -= dt;
            if (this.toastTimer <= 0 && this.grayToast) this.grayToast.node.active = false;
          }
          if (this.floatTimer > 0) {
            this.floatTimer -= dt;
            if (this.floatTimer <= 0 && this.lblFloat) this.lblFloat.string = '';
          }
        };
        _proto.onCombat = function onCombat(ev) {
          if (ev.dodge) {
            this.showFloat('闪避', C.ok);
          } else if (ev.dmgToMonster > 0) {
            this.showFloat("-" + ev.dmgToMonster, C.red);
          }
          // P3: show loot panel on every kill (not only chest open)
          if (ev.killed) {
            this.showLootPanel(!!ev.cleared);
            this.refreshAll();
          } else if (ev.cleared) {
            this.refreshAll();
          } else {
            this.refreshCombatHud();
          }
        };
        _proto.showFloat = function showFloat(text, color) {
          if (!this.lblFloat) return;
          this.lblFloat.string = text;
          this.lblFloat.color = color;
          this.floatTimer = 0.7;
        };
        _proto.showToast = function showToast(msg) {
          if (!this.grayToast) return;
          this.grayToast.string = msg;
          this.grayToast.node.active = true;
          this.toastTimer = 1.4;
        }

        // ---------- builders ----------
        ;

        _proto.mk = function mk(name, parent, w, h, x, y) {
          var n = new Node(name);
          n.layer = this.uiLayer;
          n.parent = parent;
          var ui = n.addComponent(UITransform);
          ui.setContentSize(w, h);
          ui.setAnchorPoint(0.5, 0.5);
          n.setPosition(x, y, 0);
          return n;
        };
        _proto.fill = function fill(n, color, r) {
          if (r === void 0) {
            r = 12;
          }
          var g = n.getComponent(Graphics);
          if (!g) g = n.addComponent(Graphics);
          g.clear();
          g.fillColor = color;
          var ui = n.getComponent(UITransform);
          var w = ui.width,
            h = ui.height;
          g.roundRect(-w / 2, -h / 2, w, h, r);
          g.fill();
          return g;
        };
        _proto.circle = function circle(n, color, radius) {
          var g = n.getComponent(Graphics);
          if (!g) g = n.addComponent(Graphics);
          g.clear();
          g.fillColor = color;
          var ui = n.getComponent(UITransform);
          var rad = radius != null ? radius : Math.min(ui.width, ui.height) / 2;
          g.circle(0, 0, rad);
          g.fill();
          return g;
        };
        _proto.label = function label(parent, text, size, color, x, y, w, h, bold) {
          if (w === void 0) {
            w = 200;
          }
          if (h === void 0) {
            h = 40;
          }
          if (bold === void 0) {
            bold = false;
          }
          var n = this.mk('lbl', parent, w, h, x, y);
          var l = n.addComponent(Label);
          l.string = text;
          l.fontSize = size;
          l.lineHeight = size + 4;
          l.color = color;
          l.overflow = Overflow.SHRINK;
          l.enableWrapText = false;
          l.isBold = bold;
          l.horizontalAlign = Label.HorizontalAlign.CENTER;
          l.verticalAlign = Label.VerticalAlign.CENTER;
          return l;
        };
        _proto.click = function click(n, fn) {
          var btn = n.getComponent(Button);
          if (!btn) btn = n.addComponent(Button);
          btn.transition = Button.Transition.SCALE;
          btn.zoomScale = 0.96;
          n.on(Button.EventType.CLICK, fn, this);
          n.on(Node.EventType.TOUCH_END, fn, this);
          return btn;
        };
        _proto.buildUI = function buildUI() {
          // Canvas-sized root (Creator Canvas is 720x1280 after settings)
          var canvasUi = this.node.getComponent(UITransform);
          if (canvasUi) canvasUi.setContentSize(DESIGN_W, DESIGN_H);
          this.root = this.mk('Root', this.node, DESIGN_W, DESIGN_H, 0, 0);
          this.fill(this.root, C.sky, 0);
          this.playRoot = this.mk('PlayRoot', this.root, DESIGN_W, DESIGN_H, 0, 0);
          this.spellsRoot = this.mk('SpellsRoot', this.root, DESIGN_W, DESIGN_H - 200, 0, 20);
          this.spellsRoot.active = false;
          this.equipRoot = this.mk('EquipRoot', this.root, DESIGN_W, DESIGN_H, 0, 0);
          this.equipRoot.active = false;
          this.buildPlay();
          this.buildSpells();
          this.buildChestBtn();
          this.buildEquip();
          this.buildTopBar();
          this.buildTabBar();
          this.grayToast = this.label(this.root, '', 22, C.white, 0, 80, 520, 56, true);
          this.fill(this.grayToast.node, C.navy, 16);
          this.grayToast.node.active = false;
          this.grayToast.node.setSiblingIndex(999);
          this.buildLootPanel();
        };
        _proto.buildLootPanel = function buildLootPanel() {
          this.lootPanel = this.mk('LootPanel', this.root, 520, 220, 0, 40);
          this.fill(this.lootPanel, new Color(20, 28, 40, 235), 16);
          this.lblLoot = this.label(this.lootPanel, '', 22, C.white, 0, 10, 480, 180, true);
          this.lblLoot.overflow = Overflow.CLAMP;
          this.lootPanel.active = false;
          this.lootPanel.setSiblingIndex(998);
        };
        _proto.showLootPanel = function showLootPanel(cleared) {
          var loot = this.model.lastLoot;
          if (!loot) return;
          var lines = [cleared ? '【通关结算】' : '【击杀掉落】', '金币 +' + loot.gold, loot.lingshi ? '灵石 +' + loot.lingshi : '', loot.materials.length ? '材料 ' + loot.materials.join('、') : '', loot.equip ? '装备 [' + loot.equip.name + ']' : '（未掉装备）'].filter(Boolean);
          this.lblLoot.string = lines.join('\n');
          this.lootPanel.active = true;
          this.lootTimer = 2.4;
        };
        _proto.buildTopBar = function buildTopBar() {
          var bar = this.mk('TopBar', this.root, 700, 70, 0, 590);
          this.fill(bar, new Color(26, 42, 68, 210), 18);
          var goldP = this.mk('goldP', bar, 200, 44, -230, 0);
          this.fill(goldP, C.navy2, 16);
          var goldIcon = this.mk('goldIcon', goldP, 36, 36, -70, 0);
          this.loadSprite(goldIcon, 'textures/icons/res_gold', 36, 36, false);
          this.lblGold = this.label(goldP, '金 0', 20, C.goldLt, 0, 0, 190, 40, true);
          var lingP = this.mk('lingP', bar, 180, 44, 0, 0);
          this.fill(lingP, C.navy2, 16);
          this.lblLing = this.label(lingP, '灵石 0', 20, C.goldLt, 0, 0, 170, 40, true);
          var jadeP = this.mk('jadeP', bar, 140, 44, 160, 0);
          this.fill(jadeP, C.navy2, 16);
          this.lblJade = this.label(jadeP, '仙玉 0', 20, C.goldLt, 0, 0, 130, 40, true);
          var powP = this.mk('powP', bar, 150, 44, 300, 0);
          this.fill(powP, C.navy2, 16);
          this.lblTopPower = this.label(powP, '战力 0', 20, C.hot, 0, 0, 140, 40, true);
        };
        _proto.buildPlay = function buildPlay() {
          var _this3 = this;
          var r = this.playRoot;
          var field = this.mk('Field', r, DESIGN_W, 760, 0, 80);
          this.fill(field, C.grass, 0);
          // hills
          var hill = this.mk('hill', field, 420, 180, -160, -220);
          this.circle(hill, C.grassDk, 160);
          var hill2 = this.mk('hill2', field, 480, 180, 180, -240);
          this.circle(hill2, new Color(140, 168, 112, 180), 170);
          var cave = this.mk('cave', field, 200, 120, 0, 180);
          this.fill(cave, new Color(120, 130, 120, 255), 20);
          this.label(cave, '洞口/景', 20, C.white, 0, 0, 180, 40);

          // player info
          var info = this.mk('info', r, 340, 110, -170, 500);
          var av = this.mk('avatar', info, 72, 72, -120, 8);
          this.circle(av, C.navy);
          this.label(av, '头像', 16, C.white, 0, 0, 70, 30);
          this.lblName = this.label(info, '玩家昵称', 22, C.ink, 40, 28, 220, 32, true);
          this.lblName.horizontalAlign = Label.HorizontalAlign.LEFT;
          this.lblPower = this.label(info, '战力 0', 22, C.red, 40, -2, 220, 30, true);
          this.lblPower.horizontalAlign = Label.HorizontalAlign.LEFT;
          this.lblRealm = this.label(info, '炼气期', 18, C.inkMuted, 40, -32, 240, 28);
          this.lblRealm.horizontalAlign = Label.HorizontalAlign.LEFT;
          this.lblStage = this.label(r, '2-清萍原野', 28, C.ink, 0, 430, 400, 40, true);
          var stageBar = this.mk('stageBar', r, 420, 18, 0, 400);
          this.fill(stageBar, new Color(255, 255, 255, 180), 9);
          this.barStageFill = this.mk('stageFill', stageBar, 200, 14, -110, 0);
          this.fill(this.barStageFill, C.gold, 7);
          this.lblStageProg = this.label(r, '0/5', 16, C.ink, 240, 400, 80, 24);

          // combatants — foot-anchored sprites; placeholder circles on child until load
          var heroY = 30; // feet ~10px lower toward platform
          this.heroNode = this.mk('hero', r, CHAR_SIZE, CHAR_SIZE, -160, heroY);
          this.heroNode.getComponent(UITransform).setAnchorPoint(0.5, 0);
          var heroPh = this.mk('heroPh', this.heroNode, CHAR_SIZE, CHAR_SIZE, 0, CHAR_SIZE / 2);
          this.circle(heroPh, C.hero);
          this.loadSprite(this.heroNode, 'textures/chars/hero', CHAR_SIZE, CHAR_SIZE, true);
          this.label(this.heroNode, '主角Q', 16, C.white, 0, CHAR_SIZE + 28, 120, 28, true);
          this.lblHeroHp = this.label(r, 'HP', 18, C.ink, -160, heroY - 24, 160, 28);
          this.mobNode = this.mk('mon', r, CHAR_SIZE, CHAR_SIZE, 160, heroY);
          this.mobNode.getComponent(UITransform).setAnchorPoint(0.5, 0);
          var mobPh = this.mk('mobPh', this.mobNode, CHAR_SIZE, CHAR_SIZE, 0, CHAR_SIZE / 2);
          this.circle(mobPh, C.monster);
          this.loadSprite(this.mobNode, 'textures/chars/mob_bird', CHAR_SIZE, CHAR_SIZE, true);
          this.lblMonName = this.label(this.mobNode, '野外怪', 16, C.white, 0, CHAR_SIZE + 28, 120, 28, true);
          this.lblMonHp = this.label(r, 'HP', 18, C.ink, 160, heroY - 24, 160, 28);
          this.lblFloat = this.label(r, '', 28, C.red, 160, 160, 160, 40, true);

          // side buttons
          var sideY = [220, 130, 40];
          var sideT = ['礼包', '菜单', '装备'];
          sideT.forEach(function (t, i) {
            var b = _this3.mk('side' + t, r, 70, 70, 300, sideY[i]);
            _this3.circle(b, C.navy2);
            _this3.label(b, t, 18, C.white, 0, 0, 66, 28, true);
            if (t === '装备') _this3.click(b, function () {
              return _this3.setTab('equip');
            });else _this3.click(b, function () {
              return _this3.showToast('MVP 未开放');
            });
          });

          // auto battle
          var auto = this.mk('auto', r, 100, 100, -280, -160);
          this.circle(auto, C.gold);
          this.lblAuto = this.label(auto, '自动开', 22, C.navy, 0, 0, 90, 40, true);
          this.click(auto, function () {
            _this3.model.toggleAuto();
            _this3.refreshAll();
          });

          // gray skills
          ['技能', '召唤', '增益'].forEach(function (t, i) {
            var b = _this3.mk('sk' + t, r, 64, 64, 40 + i * 80, -170);
            _this3.circle(b, C.disabledBg);
            _this3.label(b, t, 16, C.disabled, 0, 0, 60, 24);
            _this3.click(b, function () {
              return _this3.showToast('法术/召唤未开放');
            });
          });

          // breakthrough bar
          var br = this.mk('breakBar', r, 680, 70, 0, -260);
          this.fill(br, C.navy, 16);
          this.label(br, '境界', 20, C.goldLt, -280, 0, 70, 30, true);
          this.barBreakFill = this.mk('bfill', br, 320, 22, -40, 0);
          this.fill(this.barBreakFill, C.ok, 8);
          this.lblBreak = this.label(br, '突破', 18, C.white, -40, 0, 360, 30);
          this.lblBreakCost = this.label(br, '灵石20', 18, C.goldLt, 250, 0, 140, 30, true);
          this.click(br, function () {
            var ok = _this3.model.tryBreakthrough();
            if (!ok) _this3.showToast('灵石或进度不足');
            _this3.refreshAll();
          });
          var chat = this.mk('chat', r, 680, 36, 0, -320);
          this.fill(chat, C.chat, 8);
          this.lblChat = this.label(chat, '[世界] 有道友正在清萍原野修炼…', 16, C.white, 0, 0, 660, 30);
          this.lblChat.horizontalAlign = Label.HorizontalAlign.LEFT;
        };
        _proto.buildEquip = function buildEquip() {
          var _this4 = this;
          var r = this.equipRoot;
          this.fill(this.mk('eqBg', r, DESIGN_W, DESIGN_H, 0, 0), new Color(230, 236, 244, 255), 0);
          var power = this.mk('eqPower', r, 680, 70, 0, 500);
          this.fill(power, C.navy, 16);
          this.lblEquipPower = this.label(power, '战力 0', 26, C.goldLt, 0, 0, 640, 50, true);
          var doll = this.mk('doll', r, 680, 280, 0, 300);
          this.fill(doll, C.white, 18);
          this.label(doll, '人偶槽位', 20, C.inkMuted, 0, 120, 200, 28);
          var hero = this.mk('eqHero', doll, 100, 100, 0, 10);
          this.circle(hero, C.hero);
          this.label(hero, '主角', 22, C.white, 0, 0, 90, 30, true);

          // design: icon ~76% slotH, row gap tightened ~10px, icon-text gap 8px
          var SLOT_H = 56;
          var ICON = Math.round(SLOT_H * 0.76); // ~43
          var slots = [{
            slot: 'weapon',
            x: -220,
            y: 60
          }, {
            slot: 'armor',
            x: -220,
            y: 0
          }, {
            slot: 'accessory',
            x: -220,
            y: -60
          }, {
            slot: 'helmet',
            x: 220,
            y: 60
          }, {
            slot: 'boots',
            x: 220,
            y: 0
          }, {
            slot: 'artifact',
            x: 220,
            y: -60
          }];
          slots.forEach(function (s) {
            var box = _this4.mk('slot' + s.slot, doll, 160, SLOT_H, s.x, s.y);
            _this4.fill(box, new Color(236, 240, 246, 255), 10);
            var iconX = -52;
            var icon = _this4.mk('ico' + s.slot, box, ICON, ICON, iconX, 0);
            _this4.loadSprite(icon, EQUIP_ICON[s.slot], ICON, ICON, false);
            // icon right = iconX + ICON/2; +8px gap → label center
            var labelX = iconX + ICON / 2 + 8 + 48;
            var lb = _this4.label(box, SLOT_LABELS[s.slot], 16, C.ink, labelX, 0, 96, 40);
            lb.horizontalAlign = Label.HorizontalAlign.LEFT;
            _this4.slotLabels[s.slot] = lb;
          });
          // doll center uses hero skin
          this.loadSprite(hero, 'textures/chars/hero', 100, 100, false);
          this.equipListNode = this.mk('eqList', r, 680, 360, 0, -40);
          this.fill(this.equipListNode, C.white, 18);
          this.label(this.equipListNode, '装备列表', 20, C.inkMuted, -240, 155, 160, 28);
          var wear = this.mk('wear', r, 280, 64, 0, -260);
          this.fill(wear, C.primary, 18);
          this.wearBtnLabel = this.label(wear, '穿戴', 26, C.white, 0, 0, 240, 50, true);
          this.click(wear, function () {
            if (!_this4.selectedItemId) {
              _this4.showToast('请先选择装备');
              return;
            }
            _this4.model.wear(_this4.selectedItemId);
            _this4.refreshAll();
          });
        };
        _proto.rebuildEquipList = function rebuildEquipList() {
          var _this5 = this;
          if (!this.equipListNode) return;
          var children = this.equipListNode.children.slice();
          for (var _iterator = _createForOfIteratorHelperLoose(children), _step; !(_step = _iterator()).done;) {
            var c = _step.value;
            if (c.name.startsWith('row_')) c.destroy();
          }
          var items = this.model.save.inventory;
          items.forEach(function (it, i) {
            var y = 100 - i * 62;
            var row = _this5.mk('row_' + it.id, _this5.equipListNode, 640, 56, 0, y);
            var selected = _this5.selectedItemId === it.id;
            _this5.fill(row, selected ? new Color(200, 220, 245, 255) : new Color(244, 246, 250, 255), 10);
            var worn = _this5.model.save.equipped[it.slot] === it.id;
            var stat = _this5.statText(it);
            _this5.label(row, it.name + "  " + SLOT_LABELS[it.slot] + "\xB7" + it.quality + (worn ? '  [已穿]' : '') + "  " + stat, 18, C.ink, 0, 0, 620, 40);
            _this5.click(row, function () {
              _this5.selectedItemId = it.id;
              _this5.refreshAll();
            });
          });
        };
        _proto.statText = function statText(it) {
          var parts = [];
          if (it.atk) parts.push("\u653B+" + it.atk);
          if (it.def) parts.push("\u9632+" + it.def);
          if (it.spd) parts.push("\u901F+" + it.spd);
          if (it.spirit) parts.push("\u7075+" + it.spirit);
          return parts.join(' ');
        };
        _proto.buildTabBar = function buildTabBar() {
          var _this6 = this;
          var bar = this.mk('TabBar', this.root, DESIGN_W, 130, 0, -575);
          this.fill(bar, C.navy, 0);
          var tabs = [{
            id: 'equip',
            glyph: '装',
            name: '装备',
            enabled: true
          }, {
            id: 'spells',
            glyph: '法',
            name: '法术',
            enabled: true
          }, {
            id: 'beasts',
            glyph: '异',
            name: '异兽',
            enabled: false
          }, {
            id: 'play',
            glyph: '玩',
            name: '玩法',
            enabled: true
          }, {
            id: 'cave',
            glyph: '洞',
            name: '洞天',
            enabled: false
          }, {
            id: 'guild',
            glyph: '盟',
            name: '仙盟',
            enabled: false
          }];
          var gap = 110;
          var startX = -275;
          tabs.forEach(function (t, i) {
            var x = startX + i * gap;
            var b = _this6.mk('tab_' + t.id, bar, 88, 88, x, 8);
            _this6.tabDots[t.id] = b;
            var fillCol = t.enabled ? t.id === _this6.tab ? C.ok : C.navy2 : C.disabledBg;
            _this6.circle(b, fillCol);
            var gl = _this6.label(b, t.glyph, 26, t.enabled ? C.white : C.disabled, 0, 8, 70, 36, true);
            _this6.tabLabels[t.id] = _this6.label(b, t.name, 16, t.enabled ? C.goldLt : C.disabled, 0, -26, 80, 24);
            _this6.click(b, function () {
              if (!t.enabled) {
                _this6.showToast(t.name + " \u672A\u5F00\u653E");
                return;
              }
              _this6.setTab(t.id);
            });
          });
        };
        _proto.buildSpells = function buildSpells() {
          var _this7 = this;
          var r = this.spellsRoot;
          this.fill(r, new Color(24, 32, 48, 240), 0);
          this.label(r, '法术', 28, C.goldLt, 0, 520, 200, 40, true);
          this.label(r, '已解锁主动技 1/1', 18, C.inkMuted, 0, 470, 300, 30, true);
          var card = this.mk('skill1', r, 560, 180, 0, 200);
          this.fill(card, C.navy2, 16);
          this.label(card, '破邪斩', 26, C.white, -160, 40, 200, 36, true);
          this.label(card, '对当前野怪造成 220% 攻击伤害\n冷却 8 秒', 18, C.goldLt, 40, 0, 360, 80, true);
          var btn = this.mk('cast', card, 140, 52, 180, -50);
          this.fill(btn, C.primary, 12);
          this.label(btn, '施放', 22, C.white, 0, 0, 120, 40, true);
          this.click(btn, function () {
            return _this7.castSkill();
          });
          var back = this.mk('backSpell', r, 160, 48, 0, -520);
          this.fill(back, C.ok, 12);
          this.label(back, '回野外', 20, C.white, 0, 0, 140, 40, true);
          this.click(back, function () {
            return _this7.setTab('play');
          });
        };
        _proto.castSkill = function castSkill() {
          if (this.skillCd > 0) {
            this.showToast('技能冷却中 ' + Math.ceil(this.skillCd) + 's');
            return;
          }
          var dmg = Math.max(1, Math.floor(this.model.playerAtk() * 2.2));
          this.model.monsterHp = Math.max(0, this.model.monsterHp - dmg);
          this.skillCd = 8;
          this.showToast('破邪斩 -' + dmg);
          if (this.model.monsterHp <= 0) {
            this.model.onMonsterKilled();
            var cleared = false;
            if (this.model.save.killsInStage >= this.model.save.killsNeeded) {
              this.model.chestReady = true;
              cleared = true;
            } else {
              this.model.spawnMonster();
            }
            this.onCombat({
              dmgToMonster: dmg,
              dmgToPlayer: 0,
              dodge: false,
              killed: true,
              cleared: cleared
            });
          }
          this.refreshAll();
        };
        _proto.applySpriteFrame = function applySpriteFrame(node, sf, w, h, footAnchor) {
          var sp = node.getComponent(Sprite) || node.addComponent(Sprite);
          var ui = node.getComponent(UITransform) || node.addComponent(UITransform);
          sp.spriteFrame = sf;
          sp.sizeMode = Sprite.SizeMode.CUSTOM;
          sp.type = Sprite.Type.SIMPLE;
          // keep PNG alpha
          try {
            var gfx = sp;
            if (gfx.color) gfx.color = new Color(255, 255, 255, 255);
          } catch (_) {}
          if (footAnchor) ui.setAnchorPoint(0.5, 0);else ui.setAnchorPoint(0.5, 0.5);
          ui.setContentSize(w, h);
          // Hide circle/rect Graphics placeholder once real art is on
          var g = node.getComponent(Graphics);
          if (g) g.enabled = false;
          for (var _i = 0, _arr = [].concat(node.children); _i < _arr.length; _i++) {
            var child = _arr[_i];
            if (child.name.endsWith('Ph') || child.name.includes('Ph')) {
              child.active = false;
              continue;
            }
            if (child.getComponent(Label)) {
              child.setSiblingIndex(node.children.length - 1);
            }
          }
          console.log('[skin] ok', node.name, w, h, 'foot=', footAnchor);
        };
        _proto.loadSprite = function loadSprite(node, path, w, h, footAnchor) {
          var _this8 = this;
          if (footAnchor === void 0) {
            footAnchor = false;
          }
          var ui = node.getComponent(UITransform) || node.addComponent(UITransform);
          if (footAnchor) ui.setAnchorPoint(0.5, 0);
          ui.setContentSize(w, h);
          var tryApply = function tryApply(sf, via) {
            if (!sf) return false;
            _this8.applySpriteFrame(node, sf, w, h, footAnchor);
            console.log('[skin] loaded via', via, path);
            return true;
          };
          var fromImage = function fromImage(img, via) {
            // Prefer engine helper so alpha (RGBA8888) is preserved
            var frame = null;
            var anySF = SpriteFrame;
            if (typeof anySF.createWithImage === 'function') {
              frame = anySF.createWithImage(img);
            } else {
              var tex = new Texture2D();
              tex.image = img;
              frame = new SpriteFrame();
              frame.texture = tex;
            }
            return tryApply(frame, via);
          };
          // 1) direct texture sub-asset (has alpha when source is RGBA)
          resources.load(path + '/texture', Texture2D, function (errTex, tex) {
            if (!errTex && tex) {
              var frame = new SpriteFrame();
              frame.texture = tex;
              if (tryApply(frame, 'resources/texture')) return;
            }
            console.warn('[skin] texture fail', path, errTex && errTex.message);
            // 2) ImageAsset → SpriteFrame with alpha
            resources.load(path, ImageAsset, function (errImg, img) {
              if (!errImg && img && fromImage(img, 'resources/ImageAsset')) return;
              console.warn('[skin] ImageAsset fail', path, errImg && errImg.message);
              // 3) spriteFrame if Creator generated one
              resources.load(path + '/spriteFrame', SpriteFrame, function (errSf, sf) {
                if (!errSf && tryApply(sf, 'resources/spriteFrame')) return;
                console.warn('[skin] all load paths failed', path, errSf && errSf.message);
              });
            });
          });
        };
        _proto.buildChestBtn = function buildChestBtn() {
          var _this9 = this;
          this.chestBtn = this.mk('ChestBtn', this.playRoot, 120, 120, 280, 120);
          this.circle(this.chestBtn, C.gold);
          this.lblChest = this.label(this.chestBtn, '宝箱', 22, C.navy, 0, 0, 100, 40, true);
          this.chestBtn.active = false;
          this.click(this.chestBtn, function () {
            if (_this9.model.tryOpenChest()) {
              _this9.showLootPanel(true);
              _this9.refreshAll();
            }
          });
        };
        _proto.setTab = function setTab(id) {
          if (id !== 'play' && id !== 'equip' && id !== 'spells') {
            this.showToast('功能未开放');
            return;
          }
          this.tab = id;
          this.playRoot.active = id === 'play';
          this.equipRoot.active = id === 'equip';
          if (this.spellsRoot) this.spellsRoot.active = id === 'spells';
          this.refreshTabs();
          if (this.lootPanel) this.lootPanel.active = false;
          if (id === 'equip') this.rebuildEquipList();
          this.refreshAll();
        };
        _proto.refreshTabs = function refreshTabs() {
          var _this10 = this;
          Object.keys(this.tabDots).forEach(function (id) {
            var enabled = id === 'play' || id === 'equip' || id === 'spells';
            var n = _this10.tabDots[id];
            if (!n) return;
            var col = !enabled ? C.disabledBg : id === _this10.tab ? C.ok : C.navy2;
            _this10.circle(n, col);
          });
        };
        _proto.setFillWidth = function setFillWidth(node, maxW, ratio, color) {
          var w = Math.max(8, maxW * Math.min(1, Math.max(0, ratio)));
          var ui = node.getComponent(UITransform);
          ui.setContentSize(w, ui.height);
          // left-align inside parent: parent width known by caller via x
          this.fill(node, color, 7);
        };
        _proto.refreshCombatHud = function refreshCombatHud() {
          var m = this.model;
          if (this.lblHeroHp) this.lblHeroHp.string = "HP " + m.playerHp + "/" + m.playerMaxHp;
          if (this.lblMonHp) this.lblMonHp.string = "HP " + m.monsterHp + "/" + m.monsterMaxHp;
          if (this.lblMonName) this.lblMonName.string = '野外怪';
          if (this.lblChat && m.lastLog) this.lblChat.string = "[\u6218\u6597] " + m.lastLog;
        };
        _proto.refreshAll = function refreshAll() {
          var _this11 = this;
          var m = this.model;
          var s = m.save;
          if (this.lblGold) this.lblGold.string = "\u91D1 " + m.fmtGold(s.gold);
          if (this.lblLing) this.lblLing.string = "\u7075\u77F3 " + s.lingshi;
          if (this.lblJade) this.lblJade.string = "\u4ED9\u7389 " + s.xianyu;
          if (this.lblName) this.lblName.string = s.playerName;
          if (this.lblPower) this.lblPower.string = "\u6218\u529B " + m.combatPower;
          if (this.lblTopPower) this.lblTopPower.string = "\u6218\u529B " + m.combatPower;
          if (this.lblRealm) this.lblRealm.string = m.realmText + " " + s.realmLayer + "\u7EA7";
          if (this.lblStage) this.lblStage.string = m.stageTitle;
          if (this.lblStageProg) this.lblStageProg.string = s.killsInStage + "/" + s.killsNeeded;
          if (this.barStageFill) {
            var ratio = s.killsNeeded ? s.killsInStage / s.killsNeeded : 0;
            this.setFillWidth(this.barStageFill, 412, ratio, C.gold);
            this.barStageFill.setPosition(-210 + 412 * ratio / 2, 0, 0);
          }
          if (this.lblAuto) this.lblAuto.string = s.autoBattle ? '自动开' : '自动关';
          if (this.lblBreak) {
            var need = m.nextBreakthroughNeed();
            this.lblBreak.string = "\u5883\u754C\u7A81\u7834\u81F3" + m.realmText + " (" + s.realmExp + "/" + need + ")";
          }
          if (this.lblBreakCost) this.lblBreakCost.string = "\u7075\u77F3" + m.nextBreakthroughCost();
          if (this.barBreakFill) {
            var _ratio = m.breakthroughProgress();
            this.setFillWidth(this.barBreakFill, 320, _ratio, C.ok);
            this.barBreakFill.setPosition(-40 - 160 + 320 * _ratio / 2, 0, 0);
          }
          if (this.lblEquipPower) {
            this.lblEquipPower.string = "\u6218\u529B " + m.combatPower;
          }
          Object.keys(SLOT_LABELS).forEach(function (slot) {
            var lb = _this11.slotLabels[slot];
            if (!lb) return;
            var it = m.getEquipped(slot);
            lb.string = it ? SLOT_LABELS[slot] + "\n" + it.name : SLOT_LABELS[slot];
          });
          this.refreshCombatHud();
          this.refreshTabs();
          if (this.equipRoot.active) this.rebuildEquipList();
        };
        return MainGame;
      }(Component)) || _class));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/SaveSystem.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameTypes.ts'], function (exports) {
  var _extends, cclegacy, sys, createNewSave;
  return {
    setters: [function (module) {
      _extends = module.extends;
    }, function (module) {
      cclegacy = module.cclegacy;
      sys = module.sys;
    }, function (module) {
      createNewSave = module.createNewSave;
    }],
    execute: function () {
      cclegacy._RF.push({}, "bbbbc9RpxlOKKSBb/DeG4gn", "SaveSystem", undefined);
      var SAVE_KEY = 'feixian_mvp_save_v1';
      function storageGet(key) {
        try {
          if (sys && sys.localStorage) {
            var v = sys.localStorage.getItem(key);
            if (v != null) return v;
          }
        } catch (_) {/* fall through */}
        try {
          if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
        } catch (_) {/* ignore */}
        return null;
      }
      function storageSet(key, value) {
        try {
          if (sys && sys.localStorage) sys.localStorage.setItem(key, value);
        } catch (_) {/* ignore */}
        try {
          if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
        } catch (_) {/* ignore */}
      }
      function storageRemove(key) {
        try {
          if (sys && sys.localStorage) sys.localStorage.removeItem(key);
        } catch (_) {/* ignore */}
        try {
          if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
        } catch (_) {/* ignore */}
      }
      var SaveSystem = exports('SaveSystem', /*#__PURE__*/function () {
        function SaveSystem() {}
        SaveSystem.load = function load() {
          try {
            var raw = storageGet(SAVE_KEY);
            if (!raw) return createNewSave();
            var data = JSON.parse(raw);
            if (!data || data.version !== 1) return createNewSave();
            var base = createNewSave();
            return _extends({}, base, data, {
              inventory: data.inventory && data.inventory.length ? data.inventory : base.inventory
            });
          } catch (e) {
            console.warn('[SaveSystem] load failed', e);
            return createNewSave();
          }
        };
        SaveSystem.save = function save(data) {
          try {
            storageSet(SAVE_KEY, JSON.stringify(data));
          } catch (e) {
            console.warn('[SaveSystem] save failed', e);
          }
        };
        SaveSystem.clear = function clear() {
          storageRemove(SAVE_KEY);
        };
        return SaveSystem;
      }());
      cclegacy._RF.pop();
    }
  };
});

(function(r) {
  r('virtual:///prerequisite-imports/main', 'chunks:///_virtual/main'); 
})(function(mid, cid) {
    System.register(mid, [cid], function (_export, _context) {
    return {
        setters: [function(_m) {
            var _exportObj = {};

            for (var _key in _m) {
              if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _m[_key];
            }
      
            _export(_exportObj);
        }],
        execute: function () { }
    };
    });
});