function createMockResponse() {
  const response = {
    app: {
      get(setting) {
        if (setting === 'env') {
          return 'test';
        }

        return undefined;
      }
    },
    body: undefined,
    ended: false,
    headers: {},
    jsonBody: undefined,
    locals: {},
    redirectUrl: null,
    statusCode: 200,
    viewData: undefined,
    viewName: null,
    get(headerName) {
      return this.headers[String(headerName).toLowerCase()];
    },
    json(payload) {
      this.body = payload;
      this.jsonBody = payload;
      this.ended = true;
      return this;
    },
    redirect(url) {
      if (this.statusCode < 300 || this.statusCode >= 400) {
        this.statusCode = 302;
      }

      this.headers.location = url;
      this.redirectUrl = url;
      this.ended = true;
      return this;
    },
    render(viewName, viewData) {
      this.viewName = viewName;
      this.viewData = viewData;
      this.body = { viewName, viewData };
      this.ended = true;
      return this;
    },
    send(payload) {
      this.body = payload;
      this.ended = true;
      return this;
    },
    set(headerName, value) {
      this.headers[String(headerName).toLowerCase()] = value;
      return this;
    },
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    }
  };

  return response;
}

function getRouteHandlers(router, routePath, method) {
  const normalizedMethod = method.toLowerCase();
  const layer = router.stack.find(
    (candidate) =>
      candidate.route &&
      candidate.route.path === routePath &&
      candidate.route.methods[normalizedMethod]
  );

  if (!layer) {
    throw new Error(`Route not found for ${method.toUpperCase()} ${routePath}`);
  }

  return layer.route.stack.map((routeLayer) => routeLayer.handle);
}

async function runHandlers(handlers, req, res) {
  let index = 0;

  return new Promise((resolve, reject) => {
    const next = (error) => {
      if (error) {
        reject(error);
        return;
      }

      if (res.ended || index >= handlers.length) {
        resolve(res);
        return;
      }

      const handler = handlers[index];
      index += 1;

      try {
        const maybePromise = handler(req, res, next);

        if (handler.length < 3) {
          Promise.resolve(maybePromise)
            .then(() => {
              resolve(res);
            })
            .catch(reject);
          return;
        }

        Promise.resolve(maybePromise)
          .then(() => {
            if (res.ended) {
              resolve(res);
            }
          })
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    };

    next();
  });
}

async function invokeRoute(router, { body = {}, method = 'GET', params = {}, query = {}, session = {}, url }) {
  const req = {
    body,
    method: method.toUpperCase(),
    params,
    query,
    session,
    url: url || '/'
  };
  const res = createMockResponse();
  const handlers = getRouteHandlers(router, url || '/', method);

  await runHandlers(handlers, req, res);
  return { req, res };
}

module.exports = {
  invokeRoute
};
