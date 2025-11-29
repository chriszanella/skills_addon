import { world, system } from "@minecraft/server";
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
        icon: "🗻",
        color: "§t",
        xpProperty: "mining_xp",
        levelProperty: "mining_lvl",
        maxLevel: 50,
      },
      lumber: {
        name: "Machador",
        icon: "🗻",
        color: "§t",
        xpProperty: "lumber_xp",
        levelProperty: "lumber_lvl",
        maxLevel: 50,
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
  actionBar(player, skillName, xpGained) {
    // const xpPlayer = this.getXp(player, skillName);
    // const lvlPlayer = this.getLvl(player, skillName);
    // const xpNeeded = this.getXpNeeded(lvlPlayer);
    // player.onScreenDisplay.setActionBar(
    //   `§gMiner:: §dXp: (${xpPlayer}/${xpNeeded}) §3Lvl: (${lvlPlayer}/${this.skills[skillName].maxLevel})`
    // );

    ProgressBar.progressBar(player, skillName, skillSystem);
  }
}

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
const skillSystem = new SkillsSystem();



world.afterEvents.worldLoad.subscribe(() => {
  // Evento de quebrar blocos!
  world.afterEvents.playerBreakBlock.subscribe((event) => {
    const { player, brokenBlockPermutation } = event;
    const blockId = brokenBlockPermutation.type.id;

    for (const block in miningBlocksXP) {
      if (blockId === block) {
        const xp = miningBlocksXP[block];
        skillSystem.addXp(player, "mining", xp);
        skillSystem.actionBar(player, "mining", miningBlocksXP[block]);
      }
    }
  });
});
