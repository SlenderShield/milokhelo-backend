/**
 * Example Mongoose Schema
 * Data persistence layer
 */
const mongoose = require('mongoose');

const exampleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
exampleSchema.index({ name: 1 });

const ExampleModel = mongoose.model('Example', exampleSchema);

module.exports = ExampleModel;
