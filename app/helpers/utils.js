const randomString = (length) => {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHUJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

function CharacterPower(level) {
  return ((1000 + level * 10) * (Math.floor(level / 10) + 1));
}

const WeaponElement = {
  Fire: 0,
  Earth: 1,
  Lightning: 2,
  Water: 3,
};

const WeaponTrait = {
  STR: 0,
  DEX: 1,
  CHA: 2,
  INT: 3,
  PWR: 4,
};

function traitNumberToName(traitNum) {
  switch (traitNum) {
  case WeaponElement.Fire: return 'Fire';
  case WeaponElement.Earth: return 'Earth';
  case WeaponElement.Water: return 'Water';
  case WeaponElement.Lightning: return 'Lightning';
  default: return '???';
  }
}

function characterFromContract(id, data) {
  const xp = data[0];
  const level = parseInt(data[1], 10);
  const trait = data[2];
  const traitName = traitNumberToName(+data[2]);
  const staminaTimestamp = data[3];
  const head = data[4];
  const arms = data[5];
  const torso = data[6];
  const legs = data[7];
  const boots = data[8];
  const race = data[9];
  return {
    id: +id, xp, level, trait, traitName, staminaTimestamp, head, arms, torso, legs, boots, race,
  };
}

function getStatPatternFromProperties(properties) {
  return (properties >> 5) & 0x7f;
}

function getStat1Trait(statPattern) {
  return (statPattern % 5);
}

function getStat2Trait(statPattern) {
  return (Math.floor(statPattern / 5) % 5);
}

function getStat3Trait(statPattern) {
  return (Math.floor(Math.floor(statPattern / 5) / 5) % 5);
}

function statNumberToName(statNum) {
  switch (statNum) {
  case WeaponTrait.CHA: return 'CHA';
  case WeaponTrait.DEX: return 'DEX';
  case WeaponTrait.INT: return 'INT';
  case WeaponTrait.PWR: return 'PWR';
  case WeaponTrait.STR: return 'STR';
  default: return '???';
  }
}

function getWeaponTraitFromProperties(properties) {
  return (properties >> 3) & 0x3;
}

function weaponFromContract(id, data) {
  const properties = data[0];
  const stat1 = data[1];
  const stat2 = data[2];
  const stat3 = data[3];
  const level = +data[4];
  const blade = data[5];
  const crossguard = data[6];
  const grip = data[7];
  const pommel = data[8];
  const burnPoints = +data[9];
  const bonusPower = +data[10];

  const stat1Value = +stat1;
  const stat2Value = +stat2;
  const stat3Value = +stat3;

  const statPattern = getStatPatternFromProperties(+properties);
  const stat1Type = getStat1Trait(statPattern);
  const stat2Type = getStat2Trait(statPattern);
  const stat3Type = getStat3Trait(statPattern);

  const traitNum = getWeaponTraitFromProperties(+properties);

  const lowStarBurnPoints = burnPoints & 0xff;
  const fourStarBurnPoints = (burnPoints >> 8) & 0xff;
  const fiveStarBurnPoints = (burnPoints >> 16) & 0xff;

  const stars = (+properties) & 0x7;
  return {
    id: +id,
    properties,
    element: traitNumberToName(traitNum),
    stat1: statNumberToName(stat1Type),
    stat1Value,
    stat1Type,
    stat2: statNumberToName(stat2Type),
    stat2Value,
    stat2Type,
    stat3: statNumberToName(stat3Type),
    stat3Value,
    stat3Type,
    level,
    blade,
    crossguard,
    grip,
    pommel,
    stars,
    lowStarBurnPoints,
    fourStarBurnPoints,
    fiveStarBurnPoints,
    bonusPower,
  };
}

function getElementAdvantage(playerElement, enemyElement) {
  if ((playerElement + 1) % 4 === enemyElement) return 1;
  if ((enemyElement + 1) % 4 === playerElement) return -1;
  return 0;
}

function AdjustStatForTrait(statValue, statTrait, charTrait) {
  let value = statValue;
  if (statTrait === charTrait) { value = Math.floor(value * 1.07); } else if (statTrait === WeaponTrait.PWR) { value = Math.floor(value * 1.03); }
  return value;
}

function MultiplierPerEffectiveStat(statValue) {
  return statValue * 0.25;
}

function Stat1PercentForChar(wep, trait) {
  return MultiplierPerEffectiveStat(AdjustStatForTrait(wep.stat1Value, wep.stat1Type, trait));
}

function Stat2PercentForChar(wep, trait) {
  return MultiplierPerEffectiveStat(AdjustStatForTrait(wep.stat2Value, wep.stat2Type, trait));
}

function Stat3PercentForChar(wep, trait) {
  return MultiplierPerEffectiveStat(AdjustStatForTrait(wep.stat3Value, wep.stat3Type, trait));
}

function GetTotalMultiplierForTrait(wep, trait) {
  return 1 + (0.01 * (Stat1PercentForChar(wep, trait) + Stat2PercentForChar(wep, trait) + Stat3PercentForChar(wep, trait)));
}

function getWinChance(charData, weapData, enemyPower, enemyElement) {
  const characterPower = CharacterPower(charData.level);
  const playerElement = parseInt(charData.trait, 10);
  const weaponElement = parseInt(WeaponElement[weapData.element], 10);
  const weaponMultiplier = GetTotalMultiplierForTrait(weapData, playerElement);
  const totalPower = (characterPower * weaponMultiplier) + weapData.bonusPower;
  const totalMultiplier = 1 + (0.075 * (weaponElement === playerElement ? 1 : 0)) + (0.075 * getElementAdvantage(playerElement, enemyElement));
  const playerMin = totalPower * totalMultiplier * 0.9;
  const playerMax = totalPower * totalMultiplier * 1.1;
  const playerRange = playerMax - playerMin;
  const enemyMin = enemyPower * 0.9;
  const enemyMax = enemyPower * 1.1;
  const enemyRange = enemyMax - enemyMin;
  let rollingTotal = 0;
  // shortcut: if it is impossible for one side to win, just say so
  if (playerMin > enemyMax) return 3;
  if (playerMax < enemyMin) return 0;

  // case 1: player power is higher than enemy power
  if (playerMin >= enemyMin) {
    // case 1: enemy roll is lower than player's minimum
    rollingTotal = (playerMin - enemyMin) / enemyRange;
    // case 2: 1 is not true, and player roll is higher than enemy maximum
    rollingTotal += (1 - rollingTotal) * ((playerMax - enemyMax) / playerRange);
    // case 3: 1 and 2 are not true, both values are in the overlap range. Since values are basically continuous, we assume 50%
    rollingTotal += (1 - rollingTotal) * 0.5;
  } else {
    // case 1: player rolls below enemy minimum
    rollingTotal = (enemyMin - playerMin) / playerRange;
    // case 2: enemy rolls above player maximum
    rollingTotal += (1 - rollingTotal) * ((enemyMax - playerMax) / enemyRange);
    // case 3: 1 and 2 are not true, both values are in the overlap range
    rollingTotal += (1 - rollingTotal) * 0.5;
    // since this is chance the enemy wins, we negate it
    rollingTotal = 1 - rollingTotal;
  }
  if (rollingTotal <= 0.3) return 0;
  if (rollingTotal <= 0.5) return 1;
  if (rollingTotal <= 0.7) return 2;
  return 3;
}

module.exports = {
  randomString,
  traitNumberToName,
  characterFromContract,
  weaponFromContract,
  getWinChance,
};
