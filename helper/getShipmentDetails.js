import axios from "axios";

export const getShipmentDetails = async (shipmentId) => {
  try {
    console.log("Fetching shipment details for:", shipmentId);

    const tokenRes = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/auth/login",
      {
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      }
    );

    const shipToken = tokenRes.data.token;

    const response = await axios.get(
      `https://apiv2.shiprocket.in/v1/external/shipments/${shipmentId}`,
      {
        headers: {
          Authorization: `Bearer ${shipToken}`,
        },
      }
    );

    console.log("SHIPROCKET SHIPMENT DETAILS:", response.data);
    return response.data;
  } catch (error) {
    console.log(
      "SHIPMENT DETAILS ERROR:",
      error.response?.data || error.message
    );
    return null;
  }
};