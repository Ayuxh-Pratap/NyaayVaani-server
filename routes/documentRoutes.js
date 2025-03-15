import express from 'express';
import multer from 'multer';
import { userAuth } from '../middleware.js/userAuth.js';
import {
    uploadDocument,
    getUserDocuments,
    getDocumentById,
    processDocument,
    updateDocumentFields,
    fillFromTranscript,
    completeDocument,
    downloadDocument,
    deleteDocument
} from '../controllers/documentController.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// Create uploads directory if it doesn't exist
import fs from 'fs';
import path from 'path';
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

// Document routes
router.post('/', userAuth, upload.single('document'), uploadDocument);
router.get('/', userAuth, getUserDocuments);
router.get('/:id', userAuth, getDocumentById);
router.post('/:id/process', userAuth, processDocument);
router.put('/:id/fields', userAuth, updateDocumentFields);
router.post('/:id/fill-from-transcript', userAuth, fillFromTranscript);
router.post('/:id/complete', userAuth, completeDocument);
router.get('/:id/download', userAuth, downloadDocument);
router.delete('/:id', userAuth, deleteDocument);

export default router;
