
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let result = null;

    let contract = new Contract('localhost', () => {

        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error,result);
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });


        // User-submitted transaction
        DOM.elid('add_flight').addEventListener('click', () => {
            let flight = DOM.elid('a-flight-number').value;
            let flighttime = DOM.elid('a-flight-time').value;
            // Write transaction
            contract.registerFlight(flight,flighttime);
        })

        // User-submitted transaction
        DOM.elid('purchase_ins').addEventListener('click', () => {
            let flight = DOM.elid('p-flight-number').value;
            let flighttime = DOM.elid('p-flight-time').value;
            let insureamount = DOM.elid('p-insure-amount').value;
            // Write transaction
            contract.buyInsurance(flight,flighttime,insureamount);
        })

        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('s-flight-number').value;
            let flighttime = DOM.elid('s-flight-time').value;
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });
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
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}
