module.exports = function basePlugin(schema) {
  schema.add({
    isDeleted: {
      type: Boolean,
      default: false
    }
  });

  schema.set("timestamps", true);
};
