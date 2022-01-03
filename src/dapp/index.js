import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async () => {

  let result = null;

  let contract = new Contract('localhost', () => {

    // Read transaction
    contract.isOperational((error, result) => {
      console.log(error, result);
      display('Operational Status', 'Check if contract is operational', [{
        label: 'Operational Status',
        error: error,
        value: result
      }]);
    });


    // User-submitted transaction
    DOM.elid('add_flight').addEventListener('click', () => {
      let flight = DOM.elid('a-flight-number').value;
      let flighttime = DOM.elid('a-flight-time').value;
      // Write transaction
      contract.registerFlight(flight, flighttime, (error, result) => {
        display('Add Flight', '', [{
          label: 'New Flight was added',
          error: error,
          value: 'Flight:' + result.flight + '\tDepart:' + result.timestamp.toISOString().replace(/T/, ' ').replace(/\..+/, '')
        }]);
      });
    })

    // User-submitted transaction
    DOM.elid('purchase_ins').addEventListener('click', () => {
      let selected_flight = DOM.elid('p-flightlist').value;
      console.log("selected_flight");
      let insureamount = DOM.elid('p-insure-amt').value;
      if (selected_flight == "AA AA8017 2021-12-01 10:30:00") {
        // Write transaction
        contract.buyInsurance("AA8017", "2021-12-01 10:30:00", insureamount, (error, result) => {
          display('Insurence Purchased', '', [{
            label: 'Insurance Purchased',
            error: error,
            value: 'Flight:' + result.flight + '\tDepart:' + result.timestamp.toISOString().replace(/T/, ' ').replace(/\..+/, '')
          }]);
        });

      } else if (selected_flight == "AA AA1388 2022-01-01 17:45:00") {
        // Write transaction
        contract.buyInsurance("AA1388", "2022-01-01 17:45:00", insureamount, (error, result) => {
          display('Insurence Purchased', '', [{
            label: 'Insurance Purchased',
            error: error,
            value: 'Flight:' + result.flight + '\tDepart:' + result.timestamp.toISOString().replace(/T/, ' ').replace(/\..+/, '')
          }]);
        });

      } else if (selected_flight == "AA AA5232 2022-02-22 12:30:00") {
        // Write transaction
        contract.buyInsurance("AA5232", "2022-02-22 12:30:00", insureamount, (error, result) => {
          display('Insurence Purchased', '', [{
            label: 'Insurance Purchased',
            error: error,
            value: 'Flight:' + result.flight + '\tDepart:' + result.timestamp.toISOString().replace(/T/, ' ').replace(/\..+/, '')
          }]);
        });

      }


    })

    // User-submitted transaction
    DOM.elid('submit-oracle').addEventListener('click', () => {
      let selected_flight = DOM.elid('O-flight-list').value;
      let display_mapping = {
        '0': 'UNKNOWN',
        '10': 'ON_TIME',
        '20': "LATE_AIRLINE",
        '30': 'LATE_WEATHER',
        '40': 'LATE_TECHNICAL',
        '50': 'LATE_OTHER'
      }
      // Write transaction
      if (selected_flight == "AA AA8017 2021-12-01 10:30:00") {
        // Write transaction
        contract.fetchFlightStatus("AA8017", "2021-12-01 10:30:00", (error, result) => {
            display('Oracles', 'Trigger oracles', [{
            label: 'Fetch Flight Status',
            error: error,
            value: result['flight'] + ' ' + result['timestamp'] + ' ' + display_mapping[result['status']]
          }]);
        });

      } else if (selected_flight == "AA AA1388 2022-01-01 17:45:00") {
        // Write transaction
        contract.fetchFlightStatus("AA1388", "2022-01-01 17:45:00", (error, result) => {
          display('Oracles', 'Trigger oracles', [{
            label: 'Fetch Flight Status',
            error: error,
            value: result['flight'] + ' ' + result['timestamp'] + ' ' + display_mapping[result['status']]
          }]);
        });

      } else if (selected_flight == "AA AA5232 2022-02-22 12:30:00") {
        // Write transaction
        contract.fetchFlightStatus("AA5232", "2022-02-22 12:30:00", (error, result) => {
          display('Oracles', 'Trigger oracles', [{
            label: 'Fetch Flight Status',
            error: error,
            value: result['flight'] + ' ' + result['timestamp'] + ' ' + display_mapping[result['status']]
          }]);
        });

      }



    })
  });

  // User-submitted transaction
  DOM.elid('fund_withdraw').addEventListener('click', () => {
    // Write transaction
    contract.fund_withdraw();
  })

})();


function display(title, description, results) {
  let displayDiv = DOM.elid("display-wrapper");
  displayDiv.innerText='';
  let section = DOM.section();
  //section.appendChild(DOM.h4(title));
  //section.appendChild(DOM.h5(description));
  results.map((result) => {
    let row = section.appendChild(DOM.div({
      className: 'row'
    }));
    row.appendChild(DOM.div({
      className: 'col-sm-4 field'
    }, result.label));
    row.appendChild(DOM.div({
      className: 'col-sm-8 field-value'
    }, result.error ? String(result.error) : String(result.value)));
    section.appendChild(row);
  })
  displayDiv.append(section);

}
