import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';
import Swal from 'https://cdn.jsdelivr.net/npm/sweetalert2@11';
import { contractAddress, contractABI } from './contractConfig.js';
import { connectWallet, HEMI_NETWORK } from './connectButton.js';

let provider;
let signer;
let contract = null;

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
    const memeCount = await contract.memeCount();
    console.log('memeCount из контракта:', memeCount.toNumber());
    listenToContractEvents();
    return true;
  } catch (error) {
    Swal.fire('Ошибка', 'Ошибка инициализации контракта: ' + error.message, 'error');
    contract = null;
    return false;
  }
}

export function getContract() {
  return contract;
}

export async function loadMemes() {
  const currentContract = getContract();
  if (!currentContract) {
    Swal.fire('Ошибка', 'Сначала подключите кошелек!', 'error');
    throw new Error('Сначала подключите кошелек!');
  }
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
    Swal.fire('Ошибка', 'Ошибка загрузки мемов: ' + error.message, 'error');
    throw error;
  }
}

export async function voteMeme(memeId) {
  const currentContract = getContract();
  if (!currentContract) {
    Swal.fire('Ошибка', 'Сначала подключите кошелек!', 'error');
    throw new Error('Сначала подключите кошелек!');
  }
  try {
    const userAddress = await signer.getAddress();
    const memeCount = await currentContract.memeCount();
    if (memeId >= memeCount.toNumber()) {
      Swal.fire('Ошибка', 'Мем с таким ID не существует.', 'error');
      return false;
    }
    const voted = await currentContract.hasVoted(userAddress, memeId);
    if (voted) {
      Swal.fire('Ошибка', 'Вы уже голосовали за этот мем.', 'error');
      return false;
    }
    const estimatedGas = await currentContract.estimateGas.vote(memeId);
    const tx = await currentContract.vote(memeId, { gasLimit: estimatedGas.mul(120).div(100) });
    await tx.wait();
    Swal.fire('Успех', 'Голос успешно отдан!', 'success');
    return true;
  } catch (error) {
    Swal.fire('Ошибка', 'Ошибка при голосовании: ' + error.message, 'error');
    return false;
  }
}

export async function addMeme(name) {
  const currentContract = getContract();
  if (!currentContract) {
    Swal.fire('Ошибка', 'Сначала подключите кошелек!', 'error');
    throw new Error('Сначала подключите кошелек!');
  }
  try {
    const owner = await currentContract.owner();
    const userAddress = await signer.getAddress();
    if (owner.toLowerCase() !== userAddress.toLowerCase()) {
      Swal.fire('Ошибка', 'Только владелец контракта может добавлять мемы.', 'error');
      return false;
    }
    const estimatedGas = await currentContract.estimateGas.addMeme(name);
    const tx = await currentContract.addMeme(name, { gasLimit: estimatedGas.mul(120).div(100) });
    await tx.wait();
    Swal.fire('Успех', 'Мем успешно добавлен!', 'success');
    return true;
  } catch (error) {
    Swal.fire('Ошибка', 'Ошибка при добавлении мема: ' + error.message, 'error');
    return false;
  }
}

function listenToContractEvents() {
  if (!contract) return;
  contract.on('MemeAdded', (memeId, name) => {
    console.log(`Новый мем добавлен: ID=${memeId}, Название=${name}`);
    loadMemes().then(updateMemeListUI);
  });
  contract.on('Voted', (memeId, voter) => {
    console.log(`Голос за мем ID=${memeId} от ${voter}`);
    loadMemes().then(updateMemeListUI);
  });
}

async function updateMemeListUI(memes) {
  const memeList = document.getElementById('memeList');
  if (!memeList) return;
  memeList.innerHTML = '';
  memes.forEach(meme => {
    const memeElement = document.createElement('div');
    memeElement.innerHTML = `
      <div class="meme-card">
        <h3>${meme.title}</h3>
        <p>Голосов: ${meme.votes}</p>
        <button onclick="voteMeme(${meme.id})">Голосовать</button>
      </div>
    `;
    memeList.appendChild(memeElement);
  });
}
