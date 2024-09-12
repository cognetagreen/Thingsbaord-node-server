import axios from 'axios';
import { Request, Response } from 'express';
const jp = require('jsonpath');

const BASE_URL = "https://cogneta.cloud/api";

interface customerDetailsType {
    id : string;
    country : string;
    additionalInfo : string;
}

// interface DeviceDetailsType {
//   name: string;
//   id: string;
//   ownerName: string;
// }

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

// const getDeviceDetails = async (device: string, customerID : string, Token: string): Promise<DeviceDetailsType[]> => {
//   const response = await axios.get(`${BASE_URL}/customer/${customerID}/deviceInfos?pageSize=200&page=0&textSearch=${device}&sortProperty=label&sortOrder=ASC&includeCustomers=true`, {
//     headers: { 'X-Authorization': `Bearer ${Token}` }
//   });
// //   console.log("response.data : ", response.data);
//   const name = jp.query(response.data, '$.data[*].label');
//   const id = jp.query(response.data, '$.data[*].id.id');
//   const devName = jp.query(response.data, '$.data[*].name');
//   const deviceDetails = name.map((value: any, index: any) => ({
//     name: name[index],
//     id: id[index],
//     devName: devName[index],
//   }));

//   return deviceDetails;
// };

const GetLocationMapController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { searchTag, token } = req.body;
    // console.log("searchTag : ",searchTag);

    let series = [];
    
    const customerDetails = await getCustomersDetails("kW", token);
    // console.log("customerDetails : ", customerDetails);
    for(const [index, info] of Object.entries(customerDetails)) {

      const id = info.id;
      const parseInfo = JSON.parse(info.additionalInfo);
      const plantName = (parseInfo.Plant_Name).split(".")[1];
      const type = (parseInfo.Plant_Name).split(".")[0];
      const lat = parseInfo.Latitude;
      const long = parseInfo.Longitude;
      const country = info.country;
      
      series.push({
        name : plantName,
        type : type,
        country : country,
        lat : lat,
        long : long
      })

    }

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

export { GetLocationMapController };