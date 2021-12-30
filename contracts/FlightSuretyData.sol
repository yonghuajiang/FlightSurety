pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false

    uint constant MIN_REGISTERED = 4;
    uint constant MIN_PERC_REGISTERED = 50;
    address[] registeredAirline = new address[](0);
    address[] fundedAirline = new address[](0);

    mapping(address => address[]) multiRegister;
    address[] multiOperation;

    struct insuranceStatus {
        address insuree;
        uint256 insuredAmount;}

    mapping(bytes32 => insuranceStatus[]) insurance;
    mapping(address => uint256) insureeBalance;

    mapping(address => uint256) private authorizedContracts;
    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor
                                (
                                )
                                public
    {
        contractOwner = msg.sender;
        registeredAirline.push(msg.sender);
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational()
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireAuthorizeCaller()
    {
        require(authorizedContracts[msg.sender] == 1, "Caller is not authorized contract");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */
    function isOperational()
                            public
                            view
                            returns(bool)
    {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */
    function setOperatingStatus
                            (
                                bool mode
                            )
                            external
    {
        require(mode != operational,"The current operation status is not changed");

        if (registeredAirline.length <=MIN_REGISTERED){

          /* if the requested account is a registered airline, change contract mode */
          for (uint i=0; i<registeredAirline.length; i++){
            if (msg.sender == registeredAirline[i]){
              operational = mode;
              return;
            }
          }
          require(false,"Only registerred airline can change mode!");
        }
        else {
          /* the requested account need to be a registered airline, and not duplicated*/
          for (uint j=0; j<registeredAirline.length; j++){
            if (msg.sender == registeredAirline[j]){

              bool isDuplicate = false;
              for (uint k=0; k<multiOperation.length; k++){
                if (msg.sender == multiOperation[k]){
                  isDuplicate = true;
                  break;
                }
              }
              require(!isDuplicate, "Caller has already called this function.");
              /*add the address to the requestor list*/
              multiOperation.push(msg.sender);
              if (multiOperation.length >= fundedAirline.length.mul(MIN_PERC_REGISTERED).div(100)) {
                  operational = mode;
                  multiOperation = new address[](0);
              }
            }
          }
        }
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */
    function isRegistered(address newAirline) public view returns(bool){
      for (uint i=0; i < registeredAirline.length; i++) {
        if (newAirline == registeredAirline[i]) {
          return(true);
        }
      }
      return(false);
    }

    function registerAirline
                            (address newAirline,
                            address fromAddress
                            )
                            external
                            requireAuthorizeCaller
                            returns(bool success, uint256 votes)

    {
      require(newAirline != address(0), "new airline must be a valid address.");
      uint i = 0;
      /*If the airline has been registered, no action*/
      for (i=0; i < registeredAirline.length; i++) {
        if (newAirline == registeredAirline[i]) {
          return(false,0);
        }
      }
      /*If # of registerred airline is less than minimal, register by existing airline*/
      if (fundedAirline.length <=MIN_REGISTERED){
        for (i=0; i<fundedAirline.length; i++){
          if (fromAddress == fundedAirline[i]){
            registeredAirline.push(newAirline);
            return(true,0);
          }
        }
        /*msg.sender is not a registered airline*/
        return(false,0);
      }
      else {
        /* the requested account need to be a registered airline, and not duplicated*/
        for (uint l=0; l<fundedAirline.length; l++){
          if (fromAddress == fundedAirline[l]){

            bool isDuplicate = false;

            for (uint m=0; m<multiRegister[newAirline].length; m++){
              if (fromAddress == multiRegister[newAirline][m]){
                isDuplicate = true;
                return(false,multiRegister[newAirline].length);
              }
            }
            /*add the address to the requestor list*/
            multiRegister[newAirline].push(fromAddress);
            if (multiRegister[newAirline].length >= fundedAirline.length.mul(MIN_PERC_REGISTERED).div(100)) {
                registeredAirline.push(newAirline);
                delete multiRegister[newAirline];
                return(true,0);
            }
            else {
              return(false,multiRegister[newAirline].length);
            }
          }
        }
      }
    }

   /**
    * @dev Buy insurance for a flight
    *
    */
    function buy
                            (
                              address airline,
                              string  flight,
                              uint256 timestamp
                            )
                            payable
                            external
    {
      require(timestamp - block.timestamp >= 1 hours ,"Insurance purchasing has been closed!" );
      require(msg.value <= 1 ether, "The maximal insuarnce premium is 1 ether!");
      bytes32 flightKey = getFlightKey(airline,flight,timestamp);

      /*check if the sender has purchased insurance*/
      for (uint8 i = 0; i < insurance[flightKey].length; i++){
        if (insurance[flightKey][i].insuree == msg.sender){
          break;
        }
      }

      insuranceStatus memory newInsurance = insuranceStatus(msg.sender,msg.value);

      insurance[flightKey].push(newInsurance);
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
                                (bytes32 flightKey
                                )
                                requireAuthorizeCaller
                                external

    {
      insuranceStatus[] memory flightInsured = insurance[flightKey];
      delete insurance[flightKey];
      address insuree;
      for (uint8 i = 0; i < flightInsured.length; i++){
        insuree = flightInsured[i].insuree;
        insureeBalance[insuree] = insureeBalance[insuree].add(flightInsured[i].insuredAmount.mul(15).div(10));
      }
    }


    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay
                            (
                              address insuree
                            )
                            payable
                            external

    {
      uint256 amount = insureeBalance[insuree];
      insureeBalance[insuree] = 0;
      insuree.transfer(amount);
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */

    function isFunded(address newAirline) view public returns(bool){
      for (uint i=0; i < fundedAirline.length; i++) {
        if (newAirline == fundedAirline[i]) {
          return(true);
        }
      }
      return(false);

    }

    function fund
                            (
                            )
                            public
                            payable
    {
      require(isRegistered(msg.sender),"airline need to be registered before fund");
      require(!isFunded(msg.sender), "airline has been funded");
      require(msg.value == 10 ether, "10 Ethers are needed to fund the account!");
      fundedAirline.push(msg.sender);

    }

    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    function authorizeCaller
                            (
                                address contractAddress
                            )
                            external
                            requireContractOwner
    {
        authorizedContracts[contractAddress] = 1;
    }

    function deauthorizeCaller
                            (
                                address contractAddress
                            )
                            external
                            requireContractOwner
    {
        delete authorizedContracts[contractAddress];
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function()
                            external
                            payable
    {
        fund();
    }


}
