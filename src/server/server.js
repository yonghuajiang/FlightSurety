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
      flightSuretyApp.methods.registerOracle().send({ from:accts[i], value: REGISTRATION_FEE,gas:3000000 }).then(()=>
      flightSuretyApp.methods.getMyIndexes().call({from: accts[i]}).then((result,err) =>
      {
        //console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`)
        //do nothing
      }
    ));
}});


flightSuretyApp.events.OracleRequest(/*{
    fromBlock: 0
  },*/ function (error, event) {
    if (error) console.log(error);

    /*Simulate response*/
    let simulate_status = STATUS_CODE_UNKNOWN;
    if (Math.floor(Date.now() / 1000) > event.returnValues.timestamp){
      let random_number = Math.random();
      if (random_number < 0.6){
        simulate_status = STATUS_CODE_ON_TIME; //60% flight on time
      }
      else if (random_number < 0.7){
        simulate_status = STATUS_CODE_LATE_AIRLINE; //10% late
      }
      else if (random_number < 0.8){
        simulate_status = STATUS_CODE_LATE_WEATHER;//10% late due to weather
      }
      else if (random_number < 0.9){
        simulate_status = STATUS_CODE_LATE_TECHNICAL;//10% late due to technical
      }
      else {simulate_status = STATUS_CODE_LATE_OTHER;} //remaining 10% late due to other reason
    }
    console.log("Flight:",event.returnValues.timestamp,"Now",Math.floor(Date.now() / 1000),"simulate_status",simulate_status);
    /*Simulate Oracle Response*/
    for (let a= 1; a < 20; a++){

      flightSuretyApp.methods.submitOracleResponse(
                            event.returnValues.index,
                            event.returnValues.airline,
                            event.returnValues.flight,
                            event.returnValues.timestamp,
                            simulate_status).send(
                            {from: oracles[a],gas:3000000},(error, event)=>{}
                        );
                      }
                    });


const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

export default app;
