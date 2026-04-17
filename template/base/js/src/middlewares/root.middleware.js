const rootHandler = (_, res) => {
  res.json({
    name: '/*__PROJECT_NAME__*/',
    type: '/*__PROJECT_TYPE__*/',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      root: '/',
      health: '/api/v1/health',
      docs: '/api-docs',
      /*__AUTH_ENDPOINT__*/
    },
  });
};

module.exports = {
  rootHandler,
};
