const { expect } = require("chai");
const {ethers} = require("hardhat");

async function increaseTime(value) {
  if (!ethers.BigNumber.isBigNumber(value)) {
    value = ethers.BigNumber.from(value);
  }
  await ethers.provider.send('evm_increaseTime', [value.toNumber()]);
  await ethers.provider.send('evm_mine');
}

describe("BugBathchXen Contract", function(){
  before(async function () {
    // 一个是用源码来创合约, 一个是给定abi来创建
    // 其实 这里大概率要用到 hardhat.config.js
    this.signer = (await ethers.getSigners())[10]
    let address = '0x06450dEe7FD2Fb8E39061434BAbCFC05599a6Fb8'
    let abi = require('../abi/XEN.json')
    this.xen = new hre.ethers.Contract(address, abi, this.signer);

    const GeneralXenV2 = await ethers.getContractFactory("GeneralXenV2", this.signer);
    this.generalXenV2 = await GeneralXenV2.deploy(10,{gasLimit: 30000000});
    await this.generalXenV2.deployed();
  });


  it("Right Test The Batch General V2 By Signer", async function (){
    expect(await this.xen.balanceOf(this.signer.address)).to.equal(0);
    let tx = await this.generalXenV2.execute(0, 10, "0x06450dEe7FD2Fb8E39061434BAbCFC05599a6Fb8", this.xen.interface.encodeFunctionData("claimRank", [1]))
    await tx.wait()
    await increaseTime(24 * 60 * 60)
    tx = await this.generalXenV2.execute(0, 10, "0x06450dEe7FD2Fb8E39061434BAbCFC05599a6Fb8",this.xen.interface.encodeFunctionData("claimMintRewardAndShare", [this.signer.address, 100]));
    await tx.wait()
    expect(await this.xen.balanceOf(this.signer.address)).to.be.above(0);
  });


  it("Wrong Test The Batch General V2 By Other User", async function (){
    const user = (await ethers.getSigners())[11]
    expect(await this.xen.balanceOf(user.address)).to.equal(0);
    await expect(this.generalXenV2.connect(user).execute(0, 10, "0x06450dEe7FD2Fb8E39061434BAbCFC05599a6Fb8", this.xen.interface.encodeFunctionData("claimRank", [1]))).to.be.revertedWith("Only deployer can call this function.")
  });


  // 0x379783770d594070212973dbae0788d9b0320361 这个地址是先跑一次拿到的, 正常情况下看event log即可
  it("Try to Seal From User", async function (){
    const innocenter = (await ethers.getSigners())[12]
    // console.log("Inoccent Address: ", innocenter.address)
    let GeneralXenV2 = await ethers.getContractFactory("GeneralXenV2", innocenter);
    let generalXenV2 = await GeneralXenV2.deploy(10,{gasLimit: 30000000});
    await generalXenV2.deployed();
    let tx = await generalXenV2.execute(0, 10, "0x06450dEe7FD2Fb8E39061434BAbCFC05599a6Fb8", this.xen.interface.encodeFunctionData("claimRank", [1]))
    await tx.wait()
    await increaseTime(24 * 60 * 60)

    const hacker = (await ethers.getSigners())[13]
    const HackGeneralXenV2 = await ethers.getContractFactory("HackGeneralXenV2", hacker);
    const hackGeneralXenV2 = await HackGeneralXenV2.deploy({gasLimit: 30000000});
    await hackGeneralXenV2.deployed();
    await expect(hackGeneralXenV2.attack("0x379783770d594070212973dbae0788d9b0320361", this.xen.interface.encodeFunctionData("claimMintRewardAndShare", [this.signer.address, 100]))).to.be.revertedWith("Only original can call this function.")
    
    // await tx.wait()
    // tx = await generalXenV2.execute(0, 10, "0x06450dEe7FD2Fb8E39061434BAbCFC05599a6Fb8",this.xen.interface.encodeFunctionData("claimMintRewardAndShare", [innocenter.address, 100]));
    // await tx.wait()
    // expect(await this.xen.balanceOf(innocenter.address)).to.be.above(0);
});


});


