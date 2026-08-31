// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SignedTransfer
 * @notice Off-chain signed transfer without nonce protection
 * Based on: Various bridge exploits
 */
contract SignedTransfer {
    address public relayer;
    mapping(address => uint256) public nonces;

    constructor() { relayer = msg.sender; }

    function executeTransfer(
        address from,
        address to,
        uint256 amount,
        bytes memory signature
    ) external {
        // BUG: No nonce in hash — signatures can be replayed
        bytes32 hash = keccak256(abi.encodePacked(from, to, amount));
        
        address signer = recoverSigner(hash, signature);
        require(signer == relayer, "Invalid signature");
        
        // BUG: No nonce increment — same signature works multiple times
        // Attacker can replay the same signature to drain funds
        
        (bool success,) = to.call{value: amount}("");
        require(success);
    }

    function recoverSigner(bytes32 hash, bytes memory sig) 
        internal pure returns (address) 
    {
        (address signer, , ) = ECDSA.recover(hash, sig);
        return signer;
    }
}

library ECDSA {
    function recover(bytes32 hash, bytes memory sig) 
        internal pure returns (address, uint8, bytes32) 
    {
        require(sig.length == 65, "Invalid signature length");
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
        if (v < 27) v += 27;
        require(v == 27 || v == 28, "Invalid signature v");
        return (ecrecover(hash, v, r, s), v, r);
    }
}
