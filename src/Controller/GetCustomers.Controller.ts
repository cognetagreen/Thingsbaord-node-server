import axios from 'axios';
import { Request, Response } from 'express';
const jp = require('jsonpath');

const BASE_URL = "https://cogneta.cloud/api";

<<<<<<< HEAD
// For Multiple Customers e.g. Deif India

const getCustomersDetails = async (textSearch: string, Token: string): Promise<any> => {
=======
const getDeviceID = async (textSearch: string, Token: string): Promise<any> => {
>>>>>>> f8603801177abfe120430e731a7cb26e6e11e957
  const response = await axios.get(`${BASE_URL}/user/customers?pageSize=10&page=0&sortProperty=createdTime&textSearch=${textSearch}`, {
    headers: { 'X-Authorization': `Bearer ${Token}` }
  });
  return response.data;
};

const GetCustomersController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { textSearch, token } = req.body;
<<<<<<< HEAD
    const customerDetails = await getCustomersDetails(textSearch, token);
=======
    const customerDetails = await getDeviceID(textSearch, token);
>>>>>>> f8603801177abfe120430e731a7cb26e6e11e957
    
    // Check if customer data is arrived
    if (customerDetails?.data && customerDetails.data.length > 0) {
      const name = jp.query(customerDetails, '$.data[*].name');
      const customerID = jp.query(customerDetails, '$.data[*].id.id');
      const details = name.map((value: any, index: any) => ({
        value: customerID[index],
        label: name[index], 
      }));
<<<<<<< HEAD
=======

      console.log("details: ", details);
>>>>>>> f8603801177abfe120430e731a7cb26e6e11e957
      
      res.status(200).json(details);
    } else {
      res.status(404).json({ error: "No customer data found" });
    }
    
  } catch (error) {
    console.error("Error fetching customer detail", error);
<<<<<<< HEAD
    res.status(500).json({ error: "Failed to fetch customers detail" });
  }
};



// For Individual Customer e.g. Durtek Lanka

const getCustomerDetails = async (CustomerID: string, Token: string): Promise<any> => {

    const response = await axios.get(`${BASE_URL}/customer/${CustomerID}`, {
      headers: { 'X-Authorization': `Bearer ${Token}` }
    });
    return response.data;
  };
  
  const GetCustomerController = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.body;
      const { id } = req.params;

      const customerDetails = await getCustomerDetails(id, token);
      // Check if customer data is arrived
      if (customerDetails.id) {
        const name = jp.query(customerDetails, '$.name');
        const customerID = jp.query(customerDetails, '$.id.id');

        const details = name.map((value: any, index: any) => ({
          value: customerID[index],
          label: name[index], 
        }));
        console.log(details)
        res.status(200).json(details);
      } else {
        res.status(404).json({ error: "No customer data found" });
      }
      
    } catch (error) {
    //   console.error("Error fetching customer detail", error);
      res.status(500).json({ error: "Failed to fetch customer detail" });
    }
  };


export { GetCustomersController, GetCustomerController };
=======
    res.status(500).json({ error: "Failed to fetch customer detail" });
  }
};

export { GetCustomersController };
>>>>>>> f8603801177abfe120430e731a7cb26e6e11e957
