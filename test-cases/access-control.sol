// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title AdminVault
 * @notice A vault with missing access control on critical functions
 * @dev The admin function is callable by anyone
 */
contract AdminVault {
    address public owner;
    mapping(address => uint256) public balances;
    
    constructor() {
        owner = msg.sender;
    }

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    // BUG: No onlyOwner modifier - anyone can call this
    function withdrawAll() external {
        uint256 balance = address(this).balance;
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Transfer failed");
    }

    // BUG: No access control - anyone can change the owner
    function transferOwnership(address newOwner) external {
        owner = newOwner;
    }

    // BUG: No access control - anyone can drain to any address
    function emergencyDrain(address to) external {
        uint256 balance = address(this).balance;
        (bool success, ) = to.call{value: balance}("");
        require(success, "Transfer failed");
    }
}
