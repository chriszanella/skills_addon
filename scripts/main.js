import { world, system, ItemStack } from "@minecraft/server";
import ProgressBar from "./progressbars/progressbar.js";

// ====================================
// LER README.MD PARA INFORMACOES UTEIS
// ====================================

class SkillsSystem {
  constructor() {
    this.formulaType = "easy"; // easy -> facil(50xp p/level), hard -> dificil(150xp p/level)
    this.skills = {
      mining: {
        name: "Mineracao",
        icon: "⛏",
        color: "§t",
        xpProperty: "mining_xp",
        levelProperty: "mining_lvl",
        maxLevel: 50,
        getEffects: (level) => {
          const effects = [];
          if (level >= 5 && level < 10) {
            effects.push({ name: "haste", amplifier: 0 });
          }
          if (level >= 10) {
            effects.push({ name: "haste", amplifier: 1 });
            effects.push({ name: "night_vision", amplifier: 0 });
          }
          return effects;
        },
        getBonusDropChance: (level) => {
          if (level < 15) return 0; // Abaixo de 15: sem chance
          if (level < 20) return 0.02; // 15-19: 2%
          if (level < 25) return 0.04; // 20-24: 4%
          if (level < 30) return 0.06; // 25-29: 6%
          if (level < 35) return 0.08; // 30-34: 8%
          if (level < 40) return 0.10; // 35-39: 10%
          if (level < 45) return 0.12; // 40-44: 12%
          if (level < 50) return 0.14; // 45-49: 14%
          return 0.16; // 50: 16%
        },
      },
      lumber: {
        name: "Machador",
        icon: "🪓",
        color: "§2",
        xpProperty: "lumber_xp",
        levelProperty: "lumber_lvl",
        maxLevel: 50,
        getEffects: (level) => {
          const effects = [];
          // efeitos para o skill de machador (lumber)
          return effects;
        },
      },
    };
  }

  // ===========
  // requisicoes
  // ===========
  getXp(player, skillName) {
    const skills = this.skills[skillName];
    return player.getDynamicProperty(skills.xpProperty) ?? 0;
  }
  getLvl(player, skillName) {
    const skills = this.skills[skillName];
    return player.getDynamicProperty(skills.levelProperty) ?? 0;
  }

  // =============
  // movimentacoes
  //==============
  addXp(player, skillName, amount) {
    const skills = this.skills[skillName];

    let currentXp = this.getXp(player, skillName);
    let currentLevel = this.getLvl(player, skillName);

    currentXp += amount;
    let levelsGained = 0;

    // Loop usado para upar level.
    while (currentLevel < skills.maxLevel) {
      const xpNeeded = this.getXpNeeded(currentLevel);
      if (currentXp >= xpNeeded) {
        currentLevel++;
        currentXp -= xpNeeded; // Remove o XP usado.
        levelsGained++;
      } else {
        break;
      }
    }

    // Salvar
    player.setDynamicProperty(skills.xpProperty, currentXp);
    player.setDynamicProperty(skills.levelProperty, currentLevel);

    // Message
    if (levelsGained > 0) {
      const message =
        levelsGained === 1
          ? `${skills.color}§l[${skills.icon} LEVEL UP!] §e${skills.name} - Nível ${currentLevel}`
          : `${skills.color}§l[${skills.icon} LEVEL UP!] §e${skills.name} subiu ${levelsGained} níveis! (${currentLevel})`;
      player.sendMessage(message);
      player.playSound("random.levelup");
      this.showUnlockedEffects(player, skillName, currentLevel);
    }
  }

  // =========
  // consultas
  // =========
  getXpNeeded(level) {
    switch (this.formulaType) {
      case "easy":
        return 100 * (level + 1);
      case "hard":
        return 200 * (level + 1);
      default:
        return 150 * (level + 1);
    }
  }

  // ========
  // retornos
  // ========
  actionBar(player, skillName) {
    ProgressBar.progressBarOne(player, skillName, skillSystem);
  }
  showUnlockedEffects(player, skillName, level) {
    if (skillName === "mining") {
      if (level === 5) {
        player.sendMessage("§a§l[DESBLOQUEADO!] §eHaste I permanente!");
      }
      if (level === 10) {
        player.sendMessage(
          "§a§l[DESBLOQUEADO!] §eHaste II + Night Vision permanente!"
        );
      }
    }
  }

