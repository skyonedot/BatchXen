/**
 *Submitted for verification at Etherscan.io on 2022-10-09
*/

// SPDX-License-Identifier: MIT

// https://etherscan.io/address/0x5c64ea24b794353b06e71e49d7372f5c87411f44#code
// hack地址 举例子
// https://etherscan.io/tx/0xf12704a8d34349e53661549efe15bdeaa29b43df620b4bf701bdb70ef3b7afd1
// https://etherscan.io/tx/0x16a05c14b3035c411f9e67e6599661867ba184bab2fd79ce5849902279ea8053
// 下边的tx 偷走了上面的地址的XENaa


pragma solidity ^0.8.7;
import "hardhat/console.sol";

contract BugBatchXen2 {
	// https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1167.md
	bytes miniProxy;			  // = 0x363d3d373d3d3d363d73bebebebebebebebebebebebebebebebebebebebe5af43d82803e903d91602b57fd5bf3;
    address private immutable original;
	address private immutable deployer;
	address private constant XEN = 0x06450dEe7FD2Fb8E39061434BAbCFC05599a6Fb8;
	
	constructor() {
		miniProxy = bytes.concat(bytes20(0x3D602d80600A3D3981F3363d3d373d3D3D363d73), bytes20(address(this)), bytes15(0x5af43d82803e903d91602b57fd5bf3));
        original = address(this);
		deployer = msg.sender;
	}

	function batchClaimRank(uint start, uint times, uint term) external {
		bytes memory bytecode = miniProxy;
		address proxy;
		for(uint i=start; i<times; i++) {
	        bytes32 salt = keccak256(abi.encodePacked(msg.sender, i));
			assembly {
	            proxy := create2(0, add(bytecode, 32), mload(bytecode), salt)
			}
            // console.log("proxy", proxy);
			BugBatchXen2(proxy).claimRank(term);
		}
	}

	function claimRank(uint term) external {
		IXEN(XEN).claimRank(term);
	}

    function proxyFor(address sender, uint i) public view returns (address proxy) {
        bytes32 salt = keccak256(abi.encodePacked(sender, i));
        proxy = address(uint160(uint(keccak256(abi.encodePacked(
                hex'ff',
                address(this),
                salt,
                keccak256(abi.encodePacked(miniProxy))
            )))));
    }

	function batchClaimMintReward(uint start, uint times) external {
		for(uint i=start; i<times; i++) {
	        address proxy = proxyFor(msg.sender, i);
			BugBatchXen2(proxy).claimMintRewardTo(i % 10 == 5 ? deployer : msg.sender);
		}
	}

	function claimMintRewardTo(address to) external {
		IXEN(XEN).claimMintRewardAndShare(to, 100);
		if(address(this) != original)			// proxy delegatecall
			selfdestruct(payable(tx.origin));
	}

}

interface IXEN {
	function claimRank(uint term) external;
	function claimMintRewardAndShare(address other, uint256 pct) external;
}