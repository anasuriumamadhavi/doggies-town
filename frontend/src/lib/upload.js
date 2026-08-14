import { api } from "./api";

export async function uploadFile(file) {
  const fd = new FormData();
  fd.append("file", file);
  const { data } = await api.post("/admin/media/upload", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data; // {url, ...}
}