  // recompensa
  applyEffects(player, skillName) {
    try {
      // Verificar se a skill existe
      const skill = this.skills[skillName];
      if (!skill) {
        console.warn(`Skill "${skillName}" não existe!`);
        return;
      }

      // Verificar se o jogador é válido
      if (!player || !player.isValid) {
        console.warn("Jogador inválido ou desconectado");
        return;
      }

      // Pegar o nível do jogador
      const level = this.getLvl(player, skillName);

      // Pegar os efeitos baseados no nível
      const effects = skill.getEffects(level);

      // Se não tem efeitos, não faz nada
      if (!effects || effects.length === 0) {
        return;
      }

      // Aplicar cada efeito
      effects.forEach((effect) => {
        try {
          player.addEffect(effect.name, 1200, {
            amplifier: effect.amplifier,
            showParticles: false,
          });
        } catch (effectError) {
          // Se falhar ao aplicar um efeito específico, continua para o próximo
          console.warn(`Erro ao aplicar efeito ${effect.name}:`, effectError);
        }
      });
    } catch (error) {
      // Se der qualquer erro, apenas loga (não crasha o addon)
      console.warn(`Erro em applyEffects para ${skillName}:`, error);
    }
  }

  getWeightedRandomDrop(drops) {
    if (!drops || drops.length === 0) {
      return null; // Segurança
    }

    const totalWeight = drops.reduce((sum, drop) => sum + drop.weight, 0);

    if (totalWeight === 0) {
      return drops[0]; // Se todos os pesos são 0
    }

    let random = Math.random() * totalWeight;

    for (const drop of drops) {
      random -= drop.weight;
      if (random <= 0) return drop;
    }

    return drops[0];
  }
  dropBonusItem(player, block, bonusDrop) {
    const dimension = player.dimension;
    const location = block.location;

    // Criar o item
    const itemStack = new ItemStack(
      bonusDrop.item, // ID do item
      bonusDrop.amount // Quantidade
    );

    // Dropar no mundo (spawn)
    dimension.spawnItem(itemStack, {
      x: location.x + 0.5, // Centro do bloco
      y: location.y + 0.5,
      z: location.z + 0.5,
    });

    /*
    Feedback para o jogador
    const itemName = bonusDrop.item.split(":")[1]; // "minecraft:coal" → "coal"
    player.sendMessage(`§a§l[BONUS!] §e+${bonusDrop.amount}x ${itemName}`);
    player.playSound("random.orb");

    // Partículas (opcional)
    dimension.spawnParticle("minecraft:crop_growth_emitter", {
      x: location.x + 0.5,
      y: location.y + 0.5,
      z: location.z + 0.5,
    });
    */
  }
  shouldDropBonus(player, skillName) {
    const skill = skillSystem.skills[skillName];
    const level = skillSystem.getLvl(player, skillName);
    const chance = skill.getBonusDropChance(level);

    // Se não tem chance, retorna falso
    if (chance === 0) return false;

    // Gera número aleatório entre 0 e 1
    const random = Math.random();

    // Se o número aleatório for menor que a chance, dropa!
    return random < chance;
  }
}

import lumberVariants from "./lumber.js";

