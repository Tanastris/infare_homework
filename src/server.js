const axios = require('axios');
const fs = require('fs');
const ObjectsToCsv = require('objects-to-csv');

// Search parameters for the API
const searchParams = {
  from: 'MAD',
  to: 'AUH',
  depart: '2024-02-02',
  return: '2024-02-16',
  conn: '',
};

// Function to fetch data from the API depending on the search parameters
async function fetchData() {
  const apiUrl = searchParams.conn
    ? `http://homeworktask.infare.lt/search.php?from=${searchParams.from}&to=${searchParams.to}&depart=${searchParams.depart}&return=${searchParams.return}&conn=${searchParams.conn}`
    : `http://homeworktask.infare.lt/search.php?from=${searchParams.from}&to=${searchParams.to}&depart=${searchParams.depart}&return=${searchParams.return}`;

  const response = await axios.get(apiUrl);
  return response.data;
}

// Array to store data to be appended to CSV file
let selectedData = [];

// Function to process and append data to CSV file
function appendToCSV(apiData) {
  // Loop through the totalAvailabilities array to get through all options of flights
  for (let i = 0; i < apiData.totalAvailabilities.length; i++) {
    // Create an empty object to store the data
    let emptyData = {
      price: '',
      taxes: '',
      'outbound 1 airport departure': '',
      'outbound 1 airport arrival': '',
      'outbound 1 time departure': '',
      'outbound 1 time arrival': '',
      'outbound 1 flight number': '',
      'outbound 2 airport departure': '',
      'outbound 2 airport arrival': '',
      'outbound 2 time departure': '',
      'outbound 2 time arrival': '',
      'outbound 2 flight number': '',
      'inbound 1 airport departure': '',
      'inbound 1 airport arrival': '',
      'inbound 1 time departure': '',
      'inbound 1 time arrival': '',
      'inbound 1 flight number': '',
      'inbound 2 airport departure': '',
      'inbound 2 airport arrival': '',
      'inbound 2 time departure': '',
      'inbound 2 time arrival': '',
      'inbound 2 flight number': '',
    };

    // Get the recommendationId from the totalAvailabilities array to be compared with the recommendationId from the journeys array
    const recommendationId = apiData.totalAvailabilities[i].recommendationId;

    // Filter the journeys array to get the matching departures
    const matchingDepartures = apiData.journeys.filter(
      (obj) =>
        obj.recommendationId === recommendationId &&
        obj.direction === 'I' &&
        obj.flights.length < 3
    );

    // Loop through the matching departures to get the matching arrivals
    matchingDepartures.map((dObj) => {
      const matchingArrivals = apiData.journeys.filter(
        (obj) =>
          obj.recommendationId === recommendationId &&
          obj.direction === 'V' &&
          obj.flights.length < 3
      );

      // Loop through matching arrivals and populate the emptyData object with the data
      matchingArrivals.map((aObj) => {
        // Check if it is direct flight or with connection. If it is with connection, check if the connection airport is the same as the one specified in the search parameters or if there is no connection airport specified in the search parameters. Then populate the emptyData object with the data.
        if (
          dObj.flights.length === 1 ||
          (searchParams.conn &&
            dObj.flights.length === 2 &&
            dObj.flights[0].airportArrival.code === searchParams.conn &&
            aObj.flights.length === 1) ||
          (searchParams.conn &&
            aObj.flights[0].airportArrival.code === searchParams.conn) ||
          (!searchParams.conn && dObj.flights.length === 2) ||
          aObj.flights.length === 2
        ) {
          emptyData.price = apiData.totalAvailabilities[i].total;
          emptyData.taxes = dObj.importTaxAdl + aObj.importTaxAdl;
          emptyData['outbound 1 airport departure'] =
            dObj.flights[0].airportDeparture.code;
          emptyData['outbound 1 airport arrival'] =
            dObj.flights[0].airportArrival.code;
          emptyData['outbound 1 time departure'] =
            dObj.flights[0].dateDeparture;
          emptyData['outbound 1 time arrival'] = dObj.flights[0].dateArrival;
          emptyData['outbound 1 flight number'] =
            dObj.flights[0].companyCode + dObj.flights[0].number;
          emptyData['inbound 1 airport departure'] =
            aObj.flights[0].airportDeparture.code;
          emptyData['inbound 1 airport arrival'] =
            aObj.flights[0].airportArrival.code;
          emptyData['inbound 1 time departure'] = aObj.flights[0].dateDeparture;
          emptyData['inbound 1 time arrival'] = aObj.flights[0].dateArrival;
          emptyData['inbound 1 flight number'] =
            aObj.flights[0].companyCode + aObj.flights[0].number;

          // Check if there is a second flight in the outbound and populate the emptyData object with the data
          if (dObj.flights.length === 2) {
            emptyData['outbound 2 airport departure'] =
              dObj.flights[1].airportDeparture.code;
            emptyData['outbound 2 airport arrival'] =
              dObj.flights[1].airportArrival.code;
            emptyData['outbound 2 time departure'] =
              dObj.flights[1].dateDeparture;
            emptyData['outbound 2 time arrival'] = dObj.flights[1].dateArrival;
            emptyData['outbound 2 flight number'] =
              dObj.flights[1].companyCode + dObj.flights[1].number;
          }

          // Check if there is a second flight in the inbound and populate the emptyData object with the data
          if (aObj.flights.length === 2) {
            emptyData['inbound 2 airport departure'] =
              aObj.flights[1].airportDeparture.code;
            emptyData['inbound 2 airport arrival'] =
              aObj.flights[1].airportArrival.code;
            emptyData['inbound 2 time departure'] =
              aObj.flights[1].dateDeparture;
            emptyData['inbound 2 time arrival'] = aObj.flights[1].dateArrival;
            emptyData['inbound 2 flight number'] =
              aObj.flights[1].companyCode + aObj.flights[1].number;
          }
        }
      });

      // Push emptyData object into selectedData array
      selectedData.push(emptyData);
    });
  }
}

