"use strict";

import axios from "axios";

export function findPostById(posts, id) {
  for (let i = 0; i < posts.length; i++) {
    if (posts[i]._id === id) return posts[i];
  }
  return null;
};

export async function request(url, method, data = {}) {
  method = method ? method.toUpperCase() : "GET";
  let extraOptions = {};
  if (method !== "GET")
    extraOptions = {
      data
    };
  const response = await axios({
    url,
    method,
    ...extraOptions
  });
  return response.data;
};

export function redirect(path) {
  window.location.pathname = path;
};

export function prettyDate(date) {
  date = new Date(date);
  const pad = n => `${n < 10 ? "0" : ""}${n}`;
  return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
