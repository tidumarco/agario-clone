var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

// define the player schema
// i.e. structure of the MongoDB document
var playerSchema = mongoose.Schema({
  name: {
    type: String, unique: true,
    required: true,
    min: 4,
    max: 10,
    validate: function (name) {
      return /[A-Za-z]/.test(name);
    }
  },
  password: {
    type: String,
    required: true
  },
  created: {
    type: Date,
    default: Date.now
  },
  updated: {
    type: Date,
    default: Date.now
  },
});

// check if password is valid
playerSchema.methods.isValidPassword = function (password) {
  console.log("comparing", this.password, password);
  if(this.password.toString() == password.toString()) {
    console.log("succeeded");
    return "success";
  }
  else {
    return "fail";
  }
};

// create the model for players and expose it to the app
module.exports = mongoose.model('Player', playerSchema);