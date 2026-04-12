// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract SafetyProofVerifier is Ownable {
    error InvalidInput();

    address public proofSigner;

    event ProofSignerUpdated(address indexed previousSigner, address indexed newSigner);

    constructor(address initialProofSigner, address initialOwner) Ownable(initialOwner == address(0) ? msg.sender : initialOwner) {
        if (initialProofSigner == address(0)) {
            revert InvalidInput();
        }

        proofSigner = initialProofSigner;
        emit ProofSignerUpdated(address(0), initialProofSigner);
    }

    function setProofSigner(address newProofSigner) external onlyOwner {
        if (newProofSigner == address(0)) {
            revert InvalidInput();
        }

        emit ProofSignerUpdated(proofSigner, newProofSigner);
        proofSigner = newProofSigner;
    }

    function verify(bytes32 signalHash, bytes calldata proof) external view returns (bool) {
        if (signalHash == bytes32(0)) {
            return false;
        }

        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(signalHash);
        (address recovered, ECDSA.RecoverError recoverError, ) = ECDSA.tryRecover(digest, proof);

        return recoverError == ECDSA.RecoverError.NoError && recovered == proofSigner;
    }
}