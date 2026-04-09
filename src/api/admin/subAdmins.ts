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


// put / edit sub-admins details endpoint : SubAdmin/25/courses
// {
//     "courseIds": [
//         2,
//         6,
//         7
//     ]
// }

export const updateSubAdmin = async (userId: number, courseId: number) => {
  try {
    const response = await https.put(`SubAdmin/${userId}/courses`, { courseIds: courseId });
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