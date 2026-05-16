module.exports = {
  // Global options
  ignoreFiles: [
    'package-lock.json',
    'yarn.lock',
    '.env',
    '.gitignore',
    'src/',
    'overrides/',
    'rspack.config.js',
    'tsconfig.json',
    'tailwind.config.js',
    '.babelrc',
    '.editorconfig',
  ],
  // Signing options
  sign: {
    license: 'MIT',
  },
};
