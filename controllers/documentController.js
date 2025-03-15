import Document from '../models/documentModel.js';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';

/**
 * @desc    Upload a new document
 * @route   POST /api/documents
 * @access  Private
 * @frontend Used in the upload step of fill-document page when user clicks "Process Document" button
 */
export const uploadDocument = async (req, res) => {
    try {
        console.log("Upload document request received");
        console.log("File:", req.file);

        // Get userId from req.body (set by userAuth middleware)
        const { userId, title, language } = req.body;
        console.log("Request body:", req.body);
        console.log("User ID:", userId);
        
        // Check if userId exists
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }
        
        // Check if file was uploaded
        if (!req.file) {
            // Check if the file might be in req.files instead (multer configuration can vary)
            if (req.files && req.files.document) {
                req.file = req.files.document;
            } else if (req.files && req.files.length > 0) {
                req.file = req.files[0];
            } else {
                console.log("No file found in request. req.files:", req.files, "req.body:", req.body);
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded. Please ensure you are uploading a PDF file.'
                });
            }
        }

        // Validate file type
        if (req.file.mimetype !== 'application/pdf') {
            // Remove the uploaded file
            fs.unlinkSync(req.file.path);

            return res.status(400).json({
                success: false,
                message: 'Only PDF files are allowed'
            });
        }

        console.log("Uploading to Cloudinary...");
        // Upload to Cloudinary
        try {
            console.log("Uploading to Cloudinary - ... 1");
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'documents',
                resource_type: 'raw',
                access_mode: 'public',
                format: 'pdf',
                use_filename: true,
                unique_filename: true,
                overwrite: true
            });
            console.log("Cloudinary upload successful:", result);

            // Remove temp file after upload
            fs.unlinkSync(req.file.path);

            // Create document in database
            const document = new Document({
                userId,
                title: title || req.file.originalname,
                originalFileName: req.file.originalname,
                fileUrl: result.secure_url,
                cloudinaryId: result.public_id,
                language: language || 'English',
                status: 'uploaded'
            });

            await document.save();
            console.log("Document saved to database:", document);

            res.status(201).json({
                success: true,
                message: 'Document uploaded successfully',
                document
            });
        } catch (cloudinaryError) {
            console.error("Cloudinary upload error:", cloudinaryError);
            
            // Return a more specific error message for timeout issues
            if (cloudinaryError.error && cloudinaryError.error.http_code === 499) {
                return res.status(504).json({
                    success: false,
                    message: 'Upload timed out. Please try with a smaller file or try again later.'
                });
            }
            
            throw cloudinaryError;
        }
    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error uploading document'
        });
    }
};

/**
 * @desc    Get all documents for a user
 * @route   GET /api/documents
 * @access  Private
 * @frontend Used in the home page to display user's documents
 */
export const getUserDocuments = async (req, res) => {
    try {
        const { userId } = req.body; // From auth middleware
        const { status, search } = req.query;

        // Build query
        const query = { userId };

        // Add status filter if provided
        if (status && ['uploaded', 'processing', 'ready', 'completed'].includes(status)) {
            query.status = status;
        }

        // Add search filter if provided
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        const documents = await Document.find(query)
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: documents.length,
            documents
        });
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching documents'
        });
    }
};

/**
 * @desc    Get a single document
 * @route   GET /api/documents/:id
 * @access  Private
 * @frontend Used in the preview step to load document details and fields
 */
