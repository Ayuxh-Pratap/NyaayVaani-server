import jwt from 'jsonwebtoken';

export const userAuth = async (req, res, next) => {
    try {
        const { token } = req.cookies;
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.userId) {
            console.log('Token decoded userId:', decoded.userId);
            req.body.userId = decoded.userId;
        } else {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
