const test = require('node:test');
const assert = require('node:assert/strict');

const servicePath = require.resolve('../../services/user.service');
const bcryptPath = require.resolve('bcrypt');
const userRepositoryPath = require.resolve('../../repositories/user.repository');
const profileStorePath = require.resolve('../../profileStore');
const profileUtilPath = require.resolve('../../utils/profile.util');
const sessionUtilPath = require.resolve('../../utils/session.util');

function loadUserService({
  bcryptCompare = async () => true,
  getUserByEmail = async () => null,
  getUserByUsername = async () => null,
  getUserById = async () => null,
  deleteUser = async () => undefined,
  saveStoredProfile = () => true,
  getStoredProfile = () => null,
  deleteStoredProfile = () => true,
  getProfileImage = () => ({ profileImageUrl: null }),
  trimString = (value) => (typeof value === 'string' ? value.trim() : ''),
  buildSessionUser = (user, storedProfile = {}) => ({
    id: user.id,
    username: user.username,
    email: user.email,
    bio: storedProfile.bio || '',
    profileImageUrl: storedProfile.profileImageUrl || null
  })
} = {}) {
  const previousService = require.cache[servicePath];
  const previousBcrypt = require.cache[bcryptPath];
  const previousUserRepository = require.cache[userRepositoryPath];
  const previousProfileStore = require.cache[profileStorePath];
  const previousProfileUtil = require.cache[profileUtilPath];
  const previousSessionUtil = require.cache[sessionUtilPath];

  delete require.cache[servicePath];
  require.cache[bcryptPath] = {
    id: bcryptPath,
    filename: bcryptPath,
    loaded: true,
    exports: {
      compare: bcryptCompare,
      hash: async () => 'hashed-password'
    }
  };
  require.cache[userRepositoryPath] = {
    id: userRepositoryPath,
    filename: userRepositoryPath,
    loaded: true,
    exports: {
      getUserByEmail,
      getUserByUsername,
      getUserById,
      deleteUser,
      createUser: async () => 1
    }
  };
  require.cache[profileStorePath] = {
    id: profileStorePath,
    filename: profileStorePath,
    loaded: true,
    exports: {
      saveStoredProfile,
      getStoredProfile,
      deleteStoredProfile
    }
  };
  require.cache[profileUtilPath] = {
    id: profileUtilPath,
    filename: profileUtilPath,
    loaded: true,
    exports: {
      getProfileImage,
      trimString
    }
  };
  require.cache[sessionUtilPath] = {
    id: sessionUtilPath,
    filename: sessionUtilPath,
    loaded: true,
    exports: {
      buildSessionUser
    }
  };

  const userService = require('../../services/user.service');

  return {
    userService,
    restore() {
      delete require.cache[servicePath];

      if (previousService) {
        require.cache[servicePath] = previousService;
      }

      if (previousBcrypt) {
        require.cache[bcryptPath] = previousBcrypt;
      } else {
        delete require.cache[bcryptPath];
      }

      if (previousUserRepository) {
        require.cache[userRepositoryPath] = previousUserRepository;
      } else {
        delete require.cache[userRepositoryPath];
      }

      if (previousProfileStore) {
        require.cache[profileStorePath] = previousProfileStore;
      } else {
        delete require.cache[profileStorePath];
      }

      if (previousProfileUtil) {
        require.cache[profileUtilPath] = previousProfileUtil;
      } else {
        delete require.cache[profileUtilPath];
      }

      if (previousSessionUtil) {
        require.cache[sessionUtilPath] = previousSessionUtil;
      } else {
        delete require.cache[sessionUtilPath];
      }
    }
  };
}

test('login throws a user-not-found error when neither email nor username exist', async () => {
  const { userService, restore } = loadUserService();

  try {
    await assert.rejects(
      () => userService.login('missing@example.com', 'secret'),
      /User not found/
    );
  } finally {
    restore();
  }
});

test('deleteAccount rejects an incorrect password before deleting the user', async () => {
  let deleteCalled = false;
  const { userService, restore } = loadUserService({
    getUserById: async () => ({
      id: 18,
      password: 'hashed-password',
      is_deleted: false
    }),
    bcryptCompare: async () => false,
    deleteUser: async () => {
      deleteCalled = true;
    }
  });

  try {
    await assert.rejects(
      () => userService.deleteAccount(18, 'wrong'),
      /Incorrect password/
    );
    assert.equal(deleteCalled, false);
  } finally {
    restore();
  }
});

test('updateProfile returns an image error when profile image validation fails', async () => {
  let saveCalled = false;
  const { userService, restore } = loadUserService({
    getProfileImage: () => ({ error: 'image' }),
    saveStoredProfile: () => {
      saveCalled = true;
      return true;
    }
  });

  try {
    const result = await userService.updateProfile(
      {
        id: 19,
        username: 'player19',
        email: 'player19@example.com',
        profileImageUrl: null
      },
      {
        bio: 'Updated bio',
        selectedAvatar: '/images/avatars/Dr_Horn1.jpeg'
      }
    );

    assert.deepEqual(result, { error: 'image' });
    assert.equal(saveCalled, false);
  } finally {
    restore();
  }
});

test('updateProfile returns an update error when saving fails', async () => {
  const { userService, restore } = loadUserService({
    getProfileImage: () => ({ profileImageUrl: '/images/avatars/Dr_Horn1.jpeg' }),
    saveStoredProfile: () => false
  });

  try {
    const result = await userService.updateProfile(
      {
        id: 20,
        username: 'player20',
        email: 'player20@example.com',
        profileImageUrl: null
      },
      {
        bio: 'Updated bio',
        selectedAvatar: '/images/avatars/Dr_Horn1.jpeg'
      }
    );

    assert.deepEqual(result, { error: 'update' });
  } finally {
    restore();
  }
});

test('updateProfile trims, truncates, and rebuilds the session user from saved profile data', async () => {
  const savedProfiles = [];
  const { userService, restore } = loadUserService({
    trimString: (value) => (typeof value === 'string' ? value.trim() : ''),
    getProfileImage: ({ currentImage }) => ({ profileImageUrl: currentImage }),
    saveStoredProfile: (userId, profile) => {
      savedProfiles.push({ userId, profile });
      return true;
    },
    getStoredProfile: () => ({
      bio: 'Stored bio wins',
      profileImageUrl: '/images/avatars/Dr_Horn3.jpeg'
    }),
    buildSessionUser: (user, storedProfile) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      bio: storedProfile.bio,
      profileImageUrl: storedProfile.profileImageUrl
    })
  });

  try {
    const result = await userService.updateProfile(
      {
        id: 21,
        username: 'player21',
        email: 'player21@example.com',
        profileImageUrl: '/images/avatars/Dr_Horn2.jpeg'
      },
      {
        bio: `  ${'A'.repeat(550)}  `
      }
    );

    assert.deepEqual(savedProfiles, [
      {
        userId: 21,
        profile: {
          bio: 'A'.repeat(500),
          profileImageUrl: '/images/avatars/Dr_Horn2.jpeg'
        }
      }
    ]);
    assert.deepEqual(result, {
      updatedUser: {
        id: 21,
        username: 'player21',
        email: 'player21@example.com',
        bio: 'Stored bio wins',
        profileImageUrl: '/images/avatars/Dr_Horn3.jpeg'
      }
    });
  } finally {
    restore();
  }
});
