import https from "../https";

export const getCourse = async () => {
    try {
        const response = await https.get(`course`);
        // console.log("Fetching course list:", response.data);
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

// get tee box by course id course/2/teeBox
export const getTeeBox = async (courseId: string) => {
    try {
        const response = await https.get(`course/${courseId}`);
        if (response?.data?.teeBoxes) {
            return response.data.teeBoxes.map((tee: any) => ({
                id: tee.teeBoxId,
                name: tee.name,
                courseId: tee.courseId,
                isPredefined: tee.isPredefined,
                color: tee.color,
                rating: tee.rating,
                slope: tee.slope,
                location: tee.location,
                tees: tee.tees,
                free: tee.free,
                tournaments: tee.tournaments || [],
                scorecards: tee.scorecards,
                holes: tee.holes || [],
            }));
        }
        return response?.data?.teeBoxes || [];

    } catch (error) {
        console.error("Fetching tee box Error:", error);
        throw error;
    }
};
