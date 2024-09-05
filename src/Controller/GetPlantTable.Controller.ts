import axios from 'axios';
import { Request, Response } from 'express';
const jp = require('jsonpath');

const BASE_URL = "https://cogneta.cloud/api";

interface customerDetailsType {
    id : string;
    country : string;
    additionalInfo : string;
}

interface DeviceDetailsType {
  name: string;
  id: string;
  ownerName: string;
}

const getCustomersDetails = async (textSearch: string, Token: string): Promise<customerDetailsType[]> => {
    const response = await axios.get(`${BASE_URL}/user/customers?pageSize=10&page=0&sortProperty=createdTime&textSearch=${textSearch}`, {
      headers: { 'X-Authorization': `Bearer ${Token}` }
    });
//   console.log("response.data : ", response.data);
  const id = jp.query(response.data, '$.data[*].id.id');
  const country = jp.query(response.data, '$.data[*].country');
  const additionalInfo = jp.query(response.data, '$.data[*].additionalInfo.description') as string[];
  const customerDetails = id.map((value: any, index: any) => ({
    id: id[index],
    country : country[index],
    additionalInfo: additionalInfo[index],
  }));

    return customerDetails;
  };

const getDeviceDetails = async (device: string, customerID : string, Token: string): Promise<DeviceDetailsType[]> => {
  const response = await axios.get(`${BASE_URL}/customer/${customerID}/deviceInfos?pageSize=200&page=0&textSearch=${device}&sortProperty=label&sortOrder=ASC&includeCustomers=true`, {
    headers: { 'X-Authorization': `Bearer ${Token}` }
  });
//   console.log("response.data : ", response.data);
  const name = jp.query(response.data, '$.data[*].label');
  const id = jp.query(response.data, '$.data[*].id.id');
  const devName = jp.query(response.data, '$.data[*].name');
  const deviceDetails = name.map((value: any, index: any) => ({
    name: name[index],
    id: id[index],
    devName: devName[index],
  }));

  return deviceDetails;
};

const GetPlantTableController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { searchTag, textSearch, token } = req.body;
    console.log("searchTag : ",searchTag);

    let series = [];
    let column = [] as string[];
    let nonFormatDataFromAPI = [] as string[][];
    
    const customerDetails = await getCustomersDetails(textSearch, token);
    console.log("customerDetails : ", customerDetails);
    for(const [index, info] of Object.entries(customerDetails)) {

      // if(index !== "0") {
      //   nonFormatDataFromAPI.push(nonRowFormatDataFromAPI);
      // }

      const id = info.id;
      const parseInfo = JSON.parse(info.additionalInfo);
      const plantName = (parseInfo.Plant_Name).split(".")[1];
      const type = (parseInfo.Plant_Name).split(".")[0];
      const capacity = parseInfo.Capacity;
      const EnergySystem = parseInfo.Energy_System;
      const country = info.country;
      
      column.push("plantName", "type", "Object.entries(capacity).keys", "EnergySystem", "Country")

        console.log("parseInfo : ", id, plantName, type, Object.keys(capacity), EnergySystem, country);

        let nonRowFormatDataFromAPI = [plantName, type, EnergySystem, Object.values(capacity), country] as string[][];
        
        // Iterate over each device in the searchTag
        for (const [device, key] of Object.entries(searchTag)) {
          const deviceDetails = await getDeviceDetails(`${device}`, id, token);
          console.log("deviceDetails : ", deviceDetails);
    
          // Sequentially fetch telemetry data for each device
          for (const [i, deviceInfo] of deviceDetails.entries()) {
            const id = deviceInfo.id;
            const stringKey = key as string;
            const newKey = stringKey.replace(/0/g, (deviceInfo.name).split("-")[1]); // DG-2 => ["DG", 2]
    
            try {
              const response = await axios.get(`${BASE_URL}/plugins/telemetry/DEVICE/${id}/values/timeseries?keys=${newKey}&useStrictDataTypes=true`, {
                headers: { 'X-Authorization': `Bearer ${token}` }
              });
    
              const value = jp.query(response.data, '$..value') as string[];
    
              // console.log(response.data);
              // console.log(value);
    
              // Add the key to the column list
              
              // if (i === 0) {
              //   var temp ="Name,"+  newKey;
              //     column = (temp.split(","));
                // const ts = jp.query(response.data, '$..ts') as [];
                // console.log("ts", [ts]);
                // nonFormatDataFromAPI.push(ts.map(elem => new Date(elem).toLocaleString())); // DATE & TIME
            // }
            nonRowFormatDataFromAPI.push( value ); // NAME OF DEVICES/PLANTS AND 1 Key
            //   nonFormatDataFromAPI.push(value.map(elem => parseFloat(elem).toFixed(2)));
            } catch (error) {
              console.error(`Error fetching telemetry data for device ${id}:`, error);
              continue; // Skip to the next device if there's an error
            }
          }
        }

        nonFormatDataFromAPI.push((nonRowFormatDataFromAPI).flat(1));
    }


    // Reverse the column for table and format data accordingly
    // let dataFromAPI = [] as string[][];
    // if (nonFormatDataFromAPI[0] && nonFormatDataFromAPI[0].length > 0) {
    //   for (let k = nonFormatDataFromAPI[0].length - 1; k >= 0; k--) {
    //     let tempArrayPower = [];
    //     for (let j = 0; j < nonFormatDataFromAPI.length; j++) {
    //       tempArrayPower.push(nonFormatDataFromAPI[j][k]);
    //     }
    //     dataFromAPI.push(tempArrayPower);
    //   }
    // }

    // console.log(nonFormatDataFromAPI);
    series.push({ column: column, dataFromAPI: nonFormatDataFromAPI });

    // console.log("series", series);

    const filteredSeries = series.filter((s) => s !== null);

    if (filteredSeries.length > 0) {
      res.status(200).json(filteredSeries);
    } else {
      res.status(404).json({ error: "No telemetry data found" });
    }
  } catch (error) {
    console.error("Error fetching device details", error);
    res.status(500).json({ error: "Failed to fetch device details" });
  }
};

export { GetPlantTableController };