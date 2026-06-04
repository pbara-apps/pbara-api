import mongoose from "mongoose";

const modelDeclHelper = (modelName: string, schema: mongoose.Schema) => {
  return mongoose.model(modelName, schema);
};

export default modelDeclHelper;
