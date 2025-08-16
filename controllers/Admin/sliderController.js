import Slider from '../../models/Slider.js';
import LoginUser from '../../models/LoginUser.js';
import RegisteredUser from '../../models/RegisteredUser.js';
import ftp from "basic-ftp";
import path from "path";
import fs from "fs";
import os from "os";

// Helper: upload a file buffer to cPanel
async function uploadFileToCpanel(file, remoteFolder = "/eveningmall.in/uploads/sldr") {
    const client = new ftp.Client();
    client.ftp.verbose = false;
    try {
        await client.access({
            host: process.env.FTP_HOST || "ftp.eveningmall.in",
            user: process.env.FTP_USER,
            password: process.env.FTP_PASS,
            secure: false
        });

        const tempDir = os.tmpdir();
        const tempFilePath = path.join(tempDir, file.originalname);
        fs.writeFileSync(tempFilePath, file.buffer);

        await client.uploadFrom(tempFilePath, `${remoteFolder}/${file.originalname}`);

        return `https://eveningmall.in/uploads/sldr/${encodeURIComponent(file.originalname)}`;
    } finally {
        client.close();
    }
}

export const createSlider = async (req, res) => {
    try {
        const { subtitle, title, price, buttonText, buttonLink, alignment } = req.body;
        const userId = req.user?.userId;

        // Ensure images are provided
        if (!req.files?.['image']?.[0]) {
            return res.status(400).json({ message: 'Main image is required' });
        }

        const loginUser = await LoginUser.findById(userId);
        if (!loginUser || loginUser.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const regUser = await RegisteredUser.findOne({ email: loginUser.email });
        const createdBy = regUser?.name || 'Unknown Admin';

        // Upload images to FTP
        const imageUrl = await uploadFileToCpanel(req.files['image'][0]);
        let brandImgUrl = null;
        if (req.files?.['brandImg']?.[0]) {
            brandImgUrl = await uploadFileToCpanel(req.files['brandImg'][0]);
        }

        const slider = new Slider({
            subtitle,
            title,
            price,
            alignment,
            buttonText,
            buttonLink,
            image: imageUrl,      // Public URL from FTP
            brandImg: brandImgUrl, // Public URL from FTP (optional)
            sts: 0, // default as draft
            createdBy,
            createdOn: new Date()
        });

        await slider.save();
        res.status(201).json({ message: 'Slider created in draft mode', slider });
    } catch (err) {
        console.error('Slider create error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};


export const toggleSliderStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const slider = await Slider.findById(id);
        if (!slider) return res.status(404).json({ message: 'Slider not found' });

        // If trying to publish and already 4 are published
        if (slider.sts === 0) {
            const publishedCount = await Slider.countDocuments({ sts: 1, dlt_sts: 0 });
            if (publishedCount >= 4) {
                return res.status(400).json({ message: 'Only 4 sliders can be published at a time. Please unpublish another slider.' });
            }
        }

        // Toggle
        slider.sts = slider.sts === 1 ? 0 : 1;
        slider.updatedOn = new Date();
        await slider.save();

        res.status(200).json({ message: `Slider ${slider.sts === 1 ? 'published' : 'unpublished'}`, slider });

    } catch (err) {
        console.error('Toggle status error:', err);
        res.status(500).json({ message: 'Server error toggling status' });
    }
};

export const getAllSliders = async (req, res) => {
    try {
        const sliders = await Slider.find({ dlt_sts: 0 }).sort({ createdOn: -1 });
        res.status(200).json({ sliders });
    } catch (error) {
        console.error('Error fetching sliders:', error);
        res.status(500).json({ message: 'Failed to fetch sliders' });
    }
};

// export const updateSlider = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { subtitle, title, price, buttonText, buttonLink, alignment } = req.body;
//         const image = req.files?.['image']?.[0]?.path;
//         const brandImg = req.files?.['brandImg']?.[0]?.path;

//         const slider = await Slider.findById(id);
//         if (!slider) {
//             return res.status(404).json({ message: 'Slider not found' });
//         }

//         if (subtitle !== undefined) slider.subtitle = subtitle;
//         if (title !== undefined) slider.title = title;
//         if (price !== undefined) slider.price = price;
//         if (alignment !== undefined) slider.alignment = alignment;
//         if (buttonText !== undefined) slider.buttonText = buttonText;
//         if (buttonLink !== undefined) slider.buttonLink = buttonLink;
//         if (image) slider.image = image;
//         if (brandImg) slider.brandImg = brandImg;

//         slider.updatedOn = new Date();

//         await slider.save();
//         res.status(200).json({ message: 'Slider updated successfully', slider });
//     } catch (err) {
//         console.error('Slider update error:', err);
//         res.status(500).json({ message: 'Server error updating slider' });
//     }
// };

export const updateSlider = async (req, res) => {
    try {
        const { id } = req.params;
        const { subtitle, title, price, buttonText, buttonLink, alignment } = req.body;

        const slider = await Slider.findById(id);
        if (!slider) {
            return res.status(404).json({ message: 'Slider not found' });
        }

        // Update text fields if provided
        if (subtitle !== undefined) slider.subtitle = subtitle;
        if (title !== undefined) slider.title = title;
        if (price !== undefined) slider.price = price;
        if (alignment !== undefined) slider.alignment = alignment;
        if (buttonText !== undefined) slider.buttonText = buttonText;
        if (buttonLink !== undefined) slider.buttonLink = buttonLink;

        // Update main image if new file uploaded
        if (req.files?.['image']?.[0]) {
            slider.image = await uploadFileToCpanel(req.files['image'][0]);
        }

        // Update brand image if new file uploaded
        if (req.files?.['brandImg']?.[0]) {
            slider.brandImg = await uploadFileToCpanel(req.files['brandImg'][0]);
        }

        slider.updatedOn = new Date();

        await slider.save();
        res.status(200).json({ message: 'Slider updated successfully', slider });
    } catch (err) {
        console.error('Slider update error:', err);
        res.status(500).json({ message: 'Server error updating slider' });
    }
};


export const deleteSlider = async (req, res) => {
    try {
        const { id } = req.params;
        const slider = await Slider.findById(id);

        if (!slider) {
            return res.status(404).json({ message: 'Slider not found' });
        }

        slider.dlt_sts = 1;
        slider.deletedOn = new Date();
        await slider.save();

        res.status(200).json({ message: 'Slider deleted (soft delete)' });
    } catch (err) {
        console.error('Slider delete error:', err);
        res.status(500).json({ message: 'Server error deleting slider' });
    }
};
