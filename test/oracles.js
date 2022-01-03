
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Oracles', async (accounts) => {

  const TEST_ORACLES_COUNT = 20;
  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });


  it('can register oracles', async () => {

    // ARRANGE
    let fee = await config.flightSuretyApp.REGISTRATION_FEE.call();

    //console.log(fee);
    // ACT
      for(let a=1; a<TEST_ORACLES_COUNT; a++) {
      await config.flightSuretyApp.registerOracle({ from: accounts[a], value: fee });
      let result = await config.flightSuretyApp.getMyIndexes.call({from: accounts[a]});
      //console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
    }
  });

  it('can register flight', async () => {

    // ARRANGE
    let flight = 'ND1309'; // Course number
    let flighttimestamp = new Date('2021-10-01 11:30:00');
    let timestamp = Math.floor(flighttimestamp.getTime() / 1000);

    const STATUS_CODE_UNKNOWN = 0;
    const STATUS_CODE_ON_TIME = 10;
    const STATUS_CODE_LATE_AIRLINE = 20;
    const STATUS_CODE_LATE_WEATHER = 30;
    const STATUS_CODE_LATE_TECHNICAL = 40;
    const STATUS_CODE_LATE_OTHER = 50;

    let result = await config.flightSuretyApp.isRegisterFlight(accounts[0],flight,timestamp);
    assert.equal(result, false, "Flight should not be registered yet!");

    await config.flightSuretyApp.registerFlight(flight,timestamp,{from: accounts[0]});
    result = await config.flightSuretyApp.isRegisterFlight(accounts[0],flight,timestamp);
    assert.equal(result, true, "Flight should be registered.");
  });

  it('can request flight status', async () => {

    // ARRANGE
    let flight = 'ND1309'; // Course number
    let flighttimestamp = new Date('2021-10-01 11:30:00');
    let timestamp = Math.floor(flighttimestamp.getTime() / 1000);

    const STATUS_CODE_UNKNOWN = 0;
    const STATUS_CODE_ON_TIME = 10;
    const STATUS_CODE_LATE_AIRLINE = 20;
    const STATUS_CODE_LATE_WEATHER = 30;
    const STATUS_CODE_LATE_TECHNICAL = 40;
    const STATUS_CODE_LATE_OTHER = 50;

    // Submit a request for oracles to get status information for a flight
    let ind_assigned = await config.flightSuretyApp.fetchFlightStatus.call(accounts[0], flight, timestamp);
    // ACT
    //await config.flightSuretyApp.submitOracleResponse(ind_assigned[0].toNumber(), accounts[0], flight, timestamp, STATUS_CODE_ON_TIME,{ from: accounts[0] });
    // Since the Index assigned to each test account is opaque by design
    // loop through all the accounts and for each account, all its Indexes (indices?)
    // and submit a response. The contract will reject a submission if it was
    // not requested so while sub-optimal, it's a good test of that feature

    for(let a=1; a<TEST_ORACLES_COUNT; a++) {

      // Get oracle information
      try {
          // Submit a response...it will only be accepted if there is an Index match
          await config.flightSuretyApp.submitOracleResponse(ind_assigned[0].toNumber(), accounts[0], flight, timestamp, STATUS_CODE_ON_TIME,{ from: accounts[a] });
          //console.log(oracleIndexes[idx].toNumber(), config.firstAirline, flight, timestamp, STATUS_CODE_ON_TIME,accounts[a]);
        }
        catch(e) {
          // Enable this when debugging
          console.log(e);
          //console.log('\nError', flight, timestamp);
        }
      }
  });



});