const miningBlocksXP = {
  "minecraft:stone": 1,
  "minecraft:deepslate": 2,
  "minecraft:coal_ore": 5,
  "minecraft:deepslate_coal_ore": 7,
  "minecraft:iron_ore": 10,
  "minecraft:deepslate_iron_ore": 12,
  "minecraft:copper_ore": 8,
  "minecraft:deepslate_copper_ore": 10,
  "minecraft:gold_ore": 15,
  "minecraft:deepslate_gold_ore": 18,
  "minecraft:redstone_ore": 12,
  "minecraft:deepslate_redstone_ore": 15,
  "minecraft:lapis_ore": 12,
  "minecraft:deepslate_lapis_ore": 15,
  "minecraft:diamond_ore": 30,
  "minecraft:deepslate_diamond_ore": 35,
  "minecraft:emerald_ore": 40,
  "minecraft:deepslate_emerald_ore": 45,
  "minecraft:nether_quartz_ore": 8,
  "minecraft:nether_gold_ore": 12,
  "minecraft:ancient_debris": 100,
};
const bonusDropOresMining = {
  // Quando quebrar pedra normal
  "minecraft:stone": [
    { item: "minecraft:coal", amount: 1, weight: 40 },
    { item: "minecraft:raw_iron", amount: 1, weight: 30 },
    { item: "minecraft:raw_copper", amount: 1, weight: 20 },
    { item: "minecraft:raw_gold", amount: 1, weight: 8 },
    { item: "minecraft:diamond", amount: 1, weight: 2 },
  ],

  // Quando quebrar deepslate
  "minecraft:deepslate": [
    { item: "minecraft:coal", amount: 1, weight: 35 },
    { item: "minecraft:raw_iron", amount: 1, weight: 30 },
    { item: "minecraft:raw_copper", amount: 1, weight: 20 },
    { item: "minecraft:raw_gold", amount: 1, weight: 10 },
    { item: "minecraft:diamond", amount: 1, weight: 5 },
  ],
};

const lumberBlocksXP = { ...lumberVariants.lumberBlocksXPALL };
const farmingBlocksXP = {};
const skillSystem = new SkillsSystem();

const allXPTables = [
  { table: miningBlocksXP, skill: "mining" },
  { table: lumberBlocksXP, skill: "lumber" },
  { table: farmingBlocksXP, skill: "farming" },
];

world.afterEvents.worldLoad.subscribe(() => {
  system.runInterval(() => {
  try {
    const players = world.getPlayers();

    // Se não tem jogadores online, não faz nada
    if (players.length === 0) {
      return;
    }
        
    for (const player of players) {
      if(!player.isValid) continue;
      // Aplicar efeitos de cada skill
      skillSystem.applyEffects(player, "mining");
      skillSystem.applyEffects(player, "lumber");
    }
  } catch (error) {
    console.warn("Erro no loop de efeitos:", error);
  }
}, 300);
  // Evento de quebrar blocos!
  world.afterEvents.playerBreakBlock.subscribe((event) => {
    const { player, brokenBlockPermutation, block } = event;
    const blockId = brokenBlockPermutation.type.id;

    for (const { table, skill } of allXPTables) {
      const xp = table[blockId];
      if (xp) {
        skillSystem.addXp(player, skill, xp);
        skillSystem.actionBar(player, skill);
      }
    }

    if (bonusDropOresMining[blockId]) {
      // Passo 1: Verificar SE vai dropar (chance baseada no nível)
      if (skillSystem.shouldDropBonus(player, "mining")) {
        // Passo 2: Escolher O QUE vai dropar (peso)
        const drops = bonusDropOresMining[blockId];
        const bonusDrop = skillSystem.getWeightedRandomDrop(drops);

        // Passo 3: Dropar no mundo
        skillSystem.dropBonusItem(player, block, bonusDrop); 
      }
    }
  });

  // Evento de scriptEventRecieved para definir XP manualmente
  system.afterEvents.scriptEventReceive.subscribe((event) => {
    const { id, sourceEntity, message } = event;

    if (id === "skills:setSkillLevel") {
      try {
        const data = JSON.parse(message);
        const { skillName, level } = data;

        const skill = skillSystem.skills[skillName];
        if (!skill) {
          sourceEntity?.sendMessage(`§cSkill inválida: ${skillName}`);
          return;
        }

        sourceEntity.setDynamicProperty(skill.levelProperty, level);
        sourceEntity.setDynamicProperty(skill.xpProperty, 0);
        sourceEntity.sendMessage(
          `§aLevel da skill §e${skill.name} §asetado para §e${level}`
        );
        skillSystem.actionBar(sourceEntity, skillName);
      } catch (e) {
        sourceEntity?.sendMessage("§cDados inválidos no scriptevent");
      }
    }
  });
});
