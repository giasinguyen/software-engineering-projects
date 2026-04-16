import axios from "axios";

// Sử dụng API Gateway làm single entry point
// Fallback: gọi trực tiếp từng service nếu không có gateway
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

const withAuth = (instance) => {
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  return instance;
};

const api = withAuth(axios.create({ baseURL: API_BASE }));

export const userApi = api;
export const foodApi = api;
export const orderApi = api;
export const paymentApi = api;

export const authService = {
  register: (data) => userApi.post("/api/auth/register", data),
  login: (data) => userApi.post("/api/auth/login", data),
  getUsers: () => userApi.get("/api/users"),
};

export const foodService = {
  getAll: () => foodApi.get("/api/foods"),
  create: (data) => foodApi.post("/api/foods", data),
  update: (id, data) => foodApi.put(`/api/foods/${id}`, data),
  delete: (id) => foodApi.delete(`/api/foods/${id}`),
};

export const orderService = {
  create: (data) => orderApi.post("/orders", data),
  getAll: (userId) => orderApi.get("/orders", { params: userId ? { userId } : {} }),
  getById: (id) => orderApi.get(`/orders/${id}`),
  updateStatus: (id, status) => orderApi.put(`/orders/${id}/status`, { status }),
  cancel: (id) => orderApi.put(`/orders/${id}/cancel`),
};

export const paymentService = {
  pay: (data) => paymentApi.post("/payments", data),
  getAll: () => paymentApi.get("/payments"),
};