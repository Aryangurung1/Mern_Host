import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

// Create admin user if it doesn't exist
export const createAdminUser = async () => {
  try {
    console.log('Checking for admin user...');
    const admin = await User.findOne({ email: 'admin@gmail.com' });
    if (!admin) {
      console.log('Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const newAdmin = new User({
        username: 'admin',
        email: 'admin@gmail.com',
        password: hashedPassword,
        isAdmin: true
      });
      await newAdmin.save();
      console.log('✅ Admin user created successfully');
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error; // Re-throw to ensure the error is not silently ignored
  }
};

// Export the function so it can be called when the server starts
export default createAdminUser;

export const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: "Username or email already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user as regular user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      isAdmin: false,
      isAgent: false, // Always false for new users
      userType: 'regular' // Always regular for new users
    });

    // Save user
    await newUser.save();

    // Create token
    const token = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '1d' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: false, // Allow JavaScript access for debugging
      secure: false, // Set to false for local development
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    // Return user data (without password)
    const { password: pass, ...rest } = newUser._doc;
    res.status(201).json(rest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Create token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '1d' }
    );

    // Set token in both cookie and response
    res.cookie('token', token, {
      httpOnly: false, // Allow JavaScript access for debugging
      secure: false, // Set to false for local development
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    // Return user data (without password)
    const { password: pass, ...rest } = user._doc;
    res.status(200).json({
      token,
      user: rest
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const google = async (req, res) => {
  try {
    const { email, name, photo } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (user) {
      // Create token
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET_KEY,
        { expiresIn: '1d' }
      );

      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      });

      const { password, ...rest } = user._doc;
      res.status(200).json(rest);
    } else {
      // Generate random password
      const generatedPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(generatedPassword, 10);

      // Create username from email
      const username = email.split('@')[0] + Math.random().toString(36).slice(-4);

      // Create new user
      const newUser = new User({
        username,
        email,
        password: hashedPassword,
        photo,
        isAdmin: false,
        isAgent: false,
        userType: 'regular'
      });

      await newUser.save();

      // Create token
      const token = jwt.sign(
        { id: newUser._id },
        process.env.JWT_SECRET_KEY,
        { expiresIn: '1d' }
      );

      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      });

      const { password, ...rest } = newUser._doc;
      res.status(201).json(rest);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const signout = async (req, res) => {
  try {
    // Clear the token cookie
    res.clearCookie('token', {
      path: '/',
      sameSite: 'lax'
    });

    // Optionally, you can also clear any session data if you're using sessions
    // req.session.destroy();

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Failed to log out' });
  }
};

export const getMe = async (req, res) => {
  try {
    const { password, ...rest } = req.user._doc;
    res.status(200).json(rest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Refresh token
export const refreshToken = async (req, res) => {
  try {
    // Get token from cookie or authorization header
    const token = req.cookies.token || 
                 (req.headers.authorization && req.headers.authorization.startsWith('Bearer') 
                  ? req.headers.authorization.split(' ')[1] : null);
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Generate new token
    const newToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, { 
      expiresIn: '1d' 
    });

    // Set new token in cookie
    res.cookie('token', newToken, {
      httpOnly: false, // Allow JavaScript access for debugging
      secure: false, // Set to false for local development
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    // Return new token
    res.json({ token: newToken });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '1h' }
    );

    // Save reset token to user
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send reset email (this is a placeholder - you'll need to implement actual email sending)
    // In production, you should use an email service like SendGrid or Nodemailer
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    // For now, just log the reset URL (in production, you would send this via email)
    console.log(`Password reset URL: ${resetUrl}`);

    res.status(200).json({
      message: "Password reset instructions have been sent to your email",
      resetUrl // For testing purposes - remove this in production
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};