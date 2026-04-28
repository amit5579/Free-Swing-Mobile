import client from "../client";

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
    const response = await client.get("/Products");
    return response.data;
  } catch (error) {
    console.error("Get Products API Error:", error);
    return [];
  }
};