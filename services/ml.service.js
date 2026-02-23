const axios = require("axios");

exports.checkFraud = async (transactionData) => {
   try {
      const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:8000";
      console.log(`[ML API] Sending transaction ${transactionData._id} to Python ML Service at ${mlServiceUrl}/predict`);
      
      const payload = {
         amount: transactionData.amount,
         type: transactionData.type,
         paymentMethod: transactionData.paymentMethod || "CARD"
      };
      
      const response = await axios.post(
         `${mlServiceUrl}/predict`,
         payload
      );
   
      console.log(`[ML API] Response from Python ML Service:`, response.data);
      return response.data;
   } catch (error) {

      console.log('error: ', error);
      
      console.error("[ML API] Error calling Python ML Service:", error.message);
      // Fallback in case ML service is down
      return {
         score: 0,
         isFraud: false,
         modelVersion: "fallback-error"
      };
   }
};
