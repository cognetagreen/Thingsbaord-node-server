import axios from 'axios';
import { Request, Response } from 'express';
const jp = require('jsonpath');

const BASE_URL = "https://cogneta.cloud/api";

interface DeviceDetailsType {
  name: string;
  id: string;
  ownerName: string;
}

interface TimeWindowType {
  startTs: number;
  endTs: number;
  aggregate: string;
  interval : number;
}

const getDeviceDetails = async (device: string, Token: string): Promise<DeviceDetailsType[]> => {
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

const GetGeneratorTableController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { searchTag, token, timeWindow } = req.body;
    const { startTs, endTs, aggregate, interval } = timeWindow as TimeWindowType;
    console.log(timeWindow);
    let series = [];
    let column = ["Date & Time"] as string[];
    let nonFormatDataFromAPI = [] as string[][];

    // Iterate over each device in the searchTag
    for (const [device, key] of Object.entries(searchTag)) {
      const deviceDetails = await getDeviceDetails(`${device}-`, token);
      // console.log(deviceDetails);

      // Sequentially fetch telemetry data for each device
      for (const [i, deviceInfo] of deviceDetails.entries()) {
        const id = deviceInfo.id;
        const stringKey = key as string;
        const newKey = stringKey.replace("0", (deviceInfo.name).split("-")[1]); // DG-2 => ["DG", 2]

        try {
          const response = await axios.get(`${BASE_URL}/plugins/telemetry/DEVICE/${id}/values/timeseries?keys=${newKey}&startTs=${startTs}&endTs=${endTs}&intervalType=MILLISECONDS&interval=${interval}&limit=5000&agg=${aggregate}&orderBy=ASC&useStrictDataTypes=false`, {
            headers: { 'X-Authorization': `Bearer ${token}` }
          });

          const value = jp.query(response.data, '$..value') as [];

          // console.log(response.data);
          // console.log(value);

          // Add the key to the column list
          column.push(newKey);

          if (i === 0) {
            const ts = jp.query(response.data, '$..ts') as [];
            // console.log("ts", [ts]);
            nonFormatDataFromAPI.push(ts.map(elem => new Date(elem).toLocaleString()));
          }
          nonFormatDataFromAPI.push(value.map(elem => Number(elem).toFixed(2)));
        } catch (error) {
          console.error(`Error fetching telemetry data for device ${id}:`, error);
          continue; // Skip to the next device if there's an error
        }
      }
    }

    // Reverse the column for table and format data accordingly
    let dataFromAPI = [] as string[][];
    if (nonFormatDataFromAPI[0] && nonFormatDataFromAPI[0].length > 0) {
      for (let k = nonFormatDataFromAPI[0].length - 1; k >= 0; k--) {
        let tempArrayPower = [];
        for (let j = 0; j < nonFormatDataFromAPI.length; j++) {
          tempArrayPower.push(nonFormatDataFromAPI[j][k]);
        }
        dataFromAPI.push(tempArrayPower);
      }
    }

    // console.log(nonFormatDataFromAPI);
    series.push({ column: column, dataFromAPI: dataFromAPI });

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

export { GetGeneratorTableController };