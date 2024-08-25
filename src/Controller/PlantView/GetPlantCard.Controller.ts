import axios from 'axios';
import { Request, Response } from 'express';
const jp = require('jsonpath');

const BASE_URL = "https://cogneta.cloud/api";

const getDeviceDetails = async (device: string, customerID : string, Token: string): Promise<deviceDetailsType> => {
  const response = await axios.get(`${BASE_URL}/customer/${customerID}/deviceInfos?pageSize=200&page=0&textSearch=${device}&sortProperty=createdTime&sortOrder=ASC&includeCustomers=true`, {
    headers: { 'X-Authorization': `Bearer ${Token}` }
  });

  const name = jp.query(response.data, '$.data[*].label');
  const id = jp.query(response.data, '$.data[*].id.id');
  const ownerName = jp.query(response.data, '$.data[*].ownerName');
  // console.log(response.data)
  const deviceDetails = name.map((value: any, index: any) => ({
    name: name[index],
    id: id[index],
    ownerName: ownerName[index],
  }));

  return deviceDetails[0];
};

interface deviceDetailsType {
  name: string;
  id: string;
  ownerName: string;
}

const GetPlantCardController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { searchTag, customerID, token } = req.body;
    let series = [];

      const deviceDetails = await getDeviceDetails(searchTag.devName, customerID, token);
      // console.log(deviceDetails);
      
      if(deviceDetails && deviceDetails.id) {
        const id = deviceDetails.id;
        const stringKey = searchTag.keys as string;
        const resolution = searchTag.resolution as string[];
        const agg = searchTag.agg as string[];
        var Daily = 1000*60*5;
        var Monthly = 1000*60*60*24*30;
        var Yearly = Monthly*12;
        
        for(var i=0; i<resolution.length; i++) {
          let interval = 0

          switch (resolution[i]) {
            case "Daily":
              interval = Daily;
              break;
            case "Monthly":
              interval = Monthly;
              break;
            case "Yearly":
              interval = Yearly;
              break;
          
            default:
              interval = Daily;
              break;
          }

            const endTs = new Date().getTime();
            const startTs = endTs - interval;

          // for(var j=0; j<agg.length; j++) {

            try {
              const response = await axios.get(`${BASE_URL}/plugins/telemetry/DEVICE/${id}/values/timeseries?keys=${stringKey}&startTs=${startTs}&endTs=${endTs}&intervalType=MILLISECONDS&interval=${interval}&limit=100&agg=${agg[0]}`, {
                headers: { 'X-Authorization': `Bearer ${token}` }
              });

              // console.log(response.data)
              const values = jp.query(response.data, "$..value");
              // console.log(values)
              series.push(values);
              // res.status(200).json([[]])
              
            } catch (error) {
                console.error(`Error fetching telemetry data for device ${id}:`, error);
              }
              
            }
            
          // }
          
          
          // console.log("series", series);
          if (series.length>0) {
            res.status(200).json(series);
          } else {
            res.status(404).json({ error: "No telemetry data found" });
          }
          
    // const filteredSeries = series.filter((s) => s !== null);
      }
  } catch (error) {
    console.error("Error fetching device details", error);
    res.status(500).json({ error: "Failed to fetch device details" });
  }
};

export { GetPlantCardController };
