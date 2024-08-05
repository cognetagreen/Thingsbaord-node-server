import axios from 'axios';
import { Request, Response } from 'express';
const jp = require('jsonpath');

const BASE_URL = "https://cogneta.cloud/api";

const getDeviceID = async (textSearch: string, Token: string): Promise<any> => {
  const response = await axios.get(`${BASE_URL}/user/customers?pageSize=10&page=0&sortProperty=createdTime&textSearch=${textSearch}`, {
    headers: { 'X-Authorization': `Bearer ${Token}` }
  });
  return response.data;
};

const GetCustomersController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { textSearch, token } = req.body;
    const customerDetails = await getDeviceID(textSearch, token);
    
    // Check if customer data is arrived
    if (customerDetails?.data && customerDetails.data.length > 0) {
      const name = jp.query(customerDetails, '$.data[*].name');
      const customerID = jp.query(customerDetails, '$.data[*].id.id');
      const details = name.map((value: any, index: any) => ({
        value: customerID[index],
        label: name[index], 
      }));

      console.log("details: ", details);
      
      res.status(200).json(details);
    } else {
      res.status(404).json({ error: "No customer data found" });
    }
    
  } catch (error) {
    console.error("Error fetching customer detail", error);
    res.status(500).json({ error: "Failed to fetch customer detail" });
  }
};

export { GetCustomersController };
