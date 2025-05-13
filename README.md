# Hemi Meme Voting

This project is a decentralized meme voting platform powered by the **Hemi Virtual Machine (HVM)**, where users can view and vote for memes uploaded by others. The entire voting process and meme storage are handled directly on the blockchain for transparency, security, and decentralization.

## Features

- **Meme Upload**: Users can upload their memes through the website by providing a URL. These memes are stored and made available for voting.
- **Voting System**: Users can vote on the memes displayed on the site. The voting process is recorded on the blockchain, ensuring fairness and transparency.
- **Blockchain Integration **: All meme-related data, such as votes and meme URLs, are stored and processed on the **Hemi Virtual Machine (HVM)**, making the system scalable and decentralized.
- **Decentralized & Transparent**: All votes are stored on the blockchain, so users can verify results and ensure that no votes are tampered with.
- **Frontend Interface**: A user-friendly frontend (web interface) allows users to easily view, upload, and vote on memes.

## Architecture

1. **Frontend (Website)**:
   - Displays a list of memes uploaded by users.
   - Allows users to vote on memes.
   - Provides a simple, intuitive interface where users can see the meme count, view uploaded memes, and cast votes.

2. **Backend (Smart Contract)**:
   - The smart contract handles all the business logic for meme uploads and voting.
   - **Smart Contract**: Written in Solidity, deployed on the **Hemi Virtual Machine (HVM)**, and interacts with the frontend via web3.js or ethers.js.
   - All meme data and vote counts are managed on-chain for maximum transparency.

3. **Hemi Virtual Machine (HVM)**:
   - HVM powers the backend, processing all transactions such as meme uploads and votes, ensuring decentralization.
   - The smart contract will be deployed on the HVM network, with all interactions stored on the blockchain.

## Smart Contract

The smart contract enables users to upload memes, vote for them, and track votes in a transparent way. Here's the basic functionality:

- **Upload Meme**: Users upload a meme by providing a URL. The smart contract stores this meme's data (URL, uploader) and assigns it an ID.
- **Vote for Meme**: Users can vote for memes by their ID. The contract keeps track of the number of votes each meme has.
- **View Memes**: Users can view memes and vote for them, all via the website. The meme data is fetched directly from the blockchain.
  
### Contract Overview

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MemeVoting {
    address public owner;
    uint256 public memeCount = 0;

    struct Meme {
        string cid; // CID картинки из IPFS
        uint256 votes;
    }

    mapping(uint256 => Meme) public memes;
    mapping(address => mapping(uint256 => bool)) public hasVoted; // голосовавшие

    event MemeAdded(uint256 memeId, string cid);
    event Voted(uint256 memeId, address voter);

    constructor() {
        owner = msg.sender;
    }

    function addMeme(string memory _cid) public returns (uint256) {
        require(msg.sender == owner, "Only owner can add memes");

        memes[memeCount] = Meme({
            cid: _cid,
            votes: 0
        });

        emit MemeAdded(memeCount, _cid);
        memeCount++;
        return memeCount - 1;
    }

    function vote(uint256 _memeId) public {
        require(!hasVoted[msg.sender][_memeId], "Already voted for this meme");
        require(_memeId < memeCount, "Meme does not exist");

        memes[_memeId].votes += 1;
        hasVoted[msg.sender][_memeId] = true;

        emit Voted(_memeId, msg.sender);
    }

    function getVotes(uint256 _memeId) public view returns (uint256) {
        return memes[_memeId].votes;
    }

    function getCid(uint256 _memeId) public view returns (string memory) {
        return memes[_memeId].cid;
    }
}
