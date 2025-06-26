const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const multer = require('multer');
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/predict-style', upload.single('image'), async (req, res) => {
    try {
        const imageBuffer = req.file.buffer;

        // Create form data to send to FastAPI
        const formData = new FormData();
        formData.append('file', imageBuffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });

        // Send POST request to FastAPI server
        const response = await axios.post('http://localhost:8000/predict', formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });

        const predictedStyle = response.data.predicted_style;

        res.json({ style: predictedStyle });
    } catch (error) {
        console.error("Error analyzing image:", error);
        res.status(500).json({ error: "Failed to analyze the image" });
    }
});

module.exports = router;
