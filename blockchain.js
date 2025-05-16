import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';

// Адрес и ABI контракта
const contractAddress = '0x715045cea81d1DcC604b6A379B94D6049CDaa5a0';
const contractABI = [
  {
    "inputs": [{ "internalType": "string", "name": "_name", "type": "string" }],
    "name": "addMeme",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "uint256", "name": "memeId", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "name", "type": "string" }
    ],
    "name": "MemeAdded",
    "type": "event"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_memeId", "type": "uint256" }],
    "name": "vote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "uint256", "name": "memeId", "type": "uint256" },
      { "indexed": false, "internalType": "address", "name": "voter", "type": "address" }
    ],
    "name": "Voted",
    "type": "event"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_memeId", "type": "uint256" }],
    "name": "getName",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_memeId", "type": "uint256" }],
    "name": "getVotes",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" },
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "name": "hasVoted",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "memeCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "memes",
    "outputs": [
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "uint256", "name": "votes", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
];

let provider;
let signer;
let contract;

// Подключение кошелька
export async function connectWallet() {
  if (!window.ethereum) {
    alert('Пожалуйста, установите MetaMask!');
    return false;
  }
  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  signer = provider.getSigner();
  contract = new ethers.Contract(contractAddress, contractABI, signer);
  console.log('Подключен к контракту:', contract.address, 'Сеть:', await provider.getNetwork());
  return true;
}

// Загрузка мемов с голосами из контракта
export async function loadMemes() {
  if (!contract) throw new Error('Сначала подключите кошелек!');
  const memeCount = await contract.memeCount();
  console.log('memeCount:', memeCount.toNumber());
  const memesWithVotes = [];
  for (let i = 0; i < memeCount.toNumber(); i++) {
    try {
      const name = await contract.getName(i);
      const votes = (await contract.getVotes(i)).toNumber();
      console.log(`Мем ID ${i}: name=${name}, votes=${votes}`);
      memesWithVotes.push({ id: i, title: name, votes });
    } catch (error) {
      console.error(`Ошибка загрузки мем ID ${i}:`, error);
    }
  }
  return memesWithVotes;
}

// Голосование за мем
export async function voteMeme(memeId) {
  if (!contract) throw new Error('Сначала подключите кошелек!');
  try {
    const userAddress = await signer.getAddress();
    console.log('Адрес пользователя:', userAddress);
    const memeCount = await contract.memeCount();
    console.log('memeCount:', memeCount.toNumber());
    if (memeId >= memeCount.toNumber()) {
      console.log('Ошибка: мем с ID', memeId, 'не существует');
      alert('Мем с таким ID не существует.');
      return false;
    }
    console.log('Проверка hasVoted для memeId:', memeId);
    const voted = await contract.hasVoted(userAddress, memeId);
    console.log('hasVoted результат:', voted);
    if (voted) {
      console.log('Пользователь уже голосовал за мем ID:', memeId);
      alert('Вы уже голосовали за этот мем.');
      return false;
    }
    const estimatedGas = await contract.estimateGas.vote(memeId);
    console.log('Оценка газа для vote:', estimatedGas.toString());
    const tx = await contract.vote(memeId, { gasLimit: estimatedGas.mul(120).div(100) });
    console.log('Транзакция отправлена:', tx.hash);
    await tx.wait();
    console.log('Голос успешно отдан');
    return true;
  } catch (error) {
    console.error('Ошибка при голосовании:', error);
    alert('Ошибка при голосовании: ' + error.message);
    return false;
  }
}

// Добавление нового мема
export async function addMeme(name) {
  if (!contract) throw new Error('Сначала подключите кошелек!');
  try {
    const memeCountBefore = await contract.memeCount();
    console.log('memeCount до добавления:', memeCountBefore.toNumber());
    const estimatedGas = await contract.estimateGas.addMeme(name);
    console.log('Оценка газа для addMeme:', estimatedGas.toString());
    const tx = await contract.addMeme(name, { gasLimit: estimatedGas.mul(120).div(100) });
    console.log('Транзакция отправлена:', tx.hash);
    await tx.wait();
    const memeCountAfter = await contract.memeCount();
    console.log('memeCount после добавления:', memeCountAfter.toNumber());
    return true;
  } catch (error) {
    console.error('Ошибка при добавлении мема:', error);
    alert('Ошибка при добавлении мема: ' + error.message);
    return false;
  }
}
