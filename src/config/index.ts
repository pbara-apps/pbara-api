import app from "../app.js";

const startServer = () => {
  const PORT = process.env.PORT || 3004;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

export default startServer;
