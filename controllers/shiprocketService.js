import axios from "axios";
import { getShiprocketToken } from "../config/shiprocket.js";
export const sendToShiprocket = async (order) => {
  try {
    const token = getShiprocketToken();

    const res = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
      {
        order_id: order._id,
        order_date: new Date(),
        pickup_location: "Primary",

        billing_customer_name: order.name,
        billing_address: order.address,
        billing_phone: order.phone,

        order_items: [
          {
            name: order.productName,
            sku: "sku_" + order.productId,
            units: order.qty,
            selling_price: order.price,
          },
        ],

        payment_method: "Prepaid",
        sub_total: order.total,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("Shiprocket Order Created", res.data);
  } catch (err) {
    console.log("Shiprocket Order Error", err.message);
  }
};