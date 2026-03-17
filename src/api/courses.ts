import https from "./https";

export const getCourse = async () => {
    try {
        const response = await https.get(`course`);
        console.log("Fetching course list:", response);

        return response.data;

    } catch (error) {
        console.error("Fetching course list Error:", error);
        throw error;
    }
};

// create course  CourseAdmin
export const createCourse = async (data: any) => {
    try {
        const response = await https.post(`CourseAdmin`, data);
        return response.data;
    } catch (error) {
        console.error("Creating course Error:", error);
        throw error;
    }
};

// delete course CourseAdmin
export const deleteCourse = async (courseId: number) => {
    try {
        const response = await https.delete(`CourseAdmin/${courseId}`);
        return response.data;
    } catch (error) {
        console.error("Deleting course Error:", error);
        throw error;
    }
};