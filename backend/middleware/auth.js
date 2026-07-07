import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  console.log("AUTH HEADER RECEIVED:", req.headers.authorization);

  if (!req.headers.authorization) {
    console.log("No authorization header");
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      console.log("TOKEN AFTER SPLIT:", token ? `${token.substring(0, 20)}...` : 'null');

      if (!token || token === 'null' || token === 'undefined' || token.trim() === '' || token.length < 10) {
        console.log("Invalid token format");
        return res.status(401).json({
          success: false,
          message: 'Not authorized, invalid token format'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("DECODED TOKEN:", decoded);

      req.user = await User.findById(decoded.id).select('-password');

      console.log("USER FOUND:", req.user?.email);

      if (!req.user) {
        console.log("User not found in database");
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      console.log("AUTH SUCCESS");
      next();
    } catch (error) {
      console.error("JWT ERROR:", error.message);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Please login again.'
        });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please login again.'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    console.log("No token provided");
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Not authorized as admin. Admin access required.'
    });
  }
};

export const faculty = (req, res, next) => {
  if (req.user && (req.user.role === 'faculty' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Not authorized as faculty. Faculty access required.'
    });
  }
};