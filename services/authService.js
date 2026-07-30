const User = require("../models/User");

const findUserByEmail = (email) => User.findOne({ email: email.toLowerCase() });
const createUser = (fullName, email, password) =>
  User.create({ fullName, email: email.toLowerCase(), password });
const findUserById = (id) => User.findById(id).select("fullName email");

module.exports = { findUserByEmail, createUser, findUserById, getUserProfile: findUserById };
