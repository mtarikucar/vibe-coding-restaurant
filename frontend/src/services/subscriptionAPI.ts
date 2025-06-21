import api from './api';

export const subscriptionAPI = {
 // Plan endpoints
 getPlans: async () => {
  try {
   const response = await api.get('/subscriptions/plans');
   return response.data;
  } catch (error) {
   throw error;
  }
 },

 getPlanById: async (id: string) => {
  try {
   const response = await api.get(`/subscriptions/plans/${id}`);
   return response.data;
  } catch (error) {
   throw error;
  }
 },

 // Admin-only plan endpoints
 createPlan: async (planData: any) => {
  try {
   const response = await api.post('/subscriptions/plans', planData);
   return response.data;
  } catch (error) {
   throw error;
  }
 },

 getAllPlansAdmin: async () => {
  try {
   const response = await api.get('/subscriptions/plans/admin');
   return response.data;
  } catch (error) {
   throw error;
  }
 },

 // Subscription endpoints
 getMySubscription: async () => {
  try {
   const response = await api.get('/subscriptions/me');
   return response.data;
  } catch (error) {
   throw error;
  }
 },

 createSubscription: async (subscriptionData: any) => {
  try {
   const response = await api.post('/subscriptions', subscriptionData);
   return response.data;
  } catch (error) {
   throw error;
  }
 },

 startTrial: async (planId: string) => {
  try {
   const response = await api.post(`/subscriptions/trial/${planId}`);
   return response.data;
  } catch (error) {
   throw error;
  }
 },

 cancelSubscription: async (id: string) => {
  try {
   const response = await api.post(`/subscriptions/${id}/cancel`);
   return response.data;
  } catch (error) {
   throw error;
  }
 },

 requestCustomPlan: async (details: any) => {
  try {
   const response = await api.post('/subscriptions/custom-request', details);
   return response.data;
  } catch (error) {
   throw error;
  }
 },

 // Admin-only subscription endpoints
 getAllSubscriptions: async () => {
  try {
   const response = await api.get('/subscriptions');
   return response.data;
  } catch (error) {
   throw error;
  }
 },

 getSubscriptionById: async (id: string) => {
  try {
   const response = await api.get(`/subscriptions/${id}`);
   return response.data;
  } catch (error) {
   throw error;
  }
 },

 updateSubscription: async (id: string, updateData: any) => {
  try {
   const response = await api.patch(`/subscriptions/${id}`, updateData);
   return response.data;
  } catch (error) {
   throw error;
  }
 },
};

export default subscriptionAPI;
