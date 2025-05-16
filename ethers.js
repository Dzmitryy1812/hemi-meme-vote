import { ethers } from 'ethers';

// Адрес вашего контракта
const contractAddress = '0x715045cea81d1DcC604b6A379B94D6049CDaa5a0';

// Ваш полный ABI
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

// Локальный массив мемов (можно заменить на динамическую загрузку из контракта)
const localMemes = [
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

// Подключение кошелька и инициализация контракта
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
  if (!contract) throw new Error('Подключите кошелек');

  const memesWithVotes = [];
  for (const meme of localMemes) {
    let votes = 0;
    try {
      votes = (await contract.getVotes(meme.id)).toNumber();
    } catch {
      votes = 0;
    }
    memesWithVotes.push({ ...meme, votes });
  }
  return memesWithVotes;
}

// Голосование за мем с проверкой hasVoted и корректным memeId
export async function voteMeme(memeId) {
  if (!contract) throw new Error('Сначала подключите кошелек!');
  try {
    const count = (await contract.memeCount()).toNumber();
    if (memeId < 0 || memeId >= count) {
      alert('Неверный ID мема');
      return false;
    }

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
    console.error('Ошибка при голосовании:', error);
    alert('Ошибка при голосовании: ' + error.message);
    return false;
  }
}

// Добавление нового мема (только для владельца)
export async function addMeme(name) {
  if (!contract) throw new Error('Подключите кошелек');
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
