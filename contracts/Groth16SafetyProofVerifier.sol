// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IHealthCheckGroth16Verifier {
    function verifyProof(
        uint[2] calldata pA,
        uint[2][2] calldata pB,
        uint[2] calldata pC,
        uint[1] calldata pubSignals
    ) external view returns (bool);
}

contract Groth16SafetyProofVerifier {
    error InvalidInput();

    struct ProofPayload {
        uint256[2] pA;
        uint256[2][2] pB;
        uint256[2] pC;
        uint256[1] pubSignals;
        bytes32 signalHash;
    }

    address public immutable verifier;

    constructor(address verifierAddress) {
        if (verifierAddress == address(0)) {
            revert InvalidInput();
        }

        verifier = verifierAddress;
    }

    function verify(bytes32 signalHash, bytes calldata proof) external view returns (bool) {
        if (signalHash == bytes32(0) || proof.length == 0) {
            return false;
        }

        ProofPayload memory payload = abi.decode(proof, (ProofPayload));
        if (payload.signalHash != signalHash) {
            return false;
        }

        return
            IHealthCheckGroth16Verifier(verifier).verifyProof(
                payload.pA,
                payload.pB,
                payload.pC,
                payload.pubSignals
            );
    }
}
