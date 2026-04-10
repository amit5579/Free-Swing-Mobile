import https from "../https";

export const getSubAdminList = async () => {
  try {
    const response = await https.get(`SubAdmin/list`);
    return response.data;

  } catch (error) {
    console.error("Fetching sub admin list Error:", error);
    throw error;
  }
};


export const createSubAdmin = async (data: any) => {
  try {
    const response = await https.post(`SubAdmin/create`, data);
    return response.data;
  } catch (error) {
    console.error("Create SubAdmin Error:", error);
    throw error;
  }
};


// put / edit sub-admins details endpoint : SubAdmin/1006
// {
//   courseIds: [20, 25]
//   email: "narender@mandavconsultancy.com"
//   mobileNumber: "821951103133"
//   password: "dftyu"
//   username: "Narender Sharmadfg"
// }



export const updateSubAdmin = async (subAdminId: number, data: any) => {
  try {
    const response = await https.put(`SubAdmin/${subAdminId}`, data);
    return response.data;
  } catch (error) {
    console.error("Update SubAdmin Error:", error);
    throw error;
  }
};

export const deleteSubAdmin = async (id: number) => {
  try {
    const response = await https.delete(`SubAdmin/${id}`);
    // console.log("subbb id", id);

    return response.data;
  } catch (error) {
    console.error("Delete SubAdmin Error:", error);
    throw error;
  }
};