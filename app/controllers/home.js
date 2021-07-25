const express = require('express');

const router = express.Router();

const {
  web3, isAddress, getStakedBalance, getStakedRewards, getStakedTimeLeft, getAccountCharacters, getAccountSkillReward, getCharacterExp, getCharacterStamina, getCharacterData,
} = require('../helpers/web3');

const { characterFromContract, secondsToDDHHMMSS, getNextTargetExpLevel } = require('../helpers/utils');


router.get('/', (req, res, next) => {
  res.render('index', { title: 'Crypto Blades Tracker' });
});

router.get('/account/add/:address', (req, res, next) => {
  const { address } = req.params;
  if (!address) return res.status(500).json({ error: 'No address provided.' });
  return res.json({ valid: isAddress(req.params.address), address });
});

router.get('/account/retrieve/:data', async (req, res, next) => {
  const { data } = req.params;
  if (!data) return res.status(500).json({ error: 'No data provided.' });
  const accounts = JSON.parse(Buffer.from(data, 'base64').toString('ascii'));
  if (!accounts) return res.json([]);
  const results = await Promise.all(accounts.map(async (address) => {
    const accChars = await getAccountCharacters(address);
    const balance = await getStakedBalance(address);
    const rewards = await getStakedRewards(address);
    const timeLeft = await getStakedTimeLeft(address);
    const skills = await getAccountSkillReward(address);
    const chars = await Promise.all(accChars.map(async (charId) => {
      const exp = await getCharacterExp(address, charId);
      const sta = await getCharacterStamina(charId);
      const charData = characterFromContract(charId, await getCharacterData(address, charId));
      const nextTargetExpLevel = getNextTargetExpLevel(charData.level);
      return {
        charId,
        exp,
        sta,
        nextLevel: nextTargetExpLevel.level + 1,
        nextExp: nextTargetExpLevel.exp - parseInt(charData.xp),
        mustClaim: (exp <= 0),
        level: charData.level + 1,
        element: charData.traitName,
      };
    }));
    return {
      address,
      unclaimed: web3.utils.fromWei(`${skills}`, 'ether'),
      balance: web3.utils.fromWei(`${balance}`, 'ether'),
      rewards: web3.utils.fromWei(`${rewards}`, 'ether'),
      timeLeft: secondsToDDHHMMSS(timeLeft),
      characters: chars,
      action: `<button type="button" class="btn btn-danger btn-sm" onclick="remove('${address}')">Remove</button>`,
    };
  }));

  return res.json(results);
});

module.exports = router;
