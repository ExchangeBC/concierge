"use strict";

import React from "react";
import { Component } from "react";
import { get } from "lodash";
import Button from "./Button";
import { prettyDate } from "../util";

const determineVisiblePosts = ({ posts, user, showPosts, searchBuffer, sortKey, sortDirection }) => {
  const visiblePosts = posts.filter(post => {
    const matchesFilter = () => !searchBuffer || !!post.content.match(new RegExp(`.*${searchBuffer}.*`, "i"));
    const isUserPost = () => showPosts === "user" && post.author._id === user._id;
    return (showPosts === "all" || isUserPost()) && matchesFilter();
  });
  visiblePosts.sort((a, b) => {
    let result;
    a = get(a, sortKey);
    b = get(b, sortKey);
    if (sortKey === "createdAt") {
      a = (new Date(a)).getTime();
      b = (new Date(b)).getTime();
      result = a < b ? -1 : 1;
    } else {
      result = a.localeCompare(b);
    }
    return sortDirection === "asc" ? result : result * -1;
  });
  return visiblePosts;
}

const Controls = ({ dispatch, posts, user, showPosts, searchBuffer, sortKey, sortDirection }) => {
  //Helpers to create sort buttons.
  const showPostsButton = (type, text) => 
    (<Button dispatch={dispatch} clickMsg="showPosts" clickData={{ value: type }} text={text} className={`toggle ${showPosts === type ? "selected" : ""}`} />);
  const sortKeyButton = (key, text) => 
    (<Button dispatch={dispatch} clickMsg="changeSortKey" clickData={{ key }} text={text} className={`toggle ${sortKey === key ? "selected" : ""}`} />);
  const sortDirectionButton = (direction, text) => 
    (<Button dispatch={dispatch} clickMsg="changeSortDirection" clickData={{ direction }} text={text} className={`toggle ${sortDirection === direction ? "selected" : ""}`} />);
  //Return the VTree.
  return (
    <div className="controls">
      <div className="controls-group">
        <label>View</label>
        {showPostsButton("all", "All Posts")}
        {showPostsButton("user", "My Posts")}
      </div>
      <div className="controls-group">
        <label>Sort By</label>
        {sortKeyButton("createdAt", "Date Created")}
        {sortKeyButton("title", "Title")}
        {sortKeyButton("author.name", "Author")}
      </div>
      <div className="controls-group">
        <label>Sort Direction</label>
        {sortDirectionButton("asc", "Ascending")}
        {sortDirectionButton("desc", "Descending")}
      </div>
      <div className="controls-group">
        <label>Search</label>
        <input type="text" placeholder="Search" value={searchBuffer} onChange={e => dispatch("updateSearchBuffer", { value: e.target.value })} />
      </div>
    </div>
  );
};

const Item = ({ dispatch, post }) => {
  return (
    <div className="post" onClick={() => dispatch("navigate", { path: `/posts/${post._id}` })}>
      <div className="title">
        {post.title}
      </div>
      <div className="author">
        {post.author.name}
      </div>
      <div className="created-at">
        {prettyDate(post.createdAt)}
      </div>
      <div className="comments">
        {post.comments.length} Comment{post.comments.length === 1 ? "" : "s"}
      </div>
    </div>
  );
};

const Items = ({ dispatch, posts }) => {
  return (
    <div className="post-list">
      {posts.map((post, index) => {
        return (
          <Item dispatch={dispatch} post={post} key={index} />
        );
      })}
    </div>
  );
};

export default props => {
  const { dispatch, posts, user, showPosts, searchBuffer, sortKey, sortDirection } = props;
  return (
    <div className="posts">
      <Controls {...props} />
      <Items dispatch={dispatch} posts={determineVisiblePosts(props)} />
    </div>
  );
};
