# propertyPal Core — Frontend

React 18 + Tailwind CSS web UI for propertyPal Core.
For setup, configuration and Docker usage, see the [top-level README](../README.md).

## Local development

```bash
cd frontend
npm install
npm start      # dev server on http://localhost:3000
npm run build  # production build into build/
npm test
```

In the container, `docker-entrypoint.sh` injects `REACT_APP_API_URL` into the built bundle at startup, so one image works behind any host.
