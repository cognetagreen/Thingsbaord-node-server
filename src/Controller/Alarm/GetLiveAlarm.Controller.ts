import axios from 'axios';
import { Request, response, Response } from 'express';
const jp = require('jsonpath');

const BASE_URL = "https://cogneta.cloud/api";

// interface DeviceDetailsType {
//   name: string;
//   id: string;
//   ownerName: string;
// }

interface TimeWindowType {
  startTs: number;
  endTs: number;
  aggregate: string;
  interval : number;
}

const getDeviceDetails = async (device: string, Token: string): Promise<string> => {
  const response = await axios.get(`${BASE_URL}/deviceInfos/all?pageSize=200&page=0&textSearch=${device}&sortProperty=createdTime&sortOrder=ASC&includeCustomers=true`, {
    headers: { 'X-Authorization': `Bearer ${Token}` }
  });

  // const name = jp.query(response.data, '$.data[*].label');
  const id = jp.query(response.data, '$.data[*].id.id');
  // const ownerName = jp.query(response.data, '$.data[*].ownerName');
  // const deviceDetails = name.map((value: any, index: any) => ({
  //   name: name[index],
  //   id: id[index],
  //   ownerName: ownerName[index],
  // }));
  // console.log(deviceDetails);
  return id[0];
};

const GetLiveAlarmController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { searchDev, token, timeWindow } = req.body;
    const { startTs, endTs, aggregate, interval } = timeWindow as TimeWindowType;
    // console.log(searchDev, timeWindow);
    const deviceDetails = await getDeviceDetails(searchDev, token);
    // console.log(deviceDetails);
    const series = [];
    const nonFormatData = [];
    // for (const deviceInfo of  deviceDetails) {
        
        try {
            const response = await axios.get(`${BASE_URL}/v2/alarm/DEVICE/${deviceDetails}`, {params : {
                startTime : startTs,
                endTime : endTs,
                pageSize : 1000,
                page : 0,
                sortProperty : "severity",
                sortOrder : "ASC"
            },
            headers : { 'X-Authorization': `Bearer ${token}` }});

            // console.log(response.data);

            // $..data[*].startTs
            // $..data[*].endTs
            // Duration = endTs - startTs

            const AlarmID = jp.query(response.data, "$..data[*].id.id");
            const Device = jp.query(response.data, "$..data[*].originatorLabel");
            const createdTime = jp.query(response.data, "$..data[*].createdTime");
            const type = jp.query(response.data, "$..data[*].type");
            const severity = jp.query(response.data, "$..data[*].severity");
            const status = jp.query(response.data, "$..data[*].status");
            const assignee = jp.query(response.data, "$..data[*].assignee");
            // const acknowledged = jp.query(response.data, "$..[?(@.acknowledged == false)].id.id");
            // const cleared = jp.query(response.data, "$..[?(@.cleared == !true)].id.id");
            const acknowledged = AlarmID
              .map((id: any, index: number) => 
                jp.query(response.data, `$..data[${index}].acknowledged`)[0] ? null : id
            );

            const cleared = AlarmID
              .map((id: any, index: number) => 
                jp.query(response.data, `$..data[${index}].cleared`)[0] ? null : id
            );


            nonFormatData.push(Device, createdTime, type, severity, status, assignee, acknowledged, cleared);

            // }
            
            // Reverse the column for table and format data accordingly
            let dataFromAPI = [] as string[][];
            if (nonFormatData[0] && nonFormatData[0].length > 0) {
              for (let k = nonFormatData[0].length - 1; k >= 0; k--) {
                let tempArrayPower = [];
                for (let j = 0; j < nonFormatData.length; j++) {
                  tempArrayPower.push(nonFormatData[j][k]);
                }
                dataFromAPI.push(tempArrayPower);
              }
            }
            
            // console.log(nonFormatData);
            series.push({ dataFromAPI: dataFromAPI });
            
            // console.log("series", series);
            const filteredSeries = series.filter((s) => s !== null);
            
            if (filteredSeries.length > 0) {
              res.status(200).json(filteredSeries);
            } else {
              res.status(404).json({ error: "No telemetry data found" });
            }
          } catch (error) {
              res.status(200).json({error : "Can't Fetched Telemetry"})
          }
          } catch (error) {
    console.error("Error fetching device details", error);
    res.status(500).json({ error: "Failed to fetch device details" });
  }
};

export { GetLiveAlarmController };