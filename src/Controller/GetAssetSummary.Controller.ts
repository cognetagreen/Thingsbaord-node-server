import axios from 'axios';
import { Request, Response } from 'express';
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

const GetAssetSummaryController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { searchObj, token } = req.body;
    let series = [];

    for (const [device, key] of Object.entries(searchObj)) {
      const deviceDetails = await getDeviceDetails(`${device}-`, token);
      // console.log(deviceDetails);
      
      const telemetryPromises = deviceDetails.map(async (deviceInfo) => {
        const id = deviceInfo.id;
        const stringKey = key as string;
        const newKey = stringKey.replace("0", (deviceInfo.name).split("-")[1]);   //DG-1 => ["DG", 1]

        try {
          const response = await axios.get(`${BASE_URL}/plugins/telemetry/DEVICE/${id}/values/timeseries?keys=${newKey}`, {
            headers: { 'X-Authorization': `Bearer ${token}` }
          });
          const value = jp.query(response.data, '$..value');

        //   console.log(response.data);
        //   console.log(value);

          return Number(value) > 0;
        } catch (error) {
          console.error(`Error fetching telemetry data for device ${id}:`, error);
          return null;
        }
      });

      const telemetryResults = await Promise.all(telemetryPromises);

      const nonZeroCount = telemetryResults.filter((result) => result === true).length;

      series.push({
        name: `Available % ${device}`,
        y: (nonZeroCount / deviceDetails.length)  // Total Asset In Plant
      },
      {
        name : `Unavailable % ${device}`,
        y : ((deviceDetails.length - nonZeroCount) / deviceDetails.length)
      }
    );
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

export { GetAssetSummaryController };
