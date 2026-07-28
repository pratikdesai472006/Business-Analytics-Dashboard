const db = require("../config/db");

const findUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM users WHERE email = ?",
      [email],
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};

const createUser = (fullName, email, password) => {
  return new Promise((resolve, reject) => {
    db.query(
      "INSERT INTO users(full_name, email, password) VALUES (?, ?, ?)",
      [fullName, email, password],
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};

const findUserForLogin = (email) => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM users WHERE email = ?",
      [email],
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};

module.exports = {
  findUserByEmail,
  createUser,
  findUserForLogin,
};