export const config = {
  userServiceUrl:
    process.env.USER_SERVICE_URL ?? "http://localhost:3001",
  uploadServiceUrl:
    process.env.UPLOAD_SERVICE_URL ?? "http://localhost:3002",
  watchServiceUrl:
    process.env.WATCH_SERVICE_URL ?? "http://localhost:3003",
};
