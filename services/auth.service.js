const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');

const register = async (userData) => {
   const hashedPassword = await bcrypt.hash(userData.password, 10);

   return userRepository.create({
      ...userData,
      password: hashedPassword
   });
};

const login = async (credentials) => {
  const { email, password } = credentials;

  const user = await userRepository.findByEmail(email);

  if (!user) throw new Error("User not found");

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) throw new Error("Invalid credentials");

  const token = generateAccessToken(user);

  // Store refresh token in database
  await userRepository.updateRefreshToken(user._id, token);

  const userObj = user.toObject();
  delete userObj.password;

  return { user: userObj, token };
};

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '24h' }
  );
};

const forgotPassword = async ({ email }) => {
  const user = await userRepository.findByEmail(email);
  if (!user) throw new Error('User not found');

  const resetToken = jwt.sign(
    { id: user._id, email: user.email, purpose: 'reset-password' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  return { message: 'Password reset token generated', resetToken, email: user.email };
};

const resetPassword = async ({ resetToken, password }) => {
  let decoded;
  try {
    decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired reset token');
  }

  if (decoded.purpose !== 'reset-password') {
    throw new Error('Invalid reset token');
  }

  const user = await userRepository.findById(decoded.id);
  if (!user) throw new Error('User not found');

  const hashedPassword = await bcrypt.hash(password, 10);
  await userRepository.update(user._id, { password: hashedPassword });

  return { message: 'Password reset successful' };
};

const logout = async (userId) => {
  await userRepository.clearRefreshToken(userId);
  return { message: 'Logged out successfully' };
};

const refreshToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userRepository.findById(decoded.id);

    if (!user || user.refreshToken !== token) {
      throw new Error('Invalid or expired refresh token');
    }

    const newToken = generateAccessToken(user);
    // Optionally rotate the refresh token here
    await userRepository.updateRefreshToken(user._id, newToken);

    return { token: newToken };
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

const verifyToken = async (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  verifyToken,
  forgotPassword,
  resetPassword
};
