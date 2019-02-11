"use strict";

import React from "react";
import { Component } from "react";
import { findPostById } from "../../util";
import PostForm from "../../components/PostForm";

const Edit = ({ dispatch, state, params }) => {
  const post = findPostById(state.posts.items, params.postId);
  if (!post) {
    dispatch("navigate", { path: "/" });
    return (<div></div>);
  }
  return (
    <section>
      <h1>Edit a Post</h1>
      <PostForm
        dispatch={dispatch}
        titleBuffer={state.buffers.post.title}
        contentBuffer={state.buffers.post.content}
        submitMsg="updatePost"
        submitData={{ post }}
        cancelMsg="navigate"
        cancelData={{ path: `/posts/${params.postId}` }} />
    </section>
  );
};

//Ensure the post form's buffers contain the post's values, so they can be edited.
Edit.init = async ({ state, params }) => {
  const post = state.getIn(["posts", "items"]).find(post => post._id === params.postId);
  if (!post) return state;
  return state
    .setIn(["buffers", "post", "title"], post.title)
    .setIn(["buffers", "post", "content"], post.content);
};

export default Edit;
