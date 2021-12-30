import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';


let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

const STATUS_CODE_UNKNOWN = 0;
const STATUS_CODE_ON_TIME = 10;
const STATUS_CODE_LATE_AIRLINE = 20;
const STATUS_CODE_LATE_WEATHER = 30;
const STATUS_CODE_LATE_TECHNICAL = 40;
const STATUS_CODE_LATE_OTHER = 50;
let REGISTRATION_FEE = 0;
let oracles = [];

//Get Fee from flightSuretyApp;

flightSuretyApp.methods.REGISTRATION_FEE().call({from:oracles[0]}).then(fee=> {
  REGISTRATION_FEE= fee;
});

web3.eth.getAccounts((error, accts) => {
  for (let i = 0; i<20; i++){
      oracles.push(accts[i]);
      flightSuretyApp.methods.registerOracle().send({ from:accts[i], value: REGISTRATION_FEE }).then(()=>
      flightSuretyApp.methods.getMyIndexes().call({from: accts[i]}).then((result,err) =>
      console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`)));
}});


flightSuretyApp.events.OracleRequest({
    fromBlock: 0
  }, function (error, event) {
    //if (error) console.log(error);

    /*Simulate Oracle Response*/
    for (let a= 1; a < 5; a++){
    /*flightSuretyApp.methods.submitOracleResponse(
                            event.returnValues.index,
                            event.returnValues.airline,
                            event.returnValues.flight,
                            event.returnValues.timestamp,
                            STATUS_CODE_LATE_AIRLINE).send(
                            {from: web3.eth.accounts[a]}
                        );*/
                      }
                    });


const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

export default app;
