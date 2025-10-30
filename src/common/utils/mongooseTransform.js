// Applies a transformation to a Mongoose schema to replace _id with id in JSON output

function applyIdTransform(schema) {
  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
    },
  });
}
export { applyIdTransform };
