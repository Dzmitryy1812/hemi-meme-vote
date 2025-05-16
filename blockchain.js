import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';

// Адрес и ABI контракта
const contractAddress = '0x715045cea81d1DcC604b6A379B94D6049CDaa5a0';
const contractABI = [
  // (Твой ABI остается прежним, см. предыдущий код)
  // ... (вставь полный ABI здесь)
];

let provider;
let signer;
let contract = null; // Инициализируем как null

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
    console.log('Подключен к контракту:', contract.address, 'Сеть:', await provider.getNetwork());
    return true;
  } catch (error) {
    console.error('Ошибка подключения кошелька:', error);
    contract = null; // Сбрасываем contract при ошибке
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
    console.log
