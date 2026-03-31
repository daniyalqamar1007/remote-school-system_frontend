import axios from 'axios';
import { getAuthHeaders } from './token';

export const addActivity = async (activityData : any) => {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_SRS_SERVER}/activity/add`,
      activityData,
      {
        headers: getAuthHeaders(),
      }
    );
    return response;
  } catch (error) {
    console.error('Error adding activity:', error);
    throw error;
  }
};

export const getActivitiesByPerformer = async (performBy : any) => {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_SRS_SERVER}/activity`,
      {
        params: { performBy }
      }
    );
    return response;
  } catch (error) {
    console.error('Error fetching activities:', error);
    throw error;
  }
};

export const deleteActivity = async (id : any) => {
  try {
    const response = await axios.delete(
      `${process.env.NEXT_PUBLIC_SRS_SERVER}/activity/${id}`
    );
    return response;
  } catch (error) {
    console.error('Error deleting activity:', error);
    throw error;
  }
};
