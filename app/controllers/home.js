const express = require('express');

const router = express.Router();

const {
  web3, isAddress, getStakedBalance, getStakedRewards, getStakedTimeLeft, getBNBBalance, getAccountCharacters, getAccountWeapons, getAccountSkillReward, getCharacterExp, getCharacterStamina, getCharacterData, getWeaponData, characterTargets,
} = require('../helpers/web3');

const {
  characterFromContract, weaponFromContract, secondsToDDHHMMSS, getNextTargetExpLevel, getEnemyDetails, getWinChance, traitNumberToName,
} = require('../helpers/utils');


router.get('/', (req, res, next) => {
  res.render('index', { title: 'CryptoBlades Tracker' });
});

router.get('/account/add/:address', (req, res, next) => {
  const { address } = req.params;
  if (!address) return res.json({ error: 'No address provided.' });
  return res.json({ valid: isAddress(req.params.address), address });
});

router.get('/simulate/:address/:charId/:weapId', async (req, res, next) => {
  const { address, charId, weapId } = req.params;
  if (!address || !isAddress(req.params.address)) return res.json({ error: 'No valid address provided.' });
  if (!charId) return res.json({ error: 'No character id provided.' });
  if (!weapId) return res.json({ error: 'No weapon id provided.' });
  const targets = await characterTargets(address, charId, weapId);
  const enemies = await getEnemyDetails(targets);
  const charData = characterFromContract(charId, await getCharacterData(address, charId));
  const weapData = weaponFromContract(weapId, await getWeaponData(address, weapId));
  return res.json(enemies.map((data) => {
    const chance = getWinChance(charData, weapData, data.power, data.trait);
    data.element = traitNumberToName(data.trait);
    return {
      enemy: data,
      chance,
    };
  }));
});

router.get('/account/retrieve/:data', async (req, res, next) => {
  const { data } = req.params;
  if (!data) return res.json({ error: 'No data provided.' });
  const accounts = JSON.parse(Buffer.from(data, 'base64').toString('ascii'));
  if (!accounts) return res.json([]);
  const results = await Promise.all(accounts.map(async (address) => {
    const bnbBalance = await getBNBBalance(address);
    const accChars = await getAccountCharacters(address);
    const accWeaps = await getAccountWeapons(address);
    const balance = await getStakedBalance(address);
    const rewards = await getStakedRewards(address);
    const timeLeft = await getStakedTimeLeft(address);
    const skills = await getAccountSkillReward(address);
    const characters = await Promise.all(accChars.map(async (charId) => {
      const exp = await getCharacterExp(address, charId);
      const sta = await getCharacterStamina(charId);
      const charData = characterFromContract(charId, await getCharacterData(address, charId));
      const nextTargetExpLevel = getNextTargetExpLevel(charData.level);
      return {
        charId,
        exp,
        sta,
        trait: charData.trait,
        nextLevel: nextTargetExpLevel.level + 1,
        nextExp: nextTargetExpLevel.exp - (parseInt(charData.xp) + parseInt(exp)),
        mustClaim: (exp <= 0),
        level: charData.level + 1,
        element: charData.traitName,
      };
    }));
    const weapons = await Promise.all(accWeaps.map(async weapId => weaponFromContract(weapId, await getWeaponData(address, weapId))));
    return {
      address,
      bnb: web3.utils.fromWei(`${bnbBalance}`, 'ether'),
      unclaimed: web3.utils.fromWei(`${skills}`, 'ether'),
      balance: web3.utils.fromWei(`${balance}`, 'ether'),
      rewards: web3.utils.fromWei(`${rewards}`, 'ether'),
      timeLeft: secondsToDDHHMMSS(timeLeft),
      total: web3.utils.fromWei(`${(parseFloat(rewards) + parseFloat(balance) + parseFloat(skills))}`, 'ether'),
      characters,
      weapons,
      action: `<button type="button" class="btn btn-success btn-sm mb-1" onclick="rename('${address}')">Rename</button><br>
              <button type="button" class="btn btn-warning btn-sm mb-1" onclick="simulate('${address}', '${Buffer.from(JSON.stringify({ characters, weapons })).toString('base64')}')">Combat Simulator</button><br>
              <button type="button" class="btn btn-danger btn-sm" onclick="remove('${address}')">Remove</button>`,
    };
  }));

  return res.json(results);
});

module.exports = router;
