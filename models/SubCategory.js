import mongoose from 'mongoose';
import AutoIncrementFactory from 'mongoose-sequence';

const AutoIncrement = AutoIncrementFactory(mongoose);

const SubCategorySchema = new mongoose.Schema({
    subCatId: {
        type: Number,
        unique: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    catId: {
        type: Number,
        ref: 'Category',
        required: true
    },
    createdBy: {
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

SubCategorySchema.plugin(AutoIncrement, { inc_field: 'subCatId' });
const SubCategory = mongoose.model('SubCategory', SubCategorySchema);
export default SubCategory;