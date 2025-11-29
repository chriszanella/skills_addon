import { world, system } from "@minecraft/server";
class ProgressBar {
  progressBar(player, skillName, skillSystem) {
    const skill = skillSystem.skills[skillName]
    const xpPlayer = skillSystem.getXp(player, skillName);
    const lvlPlayer = skillSystem.getLvl(player, skillName);

    const xpNeeded = skillSystem.getXpNeeded(lvlPlayer)
    const percentage = Math.floor((xpPlayer / xpNeeded) * 100);

    let colorBar;
    if(percentage < 33){
      colorBar = '§c'
    } else if (percentage < 66){
      colorBar = '§6'
    } else {
      colorBar = '§a'
    }

    //Barra
    const barLength = 10;
    const filledBar = Math.floor((xpPlayer / xpNeeded) * barLength);
    const emptyBar = barLength - filledBar;

    const progressBar = '§7[' + colorBar + '█'.repeat(filledBar) + '§8' + '█'.repeat(emptyBar) + '§7]'

    player.onScreenDisplay.setActionBar(`${skill.color}${skill.icon} ${skill.name} Nv.${lvlPlayer} ${progressBar} ${percentage}% §7(${xpPlayer}/${xpNeeded})`)
  }
}

export default new ProgressBar();
