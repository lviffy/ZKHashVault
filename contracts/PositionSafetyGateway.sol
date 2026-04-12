// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ISafetyProofVerifier {
    function verify(bytes32 signalHash, bytes calldata proof) external view returns (bool);
}

contract PositionSafetyGateway {
    error InvalidInput();
    error ProofRejected();

    event SafetyProofVerified(address indexed user, bytes32 indexed signalHash, bool accepted);

    address public immutable verifier;

    constructor(address verifierAddress) {
        if (verifierAddress == address(0)) {
            revert InvalidInput();
        }
        verifier = verifierAddress;
    }

    function verifyPositionSafety(bytes32 signalHash, bytes calldata proof) external returns (bool) {
        if (signalHash == bytes32(0) || proof.length == 0) {
            revert InvalidInput();
        }

        bool accepted = ISafetyProofVerifier(verifier).verify(signalHash, proof);
        if (!accepted) {
            revert ProofRejected();
        }

        emit SafetyProofVerified(msg.sender, signalHash, true);
        return true;
    }
}
