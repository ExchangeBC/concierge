"use strict";

import React from "react";
import { Component } from "react";
import { findPostById } from "../../util";
import Post from "../../components/Post";

const ViewOne = ({ dispatch, state, params }) => {
  const post = findPostById(state.posts.items, params.postId);
  if (!post) {
    dispatch("navigate", { path: "/" });
    return (<div></div>);
  }
  return (
    <Post 
      dispatch={dispatch}
      post={post}
      user={state.user}
      commentBuffer={state.buffers.comment}
      showAddCommentForm={state.comments.showForm} />
  );
};

ViewOne.init = async ({ state, params }) => {
  return state
    .setIn(["buffers", "comment"], "")
    .setIn(["comments", "showForm"], false);
};

export default ViewOne;
