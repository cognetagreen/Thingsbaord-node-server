import axios from 'axios';
import { Request, Response } from 'express';
const jp = require('jsonpath');

const BASE_URL = "https://cogneta.cloud/api";

const getDeviceDetails = async (textSearch: string, Token: string): Promise<deviceDetailsType[]> => {
  const response = await axios.get(`${BASE_URL}/deviceInfos/all?pageSize=20&page=0&textSearch=${textSearch}&sortProperty=createdTime&sortOrder=ASC&includeCustomers=true`, {
    headers: { 'X-Authorization': `Bearer ${Token}` }
  });

  const name = jp.query(response.data, '$.data[*].name');
  const id = jp.query(response.data, '$.data[*].id.id');
  const description = jp.query(response.data, "$.data[*].additionalInfo.description");
  const ownerName = jp.query(response.data, '$.data[*].ownerName');
  const deviceDetails = name.map((value: any, index: any) => ({
    name: name[index],
    id: id[index],
    description : description,
    ownerName: ownerName[index],
  }));

  return deviceDetails;
};

interface deviceDetailsType {
    name : string;
    id : string;
    description : string[];
    ownerName : string;
}

const GetSpecificYieldController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { textSearch, key, token } = req.body;
    const deviceDetails = await getDeviceDetails(textSearch, token);
    // console.log(deviceDetails);

    const series = await Promise.all(
      deviceDetails.map(async (device, i) => {
        const id = device.id;
        const jsonString = device.description;
        const Description = jsonString.map(jsonStr => JSON.parse(jsonStr));
        const ownerName = device.ownerName as String;

        try {
          const response = await axios.get(`${BASE_URL}/plugins/telemetry/DEVICE/${id}/values/timeseries?keys=${key}`, {
            headers: { 'X-Authorization': `Bearer ${token}` }
          });

          const telemetryData = response.data[key];

          if (telemetryData && telemetryData.length > 0) {
            const DC = Description[i].Plant_DC_Capacity as number;
            const x = Number(telemetryData[0].ts);
            const y = Number(telemetryData[0].value).toFixed(2);
            return {
              name: ownerName,
              data: [[x, parseFloat((parseFloat(y)/DC).toFixed(2)) || 0]],
            };
          }
        } catch (error) {
          console.error(`Error fetching telemetry data for device ${id}:`, error);
        }

        return null; // Return null if no data or error occurs
      })
    );

    // Filter out any null results (devices that failed to fetch or had no data)
    const filteredSeries = series.filter((s) => s !== null);

    if (filteredSeries.length > 0) {
        // console.log(filteredSeries[0].data)
      res.status(200).json(filteredSeries);
    } else {
      res.status(404).json({ error: "No telemetry data found" });
    }
  } catch (error) {
    console.error("Error fetching device details", error);
    res.status(500).json({ error: "Failed to fetch device details" });
  }
};

export { GetSpecificYieldController };
