import client from "../client";

export const getMembersForBilling = async (search?: string, category?: string) => {
  try {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (category) params.append("category", category);
    
    const queryStr = params.toString() ? `?${params.toString()}` : "";
    const response = await client.get(`Billing/members${queryStr}`);
    return response.data;
  } catch (error) {
    console.error("Fetching billing members Error:", error);
    throw error;
  }
};

export const generateBill = async (data: any) => {
  try {
    const response = await client.post(`Billing/generate`, data);
    return response.data;
  } catch (error) {
    console.error("Generate Bill Error:", error);
    throw error;
  }
};

export const generateBatchBill = async (data: any) => {
  try {
    const response = await client.post(`Billing/generate-batch`, data);
    return response.data;
  } catch (error) {
    console.error("Generate Batch Bill Error:", error);
    throw error;
  }
};

export const getSubAdminBills = async () => {
  try {
    const response = await client.get(`Billing/subadmin-bills`);
    return response.data;
  } catch (error) {
    console.error("Fetching subadmin bills Error:", error);
    throw error;
  }
};

export const approvePayment = async (billId: number) => {
  try {
    const response = await client.post(`Billing/approve-payment/${billId}`, {});
    return response.data;
  } catch (error) {
    console.error("Approve payment Error:", error);
    throw error;
  }
};

export const getMyBills = async () => {
  try {
    const response = await client.get(`Billing/my-bills`);
    return response.data;
  } catch (error) {
    console.error("Fetching my bills Error:", error);
    throw error;
  }
};

export const uploadBillScreenshot = async (billId: number, uri: string, type: string, name: string) => {
  try {
    const formData = new FormData();
    formData.append("image", {
      uri,
      type,
      name,
    } as any);

    const response = await client.post(`Billing/${billId}/upload-screenshot`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Upload Bill Screenshot Error:", error);
    throw error;
  }
};
