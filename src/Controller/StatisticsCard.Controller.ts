import axios from 'axios';
import { Request, Response } from 'express';
const jp = require('jsonpath');

const BASE_URL = "https://cogneta.cloud/api";

const getDeviceID = async (Label: string, Token: string): Promise<deviceDetailsType[]> => {
  const response = await axios.get(`${BASE_URL}/deviceInfos/all?pageSize=20&page=0&textSearch=${Label}&sortProperty=createdTime&sortOrder=ASC&includeCustomers=true`, {
    headers: { 'X-Authorization': `Bearer ${Token}` }
  });
  const name = jp.query(response.data, '$.data[*].label');
  const id = jp.query(response.data, '$.data[*].id.id');
  const ownerName = jp.query(response.data, '$.data[*].ownerName');

  const deviceDetails = name.map((value: any, index: any) => ({
    name: name[index],
    id: id[index],
    ownerName: ownerName[index],
  }));

  return deviceDetails;
};

interface deviceDetailsType {
  name : string;
  id : string;
  ownerName : string;
}

const getStatisticsData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { deviceLabel, telemetry, token } = req.body;
    const deviceInfo = await getDeviceID(deviceLabel, token);
    // console.log(deviceInfo)
    try {
      const currentTime = new Date().getTime();
      const prevDay = currentTime - 1000 * 60 * 60 * 24;

      let allLatestValues = 0 as number;
      let allStats = 0 as number;
      let allSparkValues = [] as number[];
      let error = [] as object[];

      for(const deviceID of deviceInfo) {
        
        const response = await axios.get(
          `${BASE_URL}/plugins/telemetry/DEVICE/${deviceID.id}/values/timeseries?keys=${telemetry}&startTs=${prevDay}&endTs=${currentTime}&interval=0&limit=3000&agg=NONE&orderBy=ASC&useStrictDataTypes=false`,
          {
            headers: { 'X-Authorization': `Bearer ${token}` },
          }
        );
        const telemetryData = response.data[telemetry];
        // console.log("Telemetry Data:", telemetryData); // Check the data structure
  
        if (telemetryData && Array.isArray(telemetryData) && telemetryData.length > 0) {
          let sparkValues = jp.query(telemetryData, '$..value') as string[];
  
          let latestValue: number, compareValue: number;
          if (req.body.title === "Total Revenue") {
            latestValue = Number(telemetryData[telemetryData.length - 1].value) * 3;
            compareValue = Number(telemetryData[0].value) * 3;
          } else {
            latestValue = Number(telemetryData[telemetryData.length - 1].value);
            compareValue = Number(telemetryData[0].value);
          }
  
          let stat = 0;
          if (latestValue > 0) {
            stat = compareValue
          }
          // console.log(latestValue, compareValue, stat, deviceID, telemetry);
            allLatestValues = allLatestValues + latestValue
            allStats = allStats + stat
            if(allSparkValues.length>0) {
              allSparkValues = sparkValues.map((value : string, i : number) => {
                return allSparkValues[i]? parseFloat(value) || 0 + allSparkValues[i] : parseFloat(value) || 0 + 0;
              })
            } else {
              allSparkValues = sparkValues.map(Number).slice(-60)
            }
        } else {
          error.push({ error: "No telemetry data found for ID : ", deviceID });
        }
      }
      // console.log("allStats : ", allStats, allLatestValues)

      if(allSparkValues.length) {
        res.status(200).json([
          allLatestValues.toFixed(2),
          (((allLatestValues - allStats) * 100) / allLatestValues).toFixed(2),
          allSparkValues
        ])
      } else {
        res.status(404).json({error : "Values are not in any plant!"});
      }
      


    } catch (error) {
      // console.error("Error fetching telemetry data", error);
      res.status(500).json({ error: error });
    }
  } catch (error) {
    console.error("Error fetching device ID", error);
    res.status(500).json({ error: "Failed to fetch device ID" });
  }
};


export { getStatisticsData };
