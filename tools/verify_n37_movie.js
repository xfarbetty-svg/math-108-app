/**
 * tools/verify_n37_movie.js — G3-N-3-7 概念小教室成片（N37_Final.mp4）專用門禁。
 * 用法：node tools/verify_n37_movie.js
 */
'use strict';
const { verifyMovie } = require('./verify_g3_movie_core');

try {
  verifyMovie({
    code: 'N-3-7',
    slug: 'n37_two_step',
    mp4: 'N37_Final.mp4',
    title: '概念小教室：兩步驟應用問題',
    keyframeMin: 4,
  });
  process.exit(0);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
