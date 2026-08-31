// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title BridgeGateway
 * @notice Cross-chain bridge without chain ID in signature
 * Based on: Various bridge exploits (Wormhole, Ronin)
 */
contract BridgeGateway {
    mapping(address => uint256) public deposits;
    mapping(bytes32 => bool) public processed;
    
    struct BridgeMessage {
        address from;
        address to;
        uint256 amount;
        uint256 sourceChain;
    }

    function deposit() external payable {
        deposits[msg.sender] += msg.value;
    }

    function claimBridge(
        BridgeMessage memory message,
        bytes memory signature
    ) external {
        // BUG: No chain ID in the signed hash
        // Signature from chain A works on chain B too
        bytes32 msgHash = keccak256(abi.encodePacked(
            message.from,
            message.to,
            message.amount
            // BUG: message.sourceChain not included in hash
            // BUG: No nonce — replay possible
        ));

        // BUG: Signature verification missing
        // Anyone can call this with any message
        require(!processed[msgHash], "Already processed");
        processed[msgHash] = true;

        // Transfer without verifying source chain
        deposits[message.from] -= message.amount;
        (bool success,) = message.to.call{value: message.amount}("");
        require(success);
    }

    receive() external payable {}
}
