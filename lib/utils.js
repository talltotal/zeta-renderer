var crypto = require("crypto");

module.exports = {
  md5: function(content) {
    return crypto.createHash("md5").update(content).digest("hex");
  },
  homePath: function() {
    return process.env[process.platform === "win32" ? "USERPROFILE" : "HOME"];
  }
};

