import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const resetPassword = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get command line arguments
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
      console.log('Usage: node resetPassword.js <email> <newPassword>');
      console.log('Example: node resetPassword.js john@example.com newpassword123');
      process.exit(1);
    }

    const email = args[0];
    const newPassword = args[1];

    // Validate password length
    if (newPassword.length < 6) {
      console.log('Error: Password must be at least 6 characters long');
      process.exit(1);
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log(`Error: User with email '${email}' not found`);
      process.exit(1);
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    await User.findByIdAndUpdate(user._id, { 
      password: hashedPassword,
      updatedAt: new Date()
    });

    console.log(`✅ Password successfully reset for user: ${user.firstName} ${user.lastName} (${email})`);
    console.log(`New password: ${newPassword}`);
    console.log('You can now login with the new password.');

  } catch (error) {
    console.error('Error resetting password:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

resetPassword();