// Main function
async function main() {
  try {
    // Fetch data from the API
    const apiResponse = await fetchData();

    // Check if the received data structure is as expected
    if (apiResponse && apiResponse.body && apiResponse.body.data) {
      // Extract the data from the 'data' property
      const apiData = apiResponse.body.data;

      // Process and append data to CSV file
      appendToCSV(apiData);

      // Create the csv file paths for all data amd cheapest flight data
      const csvFilePath = 'data.csv';
      const csvCheapestFilePath = 'cheapest.csv';

      // Check if the main csv file exists. If not, create it and add the headers
      if (!fs.existsSync(csvFilePath)) {
        fs.writeFileSync(
          csvFilePath,
          Object.keys(selectedData[0]).join(',') + '\n'
        );
      }

      // Check if the cheapest csv file exists. If not, create it and add the headers
      if (!fs.existsSync(csvCheapestFilePath)) {
        fs.writeFileSync(
          csvCheapestFilePath,
          Object.keys(selectedData[0]).join(',') + '\n'
        );
      }

      // Sort the selectedData array by price so that the cheapest flight is the first one
      selectedData.sort((a, b) => a.price - b.price);

      // Append the selected data to the main csv file and the cheapest flight data to the cheapest csv file
      const csv = new ObjectsToCsv(selectedData);
      await csv.toDisk(csvFilePath, { append: true, header: false });
      const csvCheap = new ObjectsToCsv([selectedData[0]]);
      await csvCheap.toDisk(csvCheapestFilePath, {
        append: true,
        header: false,
      });

      console.log('CSV data has been written to data.csv');
    } else {
      console.error('Invalid JSON data structure received. Stopping process.');
    }
  } catch (error) {
    console.error('An error occurred:', error.message);
  }
}

// Initiate the main function
main();
