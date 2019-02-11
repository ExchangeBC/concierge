"use strict";

import React from "react";
import { Component } from "react";
import Button from "./Button";

export default ({ dispatch, user }) => {
  let userView;
  if (user)
    userView = (
      <div className="user">
        <span>
          Signed in as {user.name}
        </span>
        <Button dispatch={dispatch} clickMsg="navigate" clickData={{ path: "/posts/create" }} text="Create Post" className="submit" />
        <Button dispatch={dispatch} clickMsg="logout" text="Logout" />
      </div>
    );
  else
    userView = (
      <Button dispatch={dispatch} clickMsg="login" text="Login with Google" />
    );
  return (
    <nav>
      <div className="logo" onClick={() => dispatch("navigate", { path: "/" })}>
        Code Challenge
      </div>
      {userView}
    </nav>
  );
};
