const { expect } = require("chai");
const { ethers } = require("hardhat");
const assert = require("assert");
const exp = require("constants");

describe("Donation testing", () => {
  let contract;
  let tx;
  let receipt;
  let onlineEducator;
  let accounts;
  let addr1;
  let addr2;
  before(async () => {
    accounts = await ethers.getSigners();
    addr1 = accounts[0].address;
    addr2 = accounts[2].address;

    const Donation = await ethers.deployContract("Donation");
    contract = await Donation.waitForDeployment();
    onlineEducator = await contract.onlineEducator();

    console.log(`contract's address: ${contract.target}`);
    console.log(`accounts[2]: ${addr2}`);
    console.log(`accounts[0]: ${addr1}`);
    console.log(`Online educator: ${onlineEducator}`);
  });

  it("deploys a contract", async () => {
    // const contract = await ethers.deployContract("Donation");
    // await contract.waitForDeployment();
    assert.ok(contract.target); // assert.ok checks for truthyness
  });

  it("eth donated is removed from donator's account", async () => {
    // onlineEducator is accounts[0] (contract deployer), so we need to connect with a different account to donate
    const balanceBeforeSendingEth = await ethers.provider.getBalance(addr2);

    tx = await contract
      .connect(accounts[2])
      .offerDonation("dontaing to thank you for data viz course", {
        value: 350000,
      });
    receipt = await tx.wait();

    const balanceAfterSendingEth = await ethers.provider.getBalance(addr2);
    assert(balanceAfterSendingEth < balanceBeforeSendingEth);
  });

  it("emit LogData event", async () => {
    tx = await contract.offerDonation("python class donation");
    expect(tx).to.emit(contract, "LogData");
  });

  it("confirm donation reason and amount", async () => {
    tx = await contract
      .connect(accounts[2])
      .offerDonation("donating for private session", {
        value: 230000,
      });
    let receipt = await tx.wait();

    // create test to check if the event is emitted with the correct parameters
    expect(receipt.logs[0].args[0]).to.eq(230000);
    expect(receipt.logs[0].args[1]).to.eq("donating for private session");
  });

  it("filter indexed parameters of event", async () => {
    const filterOptions = {
      topics: [10], // filter for events where amount is 10
    };
    const eventFilter = contract.filters.LogData(...filterOptions.topics); // insert the filter

    // Perform a transaction that emits the event. It will emit 3 times
    tx = await contract.offerDonation("class on blockchain", { value: 10 });
    receipt = await tx.wait();
    tx = await contract.offerDonation("class on blockchain", { value: 10 });
    receipt = await tx.wait();
    tx = await contract.offerDonation("class on blockchain", { value: 5 });
    receipt = await tx.wait();
    tx = await contract.offerDonation("class on blockchain", { value: 10 });
    receipt = await tx.wait();

    // Filter the live events
    const events = await contract.queryFilter(eventFilter);
    expect(events.length).to.equal(3); // number of times the event was emitted with amount = 10
    expect(events[0].args.amount).to.equal(10);
    expect(events[1].args.amount).to.equal(10);
  });
});
