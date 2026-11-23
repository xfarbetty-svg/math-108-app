/**
 * tools/verify_n38_movie.js — G3-N-3-8 概念小教室成片（N38_Final.mp4）專用門禁。
 * 用法：node tools/verify_n38_movie.js
 */
'use strict';
const { verifyMovie } = require('./verify_g3_movie_core');

try {
  verifyMovie({
    code: 'N-3-8',
    slug: 'n38_estimation',
    mp4: 'N38_Final.mp4',
    title: '概念小教室：四則估算',
    keyframeMin: 4,
  });
  process.exit(0);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
