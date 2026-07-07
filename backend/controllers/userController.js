const User = require('../models/User');
const { generateRandomPassword } = require('../utils/helpers');


exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    if (!name && !email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one field to update'
      });
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();
    const updatedUser = await User.findById(user._id).select('-password');

    res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePreferences = async (req, res, next) => {
  try {
    const { notifications, theme, language } = req.body;

    const updateFields = {};
    
    if (notifications !== undefined) {
      updateFields['preferences.notifications'] = notifications;
    }
    
    if (theme) {
      updateFields['preferences.theme'] = theme;
    }
    
    if (language) {
      updateFields['preferences.language'] = language;
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one preference to update'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user.preferences,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    let user;
    if (req.params.id) {
      user = await User.findById(req.params.id).select('-password');
    } else {
      user = await User.findById(req.user.id).select('-password');
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { name, email, role, department, semester, sendWelcomeEmail = true, ...otherData } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    let password = req.body.password;
    if (!password) {
      password = generateRandomPassword();
    }

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be either "admin" or "user"'
      });
    }

    if (role === 'user') {
      if (!department) {
        return res.status(400).json({
          success: false,
          message: 'Department is required for user role'
        });
      }
      if (!semester) {
        return res.status(400).json({
          success: false,
          message: 'Semester is required for user role'
        });
      }
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      department: role === 'user' ? department : 'Administration',
      semester: role === 'user' ? semester : 'N/A',
      ...otherData
    });

    if (sendWelcomeEmail) {
      try {
        console.log(`Welcome email would be sent to: ${user.email}`);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }
    }

    const userResponse = await User.findById(user._id).select('-password');

    res.status(201).json({
      success: true,
      data: userResponse,
      message: sendWelcomeEmail ? 'User created successfully. Welcome email sent.' : 'User created successfully.'
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (req.body.password) {
      delete req.body.password;
    }

    user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).select('-password');

    res.status(200).json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};