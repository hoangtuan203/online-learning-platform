import type { AxiosInstance } from "axios";
import axios from "axios";

const baseURL: string = import.meta.env.VITE_BASE_URL ?? "http://localhost:8080/api/";

const httpRequest: AxiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});



export default httpRequest;