// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title PriceOracle
 * @notice A price oracle contract vulnerable to manipulation
 * @dev Uses single TWAP source that can be manipulated via flash loan
 */
contract PriceOracle {
    mapping(address => uint256) public lastPrice;
    mapping(address => uint256) public lastUpdate;
    
    uint256 public constant TWAP_WINDOW = 30 minutes;

    // BUG: Single price source, no sanity checks
    function updatePrice(address token, uint256 price) external {
        lastPrice[token] = price;
        lastUpdate[token] = block.timestamp;
    }

    function getPrice(address token) external view returns (uint256) {
        require(block.timestamp - lastUpdate[token] <= TWAP_WINDOW, "Stale price");
        return lastPrice[token];
    }

    // BUG: No minimum/maximum price bounds
    // An attacker can flash-loan, manipulate the price, and exploit
    // any protocol that relies on this oracle
    function getPriceSafe(address token) external view returns (uint256) {
        if (block.timestamp - lastUpdate[token] > TWAP_WINDOW) {
            return 0; // Returns 0 instead of reverting - dangerous
        }
        return lastPrice[token];
    }
}
