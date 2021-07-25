const Web3 = require('web3');

const web3 = new Web3('https://bsc-dataseed.binance.org/');

const isAddress = address => web3.utils.isAddress(address);

const conStakingReward = require('../smart/build/contracts/IStakingRewards.json');
const conStakingToken = require('../smart/build/contracts/IERC20.json');
const conCryptoBlades = require('../smart/build/contracts/CryptoBlades.json');
const conCharacters = require('../smart/build/contracts/Characters.json');
const conWeapons = require('../smart/build/contracts/Weapons.json');

const stakingRewardAddress = '0xd6b2D8f59Bf30cfE7009fB4fC00a7b13Ca836A2c';
const stakingTokenAddress = '0x154a9f9cbd3449ad22fdae23044319d6ef2a1fab';
const mainAddress = '0x39Bea96e13453Ed52A734B6ACEeD4c41F57B2271';
const charAddress = '0xc6f252c2cdd4087e30608a35c022ce490b58179b';
const weapAddress = '0x7e091b0a220356b157131c831258a9c98ac8031a';
const defaultAddress = '0x0000000000000000000000000000000000000000';

const StakingReward = new web3.eth.Contract(conStakingReward.abi, stakingRewardAddress);
const StakingToken = new web3.eth.Contract(conStakingToken.abi, stakingTokenAddress);
const CryptoBlades = new web3.eth.Contract(conCryptoBlades.abi, mainAddress);
const Characters = new web3.eth.Contract(conCharacters.abi, charAddress);
const Weapons = new web3.eth.Contract(conWeapons.abi, weapAddress);

const getStakedBalance = async address => StakingToken.methods.balanceOf(address).call({ from: defaultAddress });
const getStakedRewards = async address => StakingReward.methods.balanceOf(address).call({ from: defaultAddress });
const getStakedTimeLeft = async address => StakingReward.methods.getStakeUnlockTimeLeft().call({ from: address });
const getAccountCharacters = async address => CryptoBlades.methods.getMyCharacters().call({ from: address });
const getAccountSkillReward = async address => CryptoBlades.methods.getTokenRewards().call({ from: address });
const getCharacterExp = async (address, charId) => CryptoBlades.methods.getXpRewards(`${charId}`).call({ from: address });
const getCharacterStamina = async charId => Characters.methods.getStaminaPoints(`${charId}`).call({ from: defaultAddress });
const getCharacterData = async (address, charId) => Characters.methods.get(`${charId}`).call({ from: address });
const getBNBBalance = async address => web3.eth.getBalance(address);

module.exports = {
  web3,
  isAddress,
  StakingReward,
  StakingToken,
  CryptoBlades,
  Characters,
  Weapons,
  getStakedBalance,
  getStakedRewards,
  getStakedTimeLeft,
  getAccountCharacters,
  getAccountSkillReward,
  getCharacterExp,
  getCharacterStamina,
  getCharacterData,
  getBNBBalance,
};
