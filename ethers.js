import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';
import Swal from 'https://cdn.jsdelivr.net/npm/sweetalert2@11';
import { contractAddress, contractABI } from './contractConfig.js';
import { connectWallet, HEMI_NETWORK } from './connectButton.js';

let provider;
let signer;
let contract;

export async function initializeContract() {
  try {
    if (!(await connectWallet())) {
      return false;
    }
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    contract = new ethers.Contract(contractAddress, contractABI, signer);
    const code = await provider.getCode(contractAddress);
    if (code === '0x') {
      Swal.fire('Ошибка', 'Контракт не существует по адресу ' + contractAddress, 'error');
      return false;
    }
    return true;
  } catch (error) {
    Swal.fire('Ошибка', 'Ошибка инициализации контракта: ' + error.message, 'error');
    return false;
  }
}

export async function loadMemes() {
  if (!contract) {
    Swal.fire('Ошибка', 'Подключите кошелек', 'error');
    throw new Error('Подключите кошелек');
  }
  try {
    const memeCount = await contract.memeCount();
    const memesWithVotes = [];
    for (let i = 0; i < memeCount.toNumber(); i++) {
      try {
        const name = await contract.getName(i);
        const votes = (await contract.getVotes(i)).toNumber();
        memesWithVotes.push({ id: i, title: name, votes });
      } catch (error) {
        console.error(`Ошибка загрузки мем ID ${i}:`, error);
      }
    }
    return memesWithVotes;
  } catch (error) {
    Swal.fire('Ошибка', 'Ошибка загрузки мемов: ' + error.message, 'error');
    throw error;
  }
}

export async function voteMeme(memeId) {
  if (!contract) {
    Swal.fire('Ошибка', 'Подключите кошелек', 'error');
    throw new Error('Подключите кошелек');
  }
  try {
    const memeCount = await contract.memeCount();
    if (memeId >= memeCount.toNumber()) {
      Swal.fire('Ошибка', 'Мем с таким ID не существует.', 'error');
      return false;
    }
    const userAddress = await signer.getAddress();
    const voted = await contract.hasVoted(userAddress, memeId);
    if (voted) {
      Swal.fire('Ошибка', 'Вы уже голосовали за этот мем.', 'error');
      return false;
    }
    const estimatedGas = await contract.estimateGas.vote(memeId);
    const tx = await contract.vote(memeId, { gasLimit: estimatedGas.mul(120).div(100) });
    await tx.wait();
    Swal.fire('Успех', 'Голос учтён!', 'success');
    return true;
  } catch (error) {
    Swal.fire('Ошибка', 'Ошибка при голосовании: ' + error.message, 'error');
    return false;
  }
}

export async function addMeme(name) {
  if (!contract) {
    Swal.fire('Ошибка', 'Подключите кошелек', 'error');
    throw new Error('Подключите кошелек');
  }
  try {
    const owner = await contract.owner();
    const userAddress = await signer.getAddress();
    if (owner.toLowerCase() !== userAddress.toLowerCase()) {
      Swal.fire('Ошибка', 'Только владелец контракта может добавлять мемы.', 'error');
      return false;
    }
    const estimatedGas = await contract.estimateGas.addMeme(name);
    const tx = await contract.addMeme(name, { gasLimit: estimatedGas.mul(120).div(100) });
    await tx.wait();
    Swal.fire('Успех', 'Мем успешно добавлен!', 'success');
    return true;
  } catch (error) {
    Swal.fire('Ошибка', 'Ошибка при добавлении мема: ' + error.message, 'error');
    return false;
  }
}
