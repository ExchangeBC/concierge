"use strict";

import React from "react";
import { Component } from "react";
import Button from "./Button";
import Comments from "./Comments";
import { prettyDate } from "../util";

const Actions = ({ dispatch, post }) => {
  return (
    <div className="actions">
      <Button dispatch={dispatch} clickMsg="navigate" clickData={{ path: `/posts/${post._id}/edit` }} text="Edit Post" className="edit" />
      <Button dispatch={dispatch} clickMsg="deletePost" clickData={{post}} text="Delete Post" className="delete" />
    </div>
  );
};

export default ({ dispatch, post, user, commentBuffer, showAddCommentForm }) => {
  let actionView;
  if (user._id === post.author._id)
    actionView = (<Actions dispatch={dispatch} post={post} />);
  else
    actionView = (<div className="actions"></div>);
  return (
    <article className="post">
      <h1>
        {post.title}
      </h1>
      <div className="meta">
        Written by {post.author.name} at {prettyDate(post.createdAt)}
      </div>
      {actionView}
      <div className="content">
        {post.content}
      </div>
      <Comments
        dispatch={dispatch}
        post={post}
        comments={post.comments}
        user={user}
        commentBuffer={commentBuffer}
        showForm={showAddCommentForm} />
    </article>
  );
};
