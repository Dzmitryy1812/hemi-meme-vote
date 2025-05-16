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
let contract = null;

// Подключение кошелька
export async function connectWallet() {
  try {
    if (!window.ethereum) {
      alert('Пожалуйста, установите MetaMask!');
      return false;
    }
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    signer = provider.getSigner();
    contract = new ethers.Contract(contractAddress, contractABI, signer);
    const network = await provider.getNetwork();
    console.log('Подключен к контракту:', contract.address, 'Сеть:', network.name, 'chainId:', network.chainId);
    // Проверка доступности контракта
    const code = await provider.getCode(contractAddress);
    console.log('Код контракта:', code);
    if (code === '0x') {
      console.error('Контракт не существует по указанному адресу');
      throw new Error('Контракт не существует по адресу ' + contractAddress);
    }
    try {
      const memeCount = await contract.memeCount();
      console.log('memeCount из контракта:', memeCount.toNumber());
    } catch (error) {
      console.error('Ошибка проверки memeCount:', error);
      throw new Error('Контракт не соответствует ABI: ' + error.message);
    }
    return true;
  } catch (error) {
    console.error('Ошибка подключения кошелька:', error);
    contract = null;
    return false;
  }
}

// Функция для проверки состояния контракта
export function getContract() {
  return contract;
}

// Загрузка мемов с голосами из контракта
export async function loadMemes() {
  const currentContract = getContract();
  if (!currentContract) throw new Error('Сначала подключите кошелек!');
  try {
    const memeCount = await currentContract.memeCount();
    console.log('memeCount:', memeCount.toNumber());
    const memesWithVotes = [];
    for (let i = 0; i < memeCount.toNumber(); i++) {
      try {
        const name = await currentContract.getName(i);
        const votes = (await currentContract.getVotes(i)).toNumber();
        console.log(`Мем ID ${i}: name=${name}, votes=${votes}`);
        memesWithVotes.push({ id: i, title: name, votes });
      } catch (error) {
        console.error(`Ошибка загрузки мем ID ${i}:`, error);
      }
    }
    return memesWithVotes;
  } catch (error) {
    console.error('Ошибка в loadMemes:', error);
    throw error;
  }
}

// Голосование за мем
export async function voteMeme(memeId) {
  const currentContract = getContract();
  if (!currentContract) throw new Error('Сначала подключите кошелек!');
  try {
    const userAddress = await signer.getAddress();
    console.log('Адрес пользователя:', userAddress);
    const memeCount = await currentContract.memeCount();
    console.log('memeCount:', memeCount.toNumber());
    if (memeId >= memeCount.toNumber()) {
      console.log('Ошибка: мем с ID', memeId, 'не существует');
      alert('Мем с таким ID не существует.');
      return false;
    }
    const voted = await currentContract.hasVoted(userAddress, memeId);
    console.log('hasVoted результат:', voted);
    if (voted) {
      console.log('Пользователь уже голосовал за мем ID:', memeId);
      alert('Вы уже голосовали за этот мем.');
      return false;
    }
    const estimatedGas = await currentContract.estimateGas.vote(memeId);
    console.log('Оценка газа для vote:', estimatedGas.toString());
    const tx = await currentContract.vote(memeId, { gasLimit: estimatedGas.mul(120).div(100) });
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
  const currentContract = getContract();
  if (!currentContract) throw new Error('Сначала подключите кошелек!');
  try {
    const memeCountBefore = await currentContract.memeCount();
    console.log('memeCount до добавления:', memeCountBefore.toNumber());
    const estimatedGas = await currentContract.estimateGas.addMeme(name);
    console.log('Оценка газа для addMeme:', estimatedGas.toString());
    const tx = await currentContract.addMeme(name, { gasLimit: estimatedGas.mul(120).div(100) });
    console.log('Транзакция отправлена:', tx.hash);
    await tx.wait();
    const memeCountAfter = await currentContract.memeCount();
    console.log('memeCount после добавления:', memeCountAfter.toNumber());
    return true;
  } catch (error) {
    console.error('Ошибка при добавлении мема:', error);
    throw error;
  }
}
