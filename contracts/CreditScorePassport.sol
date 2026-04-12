// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CreditScorePassport {
    error Unauthorized();
    error InvalidInput();

    struct ScoreRecord {
        uint16 score;
        uint64 updatedAt;
        bool exists;
    }

    address public owner;
    uint256 public nextTokenId;

    mapping(uint256 => address) public ownerOf;
    mapping(address => uint256) public tokenOf;
    mapping(uint256 => ScoreRecord) public scoreOf;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event PassportMinted(address indexed user, uint256 indexed tokenId, uint16 score);
    event ScoreUpdated(uint256 indexed tokenId, uint16 previousScore, uint16 newScore, uint64 updatedAt);

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert Unauthorized();
        }
        _;
    }

    constructor(address initialOwner) {
        owner = initialOwner == address(0) ? msg.sender : initialOwner;
        emit OwnershipTransferred(address(0), owner);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) {
            revert InvalidInput();
        }

        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function mintPassport(address user, uint16 initialScore) external onlyOwner returns (uint256 tokenId) {
        if (user == address(0) || tokenOf[user] != 0 || initialScore > 1000) {
            revert InvalidInput();
        }

        tokenId = ++nextTokenId;
        ownerOf[tokenId] = user;
        tokenOf[user] = tokenId;
        scoreOf[tokenId] = ScoreRecord({
            score: initialScore,
            updatedAt: uint64(block.timestamp),
            exists: true
        });

        emit PassportMinted(user, tokenId, initialScore);
    }

    function updateScore(uint256 tokenId, uint16 newScore) external onlyOwner {
        if (newScore > 1000 || !scoreOf[tokenId].exists) {
            revert InvalidInput();
        }

        uint16 previous = scoreOf[tokenId].score;
        scoreOf[tokenId].score = newScore;
        scoreOf[tokenId].updatedAt = uint64(block.timestamp);

        emit ScoreUpdated(tokenId, previous, newScore, uint64(block.timestamp));
    }
}
