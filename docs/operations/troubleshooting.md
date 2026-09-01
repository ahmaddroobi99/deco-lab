# Troubleshooting

**Production loads UI but no mesh.**  
Confirm `/assets/smpl/smpl_neutral_tpose.f32` returns 82680 bytes and
`.u32` returns 165312 bytes.

**CI lint fails on generated files.**  
`src/routeTree.gen.ts` is eslint-ignored.

**`npm run build` asks for DATABASE_URL.**  
`db:migrate` skips when unset. That is expected.

**Want official HRNet.**  
Not this deploy. Use the authors' CUDA environment and MPI license
(https://deco.is.tue.mpg.de/).
