// ============================================================
// AGRI-LINK — Blockchain anchoring (Ethereum Sepolia testnet)
// ============================================================
//
// ⚠️  SECURITY WARNING — READ THIS ⚠️
//
// This file contains a PRIVATE KEY embedded in the app. Anyone who has the
// APK can extract it in minutes. That is an accepted tradeoff ONLY because:
//   1. This wallet is on Ethereum SEPOLIA, a free TESTNET. The ETH in it has
//      no real-world value and comes from a free faucet.
//   2. This wallet is used for NOTHING else.
//
// NEVER put a private key here that holds real funds, and never reuse this
// wallet on Ethereum mainnet or any other live network. If this app ever goes
// beyond a prototype, transaction signing must move to a backend (Cloud
// Function / server) where the key is never shipped to the client.
//
// ============================================================

const BLOCKCHAIN_CONFIG = {
  // Ethereum Sepolia testnet
  rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
  chainId: 11155111,
  explorerBase: "https://sepolia.etherscan.io",

  // PASTE YOUR DEPLOYED CONTRACT ADDRESS HERE (from Remix, step 3 of
  // BLOCKCHAIN_SETUP.md). Looks like: "0xAbC123..."
  contractAddress: "0xccE2aAdF2cE5C4A8c8153eC36ed9FB7e9Fbff7dC",

  // PASTE YOUR THROWAWAY TESTNET WALLET'S PRIVATE KEY HERE.
  // Starts with "0x". See the warning above — testnet only, never real funds.
  privateKey: "0x203084aba1e4d9ab726b824b8468c8d4ca481a10e368ad18b290bd246b554039",
};

// Minimal ABI — just the function we call and the event we emit.
const ANCHOR_ABI = [
  "function recordBatch(bytes32 batchId, bytes32 dataHash, string eventType) external",
  "function verifyHash(bytes32 batchId, bytes32 dataHash) external view returns (bool)",
  "function getAnchorCount(bytes32 batchId) external view returns (uint256)",
  "event BatchAnchored(bytes32 indexed batchId, bytes32 dataHash, string eventType, uint256 timestamp, address recorder)"
];

function blockchainConfigured(){
  return BLOCKCHAIN_CONFIG.contractAddress.startsWith("0x")
      && BLOCKCHAIN_CONFIG.privateKey.startsWith("0x");
}

/**
 * Convert an arbitrary string (like a Firestore doc ID) into a bytes32
 * value the contract can index on.
 */
function toBytes32(str){
  return ethers.keccak256(ethers.toUtf8Bytes(str));
}

/**
 * Anchor an event hash on Ethereum Sepolia.
 * Returns { txHash, explorerUrl } on success, or null if not configured /
 * failed. Deliberately non-throwing: a blockchain failure must never block
 * the farmer from listing produce or the buyer from accepting it.
 */
async function anchorOnChain(batchId, dataHashHex, eventType){
  if(!blockchainConfigured()){
    console.warn("Blockchain not configured — skipping on-chain anchor.");
    return null;
  }
  if(typeof ethers === "undefined"){
    console.warn("ethers.js not loaded — skipping on-chain anchor.");
    return null;
  }
  try{
    const provider = new ethers.JsonRpcProvider(BLOCKCHAIN_CONFIG.rpcUrl);
    const wallet = new ethers.Wallet(BLOCKCHAIN_CONFIG.privateKey, provider);
    const contract = new ethers.Contract(BLOCKCHAIN_CONFIG.contractAddress, ANCHOR_ABI, wallet);

    const batchBytes32 = toBytes32(batchId);
    const hashBytes32 = "0x" + dataHashHex; // our SHA-256 hex, already 32 bytes

    const tx = await contract.recordBatch(batchBytes32, hashBytes32, eventType);
    await tx.wait(); // wait for it to be mined

    return {
      txHash: tx.hash,
      explorerUrl: `${BLOCKCHAIN_CONFIG.explorerBase}/tx/${tx.hash}`
    };
  }catch(err){
    console.error("On-chain anchor failed:", err);
    return null;
  }
}

/** Build an explorer link for a tx hash. */
function explorerUrlFor(txHash){
  return `${BLOCKCHAIN_CONFIG.explorerBase}/tx/${txHash}`;
}
