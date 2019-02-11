"use strict";

import React from "react";
import { Component } from "react";
import PostForm from "../../components/PostForm";

const Create = ({ dispatch, state }) => {
  return (
    <section>
      <h1>Create a Post</h1>
      <PostForm
        dispatch={dispatch}
        titleBuffer={state.buffers.post.title}
        contentBuffer={state.buffers.post.content}
        submitMsg="createPost"
        cancelMsg="navigate"
        cancelData={{ path: "/" }} />
    </section>
  );
};

//Ensure the post form buffers are empty.
Create.init = async ({ state, params }) => {
  return state
    .setIn(["buffers", "post", "title"], "")
    .setIn(["buffers", "post", "content"], "");
};

export default Create;