export const getDocumentById = async (req, res) => {
    try {
        const { userId } = req.body; // From auth middleware
        const documentId = req.params.id;

        const document = await Document.findOne({
            _id: documentId,
            userId
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        res.status(200).json({
            success: true,
            document
        });
    } catch (error) {
        console.error('Error fetching document:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching document'
        });
    }
};

/**
 * @desc    Process document to detect fields
 * @route   POST /api/documents/:id/process
 * @access  Private
 * @frontend Used after document upload to detect fillable fields
 */
export const processDocument = async (req, res) => {
    try {
        const { userId } = req.body; // From auth middleware
        const documentId = req.params.id;

        const document = await Document.findOne({
            _id: documentId,
            userId
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // Update status to processing
        document.status = 'processing';
        await document.save();

        // In a real implementation, you would queue this for processing
        // For now, we'll simulate field detection with a timeout

        // Mock field detection (this would be replaced with actual PDF parsing)
        setTimeout(async () => {
            try {
                // Mock detected fields
                const detectedFields = [
                    {
                        id: `field_${Date.now()}_1`,
                        label: 'Full Name',
                        type: 'text',
                        required: true,
                        position: {
                            x: 100,
                            y: 500,
                            page: 0,
                            width: 200,
                            height: 30
                        }
                    },
                    {
                        id: `field_${Date.now()}_2`,
                        label: 'Address',
                        type: 'text',
                        required: true,
                        position: {
                            x: 100,
                            y: 400,
                            page: 0,
                            width: 300,
                            height: 30
                        }
                    },
                    {
                        id: `field_${Date.now()}_3`,
                        label: 'Date of Birth',
                        type: 'date',
                        required: true,
                        position: {
                            x: 100,
                            y: 300,
                            page: 0,
                            width: 150,
                            height: 30
                        }
                    },
                    {
                        id: `field_${Date.now()}_4`,
                        label: 'Phone Number',
                        type: 'tel',
                        required: false,
                        position: {
                            x: 100,
                            y: 200,
                            page: 0,
                            width: 150,
                            height: 30
                        }
                    },
                    {
                        id: `field_${Date.now()}_5`,
                        label: 'Email Address',
                        type: 'email',
                        required: true,
                        position: {
                            x: 100,
                            y: 150,
                            page: 0,
                            width: 200,
                            height: 30
                        }
                    }
                ];

                // Update document with detected fields
                const updatedDocument = await Document.findByIdAndUpdate(
                    documentId,
                    {
                        fields: detectedFields,
                        status: 'ready'
                    },
                    { new: true }
                );

                console.log(`Document ${documentId} processed successfully`);
            } catch (error) {
                console.error(`Error processing document ${documentId}:`, error);

                // Update document status to error
                await Document.findByIdAndUpdate(
                    documentId,
                    { status: 'uploaded' }, // Reset to uploaded state
                    { new: true }
                );
            }
        }, 3000); // Simulate 3 second processing time

        res.status(200).json({
            success: true,
            message: 'Document processing started',
            document
        });
    } catch (error) {
        console.error('Error processing document:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error processing document'
        });
    }
};

/**
 * @desc    Update document fields
 * @route   PUT /api/documents/:id/fields
 * @access  Private
 * @frontend Used when user manually updates field values or when voice input fills fields
 */
export const updateDocumentFields = async (req, res) => {
    try {
        const { userId } = req.body; // From auth middleware
        const documentId = req.params.id;
        const { fields } = req.body;

        if (!fields || !Array.isArray(fields)) {
            return res.status(400).json({
                success: false,
                message: 'Fields must be provided as an array'
            });
        }

        const document = await Document.findOne({
            _id: documentId,
            userId
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // Update fields
        fields.forEach(updatedField => {
            const fieldIndex = document.fields.findIndex(f => f.id === updatedField.id);
            if (fieldIndex !== -1) {
                document.fields[fieldIndex].value = updatedField.value;
            }
        });

        await document.save();

        res.status(200).json({
            success: true,
            message: 'Document fields updated successfully',
            document
        });
    } catch (error) {
        console.error('Error updating document fields:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error updating document fields'
        });
    }
};

/**
 * @desc    Process voice transcript to fill document fields
 * @route   POST /api/documents/:id/fill-from-transcript
 * @access  Private
 * @frontend Used when voice recording is stopped to process the transcript
 */
export const fillFromTranscript = async (req, res) => {
    try {
        const { userId } = req.body; // From auth middleware
        const documentId = req.params.id;
        const { transcript, language } = req.body;

        if (!transcript) {
            return res.status(400).json({
                success: false,
                message: 'Transcript is required'
            });
        }

        const document = await Document.findOne({
            _id: documentId,
            userId
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // In a real implementation, you would use NLP to extract entities
        // For now, we'll use simple pattern matching

        // Simple entity extraction (this would be replaced with proper NLP)
        const extractedInfo = {
            name: extractName(transcript),
            address: extractAddress(transcript),
            dob: extractDate(transcript),
            phone: extractPhone(transcript),
            email: extractEmail(transcript)
        };

        // Map extracted info to fields
        const updatedFields = document.fields.map(field => {
            const fieldCopy = { ...field.toObject() };

            // Map based on field label
            if (field.label.toLowerCase().includes('name') && extractedInfo.name) {
                fieldCopy.value = extractedInfo.name;
            } else if (field.label.toLowerCase().includes('address') && extractedInfo.address) {
                fieldCopy.value = extractedInfo.address;
            } else if (field.label.toLowerCase().includes('birth') && extractedInfo.dob) {
                fieldCopy.value = extractedInfo.dob;
            } else if (field.label.toLowerCase().includes('phone') && extractedInfo.phone) {
                fieldCopy.value = extractedInfo.phone;
            } else if (field.label.toLowerCase().includes('email') && extractedInfo.email) {
                fieldCopy.value = extractedInfo.email;
            }

            return fieldCopy;
        });

        // Update document with filled fields
        document.fields = updatedFields;
        await document.save();

        res.status(200).json({
            success: true,
            message: 'Document fields updated from transcript',
            document
        });
    } catch (error) {
        console.error('Error filling from transcript:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error filling from transcript'
        });
    }
};

/**
 * @desc    Complete document and generate final PDF
 * @route   POST /api/documents/:id/complete
 * @access  Private
 * @frontend Used when user clicks "Complete Document" button
 */
export const completeDocument = async (req, res) => {
    try {
        const { userId } = req.body; // From auth middleware
        const documentId = req.params.id;

        const document = await Document.findOne({
            _id: documentId,
            userId
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // Check if all required fields are filled
        const missingRequiredFields = document.fields
            .filter(field => field.required && !field.value)
            .map(field => field.label);

        if (missingRequiredFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Required fields are missing',
                missingFields: missingRequiredFields
            });
        }

        // In a real implementation, you would generate a filled PDF
        // For now, we'll simulate it with a timeout

        // Update status to processing
        document.status = 'processing';
        await document.save();

        // Simulate PDF generation
        setTimeout(async () => {
            try {
                // Mock completed document URL (this would be a real PDF generation)
                const completedDocumentUrl = document.fileUrl; // In real implementation, this would be a new URL

                // Update document with completed URL and status
                await Document.findByIdAndUpdate(
                    documentId,
                    {
                        completedDocumentUrl,
                        status: 'completed'
                    },
                    { new: true }
                );

                console.log(`Document ${documentId} completed successfully`);
            } catch (error) {
                console.error(`Error completing document ${documentId}:`, error);

                // Update document status to error
                await Document.findByIdAndUpdate(
                    documentId,
                    { status: 'ready' }, // Reset to ready state
                    { new: true }
                );
            }
        }, 2000); // Simulate 2 second processing time

        res.status(200).json({
            success: true,
            message: 'Document completion started',
            document
        });
    } catch (error) {
        console.error('Error completing document:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error completing document'
        });
    }
};

/**
 * @desc    Download completed document
 * @route   GET /api/documents/:id/download
 * @access  Private
 * @frontend Used when user clicks "Download Document" button in completion step
 */
export const downloadDocument = async (req, res) => {
    try {
        const { userId } = req.body; // From auth middleware
        const documentId = req.params.id;

        const document = await Document.findOne({
            _id: documentId,
            userId
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        if (document.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Document is not completed yet'
            });
        }

        // Redirect to the completed document URL for download
        res.redirect(document.completedDocumentUrl);
    } catch (error) {
        console.error('Error downloading document:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error downloading document'
        });
    }
};

/**
 * @desc    Delete a document
 * @route   DELETE /api/documents/:id
 * @access  Private
 * @frontend Used when user wants to delete a document
 */
export const deleteDocument = async (req, res) => {
    try {
        const { userId } = req.body; // From auth middleware
        const documentId = req.params.id;

        const document = await Document.findOne({
            _id: documentId,
            userId
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // Delete from Cloudinary
        if (document.cloudinaryId) {
            await cloudinary.uploader.destroy(document.cloudinaryId, { resource_type: 'raw' });
        }

        // Delete from database
        await Document.findByIdAndDelete(documentId);

        res.status(200).json({
            success: true,
            message: 'Document deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error deleting document'
        });
    }
};

// Helper functions for entity extraction
function extractName(text) {
    const namePatterns = [
        /my name is ([A-Z][a-z]+ [A-Z][a-z]+)/i,
        /I am ([A-Z][a-z]+ [A-Z][a-z]+)/i,
        /name[\s\-:]+([A-Z][a-z]+ [A-Z][a-z]+)/i
    ];

    for (const pattern of namePatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
}

function extractAddress(text) {
    const addressPatterns = [
        /I live at ([0-9]+ [A-Za-z]+ [A-Za-z]+, [A-Za-z]+)/i,
        /address[\s\-:]+([0-9]+ [A-Za-z]+ [A-Za-z]+, [A-Za-z]+)/i
    ];

    for (const pattern of addressPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
}

function extractDate(text) {
    const datePatterns = [
        /born on ([A-Za-z]+ [0-9]{1,2}, [0-9]{4})/i,
        /birth[\s\-:]+([A-Za-z]+ [0-9]{1,2}, [0-9]{4})/i,
        /([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4})/i,
        /([0-9]{4}-[0-9]{1,2}-[0-9]{1,2})/i
    ];

    for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
}

function extractPhone(text) {
    const phonePattern = /(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/;
    const match = text.match(phonePattern);
    return match ? match[0] : null;
}

function extractEmail(text) {
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const match = text.match(emailPattern);
    return match ? match[0] : null;
}
