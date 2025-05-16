import Swal from 'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.mjs';
import { contractAddress, contractABI } from './contractConfig.js';
import { connectWallet, HEMI_NETWORK } from './connectButton.js';

const { ethers } = window;

let provider;
let signer;
let contract = null;

export async function initializeContract() {
  console.log('Initializing contract');
  try {
    if (!(await connectWallet())) {
      console.error('Wallet connection failed');
      return false;
    }
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    contract = new ethers.Contract(contractAddress, contractABI, signer);
    const code = await provider.getCode(contractAddress);
    if (code === '0x') {
      console.error('Contract not found at address:', contractAddress);
      Swal.fire('Ошибка', 'Контракт не существует по адресу ' + contractAddress, 'error');
      return false;
    }
    const memeCount = await contract.memeCount();
    console.log('memeCount from contract:', memeCount.toNumber());
    listenToContractEvents();
    return true;
  } catch (error) {
    console.error('Contract initialization error:', error);
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
    console.error('No contract available');
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
    console.error('Error in loadMemes:', error);
    Swal.fire('Ошибка', 'Ошибка загрузки мемов: ' + error.message, 'error');
    throw error;
  }
}

export async function voteMeme(memeId) {
  const currentContract = getContract();
  if (!currentContract) {
    console.error('No contract available for voting');
    Swal.fire('Ошибка', 'Сначала подключите кошелек!', 'error');
    throw new Error('Сначала подключите кошелек!');
  }
  try {
    const userAddress = await signer.getAddress();
    const memeCount = await currentContract.memeCount();
    if (memeId >= memeCount.toNumber()) {
      console.error('Meme ID does not exist:', memeId);
      Swal.fire('Ошибка', 'Мем с таким ID не существует.', 'error');
      return false;
    }
    const voted = await currentContract.hasVoted(userAddress, memeId);
    if (voted) {
      console.log('User already voted for meme ID:', memeId);
      Swal.fire('Ошибка', 'Вы уже голосовали за этот мем.', 'error');
      return false;
    }
    const estimatedGas = await currentContract.estimateGas.vote(memeId);
    console.log('Estimated gas for vote:', estimatedGas.toString());
    const tx = await currentContract.vote(memeId, { gasLimit: estimatedGas.mul(120).div(100) });
    console.log('Transaction sent:', tx.hash);
    await tx.wait();
    console.log('Vote successful');
    Swal.fire('Успех', 'Голос успешно отдан!', 'success');
    return true;
  } catch (error) {
    console.error('Voting error:', error);
    Swal.fire('Ошибка', 'Ошибка при голосовании: ' + error.message, 'error');
    return false;
  }
}

export async function addMeme(name) {
  const currentContract = getContract();
  if (!currentContract) {
    console.error('No contract available for adding meme');
    Swal.fire('Ошибка', 'Сначала подключите кошелек!', 'error');
    throw new Error('Сначала подключите кошелек!');
  }
  try {
    const owner = await currentContract.owner();
    const userAddress = await signer.getAddress();
    if (owner.toLowerCase() !== userAddress.toLowerCase()) {
      console.error('Not contract owner:', userAddress);
      Swal.fire('Ошибка', 'Только владелец контракта может добавлять мемы.', 'error');
      return false;
    }
    const estimatedGas = await currentContract.estimateGas.addMeme(name);
    console.log('Estimated gas for addMeme:', estimatedGas.toString());
    const tx = await currentContract.addMeme(name, { gasLimit: estimatedGas.mul(120).div(100) });
    console.log('Transaction sent:', tx.hash);
    await tx.wait();
    console.log('Meme added successfully');
    Swal.fire('Успех', 'Мем успешно добавлен!', 'success');
    return true;
  } catch (error) {
    console.error('Error adding meme:', error);
    Swal.fire('Ошибка', 'Ошибка при добавлении мема: ' + error.message, 'error');
    return false;
  }
}

function listenToContractEvents() {
  if (!contract) return;
  contract.on('MemeAdded', (memeId, name) => {
    console.log(`New meme added: ID=${memeId}, Name=${name}`);
    loadMemes().then(updateMemeListUI);
  });
  contract.on('Voted', (memeId, voter) => {
    console.log(`Vote for meme ID=${memeId} by ${voter}`);
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
      <div class="p-4 bg-white rounded-lg shadow-md">
        <h3 class="text-lg font-semibold">${meme.title}</h3>
        <p class="text-gray-600">Голосов: ${meme.votes}</p>
        <button onclick="voteMeme(${meme.id})" class="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Голосовать</button>
      </div>
    `;
    memeList.appendChild(memeElement);
  });
}
