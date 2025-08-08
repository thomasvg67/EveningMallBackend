import mongoose from 'mongoose';
import AutoIncrementFactory from 'mongoose-sequence';

const AutoIncrement = AutoIncrementFactory(mongoose);

const categorySchema = new mongoose.Schema({
  catId: {
    type: Number,
    unique: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },createdBy: {
        type: String,
        required: true
    },
    createdOn: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: String
    },
    updatedOn: {
        type: Date
    },
    deletedBy: {
        type: String
    },
    deletedOn: {
        type: Date
    },
    dlt_sts: {
        type: Number,
        default: 0 // 0 = active, 1 = deleted
    }
});
categorySchema.plugin(AutoIncrement, { inc_field: 'catId' });
const Category = mongoose.model('Category', categorySchema);
export default Category;
