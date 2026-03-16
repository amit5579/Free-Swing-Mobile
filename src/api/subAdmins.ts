import https from "./https";

export const getSubAdminList = async () => {
    try {
        const response = await https.get(`SubAdmin/list`);
        return response.data;

    } catch (error) {
        console.error("Fetching sub admin list Error:", error);
        throw error;
    }
};

export const getCourse = async () => {
    try {
        const response = await https.get(`course`);
        return response.data;

    } catch (error) {
        console.error("Fetching sub admin list Error:", error);
        throw error;
    }
};



// SubAdmin/create
// {username: "akki", email: "akki@mail.com", password: "123456789", mobileNumber: "123456789",…}
// courseIds
// : 
// [2, 8, 4, 6, 7, 10]
// email
// : 
// "akki@mail.com"
// mobileNumber
// : 
// "123456789"
// password
// : 
// "123456789"
// username
// : 
// "akki"


// SubAdmin/20

export const deleteSubAdmin = async (id: number) => {
  try {
    const response = await https.delete(`SubAdmin/${id}`);
    console.log("subbb id", id);
    
    return response.data;
  } catch (error) {
    console.error("Delete SubAdmin Error:", error);
    throw error;
  }
};