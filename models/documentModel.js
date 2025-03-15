import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    originalFileName: {
        type: String,
        required: true
    },
    fileUrl: {
        type: String,
        required: true
    },
    cloudinaryId: {
        type: String,
        required: true
    },
    language: {
        type: String,
        enum: ['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Gujarati', 'Kannada'],
        default: 'English'
    },
    status: {
        type: String,
        enum: ['uploaded', 'processing', 'ready', 'completed'],
        default: 'uploaded'
    },
    isPublic: {
        type: Boolean,
        default: true // Only Pro users can set to false
    },
    fields: [{
        id: String,
        label: String,
        type: {
            type: String,
            enum: ['text', 'date', 'email', 'tel', 'number']
        },
        required: Boolean,
        value: String,
        position: {
            x: Number,
            y: Number,
            page: Number,
            width: Number,
            height: Number
        }
    }],
    completedDocumentUrl: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const Document = mongoose.model('Document', DocumentSchema);

export default Document;
