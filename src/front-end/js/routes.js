"use strict";

/**
 * This modules defines the front-end's routes.
 */

import ViewAllPosts from "./pages/posts/ViewAll";
import ViewOnePost from "./pages/posts/ViewOne";
import CreatePost from "./pages/posts/Create";
import EditPost from "./pages/posts/Edit";
import Login from "./pages/Login";

export default [
  {
    path: "/",
    auth: true,
    Component: ViewAllPosts
  },
  {
    path: "/posts/create",
    auth: true,
    Component: CreatePost
  },
  {
    path: "/posts/:postId",
    auth: true,
    Component: ViewOnePost
  },
  {
    path: "/posts/:postId/edit",
    auth: true,
    Component: EditPost
  },
  {
    path: "/login",
    auth: false,
    Component: Login
  },
  {
    path: "*",
    redirect: "/"
  }
];
