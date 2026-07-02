import "dotenv/config";
import app from "./app.js";

export default app;

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3004;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
