const axios = require("axios");

exports.checkFraud = async (transactionData) => {

   const response = await axios.post(
      process.env.ML_SERVICE_URL + "/predict",
      transactionData
   );

   return response.data;
};
