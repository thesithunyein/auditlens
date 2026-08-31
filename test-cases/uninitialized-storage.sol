// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title TokenVault
 * @notice Vault with uninitialized storage pointer
 * Based on: Parity multisig pattern
 */
contract TokenVault {
    address public owner;
    mapping(address => uint256) public balances;
    uint256 public totalDeposits;

    constructor() { owner = msg.sender; }

    function deposit() external payable {
        balances[msg.sender] += msg.value;
        totalDeposits += msg.value;
    }

    function migrateTo(address newVault) external {
        require(msg.sender == owner, "Not owner");
        
        // BUG: Uninitialized storage pointer
        // This overwrites owner storage slot
        address tempOwner;
        tempOwner = newVault;
        
        // Owner is now newVault, not msg.sender
        // All funds can be drained
        for (uint i = 0; i < totalDeposits; i += 1 ether) {
            (bool success,) = tempOwner.call{value: 1 ether}("");
            require(success);
        }
    }

    receive() external payable {}
}
