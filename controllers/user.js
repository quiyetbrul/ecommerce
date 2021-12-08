const bcrypt = require('bcrypt')
const { validationResult } = require('express-validator');
const { noExtendLeft } = require('sequelize/dist/lib/operators');
const { User, Item, Cart } = require('../index');

////////////////////////////////
// CREATE USER FUNCTIONALITY //
///////////////////////////////
// render create user form
exports.getCreateUser = async (req, res) => {
  res.status(200).render('userCreate');
};
// create a new user
exports.postCreateUser = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    console.log(errors)
    if (!errors.isEmpty()) {
      res.status(422).json( { errors: errors.array() })
    }

    const newUsername = req.body.username;
    const newFullName = req.body.fullName;
    const newEmail = req.body.email;
    const newPassword = req.body.password;
  
    const hashedPassword = await bcrypt.hash(newPassword, 12)
  
    const newUser = await User.create({
      username: newUsername,
      fullName: newFullName,
      email: newEmail,
      password: hashedPassword,
      isAdmin: 0
    });
  
    // create new cart and assign it to new user
    const newUserCart = await Cart.create({
      totalPrice: 0,
      UserUsername: newUser.username,
    });
    req.flash('success', 'Successfully created account')
    res.status(200).redirect(301, `/homepage/${newUser.username}`);

  } catch(err) {
    const error = new Error(err)
    error.httpStatusCode = 500
    return next(error)
  }
};

////////////////////////////////
//  READ USER FUNCTIONALITY  //
///////////////////////////////
// get a specific user
// render log in page
exports.getLogIn = async (req, res) => {
  res.render('userLogin');
};
// log in user
exports.postLogIn = async (req, res) => {
	const inputName = req.body.username;
  const inputPassword = req.body.password;
  const user = await User.findByPk(inputName);
  let loggedUsername = false;
  let loggedPassword = false;
  if (user) {
    loggedUsername = true;
  }

  // if (inputPassword === checkUser.password) {
  //   loggedPassword = true;
  // }

  const match = await bcrypt.compare(inputPassword, user.password)

  if (match) {
    res.status(200).redirect(301, `/homepage/${inputName}`);
  } else {
    res.status(200).redirect(301, '/create-account');
  }
};

// if admin, show items owned by said admin
// profile page
exports.getUser = async (req, res) => {
  const user = await User.findByPk(req.params.username);
  let data = {};

  if (user.isAdmin === 1) {
    const items = await user.getItems();
    data = {
      user: user,
      userItems: items,
    };
  } else {
    data = {
      user: user,
    };
  }

  res.status(200).render('user', { data });
};

////////////////////////////////
// UPDATE USER FUNCTIONALITY //
///////////////////////////////
// render user update form
exports.getUpdateUser = async (req, res) => {
  const user = await User.findByPk(req.params.username);
  res.status(200).render('userUpdate', { user });
};
// user update
exports.postUpdateUser = async (req, res) => {
  const user = await User.findByPk(req.params.username);
  const udpatedUsername = req.body.username;
  const updatedFullName = req.body.fullName;
  const updatedEmail = req.body.email;
  const updatedPassword = req.body.password;
  const updatedIsAdmin = req.body.isAdmin === "on" ? 1 : 0;

  user.set({
    username: udpatedUsername === '' ? user.username : udpatedUsername,
    fullName: updatedFullName === '' ? user.fullName : updatedFullName,
    email: updatedEmail === '' ? user.email : updatedEmail,
    password: updatedPassword === '' ? user.password : updatedPassword,
    isAdmin: updatedIsAdmin === '' ? user.isAdmin : updatedIsAdmin,
  });

  await user.save();
  res.status(200).redirect(301, `/users/${user.username}`);
};

////////////////////////////////
// DELETE USER FUNCTIONALITY //
///////////////////////////////
// delete a user
exports.deleteUser = async (req, res) => {
  const user = await User.findByPk(req.params.username);
  await user.destroy();
  res.redirect(301, '/homepage');
};
