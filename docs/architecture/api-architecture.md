# API

Both endpoints are unauthenticated `GET`s. They describe capability; they
do not run inference.

## `GET /api/health`

**Response 200**

```json
{
  "status": "ok",
  "deco": true,
  "smpl": true,
  "torch": false,
  "cuda": false,
  "vertexCount": 6890,
  "bodyModel": "SMPL",
  "note": "Official DECO-HRNet checkpoint is not loaded in this hosted environment."
}
```

## `GET /api/system`

**Response 200**

```json
{
  "app": "DECO Lab",
  "paper": "Tripathi et al., ICCV 2023",
  "project": "https://deco.is.tue.mpg.de/",
  "code": "https://github.com/sha2nkt/deco",
  "bodyModel": "SMPL neutral T-pose",
  "vertices": 6890,
  "faces": 13776,
  "inputResolution": [256, 256],
  "defaultThreshold": 0.5,
  "device": "browser",
  "cuda": false,
  "torch": false,
  "license": "MPI non-commercial scientific research"
}
```

## Errors

Malformed methods yield the framework 404/405. There is no request body
and no validation surface beyond HTTP.

## Client inference

`runDecoPipeline` in `src/lib/deco/pipeline.ts` is not an HTTP API. It
runs in the tab and returns a `DecoResult`.
