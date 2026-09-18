// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * AGRI-LINK batch anchor.
 *
 * Purpose: permanently record a hash of each supply-chain event on a public
 * blockchain, so anyone can independently verify the record existed at a
 * given time and hasn't been altered since.
 *
 * Design note: we deliberately store only a HASH, never the farmer's or
 * buyer's personal data. Blockchain data is public and permanent — putting
 * names, phone numbers or prices on-chain would expose them forever with no
 * way to delete. The hash proves integrity; the readable data stays in
 * Firestore where it can be corrected or deleted if needed.
 */
contract AgriLinkAnchor {

    struct Anchor {
        bytes32 dataHash;   // SHA-256 of the event payload
        uint256 timestamp;  // block time when recorded
        address recorder;   // wallet that submitted it
    }

    // batchId (as bytes32) => list of anchors for that batch's lifecycle
    mapping(bytes32 => Anchor[]) private anchors;

    event BatchAnchored(
        bytes32 indexed batchId,
        bytes32 dataHash,
        string eventType,
        uint256 timestamp,
        address recorder
    );

    /**
     * Record a new event hash for a batch.
     * eventType is a human-readable label ("listed", "agreement_signed",
     * "delivered", "rated") emitted in the log for easy explorer reading.
     */
    function recordBatch(
        bytes32 batchId,
        bytes32 dataHash,
        string calldata eventType
    ) external {
        anchors[batchId].push(Anchor({
            dataHash: dataHash,
            timestamp: block.timestamp,
            recorder: msg.sender
        }));

        emit BatchAnchored(batchId, dataHash, eventType, block.timestamp, msg.sender);
    }

    /** How many events have been anchored for this batch. */
    function getAnchorCount(bytes32 batchId) external view returns (uint256) {
        return anchors[batchId].length;
    }

    /** Read a specific anchor for a batch. */
    function getAnchor(bytes32 batchId, uint256 index)
        external
        view
        returns (bytes32 dataHash, uint256 timestamp, address recorder)
    {
        require(index < anchors[batchId].length, "Index out of range");
        Anchor storage a = anchors[batchId][index];
        return (a.dataHash, a.timestamp, a.recorder);
    }

    /**
     * Verify a hash you computed locally matches one anchored on-chain
     * for this batch. Returns true if any anchor for the batch matches.
     */
    function verifyHash(bytes32 batchId, bytes32 dataHash)
        external
        view
        returns (bool)
    {
        Anchor[] storage list = anchors[batchId];
        for (uint256 i = 0; i < list.length; i++) {
            if (list[i].dataHash == dataHash) {
                return true;
            }
        }
        return false;
    }
}
