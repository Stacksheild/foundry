# my-metrics-dashboard

Scaffolded by `foundry create --template metrics-dashboard`. Zero dependencies —
a plain Node.js `http` server serving a KPI grid and bar chart.

## Run it

```bash
npm start
```

Then open http://localhost:3000. Edit `src/server.js`'s `METRICS` object to
point at a real data source.
