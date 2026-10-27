const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../index');
const AppError = require('../utils/error');
const jwtConfig = require('../config/jwt');

class AuthService {
  async register(userData) {
    const { email, password, phone, name, full_name } = userData;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('Email already in use', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      email,
      phone: phone || null,
      full_name: full_name || name || null,
      password_hash: hashedPassword
    });

    return { message: 'User registered successfully' };
  }

  async login(email, password) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = jwt.sign({ id: user.id, role: user.role }, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn
    });
    return { token };
  }

  async logout(user) {
    // In a real application, you might want to implement token blacklisting or other logout mechanisms.
    return { message: 'User logged out successfully' };
  }
}

module.exports = new AuthService();
