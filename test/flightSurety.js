
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);

  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");

  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");

      /*revert back to true*/

      await config.flightSuretyData.setOperatingStatus(true);
  });

  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {

    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.isRegistered.call(newAirline);

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

  });

  it('(multiparty consensus) Only existing airlines may register a new airline until there are at least four airlines registered', async () => {

    // ARRANGE
    // Register and Fund two airlines
    await config.flightSuretyData.fund({from: accounts[0],value: web3.utils.toWei('10', "ether")});

    await config.flightSuretyApp.registerAirline(accounts[1], {from: accounts[0]});
    await config.flightSuretyApp.registerAirline(accounts[2], {from: accounts[0]});
    await config.flightSuretyApp.registerAirline(accounts[3], {from: accounts[0]});
    await config.flightSuretyData.fund({from: accounts[1],value: web3.utils.toWei('10', "ether")});
    await config.flightSuretyData.fund({from: accounts[2],value: web3.utils.toWei('10', "ether")});
    await config.flightSuretyData.fund({from: accounts[3],value: web3.utils.toWei('10', "ether")});
    // ACT
    try {
        await config.flightSuretyApp.registerAirline(accounts[4], {from:  accounts[1]});
    }
    catch(e) {

    }
    let result = await config.flightSuretyApp.isRegistered.call(accounts[4]);

    // ASSERT
    assert.equal(result, true, "Funded airlines are able to register another airline");

  });


  it('(multiparty consensus) need 50% of funded airlines to register a new airline', async () => {

    // ARRANGE
    // Register and Fund two airlines
    await config.flightSuretyData.fund({from: accounts[4],value: web3.utils.toWei('10', "ether")});

    // ACT
    try {
        let reg_result = await config.flightSuretyApp.registerAirline(accounts[7], {from:  accounts[0]});
    }
    catch(e) {
    }

    let result = await config.flightSuretyApp.isRegistered.call(accounts[7]);

    // ASSERT
    assert.equal(result, false, "Airline shouldn't be registered yet");

    try {
        await config.flightSuretyApp.registerAirline(accounts[7], {from:  accounts[1]});
        await config.flightSuretyApp.registerAirline(accounts[7], {from:  accounts[3]});
        await config.flightSuretyApp.registerAirline(accounts[7], {from:  accounts[4]});
    }
    catch(e) {
    }
    result = await config.flightSuretyApp.isRegistered.call(accounts[7]);

    // ASSERT
    assert.equal(result, true, "Consensus reached!");

  });
});
