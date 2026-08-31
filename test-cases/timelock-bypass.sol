// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title TimelockController
 * @notice Timelock that can be bypassed via nested calls
 */
contract TimelockController {
    address public admin;
    uint256 public delay = 2 days;
    mapping(bytes32 => uint256) public queuedAt;
    
    constructor() { admin = msg.sender; }

    function queueTransaction(bytes32 txHash) external {
        require(msg.sender == admin, "Not admin");
        queuedAt[txHash] = block.timestamp;
    }

    function executeTransaction(bytes32 txHash, address target, bytes memory data) external {
        require(msg.sender == admin, "Not admin");
        require(queuedAt[txHash] > 0, "Not queued");
        require(block.timestamp >= queuedAt[txHash] + delay, "Timelock not expired");
        
        // BUG: No re-entrancy guard on executeTransaction
        // Admin can queue + execute in same block via callback
        queuedAt[txHash] = 0;
        
        // BUG: Nested call can re-enter before state update
        (bool success,) = target.call(data);
        require(success);
    }

    function changeAdmin(address newAdmin) external {
        // BUG: No timelock on admin change
        // Can be called directly, bypassing timelock
        require(msg.sender == admin);
        admin = newAdmin;
    }
}
