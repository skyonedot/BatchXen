# XEN笔记


> npx hardhat test ./test/BugBatchXen.test.js 这个报错, 是因为address 是 不一样的, byteCode改了, 所以需要用console.log 看一下 miniproxy的address

- 实现了 XenBatch合约的一些Bug复现➕Test`contracts/BugBatchXen1,BugBatchXen2,HackBatchXen1` 以及 相应的 	`Test`文件下 都是对bug的复现

> https://etherscan.io/tx/0xf12704a8d34349e53661549efe15bdeaa29b43df620b4bf701bdb70ef3b7afd1

> https://etherscan.io/tx/0x16a05c14b3035c411f9e67e6599661867ba184bab2fd79ce5849902279ea8053

> 下边的tx 偷走了上面的地址的XEN

  > BugBatchXen1 和 BugBatchXen2的bug都一样 所以用的就是一个HackBatchXen1这个合约,

- xdeployer 用的是create2, 不过也是走的factory 上的create2

  > 计算的时候, Create2中的From 是 Factory的地址

- 同一个Describe中的It是连续的, 即上面的it会影响下面的it

---

## 知识点

#### Create2

核心在这句话, bytecode也是compile之后的json文件中的, 同下面中的bytecode, 这俩的值是一样的

salt是bytes32

```solidity
assembly {
	proxy := create2(0, add(bytecode, 32), mload(bytecode), salt)
}
Or
assembly {
	// 其实0x20和32是一样的
	addr := create2(amount, add(bytecode, 0x20), mload(bytecode), salt)
}
```

除了外部传参数, 也可以像UniV2的Facotry一样拿, 不过 同样的合约, 这样拿到的byteCode 貌似是不一样的, 个人测着不一样

比如我用这里的Foundry Emit出来的[byteCode](https://github.com/skyonedot/zuniswapv2/blob/db004a86a0037222ec00aead6eb0f974baf3b615/src/ZuniswapV2Factory.sol#L39). 和 compile出json文件中的bytecode不是一样的, 同样的contract

```solidity
import "./ZuniswapV2Pair.sol";
bytes memory bytecode = type(ZuniswapV2Pair).creationCode;
```

---

**create2** 目前 还是没有找到能够直接sendTx来创建的, 都是走了一个Factory来用create2创建, 那么这个时候 计算的时候, 用Factory的地址来计算create2的合约地址

ethers计算create2的方式

```javascript
const ethers = require('ethers')
require('dotenv').config()

async function main(){
    let wallet = new ethers.Wallet(process.env.PK)
    // From 是 Factory的地址
    const from = "0x13b0d85ccb8bf860b6b79af3029fca081ae9bef2";
    const salt = "0x06b3dfaec148fb1bb2b066f10ec285e7c9bf402ab32aa78a5d38e34566810cd2";
    // 这个bytecode是 BugBatchXen1的 在 artifacts/contracts/BugBatchXen1.sol里面能找到  bytecode
  	// 也是用 正常的 create的方式 的时候, 发送tx拿笔的data
    const initCode = "0x60c0604052xxx";
    const initCodeHash = ethers.utils.keccak256(initCode);
    console.log(typeof(initCodeHash))
    // console.log("initCodeHash", initCodeHash);

    let contractAddr = ethers.utils.getCreate2Address(from, salt, initCodeHash);
    console.log(contractAddr)
}

main()
```

---

#### Miniproxy

核心在于delegatecall,

即 我用factory contract A, 创建了许多miniproxy contract a1,a2.

当我拿到a1,a2这些地址的时候, 写好要调用的function的接口, factory(a1).function. 即可, 这样会去用delegateCall的方式调用factory中的指定的function, 可以看HackBatchXen1中的写法

> - delegatecall是 function使用别人的, 变量使用自己的
> - call 是 function 和变量都使用别人的



---

#### Gas Report部分
```
·-----------------------------------------|---------------------------|-------------|-----------------------------·
|          Solc version: 0.8.17           ·  Optimizer enabled: true  ·  Runs: 200  ·  Block limit: 30000000 gas  │
··········································|···························|·············|······························
|  Methods                                                                                                        │
·················|························|·············|·············|·············|···············|··············
|  Contract      ·  Method                ·  Min        ·  Max        ·  Avg        ·  # calls      ·  chf (avg)  │
·················|························|·············|·············|·············|···············|··············
|  BugBatchXen1  ·  batchClaimMintReward  ·          -  ·          -  ·     567788  ·            2  ·          -  │
·················|························|·············|·············|·············|···············|··············
|  BugBatchXen1  ·  batchClaimRank        ·          -  ·          -  ·    1957814  ·            2  ·          -  │
·················|························|·············|·············|·············|···············|··············
|  BugBatchXen1  ·  claimRank             ·          -  ·          -  ·     179946  ·            4  ·          -  │
·················|························|·············|·············|·············|···············|··············
|  BugBatchXen2  ·  batchClaimMintReward  ·          -  ·          -  ·     534407  ·            2  ·          -  │
·················|························|·············|·············|·············|···············|··············
|  BugBatchXen2  ·  batchClaimRank        ·          -  ·          -  ·    1934844  ·            2  ·          -  │
·················|························|·············|·············|·············|···············|··············
|  Deployments                            ·                                         ·  % of limit   ·             │
··········································|·············|·············|·············|···············|··············
|  BugBatchXen1                           ·          -  ·          -  ·     568194  ·        1.9 %  ·          -  │
··········································|·············|·············|·············|···············|··············
|  BugBatchXen2                           ·          -  ·          -  ·     517666  ·        1.7 %  ·          -  │
··········································|·············|·············|·············|···············|··············
|  HackBatchXen1                          ·          -  ·          -  ·     107799  ·        0.4 %  ·          -  │
·-----------------------------------------|-------------|-------------|-------------|---------------|-------------·
```

因为BatchXen1 和 BatchXen2 都差不多是 10次
所以 BatchXen1 的ClaimRank 平均是 5.6w, 领取是 19.5w
BatchXen2 的ClaimRank 平均 是 5.3w 领取是19.3w

---

> npx hardhat xdeploy --network goerli
>
> ~~Create2创建的合约 用 npx hardhat verify --network goerli address 貌似 不太好使 [目前正常创建也不好使, 不过正常创建的可以去etherscan上面手动搞, create2不行]~~. 正常验证即可, mumbai上成功了, goerli上可能网络问题 
>
> miniproxy是把中间的20个, 换成factory的address, 一般来说 是 address(this)

> 不同的Test文件中的describe 也是会有影响的, 可能用的都是本地的RPC

---

#### Immutable

注意imutable 和 constant的用法
callback其实是以delegateCall的用法, 那么 比较调用的original 应该是存在于 miniproxy中的, 但是miniproxy中又没有这个, 那么为什么能管用. 

因为original是immutable的, 即每次出现时会自动填充值. 详情见参考资料

```solidity
function callback(address target, bytes memory data) external {
  require(msg.sender == original, "Only original can call this function.");
  (bool success, ) = target.call(data);
  require(success, "Transaction failed.");
}
```


---

参考资料
1. [爆改！都是科技与狠活](https://mirror.xyz/0x3dbb624861C0f62BdE573a33640ca016E4c65Ff7/q7C21iEF1eZkXrlZvgXN_1xSYiKZXBvrB2yFkSknsYU)



