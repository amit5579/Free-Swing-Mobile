import https from "./https";

export type ProductApi = {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  createdAt: string;
};

/* -*-*-*-*- Get Products API -*-*-*-*- */

export const getProducts = async (): Promise<ProductApi[]> => {
  try {
    const response = await https.get("Products");
    return response.data;
  } catch (error) {
    console.error("Get Products API Error:", error);
    return [];
  }
};