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
interface typeType {
    column : string;
    line : string;
}
const GetColumnLineController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { textSearch, type, token } = req.body;
    const deviceDetails = await getDeviceDetails(textSearch, token);
    console.log(deviceDetails);

    let series = [];

    for(var i = 0; i < Object.entries(type).length; i++) {
        if(i == 0) { // This is for Column!  ((2 Column))
            const keys = Object.values(type)[i];
            console.log(i, Object.entries(type)[i])
            let columnsData = [];
            for(var j = 0; j < deviceDetails.length; j++) {
                const id = deviceDetails[j].id;
                console.log(id, deviceDetails.length, j)
                try {
                  const response = await axios.get(`${BASE_URL}/plugins/telemetry/DEVICE/${id}/values/timeseries?keys=${keys}`, {
                    headers: { 'X-Authorization': `Bearer ${token}` }
                  });
                  const value = jp.query(response.data, '$..value')
                  columnsData.push((value));
                } catch (error) {
                  console.error(`Error fetching telemetry data for device ${id}:`, error);
                } 
            }

            console.log("columnsData : ", columnsData);
            let sum = []
            for(var k = 0; k < columnsData.length; k++) {
                sum.push(parseFloat(columnsData[0][k]) + parseFloat(columnsData[1][k]));
                var data = sum.map((value, index) => ({
                    name : "Daily Energy",
                    type : "column",
                    data : [parseFloat(columnsData[0][index]) + parseFloat(columnsData[1][index])]
                }))
                series.push(data);
            }
            console.log(sum)
            console.log(series)
              
        }
    }


    // Filter out any null results (devices that failed to fetch or had no data)
    // const filteredSeries = series.filter((s) => s !== null);

    // if (filteredSeries.length > 0) {
        // console.log(filteredSeries[0].data)
      res.status(200).json({error : "filteredSeries"});
    // } else {
    //   res.status(404).json({ error: "No telemetry data found" });
    // }
  } catch (error) {
    console.error("Error fetching device details", error);
    res.status(500).json({ error: "Failed to fetch device details" });
  }
};

export { GetColumnLineController };
