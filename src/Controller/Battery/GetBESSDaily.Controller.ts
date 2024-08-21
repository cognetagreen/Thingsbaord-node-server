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

interface TimeWindowType {
    startTs: number;
    endTs: number;
    aggregate: string;
    interval : number;
  }

interface TimeSeries {
    ts : number;
    value : string;
}

const GetBESSDailyController = async (req: Request, res: Response): Promise<void> => {
    try {
      const { searchTag, timeWindow, token, customerID } = req.body;
      const { startTs, endTs, aggregate, interval } = timeWindow as TimeWindowType;
        // console.log(timeWindow)
    //   console.log(searchTag, searchTag.name[0])
      const deviceID = await getDeviceID(searchTag.devName, token, customerID);
    //   console.log("deviceID : ", deviceID)
      try {
        const response = await axios.get(`${BASE_URL}/plugins/telemetry/DEVICE/${deviceID}/values/timeseries?keys=${searchTag.keys}&startTs=${startTs}&endTs=${endTs}&intervalType=MILLISECONDS&interval=${interval}&limit=5000&agg=${aggregate}&orderBy=ASC&useStrictDataTypes=false`, {
          headers: { 'X-Authorization': `Bearer ${token}` }
        });
        const telemetryData = response.data;
            // console.log(telemetryData);
        // Check if telemetryData is defined and has at least one element
        if (telemetryData) {

            const keys = searchTag.keys as string;
            const key = keys.split(",");
            let seriesData = [];
            let series = [];
            for(var i = 0; i < key.length; i++) {
                const values = telemetryData[key[i]] as TimeSeries[];
                // console.log(values)
                seriesData.push(values.map(elem => [elem.ts , parseFloat(parseFloat(elem.value).toFixed(2))]))
                series.push({
                    type : searchTag.type,
                    name : searchTag.name[i],
                    data : seriesData[i],
                    marker: {
                        enabled: false // Disable the dots on the line
                    }
                });
            }

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
  

export { GetBESSDailyController };
