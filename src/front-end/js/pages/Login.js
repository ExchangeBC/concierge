"use strict";

import React from "react";
import { Component } from "react";
import Button from "../components/Button";

export default ({ dispatch, state }) => {
  return (
    <section className="login">
      <h1>Welcome!</h1>
      <p>
        This is Real Folk's submission for the Code Challenge.
      </p>
      <Button dispatch={dispatch} clickMsg="login" text="Login with Google" className="submit" />
    </section>
  );
};
