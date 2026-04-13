import axios from "axios";

const sanitizeText = (value = "") => {
  return String(value)
    .replace(/[^\p{L}\p{N}\s.,\-()/&]/gu, "") // removes emoji and odd symbols
    .replace(/\s+/g, " ")
    .trim();
};

export const createShipment = async (order) => {
  try {
    console.log("========== SHIPROCKET START ==========");
    console.log("Order received in createShipment:", order);

    const tokenRes = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/auth/login",
      {
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      },
    );

    console.log("Shiprocket auth response:", tokenRes.data);

    const shipToken = tokenRes.data.token;

    const subTotal = order.items.reduce(
      (acc, item) => acc + Number(item.price) * Number(item.qty),
      0,
    );

    const totalDeliveryCharge = order.items.reduce(
      (acc, item) => acc + Number(item.deliveryCharge || 0) * Number(item.qty),
      0,
    );

    const payload = {
      order_id: order._id.toString(),
      order_date: new Date().toISOString().split("T")[0],
      pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION,
      comment: "Order from Aquahari",
      billing_customer_name: sanitizeText(order.name),
      billing_last_name: "",
      billing_address: sanitizeText(
        order.shippingAddress?.fullAddress || order.address,
      ),
      billing_address_2: sanitizeText(order.shippingAddress?.landmark || ""),
      billing_city: sanitizeText(order.shippingAddress?.city || ""),
      billing_pincode: String(order.shippingAddress?.pincode || "").trim(),
      billing_state: sanitizeText(order.shippingAddress?.state || ""),
      billing_country: "India",
      billing_email:
        order.email || process.env.SHIPROCKET_DEFAULT_CUSTOMER_EMAIL,
      billing_phone: String(order.phone || "").trim(),
      shipping_is_billing: true,
      order_items: order.items.map((item) => ({
        name: sanitizeText(item.productName),
        sku: String(item.productId),
        units: Number(item.qty),
        selling_price: Number(item.price),
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
      },
    );

    console.log("Shiprocket create shipment response:", response.data);
    console.log("========== SHIPROCKET END ==========");

    if (!response.data) return null;

    if (
      response.data?.message &&
      response.data.message.toLowerCase().includes("wrong pickup location")
    ) {
      console.log("Invalid pickup location in Shiprocket");
      return null;
    }

    if (
      response.data?.message &&
      response.data.message.toLowerCase().includes("unable to create an order")
    ) {
      console.log("Shiprocket generic order creation failure");
      return null;
    }

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
      },
    );

    const shipToken = tokenRes.data.token;

    const response = await axios.get(
      "https://apiv2.shiprocket.in/v1/external/settings/company/pickup",
      {
        headers: {
          Authorization: `Bearer ${shipToken}`,
        },
      },
    );

    console.log("AVAILABLE PICKUP LOCATIONS:", response.data);
    return response.data;
  } catch (error) {
    console.log(
      "PICKUP LOCATION FETCH ERROR:",
      error.response?.data || error.message,
    );
    return null;
  }
};

