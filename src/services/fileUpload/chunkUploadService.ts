import { API_ENDPOINTS, defaultConfig } from '../api.config';

const CHUNK_SIZE = 20 * 1024 * 1024; // 5MB

export const uploadCsvFile = async (
  file: File,
  userId: number,
  sessionId: string,
  onProgress: (progress: number) => void
) => {

  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {

    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(file.size, start + CHUNK_SIZE);

    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append("chunk", chunk);
    formData.append("chunk_index", chunkIndex.toString());
    formData.append("total_chunks", totalChunks.toString());
    formData.append("session_id", sessionId);
    formData.append("filename", file.name);
    formData.append("user_id", userId.toString());

    await fetch(`${defaultConfig.baseUrl}${API_ENDPOINTS.FILE_UPLOAD.CHUNK_UPLOAD}?chunk`, {
      method: "POST",
      body: formData
    });

    const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);

    onProgress(progress);

    // store resume progress
    const stored = JSON.parse(localStorage.getItem("uploadProgress") || "{}");
    stored[file.name] = chunkIndex;
    localStorage.setItem("uploadProgress", JSON.stringify(stored));
  }

  // upload finished
  const stored = JSON.parse(localStorage.getItem("uploadProgress") || "{}");
  delete stored[file.name];
  localStorage.setItem("uploadProgress", JSON.stringify(stored));

};