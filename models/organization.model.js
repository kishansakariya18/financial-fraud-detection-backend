const mongoose = require("mongoose");
const basePlugin = require("./plugins/base.plugin");

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  industryType: String,

  adminUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  address: String,
  contactEmail: String
});

organizationSchema.plugin(basePlugin);

module.exports = mongoose.model("Organization", organizationSchema);
