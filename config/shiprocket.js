import axios from "axios";

let token = "";

export const generateShiprocketToken = async () => {
  try {
    const res = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/auth/login",
      {
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      }
    );

    token = res.data.token;
    return token;
  } catch (err) {
    console.log("Shiprocket Auth Error", err.message);
  }
};

export const getShiprocketToken = () => token;