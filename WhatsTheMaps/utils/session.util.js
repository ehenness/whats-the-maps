function destroySession(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy((error) => {
      if (error) {
        reject(new Error('SESSION_DESTROY_FAILED'));
        return;
      }

      resolve();
    });
  });
}