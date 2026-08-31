// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ProxyVault
 * @notice Vault with delegatecall to user-provided address
 * Based on: Parity Wallet (2017) — $150M lost
 */
contract ProxyVault {
    address public owner;
    mapping(address => uint256) public balances;

    constructor() { owner = msg.sender; }

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    // BUG: delegatecall to user-supplied address
    // Attacker can pass a malicious contract that overwrites storage
    function execute(address target, bytes memory data) external {
        (bool success,) = target.delegatecall(data);
        require(success, "Delegatecall failed");
    }

    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount);
        balances[msg.sender] -= amount;
        (bool success,) = msg.sender.call{value: amount}("");
        require(success);
    }
}
