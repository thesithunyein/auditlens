// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title LendingPool
 * @notice A lending pool with flash loan attack vector
 * @dev Price calculation can be manipulated within single transaction
 */
contract LendingPool {
    mapping(address => uint256) public deposits;
    mapping(address => uint256) public borrows;
    
    uint256 public totalDeposits;
    
    // BUG: Price calculated from pool reserves (manipulable via flash loan)
    function getPrice() public view returns (uint256) {
        if (totalDeposits == 0) return 1e18;
        return (address(this).balance * 1e18) / totalDeposits;
    }

    function deposit() external payable {
        deposits[msg.sender] += msg.value;
        totalDeposits += msg.value;
    }

    function borrow(uint256 amount) external {
        uint256 price = getPrice();
        uint256 collateral = deposits[msg.sender] * price / 1e18;
        require(collateral >= amount * 1.5, "Insufficient collateral");
        
        borrows[msg.sender] += amount;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }

    // BUG: Flash loan can manipulate getPrice() by depositing/withdrawing large amounts
    function flashLoan(uint256 amount, address receiver) external {
        uint256 balanceBefore = address(this).balance;
        require(balanceBefore >= amount, "Insufficient liquidity");
        
        (bool success, ) = receiver.call{value: amount}("");
        require(success, "Transfer failed");
        
        // Price is different after flash loan!
        require(address(this).balance >= balanceBefore, "Flash loan violation");
    }
}
