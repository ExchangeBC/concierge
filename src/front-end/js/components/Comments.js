"use strict";

import React from "react";
import { Component } from "react";
import Button from "./Button";
import { prettyDate } from "../util";

const Comment = ({ comment }) => {
  return (
    <li className="comment">
      <div>
        {comment.content}
      </div>
      <div className="meta">
        Written by {comment.author.name} at {prettyDate(comment.createdAt)}
      </div>
    </li>
  );
};

const CommentForm = ({ dispatch, post, commentBuffer, showForm }) => {
  const form = (
    <div className="add-comment">
      <textarea placeholder="Content" value={commentBuffer} onChange={e => dispatch("updateCommentBuffer", { value: e.target.value })}></textarea>
      <div className="buttons">
        <Button dispatch={dispatch} clickMsg="hideAddCommentForm" text="Cancel" className="cancel" />
        <Button dispatch={dispatch} clickMsg="addComment" clickData={{post}} text="Submit" className="submit" />
      </div>
    </div>
  );
  const button = (
    <div className="add-comment">
      <Button dispatch={dispatch} clickMsg="showAddCommentForm" text="Add Comment" className="submit" />
    </div>
  )
  if (showForm) return form;
  else return button;
};

export default ({ dispatch, post, comments, user, commentBuffer, showForm }) => {
  let addView;
  if (user._id !== post.author._id)
    addView = <CommentForm dispatch={dispatch} post={post} commentBuffer={commentBuffer} showForm={showForm} />;
  else
    addView = (<div></div>);
  comments.sort((a, b) => {
    a = new Date(a.createdAt);
    b = new Date(b.createdAt);
    return a.getTime() < b.getTime() ? 1 : -1;
  });
  return (
    <div className="comments">
      <h2>
        {comments.length} Comment{comments.length === 1 ? "" : "s"}
      </h2>
      {addView}
      <ul>
        {comments.map((comment, index) => {
          return (<Comment key={index} comment={comment} />);
        })}
      </ul>
    </div>
  );
};
