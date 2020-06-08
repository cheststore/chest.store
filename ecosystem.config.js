module.exports = {
  apps : [
    {
      name: 'chest.store',
      script: 'dist/bin/app.js',
      exec_mode: 'fork'
    },
    {
      name: 'chest.store_worker',
      script: 'dist/bin/resqueWorker.js',
      exec_mode: 'fork'
    },
    {
      name: 'chest.store_scheduler',
      script: 'dist/bin/resqueScheduler.js',
      exec_mode: 'fork'
    }
  ]
}