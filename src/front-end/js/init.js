"use strict";

/**
 * This module defines the starting state for the entire application.
 */

import Login from "./pages/Login";

export default {
  view: {
    Component: Login,
    params: {}
  },
  buffers: {
    search: "",
    comment: "",
    post: {
      title: "",
      content: ""
    }
  },
  posts: {
    items: [],
    show: "all",
    sort: {
      key: "createdAt",
      direction: "desc"
    }
  },
  user: null,
  comments: {
    showForm: false
  }
};
