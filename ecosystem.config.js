module.exports = {
  apps: [
    {
      name: 'chest.store',
      script: 'dist/bin/app.js',
      exec_mode: 'fork',
    },
  ],
}
