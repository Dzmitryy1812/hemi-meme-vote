import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";

const contractAddress = "0x715045cea81d1dcc604b6a379b94d6049cdaa5a0";
const contractABI = [ /* ABI вставь сюда */ ];

let provider;
let signer;
let contract;

export async function connectContract() {
    if (window.ethereum) {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        contract = new ethers.Contract(contractAddress, contractABI, signer);
        return contract;
    } else {
        alert("Metamask не найден");
    }
}
