import { contractAddress, contractABI } from './contractConfig.js';

let provider;
let signer;
let contract;

export async function connectWallet() {
  console.log('Starting connectWallet, window.ethereum:', typeof window.ethereum);
  if (typeof window.ethereum === 'undefined') {
    console.error('MetaMask is not installed');
    window.Swal.fire('Ошибка', 'Установите MetaMask для подключения кошелька.', 'error');
    return false;
  }
  try {
    provider = new window.ethers.providers.Web3Provider(window.ethereum);
    const network = await provider.getNetwork();
    console.log('Current chainId:', window.ethers.utils.hexValue(network.chainId));
    const hemiChainId = '0xa867';
    if (network.chainId !== parseInt(hemiChainId, 16)) {
      console.log('Switching to Hemi Network');
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: hemiChainId }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          console.log('Hemi Network not found, adding chain');
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: hemiChainId,
              chainName: 'Hemi',
              rpcUrls: ['https://rpc.hemi.network/rpc'],
              nativeCurrency: { name: 'Hemi', symbol: 'HMI', decimals: 18 },
              blockExplorerUrls: ['https://explorer.hemi.xyz'],
            }],
          });
        } else {
          console.error('Switch chain error:', switchError);
          window.Swal.fire('Ошибка', 'Ошибка переключения на сеть Hemi: ' + switchError.message, 'error');
          return false;
        }
      }
    }
    console.log('Requesting accounts');
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    console.log('Connected account:', accounts[0]);
    return true;
  } catch (error) {
    console.error('Wallet connection error:', error);
    window.Swal.fire('Ошибка', 'Ошибка подключения кошелька: ' + error.message, 'error');
    return false;
  }
}

export function handleDisconnect() {
  console.log('Disconnecting wallet');
  provider = null;
  signer = null;
  contract = null;
  document.getElementById('connectButton').textContent = 'Connect Wallet';
  document.getElementById('memeList').innerHTML = '';
  window.Swal.fire('Успех', 'Кошелёк отключён.', 'success');
}

export async function initializeContract() {
  console.log('Initializing contract');
  if (typeof window.ethers === 'undefined') {
    console.error('ethers is not loaded');
    window.Swal.fire('Ошибка', 'Библиотека ethers не загружена.', 'error');
    return false;
  }
  try {
    if (!provider) {
      console.error('Provider not initialized, connecting wallet');
      if (!(await connectWallet())) {
        return false;
      }
    }
    signer = provider.getSigner();
    contract = new window.ethers.Contract(contractAddress, contractABI, signer);
    const code = await provider.getCode(contractAddress);
    if (code === '0x') {
      console.error('Contract not found at address:', contractAddress);
      window.Swal.fire('Ошибка', 'Контракт не существует по адресу ' + contractAddress, 'error');
      return false;
    }
    console.log('Contract initialized successfully at address:', contractAddress);
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
    
    // Пробуем индексацию с 0 до memeCount-1
    console.log('Проверка мемов с индексацией от 0 до', memeCount.toNumber() - 1);
    for (let i = 0; i < memeCount; i++) {
      try {
        const name = await contract.getName(i);
        if (!name || name === '') {
          console.warn(`Мем ID ${i} имеет пустое имя, пропускаем`);
          continue;
        }
        const votes = await contract.getVotes(i);
        console.log(`Мем ID ${i}: name=${name}, votes=${votes.toNumber()}`);
        memes.push({ id: i, title: name, votes: votes.toNumber() });
      } catch (error) {
        console.error(`Ошибка загрузки мема ID ${i}:`, error.message);
        continue;
      }
    }

    // Если ничего не загрузилось, пробуем индексацию с 1 до memeCount
    if (memes.length === 0 && memeCount.toNumber() > 0) {
      console.log('Проверка мемов с индексацией от 1 до', memeCount.toNumber());
      for (let i = 1; i <= memeCount; i++) {
        try {
          const name = await contract.getName(i);
          if (!name || name === '') {
            console.warn(`Мем ID ${i} имеет пустое имя, пропускаем`);
            continue;
          }
          const votes = await contract.getVotes(i);
          console.log(`Мем ID ${i}: name=${name}, votes=${votes.toNumber()}`);
          memes.push({ id: i, title: name, votes: votes.toNumber() });
        } catch (error) {
          console.error(`Ошибка загрузки мема ID ${i}:`, error.message);
          continue;
        }
      }
    }

    if (memes.length === 0 && memeCount.toNumber() > 0) {
      console.warn('Не удалось загрузить ни одного мема');
      window.Swal.fire('Предупреждение', 'Не удалось загрузить мемы. Проверьте контракт или индексацию.', 'warning');
    }
    console.log('Загруженные мемы:', memes);
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
