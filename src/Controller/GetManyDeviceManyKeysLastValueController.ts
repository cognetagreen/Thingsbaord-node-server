import axios from 'axios';
import { Request, Response } from 'express';
const jp = require('jsonpath');

const BASE_URL = "https://cogneta.cloud/api";

const getDeviceID = async (Label: string, Token: string, CustomerID: string): Promise<string> => {
  const response = await axios.get(`${BASE_URL}/customer/${CustomerID}/deviceInfos?pageSize=20&page=0&textSearch=${Label}&sortProperty=createdTime&sortOrder=ASC&includeCustomers=true`, {
    headers: { 'X-Authorization': `Bearer ${Token}` }
  });
  const ID = jp.query(response.data, '$.data[*].id.id');
  return ID[0];
};

interface TimeWindowType {
  startTs: number;
  endTs: number;
  aggregate: string;
  interval: number;
}

interface TimeSeries {
  ts: number;
  value: string;
}


const GetManyDeviceManyKeysLastValueController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { searchTag, timeWindow, token, customerID } = req.body;
    const { startTs, endTs, aggregate, interval } = timeWindow as TimeWindowType;
    const searchElements = searchTag as any[];
    console.log(searchTag, timeWindow);
    let series = [] as any[];
    let errors = [] as any[];

    // Use Promise.all to wait for all asynchronous operations to complete
    await Promise.all(
      searchElements.map(async (elem) => {
        const deviceID = await getDeviceID(elem.devName, token, customerID);
        // console.log(deviceID)

        try {
          const response = await axios.get(`${BASE_URL}/plugins/telemetry/DEVICE/${deviceID}/values/timeseries?keys=${elem.keys}&startTs=${startTs}&endTs=${endTs}&intervalType=MILLISECONDS&interval=${interval}&limit=5000&agg=${aggregate}&orderBy=ASC&useStrictDataTypes=false`, {
            headers: { 'X-Authorization': `Bearer ${token}` }
          });
          const telemetryData = response.data;

        //   console.log(response)

          if (telemetryData) {
            const keys = elem.keys as string;
            const key = keys.split(",");
            let seriesData = [];

            for (let i = 0; i < key.length; i++) {
              const values = telemetryData[key[i]] as TimeSeries[];
                // ****** Logic For Last Values of Day ********
              var data = values.map(function(tsValuePair) {
                return { x: tsValuePair.ts, y: tsValuePair.value };
            });
            var tsArr = data.map(elem => {
                var date = new Date(elem.x);
                var dateString = date.toLocaleString().split(",")[0].replace(/\//g, "");
                return [dateString, elem.x, parseFloat(elem.y)];
            });
            // console.log(tsArr)
            var lastValuesMap = new Map();
    
            // Iterate over tsArr
            tsArr.forEach(subarr => {
                var dateString = subarr[0];
                var date = new Date(subarr[1]);
                date.setSeconds(0,0);
                date.setMinutes(0);
                var ts = date.getTime();
                var value = subarr[2];
                    // Update the value for the current date string
                    lastValuesMap.set(dateString, [ts, value]); // Storing [ts, value] as the value
            });
    
            // Extract the last values for each date string
            data = Array.from(lastValuesMap.values());

            // console.log("data : ", data);

              seriesData.push(data);
              series.push({
                type: elem.type[i],
                name: elem.name[i],
                data: seriesData[i],
                marker: {
                  enabled: false // Disable the dots on the line
                },
                shadow: {
                  color: 'rgba(0, 0, 0, 0.1)', // Shadow color
                  offsetX: 1, // Horizontal offset of the shadow
                  offsetY: 1, // Vertical offset of the shadow
                  opacity: 0.3, // Shadow opacity
                  blur: 2 // Shadow blur
                }
              });
            }
          } else {
            errors.push({ message: "No telemetry data found for device", deviceID });
          }
        } catch (error : any) {
          errors.push({ message: "Failed to fetch telemetry data", error: error.message });
        }
      })
    );

    if (series.length > 0) {
      res.status(200).json(series);
    } else if (errors.length > 0) {
      res.status(500).json({ errors });
    } else {
      res.status(404).json({ error: "No telemetry data found" });
    }

  } catch (error) {
    console.error("Error fetching device ID", error);
    res.status(500).json({ error: "Failed to fetch device ID" });
  }
};


export { GetManyDeviceManyKeysLastValueController };
