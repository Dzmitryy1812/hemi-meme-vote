import { contractAddress, contractABI } from './contractConfig.js';
import { connectWallet } from './connectButton.js';

let provider;
let signer;
let contract;

export async function initializeContract() {
  console.log('Initializing contract');
  if (typeof window.ethers === 'undefined') {
    console.error('ethers is not loaded');
    window.Swal.fire('Ошибка', 'Библиотека ethers не загружена.', 'error');
    return false;
  }
  try {
    if (!(await connectWallet())) {
      console.error('Wallet connection failed');
      return false;
    }
    provider = new window.ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    contract = new window.ethers.Contract(contractAddress, contractABI, signer);
    const code = await provider.getCode(contractAddress);
    if (code === '0x') {
      console.error('Contract not found at address:', contractAddress);
      window.Swal.fire('Ошибка', 'Контракт не существует по адресу ' + contractAddress, 'error');
      return false;
    }
    console.log('Contract initialized successfully');
    return true;
  } catch (error) {
    console.error('Contract initialization error:', error);
    window.Swal.fire('Ошибка', 'Ошибка инициализации контракта: ' + error.message, 'error');
    return false;
  }
}

export async function loadMemes() {
  if (!contract) {
    console.error('No contract available');
    window.Swal.fire('Ошибка', 'Сначала подключите кошелек!', 'error');
    throw new Error('Сначала подключите кошелек!');
  }
  try {
    const memeCount = await contract.memeCount();
    console.log('memeCount:', memeCount.toNumber());
    const memes = [];
    for (let i = 0; i < memeCount; i++) {
      try {
        // Проверяем существование мема через getName
        const name = await contract.getName(i);
        if (!name || name === '') {
          console.warn(`Мем ID ${i} имеет пустое имя, пропускаем`);
          continue;
        }
        const votes = await contract.getVotes(i);
        console.log(`Мем ID ${i}: name=${name}, votes=${votes.toNumber()}`);
        memes.push({ id: i, title: name, votes: votes.toNumber() });
      } catch (error) {
        console.error(`Ошибка загрузки мема ID ${i}:`, error);
        // Пропускаем проблемный мем
        continue;
      }
    }
    if (memes.length === 0 && memeCount.toNumber() > 0) {
      console.warn('Не удалось загрузить ни одного мема');
      window.Swal.fire('Предупреждение', 'Не удалось загрузить мемы. Возможно, контракт пуст или повреждён.', 'warning');
    }
    return memes;
  } catch (error) {
    console.error('Error loading memes:', error);
    window.Swal.fire('Ошибка', 'Ошибка загрузки мемов: ' + error.message, 'error');
    throw error;
  }
}

export async function voteMeme(memeId) {
  if (!contract) {
    console.error('No contract available');
    window.Swal.fire('Ошибка', 'Сначала подключите кошелек!', 'error');
    throw new Error('Сначала подключите кошелек!');
  }
  try {
    const tx = await contract.vote(memeId);
    await tx.wait();
    window.Swal.fire('Успех', 'Голос успешно отдан!', 'success');
  } catch (error) {
    console.error('Voting error:', error);
    window.Swal.fire('Ошибка', 'Ошибка при голосовании: ' + error.message, 'error');
    throw error;
  }
}

export async function addMeme(name) {
  if (!contract) {
    console.error('No contract available');
    window.Swal.fire('Ошибка', 'Сначала подключите кошелек!', 'error');
    throw new Error('Сначала подключите кошелек!');
  }
  try {
    const tx = await contract.addMeme(name);
    await tx.wait();
    window.Swal.fire('Успех', 'Мем успешно добавлен!', 'success');
  } catch (error) {
    console.error('Error adding meme:', error);
    window.Swal.fire('Ошибка', 'Ошибка при добавлении мема: ' + error.message, 'error');
    throw error;
  }
}
