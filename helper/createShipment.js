import axios from "axios";

export const createShipment = async (order) => {
  try {
    console.log("========== SHIPROCKET START ==========");
    console.log("Order received in createShipment:", order);

    const tokenRes = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/auth/login",
      {
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      }
    );

    console.log("Shiprocket auth response:", tokenRes.data);

    const shipToken = tokenRes.data.token;

    const subTotal = order.items.reduce(
      (acc, item) => acc + Number(item.price) * Number(item.qty),
      0
    );

    const totalDeliveryCharge = order.items.reduce(
      (acc, item) => acc + Number(item.deliveryCharge || 0) * Number(item.qty),
      0
    );

    const payload = {
      order_id: order._id.toString(),
      order_date: new Date().toISOString().split("T")[0],
      pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION,
      comment: "Order from Aquahari",
      billing_customer_name: order.name,
      billing_last_name: "",
      billing_address: order.shippingAddress?.fullAddress || order.address,
      billing_address_2: order.shippingAddress?.landmark || "",
      billing_city: order.shippingAddress?.city || "Indore",
      billing_pincode: order.shippingAddress?.pincode || "452001",
      billing_state: order.shippingAddress?.state || "Madhya Pradesh",
      billing_country: order.shippingAddress?.country || "India",
      billing_email:order.email ||
        "customer@example.com",
      billing_phone: order.phone,
      shipping_is_billing: true,
      order_items: order.items.map((item) => ({
        name: item.productName,
        sku: item.productId,
        units: item.qty,
        selling_price: item.price,
      })),
      payment_method: "Prepaid",
      shipping_charges: totalDeliveryCharge,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0,
      sub_total: subTotal,
      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.5,
    };

    console.log("Shiprocket payload:", payload);

    const response = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
      payload,
      {
        headers: {
          Authorization: `Bearer ${shipToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Shiprocket create shipment response:", response.data);
    console.log("========== SHIPROCKET END ==========");

    if (
      response.data?.message &&
      response.data.message.toLowerCase().includes("wrong pickup location")
    ) {
      console.log("Invalid pickup location in Shiprocket");
      return null;
    }

    return response.data;

    return response.data;
  } catch (err) {
    console.log("SHIPROCKET ERROR FULL:", err.response?.data || err.message);
    console.log("========== SHIPROCKET FAILED ==========");
    return null;
  }
};




export const getPickupLocations = async () => {
  try {
    const tokenRes = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/auth/login",
      {
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      }
    );

    const shipToken = tokenRes.data.token;

    const response = await axios.get(
      "https://apiv2.shiprocket.in/v1/external/settings/company/pickup",
      {
        headers: {
          Authorization: `Bearer ${shipToken}`,
        },
      }
    );

    console.log("AVAILABLE PICKUP LOCATIONS:", response.data);
    return response.data;
  } catch (error) {
    console.log(
      "PICKUP LOCATION FETCH ERROR:",
      error.response?.data || error.message
    );
  }
};