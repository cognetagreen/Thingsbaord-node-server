import axios from 'axios';
import { Request, response, Response } from 'express';
const jp = require('jsonpath');

const BASE_URL = "https://cogneta.cloud/api";

const getDeviceDetails = async (device: string, Token: string): Promise<deviceDetailsType[]> => {
  const response = await axios.get(`${BASE_URL}/deviceInfos/all?pageSize=200&page=0&textSearch=${device}&sortProperty=createdTime&sortOrder=ASC&includeCustomers=true`, {
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
  name: string;
  id: string;
  ownerName: string;
}

interface timeWindowType {
    startTs : Number;
    endTs : Number;
    aggregate : string;
}

const GetGeneratorTableController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { searchTag, token, timeWindow } = req.body;
    const {startTs, endTs, aggregate} = timeWindow as timeWindowType;
    console.log(timeWindow);
    let series = [];
    let column = ["Date & Time"] as string[];
    let nonFormatDataFromAPI = [] as string[][];

    for (const [device, key] of Object.entries(searchTag)) {
      const deviceDetails = await getDeviceDetails(`${device}-`, token);
      console.log(deviceDetails);
      
      const telemetryPromises = deviceDetails.map(async (deviceInfo, i) => {
        const id = deviceInfo.id;
        const stringKey = key as string;
        const newKey = stringKey.replace("0", (deviceInfo.name).split("-")[1]);

        try {
          const response = await axios.get(`${BASE_URL}/plugins/telemetry/DEVICE/${id}/values/timeseries?keys=${newKey}&startTs=${startTs}&endTs=${endTs}&interval=0&limit=5000&agg=${aggregate}&orderBy=ASC&useStrictDataTypes=false`, {
            headers: { 'X-Authorization': `Bearer ${token}` }
          });
          const value = jp.query(response.data, '$..value');
          const ts = jp.query(response.data, '$..ts') as [];


          console.log(response.data);
          console.log(value);

          column.push(newKey);
          if(i==0) {
            console.log("ts", [ts])
            nonFormatDataFromAPI.push(ts.map(elem => new Date(elem).toLocaleString()));
            nonFormatDataFromAPI.push(value);
          }else {
            nonFormatDataFromAPI.push(value);
          }
          return response.data;
        } catch (error) {
          console.error(`Error fetching telemetry data for device ${id}:`, error);
          return null;
        }
      });

      const telemetryResults = await Promise.all(telemetryPromises);
      console.log(telemetryResults);
    }

    // Reverse The Column For table
    let dataFromAPI = [] as string[][];
    if (nonFormatDataFromAPI[0].length > 0) {
        for (var k = (nonFormatDataFromAPI[0].length - 1); k >= 0; k--) {
            var tempArrayPower = [];
            for (var j = 0; j < nonFormatDataFromAPI.length; j++) {
                tempArrayPower.push(nonFormatDataFromAPI[j][k]);
            }
            dataFromAPI.push(tempArrayPower);
        }
    }
    console.log(nonFormatDataFromAPI)
    series.push({column : column, dataFromAPI : dataFromAPI});

    console.log("series", series);

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

export { GetGeneratorTableController };
