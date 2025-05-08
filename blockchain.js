// blockchain.js
import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';

// Адрес и ABI контракта
const contractAddress = '0x04cAEc2fA8Cf5b0D1AC71B61A12917456d2f27BC';
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

// Локальный массив мемов (НЕ из контракта)
const staticMemes = [
  { id: 0, title: 'Classic Doge', url: 'https://dzmitryy1812.github.io/public/memes/1.jpg', author: 'memelord#1234' },
  { id: 1, title: 'Surprised Pikachu', url: 'https://dzmitryy1812.github.io/public/memes/2.jpg', author: 'pokefan#5678' },
  { id: 2, title: 'Success Kid', url: 'https://dzmitryy1812.github.io/public/memes/3.jpg', author: 'kidlover#9012' },
  { id: 3, title: 'Distracted Boyfriend', url: 'https://dzmitryy1812.github.io/public/memes/4.jpg', author: 'relshipmeme#3456' },
  { id: 4, title: 'Evil Kermit', url: 'https://dzmitryy1812.github.io/public/memes/5.jpg', author: 'muppets#7890' },
  { id: 5, title: 'Drake Reaction', url: 'https://dzmitryy1812.github.io/public/memes/6.jpg', author: 'drakepost#1234' }
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
  return true;
}

// Загрузка мемов с голосами из контракта
export async function loadMemes() {
  if (!contract) throw new Error('Сначала подключите кошелек!');
  const memesWithVotes = [];
  for (const meme of staticMemes) {
    let votes = 0;
    try {
      votes = (await contract.getVotes(meme.id)).toNumber();
    } catch (error) {
      votes = 0;
    }
    memesWithVotes.push({ ...meme, votes });
  }
  return memesWithVotes;
}

// Голосование за мем
export async function voteMeme(memeId) {
  if (!contract) throw new Error('Сначала подключите кошелек!');
  try {
    const userAddress = await signer.getAddress();
    const voted = await contract.hasVoted(userAddress, memeId);
    if (voted) {
      alert('Вы уже голосовали за этот мем.');
      return false;
    }
    const tx = await contract.vote(memeId);
    await tx.wait();
    alert('Голос успешно отдан!');
    return true;
  } catch (error) {
    alert('Ошибка при голосовании: ' + error.message);
    return false;
  }
}

// Добавление нового мема (если нужно)
export async function addMeme(name) {
  if (!contract) throw new Error('Сначала подключите кошелек!');
  try {
    const tx = await contract.addMeme(name);
    await tx.wait();
    alert('Мем успешно добавлен!');
    return true;
  } catch (error) {
    alert('Ошибка при добавлении мемa: ' + error.message);
    return false;
  }
}
