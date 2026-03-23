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
                teeBoxId: tee.teeBoxId,
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


// get holes by teebox id - holes/teebox/26
export const getHolesByTeeBox = async (teeboxId: string) => {
    try {
        const response = await https.get(`holes/teebox/${teeboxId}`);
        // console.log("Fetching holes by teebox:", response.data);

        return response.data;
    } catch (error) {
        console.error("Fetching holes by teebox Error:", error);
        throw error;
    }
};


// update holes by holeId = courseadmin/hole/463 payload = {handicap: 13 holeId: 463 holeNumber: 13 par: 4 teeBoxId: 26 yardage: 400}

export const updateHoles = async (handicap: string, holeId: string, holeNumber: string, par: string, teeBoxId: string, yardage: string) => {
    try {
        const response = await https.put(`courseadmin/hole/${holeId}`, { handicap, holeId, holeNumber, par, teeBoxId, yardage });
        return response.data;
    } catch (error) {
        console.error("Updating holes Error:", error);
        throw error;
    }
};