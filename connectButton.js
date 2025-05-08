// connectButton.js
import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';

let provider;
let signer;

export async function connectWallet() {
  const button = document.getElementById('connectButton');

  if (!window.ethereum) {
    alert("MetaMask is not installed!");
    return;
  }

  try {
    provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    const address = await signer.getAddress();

    button.innerHTML = `<i class="fas fa-unlink mr-2"></i>${shortenAddress(address)}`;
    button.classList.remove("bg-white/90", "text-orange-600");
    button.classList.add("bg-red-100", "text-red-600");
    button.onclick = disconnectWallet;

    console.log("Connected:", address);
  } catch (err) {
    console.error("Connection error:", err);
  }
}

function disconnectWallet() {
  const button = document.getElementById('connectButton');

  provider = null;
  signer = null;

  button.innerHTML = `<i class="fas fa-wallet mr-2"></i>Connect`;
  button.classList.remove("bg-red-100", "text-red-600");
  button.classList.add("bg-white/90", "text-orange-600");
  button.onclick = connectWallet;

  console.log("Disconnected");
}

function shortenAddress(addr) {
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}
