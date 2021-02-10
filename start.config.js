module.exports = {
  apps: [
    {
      name: "app",
      script: "./app.js",
      instance: 0,
      exec_mode: "cluster",
    },
  ],
};
