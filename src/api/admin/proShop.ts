import https from "../https";

export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  imageUrls?: string[];
  createdAt: string;
};

// GET all products
export const getProducts = async (): Promise<Product[]> => {
  try {
    const response = await https.get("Products");
    return response.data;
  } catch (error) {
    console.error("Fetching Products Error:", error);
    return [];
  }
};

// CREATE a new product
export const addProduct = async (formData: FormData): Promise<any> => {
  try {
    const response = await https.post("Products", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Adding Product Error:", error);
    throw error;
  }
};

// UPDATE an existing product
export const updateProduct = async (id: number, formData: FormData): Promise<any> => {
  try {
    const response = await https.put(`Products/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Updating Product Error:", error);
    throw error;
  }
};

// DELETE a product
export const deleteProduct = async (id: number): Promise<any> => {
  try {
    const response = await https.delete(`/Products/${id}`);
    return response.data;
  } catch (error) {
    console.error("Deleting Product Error:", error);
    throw error;
  }
};


