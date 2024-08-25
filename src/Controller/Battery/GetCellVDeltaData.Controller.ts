import axios from 'axios';
import { Request, Response } from 'express';
const jp = require('jsonpath');

const BASE_URL = "https://cogneta.cloud/api";

const getDeviceID = async (Label: string, Token: string, CustomerID : string): Promise<string> => {
  const response = await axios.get(`${BASE_URL}/customer/${CustomerID}/deviceInfos?pageSize=20&page=0&textSearch=${Label}&sortProperty=createdTime&sortOrder=ASC&includeCustomers=true`, {
    headers: { 'X-Authorization': `Bearer ${Token}` }
  })
  const ID = jp.query(response.data, '$.data[*].id.id');
  return ID[0];
};


interface TimeSeries {
    ts : number;
    value : string;
}

const GetCellVDeltaController = async (req: Request, res: Response): Promise<void> => {
    try {
      const { searchTag, token, customerID } = req.body;
      // console.log(searchTag.type[0]); 
        // console.log(timeWindow)
    //   console.log(searchTag, searchTag.name[0])
      const deviceID = await getDeviceID(searchTag.devName, token, customerID);
      const now = new Date();
      const startTs = new Date(now.getTime() - 24 * 60 * 60 * 1000).setHours(0,0,0,0)
      const endTs = startTs + 24     * 60 * 60 * 1000 - 1;
    //   console.log("deviceID : ", deviceID)
      try {
        const response = await axios.get(`${BASE_URL}/plugins/telemetry/DEVICE/${deviceID}/values/timeseries?keys=${searchTag.keys}&startTs=${startTs}&endTs=${endTs}&intervalType=MILLISECONDS&interval=${1000*60*5}&limit=5000&agg=NONE&orderBy=ASC&useStrictDataTypes=false`, {
          headers: { 'X-Authorization': `Bearer ${token}` }
        });
        const telemetryData = response.data;
            // console.log(telemetryData);
        // Check if telemetryData is defined and has at least one element
        if (telemetryData) {

            const key = searchTag.keys as string;
            // const key = keys.split(",");
            let series = [];
            // for(var i = 0; i < key.length; i++) {
                const values = telemetryData[key] as TimeSeries[];
                // console.log(values)
                let seriesData = values.map(elem => parseFloat(((220-parseFloat(elem.value))/220).toFixed(2)));
                const countArray = seriesData.reduce<{[key: number]: number}>((acc, curr) => {
                    acc[curr] = (acc[curr] || 0) + 1;
                    return acc;
                  }, {});
                
                series.push({
                    type : searchTag.type[0],
                    name : searchTag.name[0],
                    data : Object.values(countArray),//[11,22,33,44,55,66,77,88,99]
                });
            // }

            // console.log(series) 
        //   const latestValue = seriesData;
          res.status(200).json(series);
        } else {
          res.status(404).json({ error: "No telemetry data found" });
        }
      } catch (error) {
        // console.error("Error fetching telemetry data", error);
        res.status(500).json({ error: "Failed to fetch telemetry data" });
      }
    } catch (error) {
      console.error("Error fetching device ID", error);
      res.status(500).json({ error: "Failed to fetch device ID" });
    }
  };
  

export { GetCellVDeltaController };
