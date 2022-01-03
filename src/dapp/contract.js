import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
  constructor(network, callback) {

    let config = Config[network];
    //this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
    this.web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
    this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
    this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
    this.initialize(callback);
    this.owner = null;
    this.airlines = [];
    this.passengers = [];
  }

  initialize(callback) {
    let self = this;
    this.web3.eth.getAccounts((error, accts) => {

      this.owner = accts[0];

      let counter = 1;

      while (this.airlines.length < 5) {
        this.airlines.push(accts[counter++]);
      }

      while (this.passengers.length < 5) {
        this.passengers.push(accts[counter++]);
      }

      console.log(accts[0]);

      /*fund airline*/
      this.flightSuretyData.methods.fund().call({
        from: accts[0],
        value: this.web3.utils.toWei('10', "ether"),
        gas: 3000000
      });

      /*register flights*/
      let flighttimestamp = new Date('2021-12-01 10:30:00');
      let payload = {
        airline: accts[0],
        flight: 'AA8017',
        timestamp: Math.floor(flighttimestamp.getTime() / 1000)
      }
      self.flightSuretyApp.methods
        .registerFlight(payload.flight, payload.timestamp)
        .send({
          from: self.owner,
          gas: 3000000
        });

      flighttimestamp = new Date('2022-01-01 17:45:00');
      payload = {
        airline: accts[0],
        flight: 'AA1388',
        timestamp: Math.floor(flighttimestamp.getTime() / 1000)
      }
      self.flightSuretyApp.methods
        .registerFlight(payload.flight, payload.timestamp)
        .send({
          from: self.owner,
          gas: 3000000
        });

      flighttimestamp = new Date('2022-02-22 12:30:00');
      payload = {
        airline: accts[0],
        flight: 'AA5232',
        timestamp: Math.floor(flighttimestamp.getTime() / 1000)
      }

      self.flightSuretyApp.methods
        .registerFlight(payload.flight, payload.timestamp)
        .send({
          from: self.owner,
          gas: 3000000
        });


      callback();
    });
  }

  isOperational(callback) {
    let self = this;
    self.flightSuretyApp.methods
      .isOperational()
      .call({
        from: self.owner
      }, callback);
  }

  fetchFlightStatus(flight, flighttime, callback) {
    let self = this;
    let flighttimestamp = new Date(flighttime);
    let payload = {
      airline: self.airlines[0],
      flight: flight,
      timestamp: flighttimestamp
    }

    /*Capture Events*/
    self.flightSuretyApp.events.FlightStatusInfo((err,event)=>callback(err, event.returnValues));

    self.flightSuretyApp.methods
      .fetchFlightStatus(payload.airline, payload.flight, Math.floor(flighttimestamp.getTime() / 1000))
      .send({
        from: self.owner
      },(err,result) =>{});
  }

  registerFlight(flight, fighttime,callback) {
    let self = this;
    let flighttimestamp = new Date(fighttime);
    let payload = {
      airline: self.airlines[0],
      flight: flight,
      timestamp: flighttimestamp
    }
    self.flightSuretyApp.methods
      .registerFlight(payload.flight, Math.floor(flighttimestamp.getTime() / 1000))
      .send({
        from: self.owner,
        gas: 3000000
      },(error,result) => {
        callback(error, payload);
      });
    }

  buyInsurance(flight, fighttime, insureamount,callback) {
    let self = this;
    let flighttimestamp = new Date(fighttime);
    let insureWei = Web3.utils.toWei(insureamount.toString(), 'ether');
    let payload = {
      airline: self.airlines[0],
      flight: flight,
      timestamp: flighttimestamp,
      insureAmount: insureWei
    };
    self.flightSuretyData.methods
      .buy("0x627306090abaB3A6e1400e9345bC60c78a8BEf57", payload.flight, Math.floor(flighttimestamp.getTime() / 1000)).send({
        from: self.owner,
        value: insureWei,
        gas: 3000000
      },(error,result) => {
        callback(error, payload);
      });
    }

  fund_withdraw() {
    let self = this;
    self.flightSuretyApp.methods.pay().send({
      from: self.owner
    });
  }
}
