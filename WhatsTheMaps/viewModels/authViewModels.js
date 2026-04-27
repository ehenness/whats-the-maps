/** Creates view data objects for login page, related auth screens */
function buildLoginViewModel({ errorMessage = null, email = '' } = {}) {
  return {
    errorMessage,
    email
  };
}

module.exports = {
  buildLoginViewModel
};
