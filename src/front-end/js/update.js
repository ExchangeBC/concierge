"use strict";

/**
 * This module exports a pure function that
 * executes requested state mutation.
 * The `msg` parameter is similar to Redux's
 * `action.type` parameter, and `data` is an object
 * that can contain arbitrary data associated with an action.
 */

import page from "page";
import { isFunction } from "lodash";
import { request, redirect } from "./util";
import Login from "./pages/Login";

const navigate = async (update, state, path) => {
  return await update(state, "navigate", { path });
};

const reloadUser = async state => {
  return state.set("user" , await request("/api/session/active"));
};

const reloadPosts = async state => {
  return state.setIn(["posts", "items"], await request("/api/post"));
};

export default async function update(state, msg, data = {}) {
  switch(msg) {

    case "view":
      let { auth, Component, params = {}} = data;
      let user, posts;
      try {
        state = await reloadUser(state);
        state = await reloadPosts(state);
      } catch(e) {
        console.error(e);
        state = state.set("user", null);
        if (auth) {
          state = await navigate(update, state, "/login");
        }
      }
      if (isFunction(Component.init))
        state = await Component.init({ state, params });
      return state
        .setIn(["view", "Component"], Component)
        .setIn(["view", "params"], params);

    case "navigate":
      const { path } = data;
      page(path);
      return state;

    case "login":
      redirect("/login/google");
      return state;

    case "logout":
      try {
        await request("/api/session/active", "delete");
        //state = state.set("user", null);
      } catch(e) {}
      return await navigate(update, state, "/login");

    case "createPost":
      try {
        await request("/api/post", "post", {
          title: state.getIn(["buffers", "post", "title"]),
          content: state.getIn(["buffers", "post", "content"])
        });
        return await navigate(update, state, "/");
      } catch(e) {
        console.error(e);
        return state;
      }

    case "updatePost":
      try {
        const title = state.getIn(["buffers", "post", "title"]);
        const content = state.getIn(["buffers", "post", "content"]);
        if (!title || !content) throw new Error("Posts must have non-empty fields");
        await request(`/api/post/${data.post._id}`, "put", {
          title,
          content
        });
        return await navigate(update, state, `/posts/${data.post._id}`);
      } catch(e) {
        console.error(e);
        return state;
      }

    case "deletePost":
      try {
        await request(`/api/post/${data.post._id}`, "delete");
        return await navigate(update, state, "/");
      } catch(e) {
        console.error(e);
        return state;
      }

    case "showAddCommentForm":
      return state.setIn(["comments", "showForm"], true);

    case "hideAddCommentForm":
      return state.setIn(["comments", "showForm"], false);

    case "addComment":
      try {
        await request("/api/comment", "post", {
          content: state.getIn(["buffers", "comment"]),
          post: data.post._id
        });
        state = await reloadPosts(state);
        return state
          .setIn(["buffers", "comment"], "")
          .setIn(["comments", "showForm"], false);
      } catch(e) {
        console.error(e);
        return state;
      }

    case "updateCommentBuffer":
      return state.setIn(["buffers", "comment"], data.value);

    case "updatePostTitleBuffer":
      return state.setIn(["buffers", "post", "title"], data.value);

    case "updatePostContentBuffer":
      return state.setIn(["buffers", "post", "content"], data.value);

    case "updateSearchBuffer":
      return state.setIn(["buffers", "search"], data.value);

    case "showPosts":
      return state.setIn(["posts", "show"], data.value);

    case "changeSortKey":
      return state.setIn(["posts", "sort", "key"], data.key);

    case "changeSortDirection":
      return state.setIn(["posts", "sort", "direction"], data.direction);

    default:
      return state;
  }
};
