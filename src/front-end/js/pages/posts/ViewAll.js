"use strict";

import React from "react";
import { Component } from "react";
import Posts from "../../components/Posts";

const ViewAll = ({ dispatch, state }) => {
  return (
    <section>
      <h1>Posts</h1>
      <Posts
        dispatch={dispatch}
        posts={state.posts.items}
        user={state.user}
        showPosts={state.posts.show}
        searchBuffer={state.buffers.search}
        sortKey={state.posts.sort.key}
        sortDirection={state.posts.sort.direction} />
    </section>
  );
};

ViewAll.init = async ({ state, params }) => {
  return state
    .setIn(["buffers", "search"], "")
    .setIn(["posts", "show"], "all")
    .setIn(["posts", "sort", "key"], "createdAt")
    .setIn(["posts", "sort", "direction"], "desc");
};

export default ViewAll;
